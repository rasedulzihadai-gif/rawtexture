import React from "react";
import { TEXTURE_META, TextureType } from "../lib/types";
import { ExportFormat } from "../lib/export";

interface HeaderProps {
  currentType: TextureType;
  onSelectType: (type: TextureType) => void;
  seed: number;
  onShuffle: () => void;
  onNewSeed: () => void;
  onOpenBulk: () => void;
  onExport: () => void;
  isExporting: boolean;
  format: ExportFormat;
  onFormatChange: (f: ExportFormat) => void;
  width: number;
  height: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentType,
  onSelectType,
  seed,
  onShuffle,
  onNewSeed,
  onOpenBulk,
  onExport,
  isExporting,
  format,
  onFormatChange,
  width,
  height,
}) => {
  return (
    <header className="h-13 bg-[#18181b] border-b border-[#27272a] px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0d99ff] via-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white shadow-md shadow-blue-900/30">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="2" width="16" height="16" rx="3" />
              <path d="M2 7h16M7 2v16" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] tracking-tight text-[#ededed]">
                RawTexture
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]/50">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-[#71717a] hidden sm:block">
              Procedural Microstock Texture Engine
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-[#27272a] mx-1 hidden md:block" />

        {/* Quick Texture Select Pill */}
        <div className="relative hidden md:flex items-center">
          <select
            aria-label="Texture Type"
            value={currentType}
            onChange={(e) => onSelectType(e.target.value as TextureType)}
            className="h-8 bg-[#202024] hover:bg-[#27272a] text-[#ededed] text-[11px] font-medium pl-3 pr-7 rounded-lg border border-[#323238] focus:border-[#0d99ff] outline-none cursor-pointer appearance-none transition-colors"
          >
            {TEXTURE_META.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
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
      </div>

      {/* Center Dimensions Badge */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] bg-[#202024] px-3 py-1.5 rounded-lg border border-[#27272a]">
        <span className="text-[#a1a1aa] font-medium">Resolution:</span>
        <span className="text-[#ededed] font-mono font-semibold">
          {width} × {height}
        </span>
        <span className="text-[#71717a]">
          ({((width * height) / 1000000).toFixed(1)} MP)
        </span>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2">
        {/* Shuffle Random Button with Spacebar indicator */}
        <button
          type="button"
          onClick={onShuffle}
          className="h-8 px-3 rounded-lg bg-[#202024] hover:bg-[#27272a] active:bg-[#2e2e33] border border-[#323238] text-[#ededed] text-[11px] font-medium flex items-center gap-1.5 transition-all group"
          title="Shuffle Texture Parameters (Shortcut: Spacebar)"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[#0d99ff] group-hover:rotate-45 transition-transform" fill="currentColor">
            <rect x="2" y="2" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth={1.5} />
            <circle cx="5.6" cy="5.6" r="1.1" />
            <circle cx="10.4" cy="10.4" r="1.1" />
            <circle cx="10.4" cy="5.6" r="1.1" />
            <circle cx="5.6" cy="10.4" r="1.1" />
          </svg>
          <span>Shuffle</span>
          <kbd className="hidden sm:inline-block text-[9px] font-mono text-[#71717a] bg-[#18181b] px-1.5 py-0.5 rounded border border-[#323238]">
            Space
          </kbd>
        </button>

        {/* New Seed Button */}
        <button
          type="button"
          onClick={onNewSeed}
          className="h-8 px-2.5 rounded-lg bg-[#202024] hover:bg-[#27272a] border border-[#323238] text-[#a1a1aa] hover:text-[#ededed] text-[11px] font-medium hidden sm:flex items-center gap-1.5 transition-colors"
          title={`Generate new seed (Current: ${seed})`}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M13.5 2.5v4H9.5M2.5 13.5v-4h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 6.5A5.5 5.5 0 0 0 3.2 4.8M3 9.5a5.5 5.5 0 0 0 9.8 1.7" strokeLinecap="round" />
          </svg>
          <span>Seed</span>
        </button>

        {/* Bulk Batch Generator */}
        <button
          type="button"
          onClick={onOpenBulk}
          className="h-8 px-3 rounded-lg bg-[#202024] hover:bg-[#27272a] border border-[#323238] text-[#ededed] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
          title="Generate Batch & Download ZIP"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[#10b981]" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1.5" />
            <rect x="9" y="1" width="6" height="6" rx="1.5" opacity=".6" />
            <rect x="1" y="9" width="6" height="6" rx="1.5" opacity=".6" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" opacity=".3" />
          </svg>
          <span>Bulk Export</span>
        </button>

        {/* Format Quick Toggle */}
        <div className="h-8 bg-[#202024] p-0.5 rounded-lg border border-[#323238] flex items-center">
          <button
            type="button"
            onClick={() => onFormatChange("png")}
            className={`h-6 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
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
            className={`h-6 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
              format === "jpg"
                ? "bg-[#0d99ff] text-white shadow-sm"
                : "text-[#a1a1aa] hover:text-[#ededed]"
            }`}
          >
            JPG
          </button>
        </div>

        {/* Primary Export Button */}
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="h-8 px-3.5 rounded-lg bg-[#0d99ff] hover:bg-[#38b6ff] active:bg-[#0080e6] text-white text-[11px] font-semibold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Exporting…</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M8 11.5l-4-4h2.5V1.5h3v6H12l-4 4zM1.5 13.5h13V15h-13v-1.5z" />
              </svg>
              <span>Export {format.toUpperCase()}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
