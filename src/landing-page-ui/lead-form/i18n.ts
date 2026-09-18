import type { StudioLanguage } from "../types";
import type { LeadFormValidationMessages } from "./validate";

export const LEAD_FORM_I18N = {
  en: {
    nameLabel: "Your name *",
    namePlaceholder: "e.g. Aisyah",
    whatsappLabel: "WhatsApp number *",
    whatsappPlaceholder: "e.g. 012-345 6789",
    eventDateLabel: "Event date",
    eventDatePlaceholder: "Pick a date",
    eventTypeLabel: "Event type *",
    eventTypePlaceholder: "Select event type",
    eventDateHint: "No date yet? Leave blank — we'll sort it out together later.",
    serviceLabel: "What are you looking for? *",
    photo: "Photo",
    video: "Video",
    both: "Both",
    locationLabel: "Event location",
    locationPlaceholder: "City or venue",
    notesLabel: "Anything else? (optional)",
    notesPlaceholder: "Tell us a little about your plans...",
    submitSuccess: "Inquiry sent! We'll get back to you soon.",
    submitError: "Failed to send. Please try again.",
    previewOnly: "Preview only — form not submitted.",
    crmRequired: "Inquiry form is not available right now.",
    sending: "Sending...",
    clearDate: "Clear date",
    nameRequired: "Please enter your name.",
    nameTooShort: "Name must be at least 2 characters.",
    phoneRequired: "Please enter your WhatsApp number.",
    phoneInvalid: "Enter a valid WhatsApp number (8–11 digits).",
    eventTypeRequired: "Please select an event type.",
    eventDateInvalid: "Please pick a valid date.",
    eventDatePast: "Event date cannot be in the past.",
    serviceRequired: "Please choose photo, video, or both.",
  },
  bm: {
    nameLabel: "Nama anda *",
    namePlaceholder: "cth. Aisyah",
    whatsappLabel: "Nombor WhatsApp *",
    whatsappPlaceholder: "cth. 012-345 6789",
    eventDateLabel: "Tarikh majlis",
    eventDatePlaceholder: "Pilih tarikh",
    eventTypeLabel: "Jenis majlis *",
    eventTypePlaceholder: "Pilih jenis majlis",
    eventDateHint:
      "Belum ada tarikh? Biarkan kosong — kita uruskan bersama nanti.",
    serviceLabel: "Apa yang anda cari? *",
    photo: "Foto",
    video: "Video",
    both: "Kedua-duanya",
    locationLabel: "Lokasi majlis",
    locationPlaceholder: "Bandar atau lokasi",
    notesLabel: "Apa-apa lagi? (pilihan)",
    notesPlaceholder: "Ceritakan sedikit tentang rancangan anda...",
    submitSuccess: "Pertanyaan dihantar! Kami akan hubungi anda.",
    submitError: "Gagal menghantar. Sila cuba lagi.",
    previewOnly: "Pratonton sahaja — borang tidak dihantar.",
    crmRequired: "Borang pertanyaan tidak tersedia buat masa ini.",
    sending: "Menghantar...",
    clearDate: "Padam tarikh",
    nameRequired: "Sila masukkan nama anda.",
    nameTooShort: "Nama mestilah sekurang-kurangnya 2 aksara.",
    phoneRequired: "Sila masukkan nombor WhatsApp.",
    phoneInvalid: "Masukkan nombor WhatsApp yang sah (8–11 digit).",
    eventTypeRequired: "Sila pilih jenis majlis.",
    eventDateInvalid: "Sila pilih tarikh yang sah.",
    eventDatePast: "Tarikh majlis tidak boleh pada masa lalu.",
    serviceRequired: "Sila pilih foto, video, atau kedua-duanya.",
  },
} as const;

export function leadFormT(lang: StudioLanguage) {
  return LEAD_FORM_I18N[lang] ?? LEAD_FORM_I18N.bm;
}

export function leadFormValidationMessages(
  lang: StudioLanguage,
): LeadFormValidationMessages {
  const t = leadFormT(lang);
  return {
    nameRequired: t.nameRequired,
    nameTooShort: t.nameTooShort,
    phoneRequired: t.phoneRequired,
    phoneInvalid: t.phoneInvalid,
    eventTypeRequired: t.eventTypeRequired,
    eventDateInvalid: t.eventDateInvalid,
    eventDatePast: t.eventDatePast,
    serviceRequired: t.serviceRequired,
  };
}
