import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdtemp, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { PRESETS, DEFAULT_PROFILE, sanitizeProfile, normalizeStyle, resolveStyle } from './style-manager-core.mjs';

const studio = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(studio, 'style-lock.json');
const profilesPath = join(studio, 'style-profiles.json');
const uiDir = join(studio, 'style-manager');
const port = Number(process.env.STYLE_MANAGER_PORT || 3431);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('STYLE_MANAGER_PORT không hợp lệ');
const host = '127.0.0.1';
const allowedHosts = new Set([host + ':' + port, 'localhost:' + port]);
let pending = Promise.resolve();
let previewBusy = false;
let cachedBundle;

class InputError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
const queue = (work) => {
  const job = pending.then(work);
  pending = job.catch(() => {});
  return job;
};
const json = (res, status, data) => respond(res, status, JSON.stringify(data), 'application/json; charset=utf-8');
function respond(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type':type, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
  });
  res.end(body);
}
async function readJSON(path) { return JSON.parse(await readFile(path,'utf8')); }
async function atomicJSON(path, content) {
  const temp = path + '.' + randomUUID() + '.tmp';
  try { await writeFile(temp, JSON.stringify(content,null,2)+'\n','utf8'); await rename(temp,path); }
  catch (error) { await rm(temp,{force:true}).catch(()=>{}); throw error; }
}
async function state() {
  const [config,registry]=await Promise.all([readJSON(configPath),readJSON(profilesPath)]);
  if (config.version!==1 || registry.version!==1 || !Array.isArray(registry.profiles)) throw new Error('Style data chưa đúng định dạng');
  return {config,registry};
}
async function requestJSON(req) {
  if (!String(req.headers['content-type']||'').startsWith('application/json')) throw new InputError('Cần Content-Type: application/json',415);
  let bytes=0;const chunks=[];
  for await(const chunk of req) {
    bytes += chunk.length;
    if(bytes > 32768) throw new InputError('Dữ liệu vượt 32KB',413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new InputError('JSON không hợp lệ'); }
}
function confirmOrigin(req) {
  if (!allowedHosts.has(req.headers.host)) throw new InputError('Host không hợp lệ',403);
  const origin = req.headers.origin;
  if(origin && !allowedHosts.has(new URL(origin).host)) throw new InputError('Trang gọi API không được phép',403);
}
async function preview(renderStyle) {
  const {bundle} = await import('@remotion/bundler');
  const {renderStill,selectComposition} = await import('@remotion/renderer');
  if (!cachedBundle) cachedBundle = bundle({entryPoint:join(studio,'src','index.ts'),publicDir:join(studio,'public')}).catch(e=>{cachedBundle=null;throw e;});
  const serveUrl = await cachedBundle;
  const inputProps = { previewStyle:renderStyle };
  const composition = await selectComposition({serveUrl,id:'Cast',inputProps});
  const dir = await mkdtemp(join(tmpdir(),'what-if-cast-'));
  const output=join(dir,'preview.png');
  try {
    await renderStill({serveUrl,composition,inputProps,frame:0,output,overwrite:true,scale:0.5});
    return await readFile(output);
  } finally { await rm(dir,{recursive:true,force:true}); }
}
const staticFiles={
  '/':'index.html',
  '/app.js':'app.js',
  '/style.css':'style.css',
};
const handler=async(req,res)=>{
  try {
    confirmOrigin(req);
    const url=new URL(req.url, 'http://'+host+':'+port);
    const pathname=url.pathname;
    if(req.method==='GET' && Object.hasOwn(staticFiles,pathname)){
      const file=staticFiles[pathname];
      const mime=file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
      return respond(res,200,await readFile(join(uiDir,file)),mime);
    }
    if(req.method==='GET' && pathname==='/api/state') {
      const {config,registry}=await state();
      return json(res,200,{selection:config.profileId?'profile:'+config.profileId:config.preset,
        locked:config.locked,profiles:registry.profiles,presets:PRESETS,defaults:DEFAULT_PROFILE});
    }
    if(req.method==='PUT' && pathname==='/api/style'){
      const body=await requestJSON(req);
      const result=await queue(async()=>{
        const {registry}=await state();
        const updated=normalizeStyle(body,registry.profiles);
        await atomicJSON(configPath,updated);
        return updated;
      });
      return json(res,200,{ok:true,config:result});
    }
    if(req.method==='POST' && pathname==='/api/profiles'){
      const body=await requestJSON(req);
      const result=await queue(async()=>{
        const {registry}=await state();
        if(registry.profiles.length>=40) throw new InputError('Giới hạn 40 phong cách');
        const profile={id:'custom-'+randomUUID(),...sanitizeProfile(body)};
        registry.profiles.push(profile);
        await atomicJSON(profilesPath,registry);
        return profile;
      });
      return json(res,201,result);
    }
    const profileMatch=/^\/api\/profiles\/([a-zA-Z0-9_-]{1,64})$/.exec(pathname);
    if(profileMatch && (req.method==='PUT' || req.method==='DELETE')){
      const body=req.method==='PUT'?await requestJSON(req):null;
      const result=await queue(async()=>{
        const {config,registry}=await state();
        const index=registry.profiles.findIndex(x=>x.id===profileMatch[1]);
        if(index<0) throw new InputError('Không tìm thấy phong cách',404);
        if(req.method==='PUT') {
          registry.profiles[index]={id:profileMatch[1],...sanitizeProfile(body)};
        } else {
          if(config.profileId===profileMatch[1]) await atomicJSON(configPath,{version:1,preset:'cinematic-dusk',profileId:null,locked:true});
          registry.profiles.splice(index,1);
        }
        await atomicJSON(profilesPath,registry);
        return req.method==='PUT'?registry.profiles[index]:{ok:true};
      });
      return json(res,200,result);
    }
    if(req.method==='POST' && pathname==='/api/preview'){
      const body=await requestJSON(req);
      if(previewBusy) throw new InputError('Đang tạo ảnh xem trước, hãy thử lại sau',429);
      const {registry}=await state();
      const style = body.locked === false
        ? {background:'#14101C',grain:true,vignette:true}
        : resolveStyle(body.selection,registry.profiles,body.draft);
      previewBusy=true;
      try { return respond(res,200,await preview(style),'image/png'); }
      finally { previewBusy=false; }
    }
    throw new InputError('Không tìm thấy địa chỉ',404);
  } catch(error) {
    if (!(error instanceof InputError)) console.error('[style-manager]',error);
    if (!res.headersSent) json(res,error instanceof InputError?error.status:500,{error:error instanceof InputError?error.message:'Lỗi server hoặc render. Kiểm tra Terminal.'});
  }
};
createServer(handler).listen(port,host,()=>{
  console.log('Style Manager đang chạy: http://'+host+':'+port);
  console.log('Chỉ truy cập từ máy này. Nhấn Ctrl+C để dừng.');
});
