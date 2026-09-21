import type { HomeCtaPresetId } from "../home-marketing/cta-presets";

export type ServicesPackage = {
  id: string;
  imageUrl: string;
  title: string;
  price: string;
  detailLabel: string;
  detailUrl: string;
};

export type ServicesCategory = {
  id: string;
  label: string;
  columns: 2 | 3;
  packages: ServicesPackage[];
};

export type ServicesSectionKey = "hero" | "packages" | "cta";

export type ServicesPageConfig = {
  pageTemplate: "services";
  showHero: boolean;
  sectionLabel: string;
  title: string;
  showPackages: boolean;
  categories: ServicesCategory[];
  showCta: boolean;
  ctaImageUrl: string;
  ctaHeading: string;
  ctaPrimaryPreset: HomeCtaPresetId;
  ctaSecondaryPreset: HomeCtaPresetId;
};

export type ServicesPageConfigInput = Partial<ServicesPageConfig> &
  Record<string, unknown>;
