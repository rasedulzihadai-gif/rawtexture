import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TextureOptions } from "../lib/types";
import { renderTexture } from "../lib/textures";

interface CanvasWorkspaceProps {
  options: TextureOptions;
  width: number;
  height: number;
  zoom: number | "fit";
  onZoomChange: (z: number | "fit") => void;
  onNewSeed: () => void;
  onPrevSeed: () => void;
  onNextSeed: () => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  options,
  width,
  height,
  zoom,
  onZoomChange,
  onNewSeed,
  onPrevSeed,
  onNextSeed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [isRendering, setIsRendering] = useState(false);
  const [bgStyle, setBgStyle] = useState<"dots" | "dark" | "checker">("dots");
  const [isCopiedSeed, setIsCopiedSeed] = useState(false);
  const [isLightbox, setIsLightbox] = useState(false);

  // ResizeObserver for responsive canvas framing
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    });
    observer.observe(el);
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  // Compute scale
  const padding = 100;
  const fitScale = Math.min(
    (containerSize.w - padding) / width,
    (containerSize.h - padding) / height,
    1.4
  );
  const actualScale = zoom === "fit" ? Math.max(0.05, fitScale) : zoom;
  const displayWidth = Math.max(48, width * actualScale);
  const displayHeight = Math.max(36, height * actualScale);

  // Live render pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsRendering(true);

    const rafId = requestAnimationFrame(() => {
      const maxCap = 1600;
      const renderScale = Math.min(1, maxCap / Math.max(width, height));
      const renderW = Math.round(width * renderScale);
      const renderH = Math.round(height * renderScale);

      renderTexture(canvas, options, renderW, renderH);
      setIsRendering(false);
    });

    return () => cancelAnimationFrame(rafId);
  }, [options, width, height]);

  // Handle Ctrl/Cmd + Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.15 : 0.85;
        const current = zoom === "fit" ? fitScale : zoom;
        const next = Math.max(0.05, Math.min(4, current * delta));
        onZoomChange(next);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoom, fitScale, onZoomChange]);

  const copySeed = () => {
    navigator.clipboard.writeText(String(options.seed));
    setIsCopiedSeed(true);
    setTimeout(() => setIsCopiedSeed(false), 2000);
  };

  return (
    <main
      ref={containerRef}
      className={`relative flex-1 h-full min-h-0 flex items-center justify-center overflow-hidden select-none transition-colors ${
        bgStyle === "dark"
          ? "bg-[#121214]"
          : bgStyle === "checker"
          ? "bg-[#18181b]"
          : "bg-[#121214]"
      }`}
      style={{
        backgroundImage:
          bgStyle === "dots"
            ? "radial-gradient(circle at 1px 1px, #27272a 1px, transparent 0)"
            : bgStyle === "checker"
            ? "linear-gradient(45deg,#1f1f23 25%,transparent 25%),linear-gradient(-45deg,#1f1f23 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1f1f23 75%),linear-gradient(-45deg,transparent 75%,#1f1f23 75%)"
            : "none",
        backgroundSize: bgStyle === "checker" ? "20px 20px" : "24px 24px",
        backgroundPosition: bgStyle === "checker" ? "0 0,0 10px,10px -10px,-10px 0" : "0 0",
      }}
    >
      {/* Texture Canvas Artboard */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ width: displayWidth, height: displayHeight }}
      >
        {/* Top Header Tag over Artboard */}
        <div className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[11px] font-medium text-[#a1a1aa] px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[#ededed] font-semibold">{options.type}</span>
            <span className="text-[#71717a]">·</span>
            <span className="text-[#71717a] font-mono">Seed #{options.seed}</span>
            {options.stack.length > 0 && (
              <span className="text-[9px] bg-[#0d99ff]/20 text-[#38b6ff] px-1.5 py-0.2 rounded font-medium">
                +{options.stack.length} Stacked
              </span>
            )}
            {options.grainOnly && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-medium">
                Grain Only
              </span>
            )}
          </div>

          <div className="text-[10px] text-[#71717a] font-mono">
            {width} × {height} px
          </div>
        </div>

        {/* The Rendered Canvas */}
        <div
          className="relative w-full h-full rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
          style={{
            backgroundImage: options.grainOnly
              ? "linear-gradient(45deg,#27272a 25%,transparent 25%),linear-gradient(-45deg,#27272a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#27272a 75%),linear-gradient(-45deg,transparent 75%,#27272a 75%)"
              : "none",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
            backgroundColor: options.grainOnly ? "#1c1c20" : "#ffffff",
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{
              imageRendering: actualScale > 1.2 ? "pixelated" : "auto",
            }}
          />

          {/* Rendering Pill */}
          {isRendering && (
            <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-mono text-white/90 shadow">
              rendering…
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#18181b]/95 border border-[#323238] p-1.5 rounded-xl shadow-2xl backdrop-blur-md select-none z-30">
        {/* Seed Stepper */}
        <div className="flex items-center gap-1 pr-2 border-r border-[#27272a]">
          <button
            type="button"
            onClick={onPrevSeed}
            className="w-7 h-7 rounded-lg text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#27272a] flex items-center justify-center transition-colors"
            title="Previous Seed"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={copySeed}
            className="px-2 h-7 rounded-lg bg-[#202024] hover:bg-[#27272a] text-[11px] font-mono text-[#ededed] flex items-center gap-1 transition-colors"
            title="Click to copy Seed"
          >
            <span>#{options.seed}</span>
            <span className="text-[9px] text-[#71717a]">
              {isCopiedSeed ? "✓" : "📋"}
            </span>
          </button>
          <button
            type="button"
            onClick={onNextSeed}
            className="w-7 h-7 rounded-lg text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#27272a] flex items-center justify-center transition-colors"
            title="Next Seed"
          >
            ›
          </button>
          <button
            type="button"
            onClick={onNewSeed}
            className="w-7 h-7 rounded-lg text-[#0d99ff] hover:bg-[#0d99ff]/20 flex items-center justify-center transition-colors text-xs font-bold"
            title="Generate Random Seed"
          >
            🎲
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 pr-2 border-r border-[#27272a]">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.05, actualScale / 1.25))}
            className="w-7 h-7 rounded-lg text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#27272a] flex items-center justify-center transition-colors"
            title="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onZoomChange("fit")}
            className="px-2 h-7 rounded-lg text-[11px] font-medium text-[#ededed] hover:bg-[#27272a] transition-colors"
            title="Zoom to Fit"
          >
            {zoom === "fit" ? "Fit" : `${Math.round(actualScale * 100)}%`}
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(4, actualScale * 1.25))}
            className="w-7 h-7 rounded-lg text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#27272a] flex items-center justify-center transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className="px-1.5 h-7 rounded-lg text-[10px] font-mono text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#27272a] transition-colors"
            title="100% Actual Resolution"
          >
            100%
          </button>
        </div>

        {/* Background Style Switcher */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setBgStyle("dots")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
              bgStyle === "dots"
                ? "bg-[#0d99ff]/20 text-[#38b6ff]"
                : "text-[#a1a1aa] hover:bg-[#27272a]"
            }`}
            title="Dot Grid Background"
          >
            ⠿
          </button>
          <button
            type="button"
            onClick={() => setBgStyle("checker")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
              bgStyle === "checker"
                ? "bg-[#0d99ff]/20 text-[#38b6ff]"
                : "text-[#a1a1aa] hover:bg-[#27272a]"
            }`}
            title="Checkerboard Transparency Grid"
          >
            ▦
          </button>
          <button
            type="button"
            onClick={() => setBgStyle("dark")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
              bgStyle === "dark"
                ? "bg-[#0d99ff]/20 text-[#38b6ff]"
                : "text-[#a1a1aa] hover:bg-[#27272a]"
            }`}
            title="Solid Dark Background"
          >
            ■
          </button>
          <button
            type="button"
            onClick={() => setIsLightbox(true)}
            className="w-7 h-7 rounded-lg text-[#a1a1aa] hover:text-[#ededed] hover:bg-[#27272a] flex items-center justify-center transition-colors text-xs"
            title="Fullscreen Lightbox Preview"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 select-none"
          onClick={() => setIsLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightbox(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-lg bg-white/10 hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
          <div className="max-w-[90vw] max-h-[85vh] rounded-lg overflow-hidden shadow-2xl border border-white/10">
            <canvas
              ref={(c) => {
                if (c) renderTexture(c, options, Math.min(2400, width), Math.min(1800, height));
              }}
              className="max-w-full max-h-[85vh] object-contain block"
            />
          </div>
          <div className="mt-3 text-center text-sm font-medium text-white/80">
            {options.type} · {width} × {height} · Seed #{options.seed} (Click anywhere to close)
          </div>
        </div>
      )}
    </main>
  );
};
