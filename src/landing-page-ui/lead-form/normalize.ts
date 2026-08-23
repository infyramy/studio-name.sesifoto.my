import { safeHttpUrl } from "../useLandingPageStyles";
import { createDefaultLeadFormConfig } from "./presets";
import type {
  LeadFormEventType,
  LeadFormPageConfig,
  LeadFormPageConfigInput,
} from "./types";

const MAX_TEXT = 500;
const MAX_LABEL = 120;
const MAX_SHORT = 80;
const MAX_EVENT_TYPES = 12;
const MAX_RECENT_IMAGES = 8;

function trim(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizeEventTypes(input: unknown): LeadFormEventType[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): LeadFormEventType | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const label = trim(item.label, MAX_LABEL);
      if (!label) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim().slice(0, 40)
          : `evt-${Math.random().toString(36).slice(2, 9)}`;
      return { id, label };
    })
    .filter((t): t is LeadFormEventType => t !== null)
    .slice(0, MAX_EVENT_TYPES);
}

function normalizeRecentImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((url) => safeHttpUrl(url) ?? "")
    .filter(Boolean)
    .slice(0, MAX_RECENT_IMAGES);
}

export function isLeadFormConfig(
  config: Record<string, unknown> | null | undefined,
): boolean {
  return config?.pageTemplate === "lead-form";
}

export function normalizeLeadFormConfig(
  input: LeadFormPageConfigInput | null | undefined,
): LeadFormPageConfig {
  const defaults = createDefaultLeadFormConfig();
  const src = input ?? {};

  const eventTypes = normalizeEventTypes(src.eventTypes);
  const heroImageUrl = safeHttpUrl(src.heroImageUrl) ?? defaults.heroImageUrl;

  return {
    pageTemplate: "lead-form",
    heroImageUrl,
    brandLabel: trim(src.brandLabel, MAX_SHORT) || defaults.brandLabel,
    heroHeading: trim(src.heroHeading, MAX_TEXT) || defaults.heroHeading,
    heroSubtitle: trim(src.heroSubtitle, MAX_TEXT) || defaults.heroSubtitle,
    heroDescription:
      trim(src.heroDescription, MAX_TEXT) || defaults.heroDescription,
    sectionLabel: trim(src.sectionLabel, MAX_SHORT) || defaults.sectionLabel,
    formHeading: trim(src.formHeading, MAX_TEXT) || defaults.formHeading,
    priceNote: trim(src.priceNote, MAX_SHORT) || defaults.priceNote,
    priceAmount: trim(src.priceAmount, MAX_SHORT) || defaults.priceAmount,
    showRecentWork:
      typeof src.showRecentWork === "boolean"
        ? src.showRecentWork
        : defaults.showRecentWork,
    recentWorkLabel:
      trim(src.recentWorkLabel, MAX_SHORT) || defaults.recentWorkLabel,
    recentWorkImages:
      normalizeRecentImages(src.recentWorkImages).length > 0
        ? normalizeRecentImages(src.recentWorkImages)
        : defaults.recentWorkImages,
    recentWorkCaption:
      trim(src.recentWorkCaption, MAX_TEXT) || defaults.recentWorkCaption,
    eventTypes:
      eventTypes.length > 0 ? eventTypes : defaults.eventTypes.map((t) => ({ ...t })),
    submitLabel: trim(src.submitLabel, MAX_SHORT) || defaults.submitLabel,
    privacyNote: trim(src.privacyNote, MAX_TEXT) || defaults.privacyNote,
    showPoweredBy:
      typeof src.showPoweredBy === "boolean"
        ? src.showPoweredBy
        : defaults.showPoweredBy,
    poweredByLabel:
      trim(src.poweredByLabel, MAX_SHORT) || defaults.poweredByLabel,
  };
}
