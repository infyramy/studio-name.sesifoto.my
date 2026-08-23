export type LeadFormEventType = {
  id: string;
  label: string;
};

export type LeadFormPageConfig = {
  pageTemplate: "lead-form";
  heroImageUrl: string;
  brandLabel: string;
  heroHeading: string;
  heroSubtitle: string;
  heroDescription: string;
  sectionLabel: string;
  formHeading: string;
  priceNote: string;
  priceAmount: string;
  showRecentWork: boolean;
  recentWorkLabel: string;
  recentWorkImages: string[];
  recentWorkCaption: string;
  eventTypes: LeadFormEventType[];
  submitLabel: string;
  privacyNote: string;
  showPoweredBy: boolean;
  poweredByLabel: string;
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
};
