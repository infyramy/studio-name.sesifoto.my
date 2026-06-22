import { createDefaultTheme, type StudioDefaults } from "./presets";
import { safeHttpUrl, safeHttpsUrl } from "./useLandingPageStyles";
import {
  SECTION_KEYS,
  type CustomLinkItem,
  type LandingPageConfig,
  type LandingPageTheme,
  type LandingPageType,
  type ProductEntitlements,
  type SectionKey,
  type TestimonialItem,
} from "./types";

export function normalizeSectionOrder(input: unknown): SectionKey[] {
  const list = Array.isArray(input) ? input : [];
  const filtered = list
    .filter((k): k is SectionKey => SECTION_KEYS.includes(k as SectionKey))
    .filter((k, idx, arr) => arr.indexOf(k) === idx);

  for (const k of SECTION_KEYS) {
    if (!filtered.includes(k)) filtered.push(k);
  }
  return filtered;
}

function applyLegacyButtonToggles(
  theme: LandingPageTheme,
  raw: LandingPageConfig,
  pageType?: LandingPageType,
): void {
  const hasNewToggles =
    typeof raw.showBookNowButton === "boolean" ||
    typeof raw.showCheckBookingButton === "boolean" ||
    typeof raw.showCrmInquiryButton === "boolean";

  if (hasNewToggles) return;

  if (theme.showButtons === false) {
    theme.showBookNowButton = false;
    theme.showCheckBookingButton = false;
    theme.showCrmInquiryButton = false;
    return;
  }

  if (pageType === "crm_inquiry") {
    theme.showBookNowButton = false;
    theme.showCheckBookingButton = false;
    theme.showCrmInquiryButton = true;
    return;
  }

  if (pageType === "general") {
    theme.showBookNowButton = false;
    theme.showCheckBookingButton = true;
    theme.showCrmInquiryButton = false;
    return;
  }

  theme.showBookNowButton = true;
  theme.showCheckBookingButton = true;
  theme.showCrmInquiryButton = false;
}

export function sanitizeProductButtonsInConfig(
  config: Record<string, unknown>,
  products: ProductEntitlements,
): Record<string, unknown> {
  const next = { ...config };

  if (!products.studio) {
    next.showBookNowButton = false;
    next.showCheckBookingButton = false;
  }

  if (!products.crm) {
    next.showCrmInquiryButton = false;
  }

  return next;
}

export function normalizeLandingPageConfig(
  saved: LandingPageConfig | null | undefined,
  studioDefaults?: StudioDefaults,
  options?: { pageType?: LandingPageType; products?: ProductEntitlements },
): LandingPageTheme {
  const raw = saved && typeof saved === "object" ? saved : {};
  const studio = studioDefaults ?? {};

  const defaults = createDefaultTheme();
  defaults.studioName = studio.name || defaults.studioName;
  defaults.logoUrl = studio.logoUrl || defaults.logoUrl;
  defaults.socialInstagram = studio.instagram || defaults.socialInstagram;
  defaults.socialFacebook = studio.facebook || defaults.socialFacebook;
  defaults.socialTiktok = studio.tiktok || defaults.socialTiktok;
  defaults.mapAddress = studio.address || defaults.mapAddress;
  defaults.ssmNumber = studio.ssm || defaults.ssmNumber;
  if (studio.whatsapp && defaults.emergencyPhoneType === "system") {
    defaults.emergencyCustomPhone = studio.whatsapp;
  }

  const theme: LandingPageTheme = { ...defaults, ...raw };

  if (typeof theme.showButtons !== "boolean") {
    theme.showButtons = true;
  }

  applyLegacyButtonToggles(theme, raw, options?.pageType);

  if (typeof theme.showBookNowButton !== "boolean") {
    theme.showBookNowButton = theme.showButtons !== false;
  }
  if (typeof theme.showCheckBookingButton !== "boolean") {
    theme.showCheckBookingButton = theme.showButtons !== false;
  }
  if (typeof theme.showCrmInquiryButton !== "boolean") {
    theme.showCrmInquiryButton = false;
  }

  if (options?.products) {
    if (!options.products.studio) {
      theme.showBookNowButton = false;
      theme.showCheckBookingButton = false;
    }
    if (!options.products.crm) {
      theme.showCrmInquiryButton = false;
    }
  }

  if (!Array.isArray(theme.faqs)) theme.faqs = [];
  if (!Array.isArray(theme.galleryImages)) {
    const legacyUrl = (raw as { pilihanSetUrl?: string }).pilihanSetUrl;
    theme.galleryImages =
      typeof legacyUrl === "string" && legacyUrl ? [legacyUrl] : [];
  }
  theme.sectionOrder = normalizeSectionOrder(theme.sectionOrder);

  theme.seoTitle = typeof theme.seoTitle === "string" ? theme.seoTitle.trim().slice(0, 70) : "";
  theme.seoDescription =
    typeof theme.seoDescription === "string"
      ? theme.seoDescription.trim().slice(0, 200)
      : "";
  theme.ogImageUrl =
    safeHttpUrl(theme.ogImageUrl) ?? (typeof theme.ogImageUrl === "string" ? "" : "");

  theme.showSocials = coerceBoolean(theme.showSocials, defaults.showSocials);
  theme.showGallery = coerceBoolean(theme.showGallery, defaults.showGallery);
  theme.showMaps = coerceBoolean(theme.showMaps, defaults.showMaps);
  theme.showFaq = coerceBoolean(theme.showFaq, defaults.showFaq);
  theme.showEmergency = coerceBoolean(theme.showEmergency, defaults.showEmergency);
  theme.showFooter = coerceBoolean(theme.showFooter, defaults.showFooter);
  theme.showTestimonials = coerceBoolean(
    theme.showTestimonials,
    defaults.showTestimonials,
  );
  theme.showCustomLinks = coerceBoolean(theme.showCustomLinks, defaults.showCustomLinks);

  theme.testimonials = normalizeTestimonials(theme.testimonials);
  theme.customLinks = normalizeCustomLinks(theme.customLinks);

  return theme;
}

