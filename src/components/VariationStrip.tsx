import { useEffect, useMemo, useRef } from "react";
import { renderTexture } from "../lib/textures";
import { TextureOptions } from "../lib/types";

function Cell({
  opts,
  onPick,
  active,
}: {
  opts: TextureOptions;
  onPick: () => void;
  active: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderTexture(c, opts, Math.round(76 * dpr), Math.round(52 * dpr));
  }, [opts]);
  return (
    <button
      onClick={onPick}
      title={`${opts.type} · seed ${opts.seed}`}
      className={`group relative overflow-hidden rounded-[5px] transition ${
        active ? "ring-2 ring-[#0d99ff]" : "ring-1 ring-black/40 hover:ring-[#5a5a5a]"
      }`}
    >
      <canvas ref={ref} className="block h-[52px] w-full" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 pb-0.5 pt-2 text-left text-[8px] font-medium text-white/85 opacity-0 transition group-hover:opacity-100">
        {opts.type}
      </span>
    </button>
  );
}

/** A grid of random candidates — click one to load it into the editor. */
export default function VariationStrip({
  candidates,
  onPick,
  currentSeed,
}: {
  candidates: TextureOptions[];
  onPick: (o: TextureOptions) => void;
  currentSeed: number;
}) {
  const items = useMemo(() => candidates, [candidates]);
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((o) => (
        <Cell
          key={o.seed}
          opts={o}
          active={o.seed === currentSeed}
          onPick={() => onPick(o)}
        />
      ))}
    </div>
  );
}
