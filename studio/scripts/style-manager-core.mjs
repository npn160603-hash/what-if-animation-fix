export const PRESETS = Object.freeze({
  'cinematic-dusk': { label:'Điện ảnh hoàng hôn (gốc)', background:'#0E0C1E', filter:'none', grain:true, vignette:true },
  'vibrant-color': { label:'Màu sắc nổi bật', background:'#0E0C1E', filter:'saturate(1.45) brightness(1.08) contrast(1.04)', grain:false, vignette:false },
  'mono-noir': { label:'Đen trắng tương phản', background:'#0E0C1E', filter:'grayscale(1) contrast(1.18)', grain:true, vignette:true },
});
export const RANGES = Object.freeze({
  brightness:[0.5,1.6], saturation:[0,2], contrast:[0.5,1.8], grayscale:[0,1], sepia:[0,1],
});
export const DEFAULT_PROFILE = {
  name:'Phong cách của tôi', background:'#0E0C1E', brightness:1, saturation:1, contrast:1,
  grayscale:0, sepia:0, grain:true, vignette:true,
};
export function sanitizeProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Dữ liệu phong cách không hợp lệ');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length < 1 || name.length > 60) throw new Error('Tên phong cách cần 1–60 ký tự');
  if (typeof input.background !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(input.background)) throw new Error('Màu nền phải có dạng #RRGGBB');
  const value = { name, background:input.background };
  for (const [key,[min,max]] of Object.entries(RANGES)) {
    if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < min || input[key] > max) throw new Error('Giá trị '+key+' không hợp lệ');
    value[key] = input[key];
  }
  for (const key of ['grain','vignette']) {
    if (typeof input[key] !== 'boolean') throw new Error('Giá trị '+key+' phải đúng hoặc sai');
    value[key] = input[key];
  }
  return value;
}
export function normalizeStyle(data, profiles) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Dữ liệu cấu hình không hợp lệ');
  const {selection, locked} = data;
  if (typeof selection !== 'string' || selection.length > 80 || typeof locked !== 'boolean') throw new Error('Lựa chọn style không hợp lệ');
  if (Object.hasOwn(PRESETS, selection)) return {version:1,preset:selection,locked,profileId:null};
  if (!selection.startsWith('profile:')) throw new Error('Không tìm thấy preset');
  const profileId=selection.slice(8);
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(profileId) || !profiles.some(p=>p.id===profileId)) throw new Error('Không tìm thấy style tùy chỉnh');
  return {version:1,preset:'cinematic-dusk',locked,profileId};
}
export const profileFilter = p => 'brightness('+p.brightness+') saturate('+p.saturation+') contrast('+p.contrast+') grayscale('+p.grayscale+') sepia('+p.sepia+')';
export function resolveStyle(selection,profiles,draft) {
  if (selection==='draft') {
    const p=sanitizeProfile(draft);
    return {background:p.background,filter:profileFilter(p),grain:p.grain,vignette:p.vignette};
  }
  const s=normalizeStyle({selection,locked:true},profiles);
  if (s.profileId) {
    const p=profiles.find(x=>x.id===s.profileId);
    return {background:p.background,filter:profileFilter(p),grain:p.grain,vignette:p.vignette};
  }
  const p=PRESETS[s.preset];
  return {background:p.background,filter:p.filter==='none'?undefined:p.filter,grain:p.grain,vignette:p.vignette};
}
