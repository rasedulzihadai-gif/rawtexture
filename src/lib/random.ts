// Randomization engine.
// Produces *tasteful* random textures — every value is drawn from a per-type
// range tuned to stay believable (subtle-to-moderate), never "Instagram filter".
// Everything is derived from a seed, so any random result is reproducible.
import { RNG, randomSeed } from "./rng";
import { Palette, TextureOptions, TextureType } from "./types";

/** Properties that can be pinned so the randomizer leaves them alone. */
export interface RandomLocks {
  type: boolean;
  palette: boolean;
  grain: boolean;
  wear: boolean;
  vignette: boolean;
  stack: boolean;
  size: boolean;
}

export const NO_LOCKS: RandomLocks = {
  type: false,
  palette: false,
  grain: false,
  wear: false,
  vignette: false,
  stack: false,
  size: false,
};

export const LOCK_META: { id: keyof RandomLocks; label: string }[] = [
  { id: "type", label: "Texture" },
  { id: "palette", label: "Palette" },
  { id: "grain", label: "Grain" },
  { id: "wear", label: "Wear" },
  { id: "vignette", label: "Vignette" },
  { id: "stack", label: "Layers" },
  { id: "size", label: "Size" },
];

interface Tuning {
  grain: [number, number];
  grainSize: [number, number];
  wear: [number, number];
  vignette: [number, number];
  stackChance: number;
  /** textures that pair well as a stacked layer on top of this one */
  pairs: TextureType[];
}

/** Per-texture ranges that keep random output looking authentic. */
const TUNING: Record<TextureType, Tuning> = {
  filmGrain: {
    grain: [35, 80],
    grainSize: [0.8, 2.4],
    wear: [0, 30],
    vignette: [10, 45],
    stackChance: 0.35,
    pairs: ["flash", "lightLeak", "dustScratches"],
  },
  flash: {
    grain: [20, 55],
    grainSize: [0.8, 1.8],
    wear: [5, 35],
    vignette: [25, 65],
    stackChance: 0.3,
    pairs: ["filmGrain", "concrete", "paper"],
  },
  paper: {
    grain: [15, 45],
    grainSize: [0.6, 1.6],
    wear: [20, 65],
    vignette: [5, 30],
    stackChance: 0.2,
    pairs: ["watercolor", "dustScratches"],
  },
  concrete: {
    grain: [25, 60],
    grainSize: [0.8, 2.2],
    wear: [25, 80],
    vignette: [15, 50],
    stackChance: 0.25,
    pairs: ["flash", "filmGrain"],
  },
  fabric: {
    grain: [15, 45],
    grainSize: [0.6, 1.5],
    wear: [15, 55],
    vignette: [10, 40],
    stackChance: 0.18,
    pairs: ["paper", "filmGrain"],
  },
  xerox: {
    grain: [30, 70],
    grainSize: [0.6, 1.8],
    wear: [25, 75],
    vignette: [0, 25],
    stackChance: 0.15,
    pairs: ["dustScratches", "paper"],
  },
  lightLeak: {
    grain: [30, 65],
    grainSize: [0.9, 2.2],
    wear: [5, 35],
    vignette: [10, 40],
    stackChance: 0.3,
    pairs: ["filmGrain", "dustScratches"],
  },
  dustScratches: {
    grain: [20, 55],
    grainSize: [0.7, 1.8],
    wear: [30, 85],
    vignette: [15, 50],
    stackChance: 0.2,
    pairs: ["filmGrain", "lightLeak"],
  },
  watercolor: {
    grain: [15, 45],
    grainSize: [0.6, 1.6],
    wear: [5, 40],
    vignette: [0, 30],
    stackChance: 0.25,
    pairs: ["paper", "filmGrain"],
  },
  bokeh: {
    grain: [20, 55],
    grainSize: [0.8, 2.0],
    wear: [0, 25],
    vignette: [20, 60],
    stackChance: 0.2,
    pairs: ["filmGrain", "lightLeak"],
  },
};

/** Stock-friendly sizes used when size randomization is enabled. */
export const RANDOM_SIZES: { w: number; h: number }[] = [
  { w: 1920, h: 1080 },
  { w: 2400, h: 1600 },
  { w: 3000, h: 2000 },
  { w: 3000, h: 3000 },
  { w: 3840, h: 2160 },
  { w: 4000, h: 3000 },
  { w: 2000, h: 3000 },
];

export function randomSize(rng: RNG): { w: number; h: number } {
  return RANDOM_SIZES[rng.int(0, RANDOM_SIZES.length - 1)];
}

/**
 * Build a fully random (but tasteful) option set.
 * Locked fields are copied straight from `base`.
 */
export function randomizeOptions(
  base: TextureOptions,
  locks: RandomLocks,
  rng: RNG,
  types: TextureType[],
  palettes: Palette[],
  seed?: number
): TextureOptions {
  const type = locks.type ? base.type : rng.pick(types);
  const t = TUNING[type];
  const palette = locks.palette ? base.palette : rng.pick(palettes);

  // stacked combo layers — mostly none, occasionally one well-matched partner
  let stack = base.stack;
  if (!locks.stack) {
    stack = [];
    if (rng.chance(t.stackChance)) {
      const candidates = t.pairs.filter((p) => p !== type);
      if (candidates.length) stack = [rng.pick(candidates)];
    }
  }

  return {
    type,
    palette,
    seed: seed ?? randomSeed(),
    grainIntensity: locks.grain ? base.grainIntensity : Math.round(rng.range(t.grain[0], t.grain[1])),
    grainSize: locks.grain
      ? base.grainSize
      : Number(rng.range(t.grainSize[0], t.grainSize[1]).toFixed(1)),
    imperfection: locks.wear ? base.imperfection : Math.round(rng.range(t.wear[0], t.wear[1])),
    vignette: locks.vignette
      ? base.vignette
      : Math.round(rng.range(t.vignette[0], t.vignette[1])),
    grainOnly: base.grainOnly,
    stack,
  };
}

/** Convenience: randomize using a brand-new seed (the Shuffle button). */
export function shuffle(
  base: TextureOptions,
  locks: RandomLocks,
  types: TextureType[],
  palettes: Palette[]
): TextureOptions {
  const seed = randomSeed();
  return randomizeOptions(base, locks, new RNG(seed), types, palettes, seed);
}

/** A deterministic set of N random candidates derived from one root seed. */
export function randomCandidates(
  base: TextureOptions,
  locks: RandomLocks,
  types: TextureType[],
  palettes: Palette[],
  rootSeed: number,
  n: number
): TextureOptions[] {
  const out: TextureOptions[] = [];
  for (let i = 0; i < n; i++) {
    const s = (rootSeed + Math.imul(i + 1, 2654435761)) >>> 0;
    out.push(randomizeOptions(base, locks, new RNG(s), types, palettes, s));
  }
  return out;
}
