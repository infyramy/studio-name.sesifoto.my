import type { GalleryDesignSettings } from "@/services/gallery.service";
import {
  blendPortalHex,
  normalizePortalHex,
  portalHexToRgba,
  readablePortalAccentText,
} from "@/utils/portal-color";

interface PaletteColors {
  hero: string;
  text: string;
  content: string;
  accent: string;
}

const PALETTES: Record<string, PaletteColors> = {
  "warm-earth": { hero: "#3b2f2a", text: "#2b2420", content: "#f4ede4", accent: "#a0704d" },
  "warm-editorial": { hero: "#1f1a17", text: "#1f1a17", content: "#faf6f0", accent: "#b0855a" },
  "collage-paper": { hero: "#e9e2d6", text: "#2d2a26", content: "#f3eee6", accent: "#c4553b" },
  "ink-stone": { hero: "#111315", text: "#1d2024", content: "#eceae6", accent: "#5b6670" },
  "sage-night": { hero: "#1c2620", text: "#e7ece6", content: "#26322b", accent: "#9bb59a" },
  "midnight-gallery": { hero: "#0b0d12", text: "#e8e8ec", content: "#12151c", accent: "#c9a86a" },
};

const FONT_SETS: Record<string, { display: string; body: string }> = {
  "instrument-sans": { display: "Instrument Sans", body: "DM Sans" },
  "newsreader-dm": { display: "Newsreader", body: "DM Sans" },
  "cormorant-dm": { display: "Cormorant Garamond", body: "DM Sans" },
  "bodoni-manrope": { display: "Bodoni Moda", body: "Manrope" },
  "instrument-serif": { display: "Instrument Serif", body: "Instrument Sans" },
  "newsreader-instrument": { display: "Newsreader", body: "Instrument Sans" },
  "fraunces-inter": { display: "Fraunces", body: "Inter" },
  "playfair-montserrat": { display: "Playfair Display", body: "Montserrat" },
  "space-cormorant": { display: "Space Grotesk", body: "Cormorant Garamond" },
  "baskerville-source": { display: "Libre Baskerville", body: "Source Sans 3" },
};

const DEFAULT_FONTS = { display: "Cormorant Garamond", body: "DM Sans" };

export function resolveGalleryPalette(
  design: GalleryDesignSettings | null | undefined,
  accent: string,
): PaletteColors | null {
  if (!design?.palette) return null;
  if (design.palette !== "custom") return PALETTES[design.palette] ?? null;
  return {
    hero: normalizePortalHex(design.heroBackground) ?? "#3b2f2a",
    text: normalizePortalHex(design.textColor) ?? "#2b2420",
    content: normalizePortalHex(design.contentBackground) ?? "#f4ede4",
    accent: normalizePortalHex(accent) ?? "#a0704d",
  };
}

export function resolveGalleryFonts(design: GalleryDesignSettings | null | undefined) {
  if (design?.fontSet === "custom") {
    return {
      display: design.fontPrimary || DEFAULT_FONTS.display,
      body: design.fontSecondary || DEFAULT_FONTS.body,
    };
  }
  return FONT_SETS[design?.fontSet ?? ""] ?? DEFAULT_FONTS;
}

/** Overrides the portal theme vars so every view picks up the palette. */
export function paletteThemeVars(palette: PaletteColors): Record<string, string> {
  return {
    "--p-shell": palette.content,
    "--p-bg": palette.content,
    "--p-text": palette.text,
    "--p-card": blendPortalHex(palette.text, palette.content, 0.06),
    "--p-border": portalHexToRgba(palette.text, 0.14),
    "--p-muted": portalHexToRgba(palette.text, 0.58),
    "--p-hover": portalHexToRgba(palette.text, 0.06),
    "--p-accent": palette.accent,
    "--p-accent-text": readablePortalAccentText(palette.accent),
    "--p-accent-bg": portalHexToRgba(palette.accent, 0.12),
    "--p-accent-border": palette.accent,
    "--g-hero": palette.hero,
  };
}

const STATIC_WEIGHTS: Record<string, string> = {
  "Instrument Serif": "",
  "Libre Baskerville": ":wght@400;700",
};

function fontHref(family: string) {
  if (family === "Satoshi") {
    return "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap";
  }
  const weights = STATIC_WEIGHTS[family] ?? ":wght@400;500;600;700";
  return `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}${weights}&display=swap`;
}

/** One stylesheet per family so an unknown family cannot break the rest. */
export function ensureGalleryFonts(families: string[]) {
  if (typeof document === "undefined") return;
  for (const family of new Set(families)) {
    if (!family || !/^[A-Za-z0-9 ]{2,40}$/.test(family)) continue;
    const id = `gallery-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = fontHref(family);
    document.head.appendChild(link);
  }
}
