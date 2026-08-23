import { safeHttpUrl } from "../useLandingPageStyles";
import { createDefaultServicesConfig } from "./presets";
import type {
  ServicesCategory,
  ServicesPackage,
  ServicesPageConfig,
  ServicesPageConfigInput,
} from "./types";

const MAX_CATEGORIES = 12;
const MAX_PACKAGES_PER_CATEGORY = 12;
const MAX_LABEL = 80;
const MAX_TITLE = 120;
const MAX_PRICE = 40;
const MAX_TEXT = 500;

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

function normalizePackages(input: unknown): ServicesPackage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): ServicesPackage | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const title = trim(item.title, MAX_TITLE);
      const imageUrl = safeHttpUrl(item.imageUrl) ?? "";
      if (!title || !imageUrl) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `pkg-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id,
        imageUrl,
        title,
        price: trim(item.price, MAX_PRICE),
        detailLabel: trim(item.detailLabel, MAX_LABEL) || "Pilih",
        detailUrl: safeNavUrl(item.detailUrl) || "/check-booking",
      };
    })
    .filter((p): p is ServicesPackage => p !== null)
    .slice(0, MAX_PACKAGES_PER_CATEGORY);
}

function normalizeCategories(input: unknown): ServicesCategory[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): ServicesCategory | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const label = trim(item.label, MAX_LABEL);
      if (!label) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim().slice(0, 40)
          : `cat-${Math.random().toString(36).slice(2, 9)}`;
      const columns = item.columns === 2 ? 2 : 3;
      const packages = normalizePackages(item.packages);
      return { id, label, columns, packages };
    })
    .filter((c): c is ServicesCategory => c !== null && c.packages.length > 0)
    .slice(0, MAX_CATEGORIES);
}

export function normalizeServicesConfig(
  saved: ServicesPageConfigInput | null | undefined,
): ServicesPageConfig {
  const defaults = createDefaultServicesConfig();
  const raw = saved && typeof saved === "object" ? saved : {};

  const categories = normalizeCategories(raw.categories);

  return {
    ...defaults,
    ...raw,
    pageTemplate: "services",
    sectionLabel: trim(raw.sectionLabel, MAX_LABEL) || defaults.sectionLabel,
    title: trim(raw.title, MAX_TITLE) || defaults.title,
    categories: categories.length > 0 ? categories : defaults.categories,
    showCta: typeof raw.showCta === "boolean" ? raw.showCta : defaults.showCta,
    ctaImageUrl: safeHttpUrl(raw.ctaImageUrl) ?? defaults.ctaImageUrl,
    ctaHeading: trim(raw.ctaHeading, MAX_TEXT) || defaults.ctaHeading,
    ctaPrimaryLabel:
      trim(raw.ctaPrimaryLabel, MAX_LABEL) || defaults.ctaPrimaryLabel,
    ctaPrimaryUrl: safeNavUrl(raw.ctaPrimaryUrl) || defaults.ctaPrimaryUrl,
  };
}

export function isServicesConfig(
  config: Record<string, unknown> | null | undefined,
): boolean {
  return config?.pageTemplate === "services";
}
