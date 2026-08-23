import type { LeadFormEventType, LeadFormPageConfig } from "./types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop";
const WORK_A =
  "https://images.unsplash.com/photo-1465495976277-4387d1b1b0ac?q=80&w=600&auto=format&fit=crop";
const WORK_B =
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop";

export const DEFAULT_LEAD_FORM_EVENT_TYPES: LeadFormEventType[] = [
  { id: "wedding", label: "Perkahwinan" },
  { id: "engagement", label: "Pertunangan" },
  { id: "pre_wedding", label: "Pra-perkahwinan" },
  { id: "birthday", label: "Hari jadi" },
  { id: "corporate", label: "Korporat" },
  { id: "other", label: "Lain-lain" },
];

export function createDefaultLeadFormConfig(): LeadFormPageConfig {
  return {
    pageTemplate: "lead-form",
    heroImageUrl: HERO_IMAGE,
    brandLabel: "STUDIO",
    heroHeading: "Ceritakan tentang hari anda",
    heroSubtitle:
      "Nota ringkas — kami akan balas melalui WhatsApp, biasanya dalam sehari.",
    heroDescription:
      "Kami percaya setiap detik berharga. Sejak 2019, kami merakam detik-detik indah pasangan di seluruh Malaysia.",
    sectionLabel: "PERTANYAAN",
    formHeading: "Ceritakan tentang hari anda",
    priceNote: "Pakej bermula",
    priceAmount: "RM 900",
    showRecentWork: true,
    recentWorkLabel: "KERJA TERKINI",
    recentWorkImages: [WORK_A, WORK_B],
    recentWorkCaption: "Ketik foto untuk lihat galeri penuh",
    eventTypes: DEFAULT_LEAD_FORM_EVENT_TYPES.map((t) => ({ ...t })),
    submitLabel: "Hantar pertanyaan →",
    privacyNote: "Kami hanya guna ini untuk membalas pertanyaan anda.",
    showPoweredBy: true,
    poweredByLabel: "DIKUASAKI OLEH SESIFOTO",
  };
}
