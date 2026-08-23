import type { HomeCtaPresetId, HomeFeaturedPackage, HomeGalleryItem, HomeMarketingContent } from "./types";
import { DEFAULT_HOME_SECTION_ORDER } from "./section-order";

const IMG_A =
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop";
const IMG_B =
  "https://images.unsplash.com/photo-1465495976277-4387d1b1b0ac?q=80&w=600&auto=format&fit=crop";
const IMG_C =
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop";
const IMG_D =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop";
const IMG_PKG1 =
  "https://images.unsplash.com/photo-1606216794074-735e2aa6c74c?q=80&w=600&auto=format&fit=crop";
const IMG_PKG2 =
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop";
const IMG_PKG3 =
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=600&auto=format&fit=crop";
const IMG_ABOUT =
  "https://images.unsplash.com/photo-1493863641943-9b64192e4c60?q=80&w=600&auto=format&fit=crop";
const IMG_CTA =
  "https://images.unsplash.com/photo-1520854221256-1748513aa6a8?q=80&w=600&auto=format&fit=crop";

export const DEFAULT_HOME_GALLERY: HomeGalleryItem[] = [
  { id: "g-1", imageUrl: IMG_A, caption: "SYAHIR & SYAZWANI" },
  { id: "g-2", imageUrl: IMG_B, caption: "AMIR & AISYAH" },
  { id: "g-3", imageUrl: IMG_C, caption: "HAKIM & NURUL" },
  { id: "g-4", imageUrl: IMG_D, caption: "FAIZ & LINA" },
];

export const DEFAULT_HOME_PACKAGES: HomeFeaturedPackage[] = [
  {
    id: "p-1",
    imageUrl: IMG_PKG1,
    title: "WCC Essential",
    price: "RM 1,500",
    detailLabel: "Pilih",
    detailUrl: "/services",
  },
  {
    id: "p-2",
    imageUrl: IMG_PKG2,
    title: "WCC Essential PLUS",
    price: "RM 2,200",
    detailLabel: "Pilih",
    detailUrl: "/services",
  },
  {
    id: "p-3",
    imageUrl: IMG_PKG3,
    title: "Engagement/Nikah/Sanding Videography",
    price: "RM 850",
    detailLabel: "Pilih",
    detailUrl: "/services",
  },
];

export function createDefaultHomeMarketingContent(): HomeMarketingContent {
  return {
    heroTagline: "Your Memory, In Eternity",
    heroSubtitle: "Wedding photography & videography",
    homeSectionOrder: [...DEFAULT_HOME_SECTION_ORDER],
    showHomeGallery: true,
    galleryItems: DEFAULT_HOME_GALLERY.map((i) => ({ ...i })),
    showHomeQuote: true,
    quoteText: "Loved by Modern Brides",
    showHomePackages: true,
    featuredPackages: DEFAULT_HOME_PACKAGES.map((p) => ({ ...p })),
    showHomeAbout: true,
    showHomeFaq: true,
    aboutSnippetImageUrl: IMG_ABOUT,
    aboutSnippetLabel: "ABOUT US",
    aboutSnippetText:
      "Tulipsfilm consist of passionate photographer and videographer in which their goals is to capture every moment for yours truly to relive the memories since 2019.",
    aboutSnippetCtaLabel: "READ MORE ABOUT US",
    aboutSnippetCtaUrl: "/about-us",
    showHomeCta: true,
    homeCtaImageUrl: IMG_CTA,
    homeCtaHeading: "Ceritakan hari bahagia anda bersama kami",
    homeCtaPrimaryPreset: "book_appointment",
    homeCtaSecondaryPreset: "view_packages",
  };
}
