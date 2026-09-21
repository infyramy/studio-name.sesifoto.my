export type LeadFormEventType = {
  id: string;
  label: string;
};

export type LeadFormSectionKey =
  | "hero"
  | "form-header"
  | "recent-work"
  | "event-types"
  | "submit-footer";

export type LeadFormPageConfig = {
  pageTemplate: "lead-form";
  showHero: boolean;
  heroImageUrl: string;
  brandLabel: string;
  heroHeading: string;
  heroSubtitle: string;
  heroDescription: string;
  showFormHeader: boolean;
  sectionLabel: string;
  formHeading: string;
  priceNote: string;
  priceAmount: string;
  showRecentWork: boolean;
  recentWorkLabel: string;
  recentWorkImages: string[];
  recentWorkCaption: string;
  showEventTypes: boolean;
  eventTypes: LeadFormEventType[];
  showSubmitFooter: boolean;
  submitLabel: string;
  privacyNote: string;
};

export type LeadFormPageConfigInput = Partial<LeadFormPageConfig> &
  Record<string, unknown>;

export type LeadFormSubmitPayload = {
  contactName: string;
  contactPhone: string;
  eventDate?: string;
  eventType?: string;
  serviceInterest: "photo" | "video" | "photo_video";
  venue?: string;
  notes?: string;
  referralCode?: string;
};
