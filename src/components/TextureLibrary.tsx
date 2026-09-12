import React, { useState } from "react";
import { TEXTURE_META, TextureType } from "../lib/types";
import { Palette } from "../lib/types";
import TextureThumb from "./TextureThumb";

interface TextureLibraryProps {
  activeType: TextureType;
  onSelectType: (type: TextureType) => void;
  palette: Palette;
  stack: TextureType[];
  onToggleStack: (type: TextureType) => void;
  onClearStack: () => void;
  keywords: string[];
  onCopyKeywords: () => void;
}

const CATEGORY_TAGS: Record<TextureType, string> = {
  filmGrain: "Analog 35mm",
  flash: "Studio Flash",
  paper: "Craft Surface",
  concrete: "Urban Grunge",
  fabric: "Textile Weave",
  xerox: "Vintage Print",
  lightLeak: "Camera Defect",
  dustScratches: "Film Damage",
  watercolor: "Organic Ink",
  bokeh: "Defocus Light",
};

export const TextureLibrary: React.FC<TextureLibraryProps> = ({
  activeType,
  onSelectType,
  palette,
  stack,
  onToggleStack,
  onClearStack,
  keywords,
  onCopyKeywords,
}) => {
  const [search, setSearch] = useState("");
  const [isStackOpen, setIsStackOpen] = useState(true);

  const filtered = TEXTURE_META.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.blurb.toLowerCase().includes(search.toLowerCase()) ||
      CATEGORY_TAGS[t.id].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-[280px] bg-[#18181b] border-r border-[#27272a] flex flex-col h-full overflow-hidden select-none z-20 shrink-0">
      {/* Search Header */}
      <div className="p-3 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-[#ededed] uppercase tracking-wider">
            Texture Models
          </span>
          <span className="text-[10px] text-[#71717a] font-mono font-medium">
            10 Procedural
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search textures (grain, wall, paper)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-7.5 bg-[#202024] text-[#ededed] text-[11px] pl-7 pr-3 rounded-md border border-[#323238] focus:border-[#0d99ff] outline-none transition-colors placeholder:text-[#52525b]"
          />
          <svg
            viewBox="0 0 16 16"
            className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l4 4" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Texture List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((item) => {
          const isSelected = activeType === item.id;
          const isStacked = stack.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onSelectType(item.id)}
              className={`group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border ${
                isSelected
                  ? "bg-[#0d99ff]/15 border-[#0d99ff]/50 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-[#202024] hover:border-[#2e2e34]"
              }`}
            >
              {/* Live miniature thumbnail */}
              <div className="relative shrink-0 rounded overflow-hidden shadow-sm border border-[#3f3f46]/40">
                <TextureThumb type={item.id} palette={palette} w={48} h={34} />
                {isStacked && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#0d99ff] ring-1 ring-[#18181b]" />
                )}
              </div>

              {/* Info text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[12px] font-semibold truncate ${
                      isSelected ? "text-[#38b6ff]" : "text-[#ededed]"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="text-[9px] text-[#71717a] bg-[#27272a] px-1.5 py-0.5 rounded font-mono">
                    {CATEGORY_TAGS[item.id]}
                  </span>
                </div>
                <p className="text-[10px] text-[#71717a] truncate mt-0.5">
                  {item.blurb}
                </p>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-[#71717a] text-[11px]">
            No textures match "{search}"
          </div>
        )}
      </div>

      {/* Bottom Section: Multi-Layer Stacking & Stock Keywords */}
      <div className="border-t border-[#27272a] p-3 bg-[#161618] space-y-3">
        {/* Layer Stacking */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <button
              type="button"
              onClick={() => setIsStackOpen(!isStackOpen)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#ededed] hover:text-[#0d99ff] transition-colors"
            >
              <svg
                viewBox="0 0 10 10"
                className={`w-2 h-2 text-[#71717a] transition-transform ${isStackOpen ? "rotate-90" : ""}`}
                fill="currentColor"
              >
                <path d="M2 2l4 3-4 3z" />
              </svg>
              <span>Layer Stacking ({stack.length})</span>
            </button>

            {stack.length > 0 && (
              <button
                type="button"
                onClick={onClearStack}
                className="text-[10px] text-[#a1a1aa] hover:text-red-400 transition-colors underline"
              >
                Clear
              </button>
            )}
          </div>

          {isStackOpen && (
            <div className="space-y-1.5 mt-2">
              <p className="text-[10px] text-[#71717a] leading-tight">
                Combine an extra texture on top in soft-light mode (e.g. Flash + Film Grain for authentic 35mm look).
              </p>
              <div className="flex flex-wrap gap-1">
                {TEXTURE_META.filter((m) => m.id !== activeType).map((m) => {
                  const isStacked = stack.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onToggleStack(m.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        isStacked
                          ? "bg-[#0d99ff]/20 text-[#38b6ff] border-[#0d99ff]"
                          : "bg-[#202024] text-[#a1a1aa] border-[#323238] hover:text-[#ededed] hover:border-[#4b4b54]"
                      }`}
                    >
                      {isStacked ? "✓ " : "+ "}
                      {m.name.split(" / ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stock Keywords Box */}
        <div className="pt-2 border-t border-[#27272a]/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Stock Keywords
            </span>
            <button
              type="button"
              onClick={onCopyKeywords}
              className="text-[10px] text-[#0d99ff] hover:underline font-medium"
            >
              Copy all
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {keywords.map((k) => (
              <span
                key={k}
                className="text-[9px] bg-[#202024] text-[#a1a1aa] px-1.5 py-0.5 rounded border border-[#2c2c32]"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
