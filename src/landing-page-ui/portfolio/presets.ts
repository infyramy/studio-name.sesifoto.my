import type { PortfolioCategory, PortfolioItem, PortfolioPageConfig } from "./types";

export const DEFAULT_PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { id: "all", label: "ALL" },
];

export const DEFAULT_PORTFOLIO_ITEMS: PortfolioItem[] = [];

export function createDefaultPortfolioConfig(): PortfolioPageConfig {
  return {
    pageTemplate: "portfolio",
    showHero: true,
    sectionLabel: "PORTFOLIO",
    title: "Wedding Gallery",
    subtitle: "Here are our recent works from past client",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop",
    showGallery: true,
    clientGalleryIds: [],
    categories: DEFAULT_PORTFOLIO_CATEGORIES.map((c) => ({ ...c })),
    items: [],
    showCta: true,
    ctaImageUrl:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
    ctaSectionLabel: "HUBUNGI KAMI",
    ctaHeading: "Ceritakan hari bahagia anda bersama kami",
    ctaPrimaryPreset: "book_appointment",
    ctaSecondaryPreset: "view_packages",
  };
}
