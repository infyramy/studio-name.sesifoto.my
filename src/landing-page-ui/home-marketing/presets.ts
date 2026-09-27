import type { HomeCtaPresetId, HomeFeaturedPackage, HomeGalleryItem, HomeMarketingContent } from "./types";
import { DEFAULT_HOME_SECTION_ORDER } from "./section-order";

const IMG_ABOUT =
  "https://images.unsplash.com/photo-1493863641943-9b64192e4c60?q=80&w=600&auto=format&fit=crop";
const IMG_CTA =
  "https://images.unsplash.com/photo-1520854221256-1748513aa6a8?q=80&w=600&auto=format&fit=crop";

export const DEFAULT_HOME_GALLERY: HomeGalleryItem[] = [];
export const DEFAULT_HOME_PACKAGES: HomeFeaturedPackage[] = [];

export function createDefaultHomeMarketingContent(): HomeMarketingContent {
  return {
    heroTagline: "Your Memory, In Eternity",
    heroSubtitle: "Wedding photography & videography",
    homeSectionOrder: [...DEFAULT_HOME_SECTION_ORDER],
    showHomeGallery: true,
    featuredClientGalleryIds: [],
    galleryItems: [],
    showHomeQuote: true,
    quoteText: "Loved by Modern Brides",
    showHomePackages: true,
    featuredPackageIds: [],
    featuredPackages: [],
    showHomeAbout: true,
    showHomeFaq: true,
    aboutSnippetImageUrl: IMG_ABOUT,
    aboutSnippetLabel: "ABOUT US",
    aboutSnippetText:
      "Tulipsfilm consist of passionate photographer and videographer in which their goals is to capture every moment for yours truly to relive the memories since 2019.",
    aboutSnippetCtaLabel: "READ MORE ABOUT US",
    aboutSnippetCtaUrl: "/portfolio",
    showHomeCta: true,
    homeCtaImageUrl: IMG_CTA,
    homeCtaHeading: "Ceritakan hari bahagia anda bersama kami",
    homeCtaPrimaryPreset: "book_appointment",
    homeCtaSecondaryPreset: "view_packages",
  };
}
