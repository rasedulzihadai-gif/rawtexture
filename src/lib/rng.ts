// Seeded random number generation. Everything in this app derives from a
// single numeric seed so any result can be reproduced exactly from the seed.

/** Hash an arbitrary string into a 32-bit unsigned integer seed. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — fast, deterministic, good enough for visuals. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A small wrapper that also exposes convenience helpers. */
export class RNG {
  private next: () => number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }

  /** float in [0, 1) */
  float(): number {
    return this.next();
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** gaussian-ish via averaging */
  gauss(mean = 0, std = 1): number {
    const u = this.next() + this.next() + this.next() + this.next() - 2;
    return mean + u * std;
  }
}

/** Generate a fresh random seed (used by the Randomize button). */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
