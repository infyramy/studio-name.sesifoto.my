import type { FaqItem, LandingPageTheme, SiteNavLink, ThemeMode } from "./types";
import { createDefaultHomeMarketingContent } from "./home-marketing/presets";

export const DEFAULT_HOME_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "How far in advance should we book?",
    answer:
      "We recommend booking 6–12 months before your wedding date, especially for peak season weekends.",
  },
  {
    id: "faq-2",
    question: "Do you travel outside Kuala Lumpur?",
    answer:
      "Yes. We cover weddings across Malaysia. Travel fees may apply depending on location.",
  },
  {
    id: "faq-3",
    question: "When will we receive our photos and video?",
    answer:
      "Preview galleries are typically ready within 4–6 weeks. Full delivery timelines depend on your package.",
  },
];

export const COLOR_PRESETS = [
  {
    name: "Dark Rustic",
    label: "Dark Rustic (Glassmorphism)",
    primaryColor: "#ffffff",
    primaryTextColor: "#000000",
    secondaryColor: "#050505",
    secondaryTextColor: "#ffffff",
    mode: "dark-glass" as ThemeMode,
  },
  {
    name: "Dark Minimal",
    label: "Dark Minimal (White & Black)",
    primaryColor: "#ffffff",
    primaryTextColor: "#000000",
    secondaryColor: "#050505",
    secondaryTextColor: "#ffffff",
    mode: "dark" as ThemeMode,
  },
  {
    name: "Light Minimal",
    label: "Light Minimal (Black & White)",
    primaryColor: "#000000",
    primaryTextColor: "#ffffff",
    secondaryColor: "#f8f9fa",
    secondaryTextColor: "#000000",
    mode: "light" as ThemeMode,
  },
  {
    name: "Midnight Blue",
    label: "Midnight Blue (Light Blue & Dark Blue)",
    primaryColor: "#38bdf8",
    primaryTextColor: "#0f172a",
    secondaryColor: "#0f172a",
    secondaryTextColor: "#f8fafc",
    mode: "dark" as ThemeMode,
  },
  {
    name: "Ocean Blue",
    label: "Ocean Blue (Blue & Light Blue)",
    primaryColor: "#0ea5e9",
    primaryTextColor: "#ffffff",
    secondaryColor: "#e0f2fe",
    secondaryTextColor: "#0c4a6e",
    mode: "light" as ThemeMode,
  },
  {
    name: "Crimson Red",
    label: "Crimson Red (Light Red & Dark Red)",
    primaryColor: "#fca5a5",
    primaryTextColor: "#450a0a",
    secondaryColor: "#450a0a",
    secondaryTextColor: "#fef2f2",
    mode: "dark" as ThemeMode,
  },
  {
    name: "Rose Light",
    label: "Rose Light (Red & Light Pink)",
    primaryColor: "#e11d48",
    primaryTextColor: "#ffffff",
    secondaryColor: "#ffe4e6",
    secondaryTextColor: "#881337",
    mode: "light" as ThemeMode,
  },
  {
    name: "Forest Green",
    label: "Forest Green (Light Green & Dark Green)",
    primaryColor: "#6ee7b7",
    primaryTextColor: "#064e3b",
    secondaryColor: "#064e3b",
    secondaryTextColor: "#ecfdf5",
    mode: "dark" as ThemeMode,
  },
  {
    name: "Mint Light",
    label: "Mint Light (Green & Light Mint)",
    primaryColor: "#059669",
    primaryTextColor: "#ffffff",
    secondaryColor: "#d1fae5",
    secondaryTextColor: "#064e3b",
    mode: "light" as ThemeMode,
  },
  {
    name: "Chocolate Brown",
    label: "Chocolate Brown (Orange & Dark Brown)",
    primaryColor: "#fdba74",
    primaryTextColor: "#431407",
    secondaryColor: "#431407",
    secondaryTextColor: "#fff7ed",
    mode: "dark" as ThemeMode,
  },
  {
    name: "Sand Light",
    label: "Sand Light (Orange & Light Sand)",
    primaryColor: "#c2410c",
    primaryTextColor: "#ffffff",
    secondaryColor: "#ffedd5",
    secondaryTextColor: "#431407",
    mode: "light" as ThemeMode,
  },
  {
    name: "Royal Purple",
    label: "Royal Purple (Light Purple & Dark Purple)",
    primaryColor: "#d8b4fe",
    primaryTextColor: "#3b0764",
    secondaryColor: "#3b0764",
    secondaryTextColor: "#faf5ff",
    mode: "dark" as ThemeMode,
  },
  {
    name: "Lavender Light",
    label: "Lavender Light (Purple & Light Lavender)",
    primaryColor: "#9333ea",
    primaryTextColor: "#ffffff",
    secondaryColor: "#f3e8ff",
    secondaryTextColor: "#3b0764",
    mode: "light" as ThemeMode,
  },
] as const;

