import { useEffect, useRef } from "react";
import { renderTexture } from "../lib/textures";
import { Palette, TextureType } from "../lib/types";

/** Tiny live-rendered preview chip used in the texture library list. */
export default function TextureThumb({
  type,
  palette,
  seed = 12345,
  w = 56,
  h = 36,
}: {
  type: TextureType;
  palette: Palette;
  seed?: number;
  w?: number;
  h?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderTexture(
      c,
      {
        type,
        seed,
        palette,
        grainIntensity: 40,
        grainSize: 1,
        imperfection: 45,
        vignette: 22,
        grainOnly: false,
        stack: [],
      },
      Math.round(w * dpr),
      Math.round(h * dpr)
    );
  }, [type, palette, seed, w, h]);

  return (
    <canvas
      ref={ref}
      style={{ width: w, height: h }}
      className="shrink-0 rounded-[3px] ring-1 ring-black/50"
    />
  );
}
