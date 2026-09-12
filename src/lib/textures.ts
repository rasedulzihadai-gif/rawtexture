// Procedural texture generators. Every effect is computed in code from a
// numeric seed — no external image generation. Each generator paints into a
// canvas context; pixel work uses ImageData, vector imperfections use the
// 2D drawing API.
import { RNG } from "./rng";
import { fbm, ridged, drawBranch, drawSmudge } from "./noise";
import {
  RGB,
  clamp,
  lerp,
  mixRGB,
  overlay,
  temperature,
  desaturate,
  rgbCss,
} from "./color";
import { Palette, TextureOptions, TextureType } from "./types";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export interface CoreOptions {
  type: TextureType;
  seed: number;
  palette: Palette;
  imperfection: number;
  grainIntensity: number;
  grainSize: number;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Fill an ImageData pixel buffer with a per-pixel function (no allocations). */
function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fn: (x: number, y: number, d: Uint8ClampedArray, i: number) => void
) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      fn(x, y, d, i);
      i += 4;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ----------------------------------------------------------------------------
// GLOBAL FINISH PASSES
// ----------------------------------------------------------------------------

/** Uniform film-style grain drawn as a noise layer blended over everything. */
export function drawGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  intensity: number,
  size: number,
  mode: GlobalCompositeOperation = "overlay"
) {
  if (intensity <= 0) return;
  const scale = clamp(size, 0.5, 4);
  const gw = Math.max(1, Math.round(w / scale));
  const gh = Math.max(1, Math.round(h / scale));
  const gc = makeCanvas(gw, gh);
  const gctx = gc.getContext("2d")!;
  const img = gctx.createImageData(gw, gh);
  const d = img.data;
  for (let i = 0; i < gw * gh; i++) {
    const v = 128 + (rng.float() - 0.5) * 255;
    d[i * 4] = v;
    d[i * 4 + 1] = v;
    d[i * 4 + 2] = v;
    d[i * 4 + 3] = 255;
  }
  gctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = clamp((intensity / 100) * 0.8, 0, 1);
  ctx.globalCompositeOperation = mode;
  ctx.imageSmoothingEnabled = scale > 1.5;
  ctx.drawImage(gc, 0, 0, w, h);
  ctx.restore();
}

