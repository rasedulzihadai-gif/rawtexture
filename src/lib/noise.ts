// Algorithmic noise building blocks. Pure math, deterministic given a seed.
import { RNG } from "./rng";

/** Smootherstep easing for interpolation. */
export function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Integer hash -> [0,1). Decorrelated across (x,y,seed). */
function hash2(x: number, y: number, seed: number): number {
  let h = (seed ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * 2D value noise with bilinear smoothing. Coordinates are in "noise units".
 * A small rotation per call is applied to avoid visible grid artifacts.
 */
export function valueNoise(x: number, y: number, seed: number): number {
  // rotate slightly to break axis alignment
  const rx = x * 0.8 - y * 0.6;
  const ry = x * 0.6 + y * 0.8;
  const x0 = Math.floor(rx);
  const y0 = Math.floor(ry);
  const xf = rx - x0;
  const yf = ry - y0;
  const tl = hash2(x0, y0, seed);
  const tr = hash2(x0 + 1, y0, seed);
  const bl = hash2(x0, y0 + 1, seed);
  const br = hash2(x0 + 1, y0 + 1, seed);
  const u = fade(xf);
  const v = fade(yf);
  const top = lerp(tl, tr, u);
  const bot = lerp(bl, br, u);
  return lerp(top, bot, v);
}

export interface FbmOptions {
  octaves?: number;
  lacunarity?: number;
  gain?: number;
  seed?: number;
}

/** Fractal Brownian Motion — layered value noise, returns ~[0,1]. */
export function fbm(x: number, y: number, opts: FbmOptions = {}): number {
  const octaves = opts.octaves ?? 5;
  const lac = opts.lacunarity ?? 2;
  const gain = opts.gain ?? 0.5;
  const baseSeed = opts.seed ?? 1;
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq, baseSeed + o * 1013);
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}

/** Ridged noise — sharp ridges, good for cracks / plaster imperfections. */
export function ridged(x: number, y: number, opts: FbmOptions = {}): number {
  const octaves = opts.octaves ?? 4;
  const lac = opts.lacunarity ?? 2;
  const gain = opts.gain ?? 0.5;
  const baseSeed = opts.seed ?? 7;
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(valueNoise(x * freq, y * freq, baseSeed + o * 1013) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}

/** Simple white noise per pixel, pre-seeded RNG. */
export function whiteNoise(rng: RNG): number {
  return rng.float();
}

/**
 * Draw a single thin "branch" — used for cracks, scratches, creases.
 * Walks from a start point with a slowly drifting angle, sometimes forking.
 */
export function drawBranch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  rng: RNG,
  color: string,
  depth = 0
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  let cx = x;
  let cy = y;
  let a = angle;
  const steps = Math.max(4, Math.floor(length / 4));
  for (let i = 0; i < steps; i++) {
    a += rng.range(-0.18, 0.18);
    const step = length / steps;
    cx += Math.cos(a) * step;
    cy += Math.sin(a) * step;
    ctx.lineTo(cx, cy);
    if (depth < 2 && rng.chance(0.06)) {
      drawBranch(
        ctx,
        cx,
        cy,
        a + rng.range(-1.1, 1.1),
        length * rng.range(0.2, 0.45),
        Math.max(0.5, width * 0.7),
        rng,
        color,
        depth + 1
      );
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** Draw a smooth low-opacity smudge/crease curve. */
export function drawSmudge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  rng: RNG,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  let cx = x;
  let cy = y;
  let a = angle;
  const steps = Math.max(6, Math.floor(length / 6));
  const curve = rng.range(-0.4, 0.4);
  for (let i = 0; i < steps; i++) {
    a += curve / steps + rng.range(-0.05, 0.05);
    const step = length / steps;
    cx += Math.cos(a) * step;
    cy += Math.sin(a) * step;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}
