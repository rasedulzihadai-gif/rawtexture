import { Palette } from "./types";
import { hexToRgb } from "./color";

// Muted, desaturated presets that fit the "authentic-feel" stock trend.
export const PALETTES: Palette[] = [
  {
    id: "warmBeige",
    name: "Warm Beige",
    base: hexToRgb("#d9ccb4"),
    shadow: hexToRgb("#b8a986"),
    highlight: hexToRgb("#efe7d6"),
    accent: hexToRgb("#c79a5b"),
  },
  {
    id: "coolGrey",
    name: "Cool Grey",
    base: hexToRgb("#b6bcc0"),
    shadow: hexToRgb("#8f969c"),
    highlight: hexToRgb("#d6dadd"),
    accent: hexToRgb("#7d8a96"),
  },
  {
    id: "fadedSepia",
    name: "Faded Sepia",
    base: hexToRgb("#cdb18c"),
    shadow: hexToRgb("#9c7c57"),
    highlight: hexToRgb("#e7d4b5"),
    accent: hexToRgb("#a9743f"),
  },
  {
    id: "mutedBlue",
    name: "Muted Blue",
    base: hexToRgb("#9fb1bd"),
    shadow: hexToRgb("#6f8696"),
    highlight: hexToRgb("#c3d0d8"),
    accent: hexToRgb("#5d7c8c"),
  },
  {
    id: "softBW",
    name: "Soft B&W",
    base: hexToRgb("#c7c7c4"),
    shadow: hexToRgb("#9a9a97"),
    highlight: hexToRgb("#e6e6e3"),
    accent: hexToRgb("#8c8c89"),
  },
  {
    id: "dustyRose",
    name: "Dusty Rose",
    base: hexToRgb("#cdb3ac"),
    shadow: hexToRgb("#a08884"),
    highlight: hexToRgb("#e3cfca"),
    accent: hexToRgb("#b0837c"),
  },
  {
    id: "oliveKhaki",
    name: "Olive / Khaki",
    base: hexToRgb("#b3ad8e"),
    shadow: hexToRgb("#8a8567"),
    highlight: hexToRgb("#d2cdaf"),
    accent: hexToRgb("#7e7a52"),
  },
  {
    id: "charcoal",
    name: "Charcoal",
    base: hexToRgb("#6f7174"),
    shadow: hexToRgb("#47494c"),
    highlight: hexToRgb("#93969a"),
    accent: hexToRgb("#3f4144"),
  },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