/** Soft darkening toward the edges. */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  strength: number
) {
  if (strength <= 0) return;
  const a = (strength / 100) * 0.8;
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.25,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.78
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a.toFixed(3)})`);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ----------------------------------------------------------------------------
// GENERATOR 1 — FILM GRAIN OVERLAY
// ----------------------------------------------------------------------------
function genFilmGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { shadow, highlight } = co.palette;
  const gf = clamp(co.grainSize, 0.5, 4);
  const amt = (co.grainIntensity / 100) * 0.9;
  paint(ctx, w, h, (x, y, d, i) => {
    const xf = x / w;
    const yf = y / h;
    // subtle tonal base gradient + macro mottling
    let base = 0.5 + 0.2 * (xf - 0.5) + 0.1 * (yf - 0.5) + 0.07 * (fbm(xf * 3, yf * 3, { seed: co.seed }) - 0.5);
    base = clamp01(base);
    // layered grain: multi-scale fbm + fine white noise
    let grain = fbm(xf * gf * 6, yf * gf * 6, { octaves: 4, seed: co.seed + 11 });
    grain = grain * 0.6 + rng.float() * 0.4;
    const v = lerp(base, overlay(base, grain), amt);
    const col = mixRGB(shadow, highlight, v);
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
}

// ----------------------------------------------------------------------------
// GENERATOR 2 — FLASH PHOTOGRAPHY LOOK
// ----------------------------------------------------------------------------
function genFlash(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { shadow, highlight, accent } = co.palette;
  const cx = w * rng.range(0.38, 0.62);
  const cy = h * rng.range(0.32, 0.58);
  const R = Math.min(w, h) * rng.range(0.45, 0.85);
  const warm = 34;
  paint(ctx, w, h, (x, y, d, i) => {
    const dx = (x - cx) / R;
    const dy = (y - cy) / R;
    const dist2 = dx * dx + dy * dy;
    const falloff = Math.exp(-dist2 * 1.15);
    // surface mottling so the wall isn't flat
    const mottle = 0.9 + 0.2 * fbm(x / 90, y / 90, { seed: co.seed + 3 });
    let lit = (0.32 + 0.68 * falloff) * mottle;
    lit = clamp01(lit);
    let col = mixRGB(shadow, highlight, lit);
    // warm center, cool edges
    col = temperature(col, (falloff - 0.45) * warm);
    col = mixRGB(col, accent, 0.12 * (1 - falloff));
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
}

// ----------------------------------------------------------------------------
// GENERATOR 3 — PAPER / CANVAS TEXTURE
// ----------------------------------------------------------------------------
function genPaper(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { shadow, highlight } = co.palette;
  paint(ctx, w, h, (x, y, d, i) => {
    const xf = x / w;
    const yf = y / h;
    // fine fibers: strong along one axis, weak along the other
    const vert = fbm(x * 0.05, y * 1.4, { seed: co.seed + 1, octaves: 3 });
    const horz = fbm(x * 1.4, y * 0.05, { seed: co.seed + 2, octaves: 3 });
    const fiber = vert * 0.5 + horz * 0.5;
    // uneven large-scale lighting
    const light = fbm(xf * 4, yf * 4, { seed: co.seed + 5 }) * 0.5;
    let v = 0.5 + (fiber - 0.5) * 0.35 + (light - 0.25) * 0.6 + (rng.float() - 0.5) * 0.03;
    v = clamp01(v);
    const col = mixRGB(shadow, highlight, v);
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
  // smudges & creases scaled by imperfection
  const imp = co.imperfection / 100;
  const smudges = Math.round(imp * 14);
  for (let s = 0; s < smudges; s++) {
    drawSmudge(
      ctx,
      rng.range(0, w),
      rng.range(0, h),
      rng.range(0, Math.PI * 2),
      rng.range(w * 0.15, w * 0.7),
      rng.range(2, 7),
      rng,
      rgbCss(shadow, rng.range(0.04, 0.12))
    );
  }
  const creases = Math.round(imp * 6);
  for (let s = 0; s < creases; s++) {
    drawSmudge(
      ctx,
      rng.range(0, w),
      rng.range(0, h),
      rng.range(0, Math.PI * 2),
      rng.range(w * 0.3, w * 0.9),
      rng.range(1, 2.5),
      rng,
      rgbCss(mixRGB(shadow, [0, 0, 0], 0.3), rng.range(0.06, 0.16))
    );
  }
}

// ----------------------------------------------------------------------------
// GENERATOR 4 — CONCRETE / PLASTER WALL
// ----------------------------------------------------------------------------
function genConcrete(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { shadow, highlight, accent } = co.palette;
  // Precompute a single height field (avoid re-sampling per pixel).
  const H = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      H[y * w + x] =
        ridged(x * 0.012, y * 0.012, { seed: co.seed, octaves: 4 }) * 0.7 +
        fbm(x * 0.03, y * 0.03, { seed: co.seed + 9, octaves: 3 }) * 0.3;
    }
  }
  paint(ctx, w, h, (x, y, d, i) => {
    const hv = H[i];
    const left = x > 0 ? H[i - 1] : hv;
    const right = x < w - 1 ? H[i + 1] : hv;
    const up = y > 0 ? H[i - w] : hv;
    const down = y < h - 1 ? H[i + w] : hv;
    const dx = right - left;
    const dy = down - up;
    const light = clamp01(
      0.55 +
        (dx * 0.6 + dy * 0.9) * 3.5 +
        0.15 * (fbm(x * 0.01, y * 0.01, { seed: co.seed + 4 }) - 0.5)
    );
    // patchy discoloration blobs
    const blob = fbm(x * 0.004, y * 0.004, { seed: co.seed + 7 });
    const patch = smoothstep(0.55, 0.8, blob);
    let base = mixRGB(shadow, highlight, hv * light);
    base = mixRGB(base, accent, patch * 0.4);
    const col = desaturate(base, 0.15);
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
  // hairline cracks
  const cracks = Math.round((co.imperfection / 100) * 22);
  for (let c = 0; c < cracks; c++) {
    drawBranch(
      ctx,
      rng.range(0, w),
      rng.range(0, h),
      rng.range(0, Math.PI * 2),
      rng.range(w * 0.05, w * 0.35),
      rng.range(0.5, 1.6),
      rng,
      rgbCss(mixRGB(shadow, [0, 0, 0], 0.45), rng.range(0.2, 0.5))
    );
  }
}

// ----------------------------------------------------------------------------
// GENERATOR 5 — FABRIC / LINEN WEAVE
// ----------------------------------------------------------------------------
function genFabric(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { shadow, highlight } = co.palette;
  const P = Math.max(4, Math.round(Math.min(w, h) / 160)); // weave period
  paint(ctx, w, h, (x, y, d, i) => {
    const cell = ((Math.floor(x / P) + Math.floor(y / P)) % 2 + 2) % 2;
    const u = (x % P) / P;
    const v = (y % P) / P;
    // over/under weave shading
    const thread = cell === 0
      ? 0.5 + 0.5 * Math.cos(u * Math.PI * 2)
      : 0.5 + 0.5 * Math.cos(v * Math.PI * 2);
    // soft diagonal fold bands
    const fold = 0.5 + 0.5 * Math.sin((x + y) / (Math.min(w, h) / 5));
    const fiber = 0.5 + 0.5 * fbm(x * 0.6, y * 0.6, { seed: co.seed + 2, octaves: 2 });
    let vv = 0.5 + (thread - 0.5) * 0.55 + (fold - 0.5) * 0.3 + (fiber - 0.5) * 0.12;
    vv = clamp01(vv);
    const col = mixRGB(shadow, highlight, vv);
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
  // lint / fiber specks
  const lint = Math.round((co.imperfection / 100) * 240);
  for (let s = 0; s < lint; s++) {
    const px = rng.range(0, w);
    const py = rng.range(0, h);
    const r = rng.range(0.5, 1.8);
    ctx.fillStyle = rgbCss(rng.chance(0.5) ? highlight : shadow, rng.range(0.1, 0.4));
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----------------------------------------------------------------------------
// GENERATOR 6 — SCANNED / XEROX
// ----------------------------------------------------------------------------
function genXerox(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { shadow, highlight } = co.palette;
  const skew = rng.range(-0.04, 0.04);
  // precompute a per-row scan-line streak offset (O(h) instead of O(w*h*streaks))
  const streakOff = new Float32Array(h);
  const nStreak = Math.round((co.imperfection / 100) * 40) + 6;
  for (let s = 0; s < nStreak; s++) {
    const sy = Math.floor(rng.range(0, h));
    const band = rng.int(1, 3);
    const o = rng.range(-0.18, 0.18);
    for (let yy = sy; yy < Math.min(h, sy + band); yy++) streakOff[yy] += o;
  }
  paint(ctx, w, h, (x, y, d, i) => {
    const sx = x + y * skew;
    const sxf = sx / w;
    const syf = y / h;
    let n = fbm(sxf * 7, syf * 7, { seed: co.seed, octaves: 4 });
    // high contrast
    n = clamp01((n - 0.5) * 1.7 + 0.5);
    const off = streakOff[y];
    let v = clamp01(n + off + (rng.float() - 0.5) * 0.08);
    const col = mixRGB(shadow, highlight, v);
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
  // dust specks
  const dust = Math.round((co.imperfection / 100) * 120);
  for (let s = 0; s < dust; s++) {
    const px = rng.range(0, w);
    const py = rng.range(0, h);
    ctx.fillStyle = rgbCss(rng.chance(0.5) ? ([10, 10, 10] as RGB) : ([250, 250, 250] as RGB), rng.range(0.3, 0.8));
    ctx.beginPath();
    ctx.arc(px, py, rng.range(0.5, 2), 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----------------------------------------------------------------------------
// GENERATOR 7 — LIGHT LEAK / ANALOG DEFECT
// ----------------------------------------------------------------------------
function genLightLeak(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { base, shadow, highlight, accent } = co.palette;
  // desaturated neutral base
  let bg = desaturate(base, 0.4);
  paint(ctx, w, h, (x, y, d, i) => {
    const v = 0.5 + 0.12 * (fbm(x / w * 4, y / h * 4, { seed: co.seed }) - 0.5);
    const col = mixRGB(shadow, highlight, clamp01(v));
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
  void bg;
  // warm colors bleeding from one edge
  const edge = rng.int(0, 3); // 0 top,1 bottom,2 left,3 right
  const warmColors: RGB[] = [accent, [200, 90, 50], [220, 150, 60], [180, 70, 90], [230, 180, 90]];
  const blobs = rng.int(3, 6);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let b = 0; b < blobs; b++) {
    const c = warmColors[rng.int(0, warmColors.length - 1)];
    let ox: number, oy: number;
    const span = Math.max(w, h);
    if (edge === 0) {
      ox = rng.range(0, w);
      oy = rng.range(-span * 0.1, h * 0.4);
    } else if (edge === 1) {
      ox = rng.range(0, w);
      oy = rng.range(h * 0.6, h + span * 0.1);
    } else if (edge === 2) {
      ox = rng.range(-span * 0.1, w * 0.4);
      oy = rng.range(0, h);
    } else {
      ox = rng.range(w * 0.6, w + span * 0.1);
      oy = rng.range(0, h);
    }
    const rad = rng.range(span * 0.15, span * 0.55);
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
    const a = rng.range(0.25, 0.6);
    g.addColorStop(0, rgbCss(c, a));
    g.addColorStop(1, rgbCss(c, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ox, oy, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ----------------------------------------------------------------------------
// GENERATOR 8 — DUST & SCRATCHES
// ----------------------------------------------------------------------------
function genDustScratches(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { shadow, highlight } = co.palette;
  // low-key clean base
  const dark = mixRGB(shadow, [0, 0, 0], 0.35);
  paint(ctx, w, h, (x, y, d, i) => {
    const v = 0.5 + 0.4 * (fbm(x / w * 5, y / h * 5, { seed: co.seed }) - 0.5);
    const col = mixRGB(dark, mixRGB(dark, highlight, 0.5), clamp01(v));
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
  const imp = co.imperfection / 100;
  const scratches = Math.round(imp * 40) + 2;
  for (let s = 0; s < scratches; s++) {
    if (rng.chance(0.6)) {
      // drifting scratch (branch)
      drawBranch(
        ctx,
        rng.range(0, w),
        rng.range(0, h),
        rng.range(0, Math.PI * 2),
        rng.range(w * 0.1, w * 0.6),
        rng.range(0.4, 1.4),
        rng,
        rgbCss(highlight, rng.range(0.15, 0.5))
      );
    } else {
      // short straight scratch
      const x = rng.range(0, w);
      const y = rng.range(0, h);
      const a = rng.range(0, Math.PI * 2);
      const len = rng.range(20, w * 0.25);
      ctx.save();
      ctx.strokeStyle = rgbCss(highlight, rng.range(0.2, 0.6));
      ctx.lineWidth = rng.range(0.3, 1.2);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
      ctx.restore();
    }
  }
  const dust = Math.round(imp * 300);
  for (let s = 0; s < dust; s++) {
    const px = rng.range(0, w);
    const py = rng.range(0, h);
    ctx.fillStyle = rgbCss(rng.chance(0.7) ? highlight : ([20, 20, 20] as RGB), rng.range(0.2, 0.7));
    ctx.beginPath();
    ctx.arc(px, py, rng.range(0.4, 1.6), 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----------------------------------------------------------------------------
// GENERATOR 9 — WATERCOLOR / INK BLEED
// ----------------------------------------------------------------------------
function genWatercolor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _rng: RNG,
  co: CoreOptions
) {
  const paper = mixRGB(co.palette.base, [255, 255, 255], 0.25);
  const ink = co.palette.accent;
  void _rng;
  paint(ctx, w, h, (x, y, d, i) => {
    const xf = x / w;
    const yf = y / h;
    // domain warp for organic edges
    const wx = xf + (fbm(xf * 3, yf * 3, { seed: co.seed + 1 }) - 0.5) * 0.25;
    const wy = yf + (fbm(xf * 3, yf * 3, { seed: co.seed + 2 }) - 0.5) * 0.25;
    const blot = fbm(wx * 2.2, wy * 2.2, { seed: co.seed, octaves: 5 });
    const edge = smoothstep(0.38, 0.62, blot + 0.12 * (fbm(wx * 9, wy * 9, { seed: co.seed + 8 }) - 0.5));
    // paper grain underlay
    const grain = 0.5 + 0.5 * fbm(xf * 8, yf * 8, { seed: co.seed + 4, octaves: 2 });
    let col = mixRGB(paper, ink, edge);
    col = mixRGB(col, paper, (1 - grain) * 0.08);
    d[i] = col[0];
    d[i + 1] = col[1];
    d[i + 2] = col[2];
    d[i + 3] = 255;
  });
}

// ----------------------------------------------------------------------------
// GENERATOR 10 — BOKEH / OUT-OF-FOCUS LIGHTS
// ----------------------------------------------------------------------------
function genBokeh(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  co: CoreOptions
) {
  const { base, shadow, highlight, accent } = co.palette;
  // dark gradient background
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, rgbCss(mixRGB(shadow, [0, 0, 0], 0.55)));
  g.addColorStop(1, rgbCss(mixRGB(shadow, [0, 0, 0], 0.3)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const colors: RGB[] = [highlight, accent, [255, 240, 210], [210, 225, 255], base];
  const count = rng.int(40, 90);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let b = 0; b < count; b++) {
    const ox = rng.range(0, w);
    const oy = rng.range(0, h);
    const rad = rng.range(Math.min(w, h) * 0.02, Math.min(w, h) * 0.13);
    const c = colors[rng.int(0, colors.length - 1)];
    const a = rng.range(0.12, 0.5);
    const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
    rg.addColorStop(0, rgbCss(c, a));
    rg.addColorStop(0.7, rgbCss(c, a * 0.35));
    rg.addColorStop(1, rgbCss(c, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(ox, oy, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ----------------------------------------------------------------------------
// DISPATCH
// ----------------------------------------------------------------------------
const GENERATORS: Record<TextureType, typeof genFilmGrain> = {
  filmGrain: genFilmGrain,
  flash: genFlash,
  paper: genPaper,
  concrete: genConcrete,
  fabric: genFabric,
  xerox: genXerox,
  lightLeak: genLightLeak,
  dustScratches: genDustScratches,
  watercolor: genWatercolor,
  bokeh: genBokeh,
};

function renderCore(canvas: HTMLCanvasElement, co: CoreOptions) {
  canvas.width = canvas.width; // no-op keep
  const ctx = canvas.getContext("2d")!;
  const rng = new RNG(co.seed);
  GENERATORS[co.type](ctx, canvas.width, canvas.height, rng, co);
}

/** Render a transparent grain-only overlay (stackable asset). */
export function renderGrainOnly(
  canvas: HTMLCanvasElement,
  opts: TextureOptions,
  w: number,
  h: number
) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const rng = new RNG(opts.seed);
  const gf = clamp(opts.grainSize, 0.5, 4);
  paint(ctx, w, h, (x, y, d, i) => {
    const xf = x / w;
    const yf = y / h;
    let n = fbm(xf * gf * 6, yf * gf * 6, { octaves: 4, seed: opts.seed + 11 });
    n = n * 0.6 + rng.float() * 0.4;
    const a = clamp01((n - 0.5) * 1.6 + 0.5) * (opts.grainIntensity / 100);
    d[i] = 128;
    d[i + 1] = 128;
    d[i + 2] = 128;
    d[i + 3] = a * 255;
  });
}

/**
 * Full render: base layer + optional stacked combo layers (soft-light blend),
 * then global grain and vignette. Mutates the target canvas to w x h.
 */
export function renderTexture(
  canvas: HTMLCanvasElement,
  opts: TextureOptions,
  w: number,
  h: number
) {
  if (opts.grainOnly) {
    renderGrainOnly(canvas, opts, w, h);
    return;
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const base = makeCanvas(w, h);
  renderCore(base, {
    type: opts.type,
    seed: opts.seed,
    palette: opts.palette,
    imperfection: opts.imperfection,
    grainIntensity: opts.grainIntensity,
    grainSize: opts.grainSize,
  });
  ctx.drawImage(base, 0, 0);

  // stacked preset combos
  opts.stack.forEach((st, idx) => {
    const lc = makeCanvas(w, h);
    renderCore(lc, {
      type: st,
      seed: (opts.seed + (idx + 1) * 99991) >>> 0,
      palette: opts.palette,
      imperfection: opts.imperfection,
      grainIntensity: opts.grainIntensity,
      grainSize: opts.grainSize,
    });
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.9;
    ctx.drawImage(lc, 0, 0);
    ctx.restore();
  });

  const rng = new RNG((opts.seed ^ 0x9e3779b9) >>> 0);
  drawGrain(ctx, w, h, rng, opts.grainIntensity, opts.grainSize, "overlay");
  drawVignette(ctx, w, h, opts.vignette);
}
