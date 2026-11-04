import assert from 'node:assert/strict';
import {it,describe} from 'node:test';
import {PRESETS,DEFAULT_PROFILE,normalizeStyle,sanitizeProfile,resolveStyle,profileFilter} from '../scripts/style-manager-core.mjs';

describe('Style Manager V2',()=>{
 it('supports all shipped presets',()=>{
   for (const name of Object.keys(PRESETS)) {
     const cfg=normalizeStyle({selection:name,locked:true},[]);
     assert.equal(cfg.preset,name); assert.equal(cfg.profileId,null); assert.equal(cfg.locked,true);
   }
 });
 it('rejects unknown and unsafe identifiers',()=>{
   assert.throws(()=>normalizeStyle({selection:'profile:../secret',locked:true},[]));
   assert.throws(()=>normalizeStyle({selection:'nonsense',locked:true},[]));
 });
 it('rejects invalid fields',()=>{
   assert.throws(()=>sanitizeProfile({...DEFAULT_PROFILE,brightness:100}));
   assert.throws(()=>sanitizeProfile({...DEFAULT_PROFILE,background:'url(javascript:1)'}));
   assert.throws(()=>sanitizeProfile({...DEFAULT_PROFILE,name:''}));
   assert.throws(()=>sanitizeProfile({...DEFAULT_PROFILE,saturation:null}));
 });
 it('resolves saved custom profile for renderer and preview',()=>{
   const p={id:'custom1',...sanitizeProfile({...DEFAULT_PROFILE,name:'Tùy chỉnh',brightness:1.25})};
   const cfg=normalizeStyle({selection:'profile:custom1',locked:true},[p]);
   assert.equal(cfg.profileId,'custom1');
   const render=resolveStyle('profile:custom1',[p]);
   assert.equal(render.filter,profileFilter(p));
   assert.equal(render.background,p.background);
 });
 it('validates draft previews',()=>{
   assert.equal(resolveStyle('draft',[],DEFAULT_PROFILE).grain,true);
   assert.throws(()=>resolveStyle('draft',[],{...DEFAULT_PROFILE,sepia:-1}));
 });
});