function normalizeTestimonials(input: unknown): TestimonialItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const quote = typeof row.quote === "string" ? row.quote.trim().slice(0, 500) : "";
      const author = typeof row.author === "string" ? row.author.trim().slice(0, 80) : "";
      if (!quote || !author) return null;
      const subtitle =
        typeof row.subtitle === "string" ? row.subtitle.trim().slice(0, 80) : undefined;
      const id =
        typeof row.id === "string" && row.id.trim()
          ? row.id
          : `testimonial-${Math.random().toString(36).slice(2, 9)}`;
      return { id, quote, author, ...(subtitle ? { subtitle } : {}) };
    })
    .filter((item): item is TestimonialItem => item !== null)
    .slice(0, 3);
}

function normalizeCustomLinks(input: unknown): CustomLinkItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = typeof row.label === "string" ? row.label.trim().slice(0, 60) : "";
      const url = safeHttpsUrl(row.url);
      if (!label || !url) return null;
      const id =
        typeof row.id === "string" && row.id.trim()
          ? row.id
          : `link-${Math.random().toString(36).slice(2, 9)}`;
      return { id, label, url };
    })
    .filter((item): item is CustomLinkItem => item !== null)
    .slice(0, 3);
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0 || value === null) return false;
  return fallback;
}

export function getGalleryImagesClean(theme: LandingPageTheme): string[] {
  return (theme.galleryImages || [])
    .filter((x) => typeof x === "string" && x.trim())
    .slice(0, 5);
}

export function getOrderedSections(
  theme: LandingPageTheme,
  options?: { studioPhone?: string; preview?: boolean },
): SectionKey[] {
  if (options?.preview) {
    const enabled: Record<SectionKey, boolean> = {
      gallery: theme.showGallery,
      testimonials: theme.showTestimonials,
      maps: theme.showMaps,
      faq: theme.showFaq,
      emergency: theme.showEmergency,
      footer: theme.showFooter,
    };
    return theme.sectionOrder.filter((key) => enabled[key]);
  }

  const galleryImages = getGalleryImagesClean(theme);
  const hasTestimonials = (theme.testimonials?.length || 0) > 0;
  const phone =
    theme.emergencyPhoneType === "custom"
      ? theme.emergencyCustomPhone
      : options?.studioPhone ?? "";
  const hasEmergency = !!phone?.trim();
  const hasFaq = (theme.faqs?.length || 0) > 0;

  const enabled: Record<SectionKey, boolean> = {
    gallery: theme.showGallery && galleryImages.length > 0,
    testimonials: theme.showTestimonials && hasTestimonials,
    maps: theme.showMaps && !!theme.mapAddress,
    faq: theme.showFaq && hasFaq,
    emergency: theme.showEmergency && hasEmergency,
    footer: theme.showFooter,
  };

  return theme.sectionOrder.filter((key) => enabled[key]);
}
