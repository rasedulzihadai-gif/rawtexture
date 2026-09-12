import React, { useState } from "react";
import { TextureOptions } from "../lib/types";
import { PALETTES } from "../lib/palettes";
import { ExportFormat } from "../lib/export";
import { LOCK_META, RandomLocks } from "../lib/random";
import VariationStrip from "./VariationStrip";

export interface SizePreset {
  id: string;
  label: string;
  w: number;
  h: number;
}

interface InspectorPanelProps {
  options: TextureOptions;
  onChangeOptions: (opts: Partial<TextureOptions>) => void;
  width: number;
  height: number;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  lockRatio: boolean;
  onToggleLockRatio: () => void;
  sizePreset: string;
  onSelectSizePreset: (presetId: string) => void;
  sizePresets: SizePreset[];
  onSwapOrientation: () => void;
  format: ExportFormat;
  onFormatChange: (f: ExportFormat) => void;
  quality: number;
  onQualityChange: (q: number) => void;
  prefix: string;
  onPrefixChange: (p: string) => void;
  grainOnly: boolean;
  onToggleGrainOnly: (g: boolean) => void;
  onExport: () => void;
  onOpenBulk: () => void;
  isExporting: boolean;
  locks: RandomLocks;
  onToggleLock: (key: keyof RandomLocks) => void;
  onResetLocks: () => void;
  candidates: TextureOptions[];
  onApplyCandidate: (opts: TextureOptions) => void;
  onRefreshCandidates: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  options,
  onChangeOptions,
  width,
  height,
  onWidthChange,
  onHeightChange,
  lockRatio,
  onToggleLockRatio,
  sizePreset,
  onSelectSizePreset,
  sizePresets,
  onSwapOrientation,
  format,
  onFormatChange,
  quality,
  onQualityChange,
  prefix,
  onPrefixChange,
  grainOnly,
  onToggleGrainOnly,
  onExport,
  onOpenBulk,
  isExporting,
  locks,
  onToggleLock,
  onResetLocks,
  candidates,
  onApplyCandidate,
  onRefreshCandidates,
}) => {
  const [openSections, setOpenSections] = useState({
    size: true,
    palette: true,
    texture: true,
    random: true,
    export: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-[300px] bg-[#18181b] border-l border-[#27272a] flex flex-col h-full overflow-y-auto select-none z-20 shrink-0 text-[#ededed]">
      {/* 1. CANVAS SIZE & RESOLUTION */}
      <div className="p-3.5 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection("size")}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#ededed] uppercase tracking-wider hover:text-[#0d99ff] transition-colors"
          >
            <svg
              viewBox="0 0 10 10"
              className={`w-2 h-2 text-[#71717a] transition-transform ${openSections.size ? "rotate-90" : ""}`}
              fill="currentColor"
            >
              <path d="M2 2l4 3-4 3z" />
            </svg>
            <span>Canvas Resolution</span>
          </button>
          <span className="text-[10px] text-[#71717a] font-mono">
            {((width * height) / 1000000).toFixed(1)} MP
          </span>
        </div>

        {openSections.size && (
          <div className="space-y-2.5">
            {/* Presets dropdown */}
            <div className="relative">
              <select
                aria-label="Resolution Preset"
                value={sizePreset}
                onChange={(e) => onSelectSizePreset(e.target.value)}
                className="w-full h-8 bg-[#202024] hover:bg-[#27272a] text-[#ededed] text-[11px] font-medium pl-2.5 pr-7 rounded-lg border border-[#323238] focus:border-[#0d99ff] outline-none cursor-pointer appearance-none transition-colors"
              >
                {sizePresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3 text-[#71717a] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                fill="currentColor"
              >
                <path d="M2.5 4.5l3.5 3.5 3.5-3.5z" />
              </svg>
            </div>

            {/* Custom W and H inputs */}
            <div className="flex items-center gap-1.5">
              {/* Width */}
              <div className="flex items-center flex-1 bg-[#202024] h-8 px-2.5 rounded-lg border border-[#323238] focus-within:border-[#0d99ff] transition-colors">
                <span className="text-[10px] text-[#71717a] font-semibold w-3.5">W</span>
                <input
                  aria-label="Custom Width"
                  type="number"
                  value={width}
                  onChange={(e) => onWidthChange(Math.max(64, Math.min(8000, Number(e.target.value) || 64)))}
                  className="w-full bg-transparent text-[11px] text-[#ededed] outline-none font-mono text-right"
                />
                <span className="text-[9px] text-[#71717a] ml-1">px</span>
              </div>

              {/* Lock Ratio */}
              <button
                type="button"
                onClick={onToggleLockRatio}
                className={`w-7 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  lockRatio
                    ? "text-[#0d99ff] bg-[#0d99ff]/15 border border-[#0d99ff]/50"
                    : "text-[#71717a] hover:text-[#ededed] bg-[#202024] hover:bg-[#27272a] border border-[#323238]"
                }`}
                title={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                  {lockRatio ? (
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                  ) : (
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 4.5-1.3" />
                  )}
                </svg>
              </button>

              {/* Height */}
              <div className="flex items-center flex-1 bg-[#202024] h-8 px-2.5 rounded-lg border border-[#323238] focus-within:border-[#0d99ff] transition-colors">
                <span className="text-[10px] text-[#71717a] font-semibold w-3.5">H</span>
                <input
                  aria-label="Custom Height"
                  type="number"
                  value={height}
                  onChange={(e) => onHeightChange(Math.max(64, Math.min(8000, Number(e.target.value) || 64)))}
                  className="w-full bg-transparent text-[11px] text-[#ededed] outline-none font-mono text-right"
                />
                <span className="text-[9px] text-[#71717a] ml-1">px</span>
              </div>

              {/* Swap Orientation */}
              <button
                type="button"
                onClick={onSwapOrientation}
                className="w-7 h-8 rounded-lg flex items-center justify-center text-[#71717a] hover:text-[#ededed] bg-[#202024] hover:bg-[#27272a] border border-[#323238] transition-colors"
                title="Swap Width / Height"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M4 5h8l-2.5-2.5M12 11H4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. COLOR PALETTE */}
      <div className="p-3.5 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection("palette")}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#ededed] uppercase tracking-wider hover:text-[#0d99ff] transition-colors"
          >
            <svg
              viewBox="0 0 10 10"
              className={`w-2 h-2 text-[#71717a] transition-transform ${openSections.palette ? "rotate-90" : ""}`}
              fill="currentColor"
            >
              <path d="M2 2l4 3-4 3z" />
            </svg>
            <span>Color Palette</span>
          </button>
          <span className="text-[10px] font-medium text-[#38b6ff]">
            {options.palette.name}
          </span>
        </div>

        {openSections.palette && (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              {PALETTES.map((p) => {
                const isSelected = options.palette.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onChangeOptions({ palette: p })}
                    title={p.name}
                    className={`h-7 rounded-md border transition-all ${
                      isSelected
                        ? "border-[#0d99ff] ring-2 ring-[#0d99ff]/50 scale-105"
                        : "border-black/40 hover:border-[#555]"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, rgb(${p.shadow.join(",")}), rgb(${p.base.join(",")}), rgb(${p.highlight.join(",")}))`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. TEXTURE PARAMETERS */}
      <div className="p-3.5 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection("texture")}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#ededed] uppercase tracking-wider hover:text-[#0d99ff] transition-colors"
          >
            <svg
              viewBox="0 0 10 10"
              className={`w-2 h-2 text-[#71717a] transition-transform ${openSections.texture ? "rotate-90" : ""}`}
              fill="currentColor"
            >
              <path d="M2 2l4 3-4 3z" />
            </svg>
            <span>Parameters & Tactility</span>
          </button>
        </div>

        {openSections.texture && (
          <div className="space-y-3 pt-1">
            {/* Grain Intensity */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-1">
                <span>Film Grain Noise</span>
                <span className="font-mono text-[#ededed] font-medium">{options.grainIntensity}%</span>
              </div>
              <input
                aria-label="Film Grain Noise"
                type="range"
                min="0"
                max="100"
                value={options.grainIntensity}
                onChange={(e) => onChangeOptions({ grainIntensity: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Grain Size Scale */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-1">
                <span>Grain Size Scale</span>
                <span className="font-mono text-[#ededed] font-medium">{options.grainSize}x</span>
              </div>
              <input
                aria-label="Grain Size Scale"
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={options.grainSize}
                onChange={(e) => onChangeOptions({ grainSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Imperfection / Wear */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-1">
                <span>Imperfection & Wear</span>
                <span className="font-mono text-[#ededed] font-medium">{options.imperfection}%</span>
              </div>
              <input
                aria-label="Imperfection & Wear"
                type="range"
                min="0"
                max="100"
                value={options.imperfection}
                onChange={(e) => onChangeOptions({ imperfection: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[9px] text-[#71717a] mt-0.5">
                Controls cracks, hairline scratches, fibers, and dust specks.
              </p>
            </div>

            {/* Vignette */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-1">
                <span>Vignette Falloff</span>
                <span className="font-mono text-[#ededed] font-medium">{options.vignette}%</span>
              </div>
              <input
                aria-label="Vignette Falloff"
                type="range"
                min="0"
                max="100"
                value={options.vignette}
                onChange={(e) => onChangeOptions({ vignette: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Seed Input Field */}
            <div className="pt-2 border-t border-[#27272a]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#a1a1aa]">Seed</span>
              <div className="flex items-center gap-1.5">
                <input
                  aria-label="Random Seed"
                  type="number"
                  value={options.seed}
                  onChange={(e) => onChangeOptions({ seed: Number(e.target.value) >>> 0 })}
                  className="w-28 h-7 bg-[#202024] text-[#ededed] text-[11px] font-mono px-2 rounded-lg text-right outline-none border border-[#323238] focus:border-[#0d99ff]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SMART RANDOMIZER & LOCKS */}
      <div className="p-3.5 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection("random")}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#ededed] uppercase tracking-wider hover:text-[#0d99ff] transition-colors"
          >
            <svg
              viewBox="0 0 10 10"
              className={`w-2 h-2 text-[#71717a] transition-transform ${openSections.random ? "rotate-90" : ""}`}
              fill="currentColor"
            >
              <path d="M2 2l4 3-4 3z" />
            </svg>
            <span>Smart Randomizer</span>
          </button>
          <button
            type="button"
            onClick={onResetLocks}
            className="text-[10px] text-[#71717a] hover:text-[#ededed] underline"
          >
            Unlock all
          </button>
        </div>

        {openSections.random && (
          <div className="space-y-3">
            {/* Lock chips */}
            <div>
              <div className="text-[10px] text-[#71717a] mb-1.5">
                Keep locked when shuffling:
              </div>
              <div className="flex flex-wrap gap-1">
                {LOCK_META.filter((l) => l.id !== "size").map((l) => {
                  const isLocked = locks[l.id];
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onToggleLock(l.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${
                        isLocked
                          ? "border-[#0d99ff] bg-[#0d99ff]/20 text-[#38b6ff]"
                          : "border-[#323238] bg-[#202024] text-[#a1a1aa] hover:text-[#ededed]"
                      }`}
                    >
                      <span>{isLocked ? "🔒" : "🔓"}</span>
                      <span>{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggestions Strip */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-[#71717a] mb-1.5">
                <span>Quick Variations</span>
                <button
                  type="button"
                  onClick={onRefreshCandidates}
                  className="text-[#0d99ff] hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <VariationStrip
                candidates={candidates}
                onPick={onApplyCandidate}
                currentSeed={options.seed}
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. EXPORT & OUTPUT */}
      <div className="p-3.5 border-b border-[#27272a] bg-[#161618]">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => toggleSection("export")}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#ededed] uppercase tracking-wider hover:text-[#0d99ff] transition-colors"
          >
            <svg
              viewBox="0 0 10 10"
              className={`w-2 h-2 text-[#71717a] transition-transform ${openSections.export ? "rotate-90" : ""}`}
              fill="currentColor"
            >
              <path d="M2 2l4 3-4 3z" />
            </svg>
            <span>Export & Downloads</span>
          </button>
        </div>

        {openSections.export && (
          <div className="space-y-3">
            {/* Format Row: PNG / JPG and Quality */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#202024] p-0.5 rounded-lg border border-[#323238] flex">
                <button
                  type="button"
                  onClick={() => onFormatChange("png")}
                  className={`flex-1 h-7 rounded-md text-[11px] font-semibold transition-colors ${
                    format === "png"
                      ? "bg-[#0d99ff] text-white shadow-sm"
                      : "text-[#a1a1aa] hover:text-[#ededed]"
                  }`}
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => onFormatChange("jpg")}
                  className={`flex-1 h-7 rounded-md text-[11px] font-semibold transition-colors ${
                    format === "jpg"
                      ? "bg-[#0d99ff] text-white shadow-sm"
                      : "text-[#a1a1aa] hover:text-[#ededed]"
                  }`}
                >
                  JPG
                </button>
              </div>

              {format === "jpg" && (
                <div className="w-[90px] bg-[#202024] h-8 px-2 rounded-lg border border-[#323238] flex items-center justify-between text-[11px]">
                  <span className="text-[#71717a] text-[10px]">Quality</span>
                  <input
                    aria-label="JPG Quality"
                    type="number"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => onQualityChange(Math.max(10, Math.min(100, Number(e.target.value) || 90)))}
                    className="w-7 bg-transparent text-right font-mono text-[#ededed] outline-none"
                  />
                  <span className="text-[#71717a] text-[10px]">%</span>
                </div>
              )}
            </div>

            {/* Filename prefix */}
            <div className="flex items-center bg-[#202024] h-8 px-2.5 rounded-lg border border-[#323238] focus-within:border-[#0d99ff] transition-colors">
              <span className="text-[10px] text-[#71717a] mr-2">Prefix</span>
              <input
                aria-label="File Prefix"
                type="text"
                value={prefix}
                onChange={(e) => onPrefixChange(e.target.value)}
                className="w-full bg-transparent text-[11px] text-[#ededed] outline-none"
                placeholder="rawtexture"
              />
            </div>

            {/* Grain Only Plate Toggle */}
            <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#a1a1aa] hover:text-[#ededed]">
              <input
                type="checkbox"
                checked={grainOnly}
                onChange={(e) => onToggleGrainOnly(e.target.checked)}
                className="mt-0.5 rounded border-[#3f3f46] bg-[#202024] text-[#0d99ff] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="block font-medium">Grain-only overlay</span>
                <span className="block text-[9px] text-[#71717a]">
                  Export transparent PNG noise plate to stack on photos.
                </span>
              </div>
            </label>

            {/* Export Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onExport}
                disabled={isExporting}
                className="w-full h-9 bg-[#0d99ff] hover:bg-[#38b6ff] active:bg-[#0080e6] text-white text-[12px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M8 11.5l-4-4h2.5V1.5h3v6H12l-4 4zM1.5 13.5h13V15h-13v-1.5z" />
                </svg>
                <span>Export High-Res {format.toUpperCase()}</span>
              </button>

              <button
                type="button"
                onClick={onOpenBulk}
                className="w-full h-8.5 bg-[#202024] hover:bg-[#27272a] text-[#ededed] text-[11px] font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#323238]"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[#10b981]" fill="currentColor">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" />
                  <rect x="9" y="1" width="6" height="6" rx="1.5" opacity=".6" />
                  <rect x="1" y="9" width="6" height="6" rx="1.5" opacity=".6" />
                  <rect x="9" y="9" width="6" height="6" rx="1.5" opacity=".3" />
                </svg>
                <span>Bulk Batch Generator (ZIP)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
