import { safeHttpUrl } from "../useLandingPageStyles";
import { createDefaultAboutConfig } from "./presets";
import type {
  AboutPageConfig,
  AboutPageConfigInput,
  AboutProcessStep,
  AboutTestimonial,
  AboutValueProp,
} from "./types";

const MAX_TEXT = 500;
const MAX_LABEL = 120;
const MAX_SHORT = 80;

function trim(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function safeNavUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 500);
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return safeHttpUrl(trimmed) ?? "";
}

function normalizeValues(input: unknown): AboutValueProp[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): AboutValueProp | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const title = trim(item.title, MAX_LABEL);
      if (!title) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `val-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id,
        title,
        description: trim(item.description, MAX_TEXT),
      };
    })
    .filter((v): v is AboutValueProp => v !== null)
    .slice(0, 6);
}

function normalizeSteps(input: unknown): AboutProcessStep[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): AboutProcessStep | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const title = trim(item.title, MAX_LABEL);
      if (!title) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `step-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id,
        number: trim(item.number, 8) || "01",
        title,
        description: trim(item.description, MAX_TEXT),
      };
    })
    .filter((s): s is AboutProcessStep => s !== null)
    .slice(0, 8);
}

function normalizeTestimonial(input: unknown): AboutTestimonial {
  const defaults = createDefaultAboutConfig().testimonial;
  if (!input || typeof input !== "object") return { ...defaults };
  const item = input as Record<string, unknown>;
  const imageUrl = safeHttpUrl(item.imageUrl) ?? defaults.imageUrl;
  return {
    imageUrl,
    quote: trim(item.quote, MAX_TEXT) || defaults.quote,
    attribution: trim(item.attribution, MAX_LABEL) || defaults.attribution,
  };
}

export function isAboutConfig(
  config: Record<string, unknown> | null | undefined,
): boolean {
  return config?.pageTemplate === "about-us";
}

export function normalizeAboutConfig(
  input: AboutPageConfigInput | null | undefined,
): AboutPageConfig {
  const defaults = createDefaultAboutConfig();
  const src = input ?? {};
  const values = normalizeValues(src.values);
  const processSteps = normalizeSteps(src.processSteps);

  return {
    pageTemplate: "about-us",
    sectionLabel: trim(src.sectionLabel, MAX_SHORT) || defaults.sectionLabel,
    title: trim(src.title, MAX_TEXT) || defaults.title,
    subtitle: trim(src.subtitle, MAX_TEXT) || defaults.subtitle,
    heroImageUrl: safeHttpUrl(src.heroImageUrl) ?? defaults.heroImageUrl,
    teamImageUrl: safeHttpUrl(src.teamImageUrl) ?? defaults.teamImageUrl,
    missionStatement:
      trim(src.missionStatement, MAX_TEXT) || defaults.missionStatement,
    values: values.length > 0 ? values : defaults.values.map((v) => ({ ...v })),
    processLabel: trim(src.processLabel, MAX_LABEL) || defaults.processLabel,
    processSteps:
      processSteps.length > 0
        ? processSteps
        : defaults.processSteps.map((s) => ({ ...s })),
    showTestimonial:
      typeof src.showTestimonial === "boolean"
        ? src.showTestimonial
        : defaults.showTestimonial,
    testimonial: normalizeTestimonial(src.testimonial),
    showCta: typeof src.showCta === "boolean" ? src.showCta : defaults.showCta,
    ctaImageUrl: safeHttpUrl(src.ctaImageUrl) ?? defaults.ctaImageUrl,
    ctaHeading: trim(src.ctaHeading, MAX_TEXT) || defaults.ctaHeading,
    ctaPrimaryLabel:
      trim(src.ctaPrimaryLabel, MAX_SHORT) || defaults.ctaPrimaryLabel,
    ctaPrimaryUrl: safeNavUrl(src.ctaPrimaryUrl) || defaults.ctaPrimaryUrl,
    ctaSecondaryLabel:
      trim(src.ctaSecondaryLabel, MAX_SHORT) || defaults.ctaSecondaryLabel,
    ctaSecondaryUrl:
      safeNavUrl(src.ctaSecondaryUrl) || defaults.ctaSecondaryUrl,
  };
}
