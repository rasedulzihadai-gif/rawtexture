import React, { useMemo } from "react";
import {
  BulkSettings,
  VariationMode,
  VARIATION_LABELS,
  formatBytes,
  BatchProgress,
} from "../lib/export";
import { LOCK_META, RandomLocks } from "../lib/random";

interface BulkModalProps {
  open: boolean;
  onClose: () => void;
  settings: BulkSettings;
  onChange: (s: BulkSettings) => void;
  onRun: () => void;
  onCancel: () => void;
  running: boolean;
  progress: BatchProgress | null;
  width: number;
  height: number;
  locks: RandomLocks;
  onLocksChange: (l: RandomLocks) => void;
}

export const BulkModal: React.FC<BulkModalProps> = ({
  open,
  onClose,
  settings,
  onChange,
  onRun,
  onCancel,
  running,
  progress,
  width,
  height,
  locks,
  onLocksChange,
}) => {
  const set = <K extends keyof BulkSettings>(key: K, val: BulkSettings[K]) =>
    onChange({ ...settings, [key]: val });

  const randomisingSizes = settings.variation === "random" && settings.randomSize;

  // Estimated size in MB
  const estimate = useMemo(() => {
    const px = randomisingSizes ? 7_000_000 : width * height;
    const perImage =
      settings.format === "png"
        ? px * 0.9
        : px * (0.06 + (settings.quality / 100) * 0.22);
    return perImage * settings.count;
  }, [width, height, settings.format, settings.quality, settings.count, randomisingSizes]);

  if (!open) return null;

  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={running ? undefined : onClose}
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#323238] bg-[#18181b] shadow-2xl text-[#ededed]">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-[#27272a] px-5 bg-[#161618]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#10b981]/20 text-[#10b981] flex items-center justify-center">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" opacity=".6" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" opacity=".6" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" opacity=".3" />
              </svg>
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-[#ededed]">
                Bulk Texture Generator
              </h2>
              <p className="text-[10px] text-[#71717a]">
                Generate stock-ready batches for Adobe Stock / Shutterstock
              </p>
            </div>
          </div>

          {!running && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#71717a] hover:text-[#ededed] hover:bg-[#27272a] transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quantity Selector */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#ededed] mb-1.5">
              <span>Batch Quantity</span>
              <span className="font-mono text-[#0d99ff] bg-[#0d99ff]/10 px-2 py-0.5 rounded">
                {settings.count} textures
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                aria-label="Batch Quantity"
                type="range"
                min="1"
                max="100"
                value={settings.count}
                onChange={(e) => set("count", Number(e.target.value))}
                className="flex-1"
              />
              <input
                aria-label="Batch Quantity Input"
                type="number"
                min="1"
                max="100"
                value={settings.count}
                onChange={(e) => set("count", Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-14 h-8 bg-[#202024] text-center font-mono text-[11px] text-[#ededed] rounded-lg border border-[#323238] focus:border-[#0d99ff] outline-none"
              />
            </div>
          </div>

          {/* Variation Strategy */}
          <div>
            <div className="text-[11px] font-semibold text-[#ededed] mb-1.5">
              Variation Strategy
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {VARIATION_LABELS.map((v) => {
                const isSelected = settings.variation === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => set("variation", v.id as VariationMode)}
                    className={`p-2.5 rounded-lg text-left border transition-all ${
                      isSelected
                        ? "bg-[#0d99ff]/15 border-[#0d99ff] text-[#ededed]"
                        : "bg-[#202024] border-[#323238] text-[#a1a1aa] hover:border-[#444]"
                    }`}
                  >
                    <div className={`text-[11px] font-bold ${isSelected ? "text-[#38b6ff]" : "text-[#ededed]"}`}>
                      {v.name}
                    </div>
                    <div className="text-[9px] text-[#71717a] mt-0.5 leading-tight">
                      {v.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locks (for Full Random Mode) */}
          {settings.variation === "random" && (
            <div className="p-3 bg-[#202024] rounded-xl border border-[#323238] space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#ededed]">Preserve Locked Properties</span>
                <button
                  type="button"
                  onClick={() =>
                    onLocksChange(
                      LOCK_META.reduce((acc, l) => ({ ...acc, [l.id]: false }), {} as RandomLocks)
                    )
                  }
                  className="text-[10px] text-[#0d99ff] hover:underline"
                >
                  Unlock all
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {LOCK_META.filter((l) => l.id !== "size").map((l) => {
                  const isLocked = locks[l.id];
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onLocksChange({ ...locks, [l.id]: !locks[l.id] })}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                        isLocked
                          ? "border-[#0d99ff] bg-[#0d99ff]/20 text-[#38b6ff]"
                          : "border-[#3f3f46] text-[#71717a] hover:text-[#ededed]"
                      }`}
                    >
                      <span>{isLocked ? "🔒" : "🔓"}</span>
                      <span>{l.label}</span>
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#2d2d34] text-[11px] text-[#a1a1aa]">
                <input
                  type="checkbox"
                  checked={settings.randomSize}
                  onChange={(e) => set("randomSize", e.target.checked)}
                  className="rounded border-[#3f3f46] bg-[#18181b] text-[#0d99ff] focus:ring-0"
                />
                <span>Vary resolutions per file (HD, 4K, 4:3, square, portrait)</span>
              </label>
            </div>
          )}

          {/* Export Format & Quality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-semibold text-[#ededed] mb-1.5">
                Output Format
              </div>
              <div className="flex h-8 bg-[#202024] p-0.5 rounded-lg border border-[#323238]">
                <button
                  type="button"
                  onClick={() => set("format", "png")}
                  className={`flex-1 rounded-md text-[11px] font-semibold transition-colors ${
                    settings.format === "png"
                      ? "bg-[#0d99ff] text-white shadow-sm"
                      : "text-[#a1a1aa] hover:text-[#ededed]"
                  }`}
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => set("format", "jpg")}
                  className={`flex-1 rounded-md text-[11px] font-semibold transition-colors ${
                    settings.format === "jpg"
                      ? "bg-[#0d99ff] text-white shadow-sm"
                      : "text-[#a1a1aa] hover:text-[#ededed]"
                  }`}
                >
                  JPG
                </button>
              </div>
            </div>

            {settings.format === "jpg" ? (
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#ededed] mb-1.5">
                  <span>JPG Quality</span>
                  <span className="font-mono text-[#0d99ff]">{settings.quality}%</span>
                </div>
                <input
                  aria-label="Bulk JPG Quality"
                  type="range"
                  min="40"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => set("quality", Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            ) : (
              <div>
                <div className="text-[11px] font-semibold text-[#ededed] mb-1.5">
                  Filename Prefix
                </div>
                <input
                  aria-label="Bulk Filename Prefix"
                  type="text"
                  value={settings.prefix}
                  onChange={(e) => set("prefix", e.target.value)}
                  placeholder="rawtexture"
                  className="w-full h-8 bg-[#202024] text-[11px] text-[#ededed] px-2.5 rounded-lg border border-[#323238] focus:border-[#0d99ff] outline-none"
                />
              </div>
            )}
          </div>

          {/* Delivery Options */}
          <div className="p-3 bg-[#202024] rounded-xl border border-[#323238]">
            <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-[#ededed]">
              <input
                type="checkbox"
                checked={settings.asZip}
                onChange={(e) => set("asZip", e.target.checked)}
                className="rounded border-[#3f3f46] bg-[#18181b] text-[#0d99ff] focus:ring-0 cursor-pointer"
              />
              <span className="font-medium">Download as single compressed ZIP archive</span>
            </label>
          </div>

          {/* Size & Specs Readout */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#141416] border border-[#27272a] text-[11px]">
            <span className="text-[#71717a]">
              {settings.count} × {randomisingSizes ? "Mixed Resolutions" : `${width}×${height}`} ({settings.format.toUpperCase()})
            </span>
            <span className="font-mono text-[#a1a1aa]">
              Est: ~{formatBytes(estimate)}
            </span>
          </div>

          {/* Progress Bar (while generating) */}
          {running && progress && (
            <div className="p-3.5 bg-[#202024] rounded-xl border border-[#0d99ff]/40 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#ededed] truncate max-w-[320px]">
                  {progress.label}
                </span>
                <span className="font-mono font-bold text-[#0d99ff]">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0d99ff] to-[#38b6ff] transition-all duration-150"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#71717a] font-mono">
                <span>{progress.done} / {progress.total} done</span>
                <span>{formatBytes(progress.bytes)} written</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#27272a] px-5 py-3.5 bg-[#161618]">
          {running ? (
            <button
              type="button"
              onClick={onCancel}
              className="h-8.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-semibold rounded-lg transition-colors border border-red-500/30"
            >
              Cancel Generation
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-8.5 px-3.5 text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#202024] text-[11px] font-medium rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onRun}
                className="h-8.5 px-4 bg-[#0d99ff] hover:bg-[#38b6ff] active:bg-[#0080e6] text-white text-[11px] font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M8 11.5l-4-4h2.5V1.5h3v6H12l-4 4zM1.5 13.5h13V15h-13v-1.5z" />
                </svg>
                <span>Generate {settings.count} Textures</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
