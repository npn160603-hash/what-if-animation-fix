const q = (id) => document.getElementById(id);
const values = [
  {key:'brightness',label:'Độ sáng',min:0.5,max:1.6,step:0.05},
  {key:'saturation',label:'Độ bão hòa màu',min:0,max:2,step:0.05},
  {key:'contrast',label:'Tương phản',min:0.5,max:1.8,step:0.05},
  {key:'grayscale',label:'Đen trắng',min:0,max:1,step:0.05},
  {key:'sepia',label:'Màu phim cũ',min:0,max:1,step:0.05},
];
let data;
let selection = 'cinematic-dusk';
let draft = null;
let dirty = false;
let currentImageURL = null;
const setStatus = (message,failed=false) => {
  q('status').textContent = message;
  q('status').style.color = failed ? '#ffb2bd' : '#a7caff';
};
const getJSON = async (url, options) => {
  const response = await fetch(url,options);
  let payload;
  try { payload = await response.json(); } catch { payload = {}; }
  if(!response.ok) throw new Error(payload.error || 'Yêu cầu thất bại ('+response.status+')');
  return payload;
};
const call = (url,method,body) => getJSON(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const sliderUI = () => {
  const holder=q('sliders');
  for(const field of values){
    const div=document.createElement('div'); div.className='control';
    const label=document.createElement('label'); label.htmlFor=field.key; label.textContent=field.label;
    const output=document.createElement('output');output.htmlFor=field.key;output.id=field.key+'-value';
    const input=document.createElement('input');input.id=field.key;input.type='range';
    input.min=field.min;input.max=field.max;input.step=field.step;
    input.addEventListener('input',()=>{
      output.value=String(input.value);
      dirty=true;
    });
    div.append(label,output,input);holder.append(div);
  }
};
function readEditor(){
  const p={name:q('name').value,background:q('background').value,
    grain:q('grain').checked,vignette:q('vignette').checked};
  for(const field of values) p[field.key]=Number(q(field.key).value);
  return p;
}
function fillEditor(p){
  q('name').value=p.name; q('background').value=p.background;
  q('grain').checked=p.grain;q('vignette').checked=p.vignette;
  for(const field of values){
    q(field.key).value=p[field.key];
    q(field.key+'-value').value=String(p[field.key]);
  }
  dirty=false;
}
function showEditor(){
  const custom = selection==='draft'||selection.startsWith('profile:');
  q('editor').hidden=!custom;
  q('delete-profile').hidden=!selection.startsWith('profile:');
  if(!custom) return;
  q('editor-heading').textContent=selection==='draft'?'Tạo phong cách mới':'Chỉnh sửa phong cách riêng';
  if(selection==='draft') fillEditor(draft ?? data.defaults);
  else fillEditor(data.profiles.find(p=>selection==='profile:'+p.id));
}
function populateSelect(){
  const select=q('selection');select.replaceChildren();
  for(const [key,preset] of Object.entries(data.presets)){
    const option=document.createElement('option');option.value=key;option.textContent=preset.label;select.append(option);
  }
  for(const profile of data.profiles){
    const option=document.createElement('option');option.value='profile:'+profile.id;option.textContent='★ '+profile.name;select.append(option);
  }
  if(selection==='draft'){
    const option=document.createElement('option');option.value='draft';option.textContent='✦ Đang tạo phong cách mới';select.append(option);
  }
  if(!Array.from(select.options).some(o=>o.value===selection)) selection='cinematic-dusk';
  select.value=selection;
  showEditor();
}
async function loadState(preferredSelection){
  data=await getJSON('/api/state');
  selection=preferredSelection ?? data.selection;
  q('locked').checked=data.locked;
  populateSelect();
}
async function act(button,action){
  button.disabled=true;
  try { await action(); }
  catch(error) { setStatus(error.message || String(error),true); }
  finally { button.disabled=false; }
}
q('selection').addEventListener('change',(e)=>{
  selection=e.target.value;
  dirty=false;
  if(selection==='draft') draft={...data.defaults};
  populateSelect();
  setStatus('Đã đổi lựa chọn. Nhấn “Lưu lựa chọn” để áp dụng khi xuất video.');
});
q('new-profile').addEventListener('click',()=>{
  selection='draft';draft={...data.defaults};populateSelect();
  q('name').focus();setStatus('Điều chỉnh màu, tạo ảnh xem trước rồi lưu phong cách riêng.');
});
q('editor').addEventListener('input',(e)=>{if(e.target.id==='name'||e.target.id==='background'||e.target.id==='grain'||e.target.id==='vignette') dirty=true;});
q('save-active').addEventListener('click',()=>act(q('save-active'),async()=>{
  if(selection==='draft') throw new Error('Hãy lưu phong cách mới trước khi áp dụng.');
  if(selection.startsWith('profile:') && dirty) throw new Error('Bạn đã thay đổi thông số. Hãy nhấn “Lưu phong cách riêng” trước.');
  await call('/api/style','PUT',{selection,locked:q('locked').checked});
  await loadState(selection);setStatus('Đã lưu cấu hình. Các video render mới sẽ áp dụng style này.');
}));
q('save-profile').addEventListener('click',()=>act(q('save-profile'),async()=>{
  if(!selection.startsWith('profile:') && selection!=='draft') throw new Error('Hãy chọn phong cách riêng');
  const p=readEditor();
  const saved=selection==='draft'
    ? await call('/api/profiles','POST',p)
    : await call('/api/profiles/'+selection.slice(8),'PUT',p);
  const next='profile:'+saved.id;
  await call('/api/style','PUT',{selection:next,locked:q('locked').checked});
  draft=null;dirty=false;
  await loadState(next);setStatus('Đã lưu phong cách “'+saved.name+'” và kích hoạt cho video.');
}));
q('delete-profile').addEventListener('click',()=>act(q('delete-profile'),async()=>{
  if(!selection.startsWith('profile:')) return;
  const p=data.profiles.find(x=>'profile:'+x.id===selection);
  if(!window.confirm('Xóa phong cách “'+p.name+'”? Thao tác không thể hoàn tác.'))return;
  await call('/api/profiles/'+p.id,'DELETE',{});
  draft=null;dirty=false;await loadState();setStatus('Đã xóa phong cách. Nếu đang dùng phong cách này, hệ thống quay về bản gốc.');
}));
q('preview-btn').addEventListener('click',()=>act(q('preview-btn'),async()=>{
  setStatus('Đang dùng Remotion dựng ảnh nhân vật trên máy. Lần đầu có thể chậm hơn.');
  const params={selection,locked:q('locked').checked};
  if(selection==='draft' || selection.startsWith('profile:')){
    params.selection='draft';params.draft=readEditor();
  }
  const response=await fetch('/api/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params)});
  if(!response.ok){
    let error={};try {error=await response.json();}catch{}
    throw new Error(error.error || 'Không thể tạo ảnh xem trước');
  }
  const blob=await response.blob();
  const url=URL.createObjectURL(blob);
  q('preview-image').src=url;
  q('preview-image').hidden=false;
  q('empty-preview').hidden=true;
  if(currentImageURL) URL.revokeObjectURL(currentImageURL);
  currentImageURL=url;
  setStatus('Đã dựng ảnh thực từ bộ nhân vật Remotion. Thích phong cách này thì nhấn Lưu.');
}));
sliderUI();
loadState().then(()=>setStatus('Sẵn sàng. Có thể chọn preset hoặc tạo phong cách mới.'))
  .catch(error=>setStatus('Không đọc được cấu hình: '+error.message,true));
