export const PALETTES = [
  {
    id: 'hivis',
    label: 'Hi-Vis',
    description: 'Site-safety amber on poured concrete',
    swatch: 'oklch(0.72 0.16 75)',
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'Survey cyan on drawing paper',
    swatch: 'oklch(0.52 0.12 240)',
  },
  {
    id: 'steel',
    label: 'Steel',
    description: 'Structural cool gray',
    swatch: 'oklch(0.45 0.05 250)',
  },
  {
    id: 'timber',
    label: 'Timber',
    description: 'Formwork walnut',
    swatch: 'oklch(0.5 0.08 60)',
  },
] as const;

export type PaletteId = (typeof PALETTES)[number]['id'];
export type Density = 'comfortable' | 'compact';
export type MotionPref = 'system' | 'reduce';
export type ColorMode = 'system' | 'light' | 'dark';

export const PALETTE_KEY = 'cms.palette';
export const DENSITY_KEY = 'cms.density';
export const MOTION_KEY = 'cms.motion';
export const COLOR_SCHEME_KEY = 'cms.color-scheme';

export const DEFAULT_PALETTE: PaletteId = 'hivis';
export const DEFAULT_DENSITY: Density = 'comfortable';
export const DEFAULT_MOTION: MotionPref = 'system';

export function isPaletteId(value: unknown): value is PaletteId {
  return PALETTES.some((p) => p.id === value);
}

export function isDensity(value: unknown): value is Density {
  return value === 'comfortable' || value === 'compact';
}

export function isMotionPref(value: unknown): value is MotionPref {
  return value === 'system' || value === 'reduce';
}

export const APPEARANCE_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var p=localStorage.getItem('${PALETTE_KEY}');if(p)d.setAttribute('data-palette',p);var n=localStorage.getItem('${DENSITY_KEY}');if(n)d.setAttribute('data-density',n);var m=localStorage.getItem('${MOTION_KEY}');if(m)d.setAttribute('data-motion',m);var cs=localStorage.getItem('${COLOR_SCHEME_KEY}');var meta=document.querySelector('meta[name="color-scheme"]');if(cs&&meta)meta.setAttribute('content',cs);}catch(e){}})();`;
