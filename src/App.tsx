import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { TextureLibrary } from "./components/TextureLibrary";
import { CanvasWorkspace } from "./components/CanvasWorkspace";
import { InspectorPanel, SizePreset } from "./components/InspectorPanel";
import { BulkModal } from "./components/BulkModal";
import { TEXTURE_META, TextureOptions, TextureType } from "./lib/types";
import { PALETTES, paletteById } from "./lib/palettes";
import { randomSeed } from "./lib/rng";
import {
  NO_LOCKS,
  RandomLocks,
  randomCandidates,
  shuffle,
} from "./lib/random";
import {
  BatchProgress,
  BulkSettings,
  ExportFormat,
  exportSingle,
  formatBytes,
  runBatch,
} from "./lib/export";

const SIZE_PRESETS: SizePreset[] = [
  { id: "hd", label: "1920 × 1080 · HD (16:9)", w: 1920, h: 1080 },
  { id: "4k", label: "3840 × 2160 · 4K UHD (16:9)", w: 3840, h: 2160 },
  { id: "stock", label: "4000 × 3000 · Microstock Standard (4:3)", w: 4000, h: 3000 },
  { id: "sq3000", label: "3000 × 3000 · Square Stock (1:1)", w: 3000, h: 3000 },
  { id: "print", label: "5000 × 3333 · High-Res Print (3:2)", w: 5000, h: 3333 },
  { id: "social", label: "1080 × 1350 · Social Portrait (4:5)", w: 1080, h: 1350 },
  { id: "custom", label: "Custom Dimensions…", w: 2400, h: 1600 },
];

const PALETTE_TAGS: Record<string, string[]> = {
  warmBeige: ["warm beige", "neutral cream", "organic surface"],
  coolGrey: ["cool grey", "minimal concrete", "slate background"],
  fadedSepia: ["vintage sepia", "retro print", "aged paper"],
  mutedBlue: ["muted blue", "analog cyan", "dusk background"],
  softBW: ["monochrome", "black and white", "dark studio"],
  dustyRose: ["dusty rose", "pastel paper", "faded grain"],
  oliveKhaki: ["olive khaki", "earth texture", "weathered textile"],
  charcoal: ["charcoal dark", "moody asphalt", "matte black"],
};

const BASE_KEYWORDS: Record<TextureType, string[]> = {
  filmGrain: ["35mm film grain", "analog noise", "vintage film overlay", "tactile backdrop"],
  flash: ["on-camera flash", "direct flash photography", "flash hotspot", "studio surface"],
  paper: ["handmade paper texture", "canvas weave", "creased paper", "fibrous parchment"],
  concrete: ["concrete wall", "weathered plaster", "urban grunge", "hairline cracks"],
  fabric: ["linen fabric weave", "textile crosshatch", "cloth material", "fabric folds"],
  xerox: ["scanned xerox texture", "photocopy defect", "high contrast scan", "toner dust"],
  lightLeak: ["vintage light leak", "analog film camera", "warm color burn", "lens flare"],
  dustScratches: ["film dust and scratches", "vintage negative damage", "retro photo defect"],
  watercolor: ["watercolor ink bleed", "organic pigment spread", "wet paper blot", "fluid art"],
  bokeh: ["bokeh out of focus lights", "blurred lens flare", "soft circular lights", "night defocus"],
};

function keywordsFor(type: TextureType, paletteId: string): string[] {
  return Array.from(
    new Set([
      ...BASE_KEYWORDS[type],
      ...(PALETTE_TAGS[paletteId] ?? []),
      "authentic texture",
      "non-ai real texture",
      "microstock asset",
    ])
  ).slice(0, 8);
}

