import config from '../../style-lock.json';

/**
 * Style Lock V1: deterministic final-color presets.
 * Characters, silhouettes, sets and line art still come from the original shared SVG rigs.
 * A genuinely new drawing style will require a different renderer/rig, not only a CSS filter.
 */
export const STYLE_PRESETS = {
  'cinematic-dusk': {
    label: 'Điện ảnh hoàng hôn (gốc)',
    background: '#0E0C1E',
    filter: 'none',
    grain: true,
    vignette: true,
  },
  'vibrant-color': {
    label: 'Màu sắc nổi bật',
    background: '#0E0C1E',
    filter: 'saturate(1.45) brightness(1.08) contrast(1.04)',
    grain: false,
    vignette: false,
  },
  'mono-noir': {
    label: 'Đen trắng tương phản',
    background: '#0E0C1E',
    filter: 'grayscale(1) contrast(1.18)',
    grain: true,
    vignette: true,
  },
} as const;

export type StylePresetId = keyof typeof STYLE_PRESETS;

export const getStyleLock = () => {
  if (config.version !== 1) {
    throw new Error('Style Lock: unsupported configuration version.');
  }
  if (!Object.prototype.hasOwnProperty.call(STYLE_PRESETS, config.preset)) {
    throw new Error(`Style Lock: unknown preset "${config.preset}".`);
  }
  const id = config.preset as StylePresetId;
  return { id, ...STYLE_PRESETS[id], locked: config.locked === true };
};

/** Main video and storyboard resolve the exact same immutable style setting. */
export const getRenderStyle = (fallback: { background: string; grain: boolean; vignette: boolean }) => {
  const active = getStyleLock();
  return {
    background: active.locked ? active.background : fallback.background,
    grain: active.locked ? active.grain : fallback.grain,
    vignette: active.locked ? active.vignette : fallback.vignette,
    filter: active.locked && active.filter !== 'none' ? active.filter : undefined,
  };
};
