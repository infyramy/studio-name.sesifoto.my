import type {
  AboutPageConfig,
  AboutProcessStep,
  AboutTestimonial,
  AboutValueProp,
} from "./types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1493863641943-9b64192e4c60?q=80&w=1200&auto=format&fit=crop";
const TEAM_IMG =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop";
const TESTIMONIAL_IMG =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";
const CTA_IMG =
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop";

export const DEFAULT_ABOUT_VALUES: AboutValueProp[] = [
  {
    id: "val-1",
    title: "Candid & unposed",
    description:
      "Kami rakam detik semula jadi — bukan pose kaku. Anda boleh enjoy hari tanpa risau kamera.",
  },
  {
    id: "val-2",
    title: "Fast delivery",
    description:
      "Album preview dalam beberapa minggu. Kami faham anda tak sabar nak share.",
  },
  {
    id: "val-3",
    title: "Relaxed & easy",
    description:
      "Proses ringkas dari pertanyaan hingga penyerahan. Kami bimbing anda langkah demi langkah.",
  },
];

export const DEFAULT_ABOUT_PROCESS: AboutProcessStep[] = [
  {
    id: "step-1",
    number: "01",
    title: "Hantar pertanyaan",
    description: "Isi borang atau WhatsApp kami.",
  },
  {
    id: "step-2",
    number: "02",
    title: "Semak & jumpa",
    description: "Bincang pakej dan tarikh.",
  },
  {
    id: "step-3",
    number: "03",
    title: "Portal klien anda",
    description: "Urus butiran dalam satu tempat.",
  },
  {
    id: "step-4",
    number: "04",
    title: "Hari penggambaran",
    description: "Kami ada untuk setiap detik.",
  },
  {
    id: "step-5",
    number: "05",
    title: "Penyerahan",
    description: "Foto & video sampai ke tangan anda.",
  },
];

export const DEFAULT_ABOUT_TESTIMONIAL: AboutTestimonial = {
  imageUrl: TESTIMONIAL_IMG,
  quote:
    "Thank you for being the best photographer during our wedding. Lots of candid moments instead of stiff posed shots.",
  attribution: "RAIHAN & AZZAT — TERENGGANU / KUALA LUMPUR",
};

export function createDefaultAboutConfig(): AboutPageConfig {
  return {
    pageTemplate: "about-us",
    sectionLabel: "TENTANG KAMI",
    title: "Where it all starts",
    subtitle: "Photographer and Videographer Group",
    heroImageUrl: HERO_IMG,
    teamImageUrl: TEAM_IMG,
    missionStatement:
      "Tulipsfilm consist of passionate photographer and videographer in which their goals is to capture every moment for yours truly to relive the memories since 2019.",
    values: DEFAULT_ABOUT_VALUES.map((v) => ({ ...v })),
    processLabel: "Cara kami bekerja",
    processSteps: DEFAULT_ABOUT_PROCESS.map((s) => ({ ...s })),
    showTestimonial: true,
    testimonial: { ...DEFAULT_ABOUT_TESTIMONIAL },
    showCta: true,
    ctaImageUrl: CTA_IMG,
    ctaHeading: "Ceritakan hari bahagia anda bersama kami",
    ctaPrimaryLabel: "HUBUNGI KAMI SEKARANG →",
    ctaPrimaryUrl: "/lead-form",
    ctaSecondaryLabel: "Lihat Pakej →",
    ctaSecondaryUrl: "/services",
  };
}
