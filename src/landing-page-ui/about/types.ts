export type AboutValueProp = {
  id: string;
  title: string;
  description: string;
};

export type AboutProcessStep = {
  id: string;
  number: string;
  title: string;
  description: string;
};

export type AboutTestimonial = {
  imageUrl: string;
  quote: string;
  attribution: string;
};

export type AboutPageConfig = {
  pageTemplate: "about-us";
  sectionLabel: string;
  title: string;
  subtitle: string;
  heroImageUrl: string;
  teamImageUrl: string;
  missionStatement: string;
  values: AboutValueProp[];
  processLabel: string;
  processSteps: AboutProcessStep[];
  showTestimonial: boolean;
  testimonial: AboutTestimonial;
  showCta: boolean;
  ctaImageUrl: string;
  ctaHeading: string;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
};

export type AboutPageConfigInput = Partial<AboutPageConfig> &
  Record<string, unknown>;
