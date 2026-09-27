import type { HomeCtaPresetId } from "../home-marketing/cta-presets";

export type PortfolioCategory = {
  id: string;
  label: string;
};

export type PortfolioItem = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  categoryId: string;
  /** Client gallery public path, e.g. `/client-portal/{jobId}/gallery/{id}` */
  url: string;
};

export type PortfolioSectionKey = "hero" | "gallery" | "cta";

export type PortfolioPageConfig = {
  pageTemplate: "portfolio";
  showHero: boolean;
  sectionLabel: string;
  title: string;
  subtitle: string;
  featuredImageUrl: string;
  showGallery: boolean;
  /** Selected CRM client gallery IDs (live-linked). Each becomes one cover card. */
  clientGalleryIds: string[];
  categories: PortfolioCategory[];
  /** Resolved gallery cards. Not the source of truth. */
  items: PortfolioItem[];
  showCta: boolean;
  ctaImageUrl: string;
  ctaSectionLabel: string;
  ctaHeading: string;
  ctaPrimaryPreset: HomeCtaPresetId;
  ctaSecondaryPreset: HomeCtaPresetId;
};

export type PortfolioPageConfigInput = Partial<PortfolioPageConfig> &
  Record<string, unknown>;
