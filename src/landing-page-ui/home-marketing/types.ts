import type { HomeSectionKey } from "./section-order";

export type HomeGalleryItem = {
  id: string;
  imageUrl: string;
  caption: string;
  /** Client gallery public path, e.g. `/client-portal/{jobId}/gallery/{id}` */
  url: string;
};

export type HomeFeaturedPackage = {
  id: string;
  imageUrl: string;
  title: string;
  price: string;
  detailLabel: string;
  detailUrl: string;
};

/** Ordered CRM package IDs shown in home featured packages (live-linked). */
export type HomeFeaturedPackageId = string;

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
  /** Selected CRM client gallery IDs (live-linked). Max 6. */
  featuredClientGalleryIds: string[];
  /** Resolved gallery cards (cover + title). Not the source of truth. */
  galleryItems: HomeGalleryItem[];
  showHomeQuote: boolean;
  quoteText: string;
  showHomePackages: boolean;
  featuredPackageIds: HomeFeaturedPackageId[];
  /** Resolved display cards (from CRM). Not the source of truth. */
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
