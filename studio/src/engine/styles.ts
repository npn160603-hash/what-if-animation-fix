import config from '../../style-lock.json';
import registry from '../../style-profiles.json';

/** A shared style for animation, storyboard and Remotion cast previews.
 * Custom V2 presets color-grade existing line art; they do not re-draw characters.
 */
export const STYLE_PRESETS = {
  'cinematic-dusk': { label:'Điện ảnh hoàng hôn (gốc)', background:'#0E0C1E', filter:'none', grain:true, vignette:true },
  'vibrant-color': { label:'Màu sắc nổi bật', background:'#0E0C1E', filter:'saturate(1.45) brightness(1.08) contrast(1.04)', grain:false, vignette:false },
  'mono-noir': { label:'Đen trắng tương phản', background:'#0E0C1E', filter:'grayscale(1) contrast(1.18)', grain:true, vignette:true },
} as const;
export type StylePresetId = keyof typeof STYLE_PRESETS;
export type UserStyleProfile = {
  id:string; name:string; background:string; brightness:number; saturation:number;
  contrast:number; grayscale:number; sepia:number; grain:boolean; vignette:boolean;
};
export type RenderStyle = { background:string; filter?:string; grain:boolean; vignette:boolean };
const profiles = (registry as {version:number; profiles:UserStyleProfile[]}).profiles;

export const profileFilter = (p:UserStyleProfile):string =>
  'brightness('+p.brightness+') saturate('+p.saturation+') contrast('+p.contrast+') grayscale('+p.grayscale+') sepia('+p.sepia+')';
export function getStyleLock() {
  if (config.version!==1 || registry.version!==1) throw new Error('Style Lock: invalid version');
  if (!Object.prototype.hasOwnProperty.call(STYLE_PRESETS,config.preset)) throw new Error('Style Lock: unknown preset');
  const profileId=config.profileId as string | null;
  const custom=profileId ? profiles.find(p=>p.id===profileId):undefined;
  if (profileId && !custom) throw new Error('Style Lock: unknown custom profile');
  const base=STYLE_PRESETS[config.preset as StylePresetId];
  return {
    id:custom?.id ?? config.preset,
    label:custom?.name ?? base.label,
    background:custom?.background ?? base.background,
    filter:custom ? profileFilter(custom) : base.filter,
    grain:custom?.grain ?? base.grain,
    vignette:custom?.vignette ?? base.vignette,
    locked:config.locked===true,
  };
}
export function getRenderStyle(fallback:{background:string;grain:boolean;vignette:boolean}):RenderStyle {
  const style=getStyleLock();
  return {
    background:style.locked?style.background:fallback.background,
    grain:style.locked?style.grain:fallback.grain,
    vignette:style.locked?style.vignette:fallback.vignette,
    filter:style.locked && style.filter!=='none'?style.filter:undefined,
  };
}