export const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Playfair Display",
  "Space Grotesk",
  "Outfit",
  "Montserrat",
  "Merriweather",
  "Cinzel",
  "Cormorant Garamond",
] as const;

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function createDefaultSiteNav(): {
  siteNavLeft: SiteNavLink[];
  siteNavRight: SiteNavLink[];
  footerNav: SiteNavLink[];
} {
  return {
    siteNavLeft: [
      { id: "nav-about", label: "Tentang Kami", url: "/about-us" },
      { id: "nav-portfolio", label: "Portfolio", url: "/portfolio" },
      { id: "nav-packages", label: "Pakej", url: "/services" },
    ],
    siteNavRight: [
      { id: "nav-contact", label: "Hubungi Kami", url: "/lead-form" },
      { id: "nav-faq", label: "Soalan Lazim", url: "/#faq" },
    ],
    footerNav: [
      { id: "footer-about", label: "Tentang Kami", url: "/about-us" },
      { id: "footer-portfolio", label: "Portfolio", url: "/portfolio" },
      { id: "footer-packages", label: "Pakej", url: "/services" },
      { id: "footer-contact", label: "Hubungi Kami", url: "/lead-form" },
      { id: "footer-faq", label: "Soalan Lazim", url: "/#faq" },
    ],
  };
}

export function createDefaultTheme(): LandingPageTheme {
  const siteNav = createDefaultSiteNav();
  const marketing = createDefaultHomeMarketingContent();
  return {
    presetName: "Sand Light",
    primaryColor: "#1a1a1a",
    primaryTextColor: "#ffffff",
    secondaryColor: "#f5f2eb",
    secondaryTextColor: "#1a1a1a",
    mode: "light",
    titleFont: "Cormorant Garamond",
    bodyFont: "Inter",
    radius: "rounded-none",
    showSocials: true,
    showButtons: true,
    showBookNowButton: true,
    showCheckBookingButton: true,
    showCrmInquiryButton: true,
    socialInstagram: "https://instagram.com",
    socialTiktok: "https://tiktok.com",
    socialFacebook: "https://facebook.com",
    socialPinterest: "",
    socialThreads: "",
    socialWebsite: "https://sesifoto.my",
    showGallery: true,
    showMaps: true,
    showFaq: true,
    showEmergency: true,
    showFooter: true,
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4LrfZrIU_TSCVQRbm7mx1JHv8KfGe6-d3aQ&s",
    logoStyle: "square",
    studioName: "Sesifoto Studio",
    mainTitle: marketing.heroTagline,
    ssmNumber: "1402334A",
    description: marketing.heroSubtitle,
    emergencyPhoneType: "custom",
    emergencyCustomPhone: "+60123456789",
    emergencyMethods: "whatsapp",
    emergencyText: "Need help? Contact us",
    heroUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
    mapAddress:
      "8B, 1, Jalan Nirwana 1/1, Taman Nirwana, 68000 Ampang Jaya, Selangor",
    mapsLink: "",
    contactEmail: "",
    galleryImages: [],
    sectionOrder: ["gallery", "testimonials", "maps", "faq", "emergency", "footer"],
    faqs: DEFAULT_HOME_FAQS.map((f) => ({ ...f })),
    seoTitle: "",
    seoDescription: "",
    ogImageUrl: "",
    showTestimonials: false,
    testimonials: [],
    showCustomLinks: false,
    customLinks: [],
    ...siteNav,
    footerCopyright: "© Sesifoto Studio. All rights reserved.",
    showLanguageSwitcher: true,
    ...marketing,
  };
}

export type StudioDefaults = {
  name?: string;
  logoUrl?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  pinterest?: string;
  threads?: string;
  address?: string;
  mapsLink?: string;
  ssm?: string;
  whatsapp?: string;
  description?: string;
};
