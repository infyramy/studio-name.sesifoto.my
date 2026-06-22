export type ThemeMode = "dark" | "light" | "dark-glass";
export type EmergencyMethods = "both" | "whatsapp" | "call";
export type EmergencyPhoneType = "system" | "custom";
export type LogoStyle = "transparent" | "circle" | "square";
export type StudioLanguage = "en" | "bm";

export type FaqItem = { id: string; question: string; answer: string };

export type TestimonialItem = {
  id: string;
  quote: string;
  author: string;
  subtitle?: string;
};

export type CustomLinkItem = {
  id: string;
  label: string;
  url: string;
};

export const SECTION_KEYS = [
  "gallery",
  "testimonials",
  "maps",
  "faq",
  "emergency",
  "footer",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export type LandingPageTheme = {
  presetName: string;
  primaryColor: string;
  primaryTextColor: string;
  secondaryColor: string;
  secondaryTextColor: string;
  mode: ThemeMode;
  titleFont: string;
  bodyFont: string;
  radius: "rounded-none" | "rounded-2xl" | "rounded-full";
  showSocials: boolean;
  showButtons: boolean;
  showBookNowButton: boolean;
  showCheckBookingButton: boolean;
  showCrmInquiryButton: boolean;
  socialInstagram: string;
  socialTiktok: string;
  socialFacebook: string;
  socialWebsite: string;
  showGallery: boolean;
  showMaps: boolean;
  showFaq: boolean;
  showEmergency: boolean;
  showFooter: boolean;
  logoUrl: string;
  logoStyle: LogoStyle;
  studioName: string;
  mainTitle: string;
  ssmNumber: string;
  description: string;
  emergencyPhoneType: EmergencyPhoneType;
  emergencyCustomPhone: string;
  emergencyMethods: EmergencyMethods;
  emergencyText: string;
  heroUrl: string;
  mapAddress: string;
  galleryImages: string[];
  sectionOrder: SectionKey[];
  faqs: FaqItem[];
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  showTestimonials: boolean;
  testimonials: TestimonialItem[];
  showCustomLinks: boolean;
  customLinks: CustomLinkItem[];
};

export type LandingPageConfig = Partial<LandingPageTheme> & Record<string, unknown>;

export type LandingPageType = "studio_booking" | "crm_inquiry" | "general";

export type ProductEntitlements = {
  studio: boolean;
  crm: boolean;
};

export interface LandingPagePublicDto {
  id: string;
  slug: string;
  title: string;
  type: LandingPageType;
  config: LandingPageConfig;
  isDefault: boolean;
  products: ProductEntitlements;
}

export interface LandingPage {
  id: string;
  studioId: string;
  slug: string;
  title: string;
  type: LandingPageType;
  config: LandingPageConfig;
  isPublished: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
