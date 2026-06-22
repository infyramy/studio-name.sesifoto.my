import type { LandingPageTheme, ThemeMode } from "./types";

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

export function createDefaultTheme(): LandingPageTheme {
  return {
    presetName: "Dark Minimal",
    primaryColor: "#ffffff",
    primaryTextColor: "#000000",
    secondaryColor: "#050505",
    secondaryTextColor: "#ffffff",
    mode: "dark",
    titleFont: "Cormorant Garamond",
    bodyFont: "Inter",
    radius: "rounded-2xl",
    showSocials: true,
    showButtons: true,
    showBookNowButton: true,
    showCheckBookingButton: true,
    showCrmInquiryButton: true,
    socialInstagram: "https://instagram.com",
    socialTiktok: "https://tiktok.com",
    socialFacebook: "https://facebook.com",
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
    mainTitle: "Book your Raya photo session in under a minute",
    ssmNumber: "1402334A",
    description:
      "Capture meaningful Raya moments with a professional photography experience.",
    emergencyPhoneType: "custom",
    emergencyCustomPhone: "+60123456789",
    emergencyMethods: "whatsapp",
    emergencyText: "Need help? Contact us",
    heroUrl:
      "https://images.unsplash.com/photo-1500964757637-c85e8a162699?q=80&w=3003&auto=format&fit=crop",
    mapAddress:
      "8B, 1, Jalan Nirwana 1/1, Taman Nirwana, 68000 Ampang Jaya, Selangor",
    galleryImages: [],
    sectionOrder: ["gallery", "testimonials", "maps", "faq", "emergency", "footer"],
    faqs: [],
    seoTitle: "",
    seoDescription: "",
    ogImageUrl: "",
    showTestimonials: false,
    testimonials: [],
    showCustomLinks: false,
    customLinks: [],
  };
}

export type StudioDefaults = {
  name?: string;
  logoUrl?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  address?: string;
  ssm?: string;
  whatsapp?: string;
};
