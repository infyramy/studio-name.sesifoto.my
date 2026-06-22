import type { LandingPageTheme } from "./types";

const MAX_DESCRIPTION_LENGTH = 160;

export type LandingPageMeta = {
  title: string;
  description: string;
  ogImage: string;
  canonicalUrl?: string;
};

function trimText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function buildLandingPageMeta(
  theme: LandingPageTheme,
  options?: { canonicalUrl?: string; studioName?: string },
): LandingPageMeta {
  const title =
    trimText(theme.seoTitle, 70) ||
    trimText(theme.mainTitle, 70) ||
    trimText(theme.studioName, 70) ||
    trimText(options?.studioName, 70) ||
    "SesiFoto";

  const rawDescription =
    trimText(theme.seoDescription, 200) || trimText(theme.description, 500);
  const description =
    rawDescription.length > MAX_DESCRIPTION_LENGTH
      ? `${rawDescription.slice(0, MAX_DESCRIPTION_LENGTH - 1).trim()}…`
      : rawDescription;

  const ogImage =
    trimText(theme.ogImageUrl, 2048) ||
    trimText(theme.heroUrl, 2048) ||
    trimText(theme.logoUrl, 2048);

  return {
    title,
    description,
    ogImage,
    canonicalUrl: options?.canonicalUrl,
  };
}
