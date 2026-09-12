// Color helpers and per-channel blend modes used for layered compositing.

export type RGB = [number, number, number];

export function clamp(v: number, min = 0, max = 255): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Convert a hex string to an RGB triple. */
export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Shift an RGB toward warmer (positive) or cooler (negative) tones. */
export function temperature(rgb: RGB, amt: number): RGB {
  return [
    clamp(rgb[0] + amt),
    clamp(rgb[1] - amt * 0.15),
    clamp(rgb[2] - amt),
  ];
}

/** Desaturate an RGB toward its luminance by `amt` in [0,1]. */
export function desaturate(rgb: RGB, amt: number): RGB {
  const lum = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
  return [
    lerp(rgb[0], lum, amt),
    lerp(rgb[1], lum, amt),
    lerp(rgb[2], lum, amt),
  ];
}

// --- Blend modes (inputs/outputs in 0..1) ---

export function overlay(b: number, s: number): number {
  return b < 0.5 ? 2 * b * s : 1 - 2 * (1 - b) * (1 - s);
}

export function softLight(b: number, s: number): number {
  return s < 0.5
    ? b - (1 - 2 * s) * b * (1 - b)
    : b + (2 * s - 1) * (Math.sqrt(b) - b);
}

export function multiply(b: number, s: number): number {
  return b * s;
}

export function screen(b: number, s: number): number {
  return 1 - (1 - b) * (1 - s);
}

export function rgbCss(rgb: RGB, a = 1): string {
  return `rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${a})`;
}