export default function App() {
  /* Texture Parameters */
  const [type, setType] = useState<TextureType>("paper");
  const [paletteId, setPaletteId] = useState<string>("warmBeige");
  const [grainIntensity, setGrainIntensity] = useState<number>(45);
  const [grainSize, setGrainSize] = useState<number>(1.2);
  const [imperfection, setImperfection] = useState<number>(40);
  const [vignette, setVignette] = useState<number>(25);
  const [seed, setSeed] = useState<number>(681920);
  const [grainOnly, setGrainOnly] = useState<boolean>(false);
  const [stack, setStack] = useState<TextureType[]>([]);

  /* Dimensions & Presets */
  const [sizePreset, setSizePreset] = useState<string>("hd");
  const [customW, setCustomW] = useState<number>(1920);
  const [customH, setCustomH] = useState<number>(1080);
  const [lockRatio, setLockRatio] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const ratioRef = useRef<number>(1920 / 1080);

  /* Export Configuration */
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<number>(92);
  const [prefix, setPrefix] = useState<string>("rawtexture");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  /* Randomizer & Locks */
  const [locks, setLocks] = useState<RandomLocks>(NO_LOCKS);
  const [candRoot, setCandRoot] = useState<number>(randomSeed());

  /* Bulk Generation */
  const [bulkOpen, setBulkOpen] = useState<boolean>(false);
  const [bulk, setBulk] = useState<BulkSettings>({
    count: 20,
    format: "jpg",
    quality: 92,
    variation: "random",
    prefix: "rawtexture",
    asZip: true,
    randomSize: false,
  });
  const [bulkRunning, setBulkRunning] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<BatchProgress | null>(null);
  const bulkCancelRef = useRef<boolean>(false);

  /* Toast notification */
  const [toast, setToast] = useState<string>("");

  /* Current Active Palette */
  const palette = useMemo(() => paletteById(paletteId), [paletteId]);

  /* Current Active Dimensions */
  const currentPreset = SIZE_PRESETS.find((s) => s.id === sizePreset) || SIZE_PRESETS[0];
  const width = sizePreset === "custom" ? customW : currentPreset.w;
  const height = sizePreset === "custom" ? customH : currentPreset.h;

  /* Combined Texture Options */
  const options: TextureOptions = useMemo(
    () => ({
      type,
      seed,
      palette,
      grainIntensity,
      grainSize,
      imperfection,
      vignette,
      grainOnly,
      stack,
    }),
    [type, seed, palette, grainIntensity, grainSize, imperfection, vignette, grainOnly, stack]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* Options Update Handler */
  const handleOptionsChange = (updated: Partial<TextureOptions>) => {
    if (updated.type !== undefined) setType(updated.type);
    if (updated.palette !== undefined) setPaletteId(updated.palette.id);
    if (updated.grainIntensity !== undefined) setGrainIntensity(updated.grainIntensity);
    if (updated.grainSize !== undefined) setGrainSize(updated.grainSize);
    if (updated.imperfection !== undefined) setImperfection(updated.imperfection);
    if (updated.vignette !== undefined) setVignette(updated.vignette);
    if (updated.seed !== undefined) setSeed(updated.seed);
    if (updated.grainOnly !== undefined) setGrainOnly(updated.grainOnly);
    if (updated.stack !== undefined) setStack(updated.stack);
  };

  /* Dimension Handlers */
  const handleWidthChange = (newW: number) => {
    setSizePreset("custom");
    setCustomW(newW);
    if (lockRatio) {
      setCustomH(Math.max(64, Math.round(newW / ratioRef.current)));
    }
  };

  const handleHeightChange = (newH: number) => {
    setSizePreset("custom");
    setCustomH(newH);
    if (lockRatio) {
      setCustomW(Math.max(64, Math.round(newH * ratioRef.current)));
    }
  };

  const handleToggleLockRatio = () => {
    if (!lockRatio) {
      ratioRef.current = width / Math.max(1, height);
    }
    setLockRatio(!lockRatio);
  };

  const handleSelectSizePreset = (presetId: string) => {
    setSizePreset(presetId);
    const p = SIZE_PRESETS.find((s) => s.id === presetId);
    if (p && presetId !== "custom") {
      setCustomW(p.w);
      setCustomH(p.h);
      ratioRef.current = p.w / p.h;
    }
  };

  const handleSwapOrientation = () => {
    setSizePreset("custom");
    const oldW = width;
    const oldH = height;
    setCustomW(oldH);
    setCustomH(oldW);
    ratioRef.current = oldH / Math.max(1, oldW);
    showToast(`Swapped to ${oldH} × ${oldW} px`);
  };

  /* Layer Stacking */
  const handleToggleStack = (t: TextureType) => {
    setStack((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  /* Shuffle / Spacebar Randomization */
  const allTypes = useMemo(() => TEXTURE_META.map((t) => t.id), []);

  const handleShuffle = useCallback(() => {
    const randomized = shuffle(options, locks, allTypes, PALETTES);
    setType(randomized.type);
    setPaletteId(randomized.palette.id);
    setSeed(randomized.seed);
    setGrainIntensity(randomized.grainIntensity);
    setGrainSize(randomized.grainSize);
    setImperfection(randomized.imperfection);
    setVignette(randomized.vignette);
    setStack(randomized.stack);
    setCandRoot(randomSeed());
    showToast(`Shuffled: ${TEXTURE_META.find((m) => m.id === randomized.type)?.name}`);
  }, [options, locks, allTypes]);

  /* Keyboard shortcut: Spacebar = Shuffle */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleShuffle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleShuffle]);

  /* Export Single File */
  const handleExportSingle = useCallback(async () => {
    setIsExporting(true);
    showToast(`Exporting ${width}×${height} ${format.toUpperCase()}…`);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    try {
      const bytes = await exportSingle(options, width, height, format, quality, prefix);
      showToast(`Exported ${format.toUpperCase()} · ${formatBytes(bytes)}`);
    } catch {
      showToast("Export error — try a smaller resolution.");
    }
    setIsExporting(false);
  }, [options, width, height, format, quality, prefix]);

  /* Bulk Generation Runner */
  const handleRunBulk = async () => {
    bulkCancelRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: bulk.count, label: "Initializing…", bytes: 0 });

    const res = await runBatch(
      options,
      bulk,
      width,
      height,
      TEXTURE_META.map((t) => t.id),
      PALETTES,
      setBulkProgress,
      () => bulkCancelRef.current,
      locks
    );

    setBulkRunning(false);
    setBulkOpen(false);
    setBulkProgress(null);

    showToast(
      res.cancelled
        ? `Bulk cancelled after ${res.count} files.`
        : `Bulk complete: ${res.count} textures exported (${formatBytes(res.bytes)})`
    );
  };

  /* Candidates for Suggestions Strip */
  const candidates = useMemo(
    () => randomCandidates(options, locks, allTypes, PALETTES, candRoot, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candRoot, locks, allTypes, options.grainOnly]
  );

  const keywords = keywordsFor(type, paletteId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121214] text-[#ededed] font-sans select-none antialiased">
      {/* 1. TOP APP HEADER */}
      <Header
        currentType={type}
        onSelectType={setType}
        seed={seed}
        onShuffle={handleShuffle}
        onNewSeed={() => setSeed(randomSeed())}
        onOpenBulk={() => setBulkOpen(true)}
        onExport={handleExportSingle}
        isExporting={isExporting}
        format={format}
        onFormatChange={setFormat}
        width={width}
        height={height}
      />

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Texture Library & Presets */}
        <TextureLibrary
          activeType={type}
          onSelectType={setType}
          palette={palette}
          stack={stack}
          onToggleStack={handleToggleStack}
          onClearStack={() => setStack([])}
          keywords={keywords}
          onCopyKeywords={() => {
            navigator.clipboard?.writeText(keywords.join(", "));
            showToast("Microstock keywords copied!");
          }}
        />

        {/* Center: Canvas Workspace */}
        <CanvasWorkspace
          options={options}
          width={width}
          height={height}
          zoom={zoom}
          onZoomChange={setZoom}
          onNewSeed={() => setSeed(randomSeed())}
          onPrevSeed={() => setSeed((s) => (s > 0 ? s - 1 : 4294967295))}
          onNextSeed={() => setSeed((s) => (s + 1) >>> 0)}
        />

        {/* Right: Inspector Panel & Controls */}
        <InspectorPanel
          options={options}
          onChangeOptions={handleOptionsChange}
          width={width}
          height={height}
          onWidthChange={handleWidthChange}
          onHeightChange={handleHeightChange}
          lockRatio={lockRatio}
          onToggleLockRatio={handleToggleLockRatio}
          sizePreset={sizePreset}
          onSelectSizePreset={handleSelectSizePreset}
          sizePresets={SIZE_PRESETS}
          onSwapOrientation={handleSwapOrientation}
          format={format}
          onFormatChange={setFormat}
          quality={quality}
          onQualityChange={setQuality}
          prefix={prefix}
          onPrefixChange={setPrefix}
          grainOnly={grainOnly}
          onToggleGrainOnly={setGrainOnly}
          onExport={handleExportSingle}
          onOpenBulk={() => setBulkOpen(true)}
          isExporting={isExporting}
          locks={locks}
          onToggleLock={(key) => setLocks((l) => ({ ...l, [key]: !l[key] }))}
          onResetLocks={() => setLocks(NO_LOCKS)}
          candidates={candidates}
          onApplyCandidate={(cand) => {
            setType(cand.type);
            setPaletteId(cand.palette.id);
            setSeed(cand.seed);
            setGrainIntensity(cand.grainIntensity);
            setGrainSize(cand.grainSize);
            setImperfection(cand.imperfection);
            setVignette(cand.vignette);
            setStack(cand.stack);
            showToast(`Applied ${cand.type} · seed #${cand.seed}`);
          }}
          onRefreshCandidates={() => setCandRoot(randomSeed())}
        />
      </div>

      {/* 3. BULK BATCH GENERATOR MODAL */}
      <BulkModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        settings={bulk}
        onChange={setBulk}
        onRun={handleRunBulk}
        onCancel={() => (bulkCancelRef.current = true)}
        running={bulkRunning}
        progress={bulkProgress}
        width={width}
        height={height}
        locks={locks}
        onLocksChange={setLocks}
      />

      {/* 4. TOAST NOTIFICATION */}
      {toast && (
        <div className="pointer-events-none fixed bottom-18 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-[#323238] bg-[#18181b]/95 px-4 py-2 text-[11px] font-medium text-white shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
}
