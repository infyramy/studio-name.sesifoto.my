import type { PortfolioCategory, PortfolioItem, PortfolioPageConfig } from "./types";

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";

export const DEFAULT_PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { id: "all", label: "ALL" },
  { id: "wedding", label: "WEDDING" },
  { id: "engagement", label: "ENGAGEMENT" },
  { id: "others", label: "OTHERS" },
];

export const DEFAULT_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "item-1",
    imageUrl: SAMPLE_IMAGE,
    title: "SYAHIR & SYAZWANI",
    subtitle: "25 JUN 2025, IPH, JOHOR",
    categoryId: "wedding",
  },
  {
    id: "item-2",
    imageUrl:
      "https://images.unsplash.com/photo-1465495976277-4387d1b1b0ac?q=80&w=800&auto=format&fit=crop",
    title: "AMIR & AISYAH",
    subtitle: "12 MAY 2025, KL",
    categoryId: "wedding",
  },
  {
    id: "item-3",
    imageUrl:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop",
    title: "HAKIM & NURUL",
    subtitle: "3 APR 2025, PENANG",
    categoryId: "engagement",
  },
  {
    id: "item-4",
    imageUrl:
      "https://images.unsplash.com/photo-1520854221256-1748513aa6a8?q=80&w=800&auto=format&fit=crop",
    title: "FAIZ & LINA",
    subtitle: "18 MAR 2025, MELAKA",
    categoryId: "wedding",
  },
  {
    id: "item-5",
    imageUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
    title: "ZAIN & MIRA",
    subtitle: "9 FEB 2025, SELANGOR",
    categoryId: "others",
  },
  {
    id: "item-6",
    imageUrl:
      "https://images.unsplash.com/photo-1606216794074-735e2aa6c74c?q=80&w=800&auto=format&fit=crop",
    title: "IRFAN & SOFEA",
    subtitle: "22 JAN 2025, PERAK",
    categoryId: "engagement",
  },
];

export function createDefaultPortfolioConfig(): PortfolioPageConfig {
  return {
    pageTemplate: "portfolio",
    sectionLabel: "PORTFOLIO",
    title: "Wedding Gallery",
    subtitle: "Here are our recent works from past client",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop",
    categories: DEFAULT_PORTFOLIO_CATEGORIES.map((c) => ({ ...c })),
    items: DEFAULT_PORTFOLIO_ITEMS.map((i) => ({ ...i })),
    showCta: true,
    ctaImageUrl:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
    ctaSectionLabel: "HUBUNGI KAMI",
    ctaHeading: "Ceritakan hari bahagia anda bersama kami",
    ctaPrimaryLabel: "SEMAK KEKOSONGAN",
    ctaPrimaryUrl: "/check-booking",
    ctaSecondaryLabel: "LIHAT PAKEJ",
    ctaSecondaryUrl: "/services",
  };
}
