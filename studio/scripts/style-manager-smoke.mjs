import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';

const dir=await mkdtemp(join(tmpdir(),'what-if-ci-preview-'));
try {
  const serveUrl=await bundle({entryPoint:resolve('src/index.ts'),publicDir:resolve('public')});
  const inputProps={previewStyle:{background:'#1A2030',filter:'saturate(1.2) brightness(1.1)',grain:false,vignette:true}};
  const composition=await selectComposition({serveUrl,id:'Cast',inputProps});
  const output=join(dir,'cast-preview.png');
  await renderStill({serveUrl,composition,inputProps,frame:0,output,overwrite:true,scale:0.25});
  const contents=await readFile(output);
  const pngMagic=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  assert.ok(contents.subarray(0,8).equals(pngMagic),'Preview does not have a PNG header');
  assert.ok(contents.length>10000,'Preview image unexpectedly empty');
  console.log('Real Remotion cast preview rendered successfully:',contents.length,'bytes');
} finally {
  await rm(dir,{recursive:true,force:true});
}
