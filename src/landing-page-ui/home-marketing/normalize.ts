import { safeHttpUrl } from "../useLandingPageStyles";
import { isHomeCtaPresetId } from "./cta-presets";
import { createDefaultHomeMarketingContent } from "./presets";
import { normalizeHomeSectionOrder } from "./section-order";
import type {
  HomeCtaPresetId,
  HomeFeaturedPackage,
  HomeGalleryItem,
  HomeMarketingContent,
} from "./types";

const MAX_TEXT = 500;
const MAX_LABEL = 120;
const MAX_PRICE = 40;

function trim(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function safeNavUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 500);
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return safeHttpUrl(trimmed) ?? "";
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0 || value === null) return false;
  return fallback;
}

function normalizeGallery(input: unknown): HomeGalleryItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): HomeGalleryItem | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const imageUrl = safeHttpUrl(item.imageUrl) ?? "";
      if (!imageUrl) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `g-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id,
        imageUrl,
        caption: trim(item.caption, MAX_LABEL),
      };
    })
    .filter((g): g is HomeGalleryItem => g !== null)
    .slice(0, 8);
}

function normalizePackages(input: unknown): HomeFeaturedPackage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): HomeFeaturedPackage | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const title = trim(item.title, MAX_LABEL);
      const imageUrl = safeHttpUrl(item.imageUrl) ?? "";
      if (!title || !imageUrl) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `p-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id,
        imageUrl,
        title,
        price: trim(item.price, MAX_PRICE),
        detailLabel: "Pilih",
        detailUrl: "/services",
      };
    })
    .filter((p): p is HomeFeaturedPackage => p !== null)
    .slice(0, 6);
}

function normalizeCtaPreset(
  value: unknown,
  fallback: HomeCtaPresetId,
): HomeCtaPresetId {
  if (isHomeCtaPresetId(value)) return value;
  return fallback;
}

function legacyPrimaryPreset(src: Record<string, unknown>): HomeCtaPresetId {
  const url = safeNavUrl(src.homeCtaPrimaryUrl);
  if (url === "/check-booking") return "book_appointment";
  if (url === "/services") return "view_packages";
  if (url === "/lead-form") return "contact_us";
  if (url === "/portfolio") return "view_portfolio";
  return "book_appointment";
}

function legacySecondaryPreset(src: Record<string, unknown>): HomeCtaPresetId {
  const url = safeNavUrl(src.homeCtaSecondaryUrl);
  if (!url) return "none";
  if (url === "/check-booking") return "book_appointment";
  if (url === "/services") return "view_packages";
  if (url === "/lead-form") return "contact_us";
  if (url === "/portfolio") return "view_portfolio";
  return "view_packages";
}

export function normalizeHomeMarketingContent(
  input: Record<string, unknown> | null | undefined,
): HomeMarketingContent {
  const defaults = createDefaultHomeMarketingContent();
  const src = input ?? {};
  const galleryItems = normalizeGallery(src.galleryItems);
  const featuredPackages = normalizePackages(src.featuredPackages);

  return {
    heroTagline: trim(src.heroTagline, MAX_TEXT) || defaults.heroTagline,
    heroSubtitle: trim(src.heroSubtitle, MAX_TEXT) || defaults.heroSubtitle,
    homeSectionOrder: normalizeHomeSectionOrder(src.homeSectionOrder),
    showHomeGallery: coerceBoolean(src.showHomeGallery, defaults.showHomeGallery),
    galleryItems:
      galleryItems.length > 0
        ? galleryItems
        : defaults.galleryItems.map((i) => ({ ...i })),
    showHomeQuote: coerceBoolean(src.showHomeQuote, defaults.showHomeQuote),
    quoteText: trim(src.quoteText, MAX_TEXT) || defaults.quoteText,
    showHomePackages: coerceBoolean(
      src.showHomePackages,
      defaults.showHomePackages,
    ),
    featuredPackages:
      featuredPackages.length > 0
        ? featuredPackages
        : defaults.featuredPackages.map((p) => ({ ...p })),
    showHomeAbout: coerceBoolean(src.showHomeAbout, defaults.showHomeAbout),
    showHomeFaq: coerceBoolean(
      src.showHomeFaq ?? src.showFaq,
      defaults.showHomeFaq,
    ),
    aboutSnippetImageUrl:
      safeHttpUrl(src.aboutSnippetImageUrl) ?? defaults.aboutSnippetImageUrl,
    aboutSnippetLabel:
      trim(src.aboutSnippetLabel, MAX_LABEL) || defaults.aboutSnippetLabel,
    aboutSnippetText:
      trim(src.aboutSnippetText, MAX_TEXT) || defaults.aboutSnippetText,
    aboutSnippetCtaLabel:
      trim(src.aboutSnippetCtaLabel, MAX_LABEL) ||
      defaults.aboutSnippetCtaLabel,
    aboutSnippetCtaUrl: "/about-us",
    showHomeCta: coerceBoolean(src.showHomeCta, defaults.showHomeCta),
    homeCtaImageUrl:
      safeHttpUrl(src.homeCtaImageUrl) ?? defaults.homeCtaImageUrl,
    homeCtaHeading:
      trim(src.homeCtaHeading, MAX_TEXT) || defaults.homeCtaHeading,
    homeCtaPrimaryPreset: normalizeCtaPreset(
      src.homeCtaPrimaryPreset,
      src.homeCtaPrimaryPreset
        ? defaults.homeCtaPrimaryPreset
        : legacyPrimaryPreset(src),
    ),
    homeCtaSecondaryPreset: normalizeCtaPreset(
      src.homeCtaSecondaryPreset,
      src.homeCtaSecondaryPreset
        ? defaults.homeCtaSecondaryPreset
        : legacySecondaryPreset(src),
    ),
  };
}
