import type { HomeCtaPresetId } from "../home-marketing/cta-presets";

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

export type AboutSectionKey =
  | "hero"
  | "mission"
  | "values"
  | "process"
  | "testimonial"
  | "cta";

export type AboutPageConfig = {
  pageTemplate: "about-us";
  showHero: boolean;
  sectionLabel: string;
  title: string;
  subtitle: string;
  heroImageUrl: string;
  teamImageUrl: string;
  showMission: boolean;
  missionStatement: string;
  showValues: boolean;
  values: AboutValueProp[];
  showProcess: boolean;
  processLabel: string;
  processSteps: AboutProcessStep[];
  showTestimonial: boolean;
  testimonial: AboutTestimonial;
  showCta: boolean;
  ctaImageUrl: string;
  ctaHeading: string;
  ctaPrimaryPreset: HomeCtaPresetId;
  ctaSecondaryPreset: HomeCtaPresetId;
};

export type AboutPageConfigInput = Partial<AboutPageConfig> &
  Record<string, unknown>;
