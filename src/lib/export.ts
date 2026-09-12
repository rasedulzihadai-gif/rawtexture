// Export pipeline: single-file PNG/JPG export + bulk batch generation.
import JSZip from "jszip";
import { Palette, TextureOptions, TextureType } from "./types";
import { renderTexture } from "./textures";
import { RNG } from "./rng";
import { NO_LOCKS, RandomLocks, randomSize, randomizeOptions } from "./random";

export type ExportFormat = "png" | "jpg";

export type VariationMode = "seed" | "palette" | "type" | "random";

export const VARIATION_LABELS: { id: VariationMode; name: string; desc: string }[] = [
  { id: "seed", name: "Seed only", desc: "Same look, new random structure each time" },
  { id: "palette", name: "Seed + palette", desc: "Cycles through every colour preset" },
  { id: "type", name: "Seed + texture", desc: "Cycles through all 10 texture types" },
  {
    id: "random",
    name: "Full random",
    desc: "Randomises texture, palette & every slider (respects locks)",
  },
];

export interface BulkSettings {
  count: number;
  format: ExportFormat;
  quality: number; // 1-100, jpg only
  variation: VariationMode;
  prefix: string;
  asZip: boolean;
  /** Full-random mode only: vary the output dimensions per file too. */
  randomSize: boolean;
}

export function mimeFor(format: ExportFormat): string {
  return format === "png" ? "image/png" : "image/jpeg";
}

export function extFor(format: ExportFormat): string {
  return format === "png" ? "png" : "jpg";
}

/**
 * Render a texture at full size ready for export.
 * JPEG has no alpha channel, so a transparent grain-only plate is flattened
 * onto mid-grey (the neutral value for overlay/soft-light blending).
 */
export function renderForExport(
  opts: TextureOptions,
  w: number,
  h: number,
  format: ExportFormat
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  renderTexture(c, opts, w, h);
  if (format === "jpg" && opts.grainOnly) {
    const flat = document.createElement("canvas");
    flat.width = w;
    flat.height = h;
    const fx = flat.getContext("2d")!;
    fx.fillStyle = "#808080";
    fx.fillRect(0, 0, w, h);
    fx.drawImage(c, 0, 0);
    return flat;
  }
  return c;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      mimeFor(format),
      format === "jpg" ? Math.min(1, Math.max(0.1, quality / 100)) : undefined
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function safeName(s: string): string {
  return (s || "rawtexture").replace(/[^a-z0-9_-]/gi, "_").slice(0, 48);
}

/** Export the currently configured texture as a single file. */
export async function exportSingle(
  opts: TextureOptions,
  w: number,
  h: number,
  format: ExportFormat,
  quality: number,
  prefix: string
) {
  const canvas = renderForExport(opts, w, h, format);
  const blob = await canvasToBlob(canvas, format, quality);
  downloadBlob(
    blob,
    `${safeName(prefix)}_${opts.type}_${opts.seed}_${w}x${h}.${extFor(format)}`
  );
  return blob.size;
}

/**
 * Build the per-variant option set for a given batch index.
 * Deterministic: the same base seed + index always yields the same variant.
 */
export function variantOptions(
  base: TextureOptions,
  index: number,
  mode: VariationMode,
  types: TextureType[],
  palettes: Palette[],
  locks: RandomLocks = NO_LOCKS
): TextureOptions {
  const seed = (base.seed + Math.imul(index + 1, 2654435761)) >>> 0;

  if (mode === "random") {
    return randomizeOptions(base, locks, new RNG(seed), types, palettes, seed);
  }

  const o: TextureOptions = { ...base, seed };
  if (mode === "palette") {
    o.palette = palettes[index % palettes.length];
  } else if (mode === "type") {
    o.type = types[index % types.length];
  }
  return o;
}

/** Per-variant output dimensions (random-size mode only). */
export function variantSize(
  index: number,
  base: TextureOptions,
  settings: BulkSettings,
  w: number,
  h: number
): { w: number; h: number } {
  if (!settings.randomSize || settings.variation !== "random") return { w, h };
  const seed = (base.seed ^ Math.imul(index + 1, 40503)) >>> 0;
  return randomSize(new RNG(seed));
}

export interface BatchProgress {
  done: number;
  total: number;
  label: string;
  bytes: number;
}

/**
 * Generate N variations and download them (zipped or individually).
 * Yields to the event loop between frames so the UI stays responsive.
 */
export async function runBatch(
  base: TextureOptions,
  settings: BulkSettings,
  w: number,
  h: number,
  types: TextureType[],
  palettes: Palette[],
  onProgress: (p: BatchProgress) => void,
  isCancelled: () => boolean,
  locks: RandomLocks = NO_LOCKS
): Promise<{ cancelled: boolean; bytes: number; count: number }> {
  const { count, format, quality, variation, prefix, asZip } = settings;
  const zip = asZip ? new JSZip() : null;
  const folder = zip ? zip.folder(safeName(prefix) || "textures") ?? zip : null;
  let bytes = 0;
  let made = 0;

  for (let i = 0; i < count; i++) {
    if (isCancelled()) return { cancelled: true, bytes, count: made };
    const o = variantOptions(base, i, variation, types, palettes, locks);
    const dim = variantSize(i, base, settings, w, h);
    onProgress({
      done: i,
      total: count,
      label: `Rendering ${i + 1} of ${count} — ${o.type} ${dim.w}×${dim.h}`,
      bytes,
    });
    // yield so React can paint the progress bar
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const canvas = renderForExport(o, dim.w, dim.h, format);
    const blob = await canvasToBlob(canvas, format, quality);
    bytes += blob.size;
    made++;
    const name = `${safeName(prefix)}_${String(i + 1).padStart(3, "0")}_${o.type}_${o.seed}_${dim.w}x${dim.h}.${extFor(format)}`;

    if (folder) {
      folder.file(name, blob);
    } else {
      downloadBlob(blob, name);
      await new Promise((r) => setTimeout(r, 220)); // spacing for browser download queue
    }
    // release the canvas early
    canvas.width = 0;
    canvas.height = 0;
  }

  if (zip) {
    onProgress({ done: count, total: count, label: "Compressing archive…", bytes });
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    // PNG/JPG are already compressed — STORE keeps zipping fast
    const out = await zip.generateAsync({ type: "blob", compression: "STORE" });
    downloadBlob(out, `${safeName(prefix)}_${count}x_${w}x${h}.zip`);
  }

  onProgress({ done: count, total: count, label: "Complete", bytes });
  return { cancelled: false, bytes, count: made };
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
