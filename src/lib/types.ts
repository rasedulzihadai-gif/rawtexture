import { RGB } from "./color";

export type TextureType =
  | "filmGrain"
  | "flash"
  | "paper"
  | "concrete"
  | "fabric"
  | "xerox"
  | "lightLeak"
  | "dustScratches"
  | "watercolor"
  | "bokeh";

export interface Resolution {
  w: number;
  h: number;
  label: string;
}

export interface Palette {
  id: string;
  name: string;
  base: RGB;
  shadow: RGB;
  highlight: RGB;
  accent: RGB;
}

export interface TextureOptions {
  type: TextureType;
  seed: number;
  palette: Palette;
  grainIntensity: number; // 0-100
  grainSize: number; // 0.5 - 4 (film grain scale)
  imperfection: number; // 0-100
  vignette: number; // 0-100
  grainOnly: boolean;
  /** For stacked preset combos — additional types layered on top. */
  stack: TextureType[];
}

export const TEXTURE_META: { id: TextureType; name: string; blurb: string }[] = [
  { id: "filmGrain", name: "Film Grain Overlay", blurb: "Layered analog grain over a base gradient" },
  { id: "flash", name: "Flash Photography", blurb: "Radial hotspot, vignette & color temp" },
  { id: "paper", name: "Paper / Canvas", blurb: "Fine fiber weave with smudges & creases" },
  { id: "concrete", name: "Concrete / Plaster Wall", blurb: "Weathered blotches, cracks & bumps" },
  { id: "fabric", name: "Fabric / Linen Weave", blurb: "Woven cross-hatch with fold shading" },
  { id: "xerox", name: "Scanned / Xerox", blurb: "High-contrast streaks & dust specks" },
  { id: "lightLeak", name: "Light Leak / Defect", blurb: "Warm bleed from the edge + grain" },
  { id: "dustScratches", name: "Dust & Scratches", blurb: "Clean base with vintage damage" },
  { id: "watercolor", name: "Watercolor / Ink Bleed", blurb: "Soft organic bleed on paper grain" },
  { id: "bokeh", name: "Bokeh / Out-of-Focus", blurb: "Soft blurred lights on dark gradient" },
];
