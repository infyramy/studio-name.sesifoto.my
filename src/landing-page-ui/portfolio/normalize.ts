import { safeHttpUrl } from "../useLandingPageStyles";
import { createDefaultPortfolioConfig } from "./presets";
import type {
  PortfolioCategory,
  PortfolioItem,
  PortfolioPageConfig,
  PortfolioPageConfigInput,
} from "./types";

const MAX_CATEGORIES = 12;
const MAX_ITEMS = 48;
const MAX_LABEL = 80;
const MAX_TITLE = 120;
const MAX_SUBTITLE = 120;
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

function normalizeCategories(input: unknown): PortfolioCategory[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row): PortfolioCategory | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const label = trim(item.label, MAX_LABEL);
      if (!label) return null;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim().slice(0, 40)
          : `cat-${Math.random().toString(36).slice(2, 9)}`;
      return { id, label };
    })
    .filter((c): c is PortfolioCategory => c !== null)
    .slice(0, MAX_CATEGORIES);
}

function normalizeItems(
  input: unknown,
  categories: PortfolioCategory[],
): PortfolioItem[] {
  const validCategoryIds = new Set(categories.map((c) => c.id));
  const fallbackCategory = categories.find((c) => c.id !== "all")?.id ?? "all";

  if (!Array.isArray(input)) return [];
  return input
    .map((row): PortfolioItem | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const title = trim(item.title, MAX_TITLE);
      const imageUrl = safeHttpUrl(item.imageUrl) ?? "";
      if (!title || !imageUrl) return null;
      const categoryId =
        typeof item.categoryId === "string" && validCategoryIds.has(item.categoryId)
          ? item.categoryId
          : fallbackCategory;
      const id =
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `item-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id,
        imageUrl,
        title,
        subtitle: trim(item.subtitle, MAX_SUBTITLE),
        categoryId,
      };
    })
    .filter((i): i is PortfolioItem => i !== null)
    .slice(0, MAX_ITEMS);
}

export function normalizePortfolioConfig(
  saved: PortfolioPageConfigInput | null | undefined,
): PortfolioPageConfig {
  const defaults = createDefaultPortfolioConfig();
  const raw = saved && typeof saved === "object" ? saved : {};

  const categories = normalizeCategories(raw.categories);
  const merged: PortfolioPageConfig = {
    ...defaults,
    ...raw,
    pageTemplate: "portfolio",
    sectionLabel: trim(raw.sectionLabel, MAX_LABEL) || defaults.sectionLabel,
    title: trim(raw.title, MAX_TITLE) || defaults.title,
    subtitle: trim(raw.subtitle, MAX_TEXT) || defaults.subtitle,
    featuredImageUrl:
      safeHttpUrl(raw.featuredImageUrl) ?? defaults.featuredImageUrl,
    categories: categories.length > 0 ? categories : defaults.categories,
    items: [],
    showCta: typeof raw.showCta === "boolean" ? raw.showCta : defaults.showCta,
    ctaImageUrl: safeHttpUrl(raw.ctaImageUrl) ?? defaults.ctaImageUrl,
    ctaSectionLabel:
      trim(raw.ctaSectionLabel, MAX_LABEL) || defaults.ctaSectionLabel,
    ctaHeading: trim(raw.ctaHeading, MAX_TEXT) || defaults.ctaHeading,
    ctaPrimaryLabel:
      trim(raw.ctaPrimaryLabel, MAX_LABEL) || defaults.ctaPrimaryLabel,
    ctaPrimaryUrl: safeNavUrl(raw.ctaPrimaryUrl) || defaults.ctaPrimaryUrl,
    ctaSecondaryLabel:
      trim(raw.ctaSecondaryLabel, MAX_LABEL) || defaults.ctaSecondaryLabel,
    ctaSecondaryUrl:
      safeNavUrl(raw.ctaSecondaryUrl) || defaults.ctaSecondaryUrl,
  };

  const items = normalizeItems(raw.items, merged.categories);
  merged.items = items.length > 0 ? items : defaults.items;

  return merged;
}

export function isPortfolioConfig(
  config: Record<string, unknown> | null | undefined,
): boolean {
  return config?.pageTemplate === "portfolio";
}
