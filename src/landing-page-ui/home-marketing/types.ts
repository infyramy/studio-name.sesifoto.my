import type { HomeSectionKey } from "./section-order";

export type HomeGalleryItem = {
  id: string;
  imageUrl: string;
  caption: string;
};

export type HomeFeaturedPackage = {
  id: string;
  imageUrl: string;
  title: string;
  price: string;
  detailLabel: string;
  detailUrl: string;
};

export type HomeCtaPresetId =
  | "book_appointment"
  | "view_packages"
  | "contact_us"
  | "view_portfolio"
  | "none";

export type { HomeSectionKey } from "./section-order";

export type HomeMarketingContent = {
  heroTagline: string;
  heroSubtitle: string;
  homeSectionOrder: HomeSectionKey[];
  showHomeGallery: boolean;
  galleryItems: HomeGalleryItem[];
  showHomeQuote: boolean;
  quoteText: string;
  showHomePackages: boolean;
  featuredPackages: HomeFeaturedPackage[];
  showHomeAbout: boolean;
  showHomeFaq: boolean;
  aboutSnippetImageUrl: string;
  aboutSnippetLabel: string;
  aboutSnippetText: string;
  aboutSnippetCtaLabel: string;
  aboutSnippetCtaUrl: string;
  showHomeCta: boolean;
  homeCtaImageUrl: string;
  homeCtaHeading: string;
  homeCtaPrimaryPreset: HomeCtaPresetId;
  homeCtaSecondaryPreset: HomeCtaPresetId;
};
