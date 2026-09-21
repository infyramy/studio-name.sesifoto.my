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
  categories: PortfolioCategory[];
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
