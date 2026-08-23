import type { StudioLanguage } from "../types";

export const LEAD_FORM_I18N = {
  en: {
    nameLabel: "YOUR NAME *",
    namePlaceholder: "e.g. Aisyah",
    whatsappLabel: "WHATSAPP NUMBER *",
    whatsappPlaceholder: "e.g. 012-345 6789",
    eventDateLabel: "EVENT DATE",
    eventTypeLabel: "EVENT TYPE",
    eventDateHint: "No date yet? Leave blank — we'll sort it out together later.",
    serviceLabel: "WHAT ARE YOU LOOKING FOR?",
    photo: "Photo",
    video: "Video",
    both: "Both",
    locationLabel: "EVENT LOCATION",
    locationPlaceholder: "City or venue",
    notesLabel: "ANYTHING ELSE? (OPTIONAL)",
    notesPlaceholder: "Tell us a little about your plans...",
    submitSuccess: "Inquiry sent! We'll get back to you soon.",
    submitError: "Failed to send. Please try again.",
    previewOnly: "Preview only — form not submitted.",
    crmRequired: "Inquiry form is not available right now.",
    sending: "Sending...",
  },
  bm: {
    nameLabel: "NAMA ANDA *",
    namePlaceholder: "cth. Aisyah",
    whatsappLabel: "NOMBOR WHATSAPP *",
    whatsappPlaceholder: "cth. 012-345 6789",
    eventDateLabel: "TARIKH MAJLIS",
    eventTypeLabel: "JENIS MAJLIS",
    eventDateHint:
      "Belum ada tarikh? Biarkan kosong — kita uruskan bersama nanti.",
    serviceLabel: "APA YANG ANDA CARI?",
    photo: "Foto",
    video: "Video",
    both: "Kedua-duan...",
    locationLabel: "LOKASI MAJLIS",
    locationPlaceholder: "Bandar atau lokasi",
    notesLabel: "APA-APA LAGI? (PILIHAN)",
    notesPlaceholder: "Ceritakan sedikit tentang rancangan anda...",
    submitSuccess: "Pertanyaan dihantar! Kami akan hubungi anda.",
    submitError: "Gagal menghantar. Sila cuba lagi.",
    previewOnly: "Pratonton sahaja — borang tidak dihantar.",
    crmRequired: "Borang pertanyaan tidak tersedia buat masa ini.",
    sending: "Menghantar...",
  },
} as const;

export function leadFormT(lang: StudioLanguage) {
  return LEAD_FORM_I18N[lang] ?? LEAD_FORM_I18N.bm;
}
