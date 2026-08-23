import type { LandingPageConfig, LandingPageTheme } from "./types";
import type { StudioDefaults } from "./presets";

const GENERIC_SOCIAL_URLS = new Set([
  "https://instagram.com",
  "https://instagram.com/",
  "https://tiktok.com",
  "https://tiktok.com/",
  "https://facebook.com",
  "https://facebook.com/",
  "https://sesifoto.my",
  "https://sesifoto.my/",
]);

const FALLBACK_LOGO_PATTERNS = ["encrypted-tbn0.gstatic.com"];

function isEmptyValue(value: unknown): boolean {
  return typeof value !== "string" || !value.trim();
}

function isPlaceholderLogo(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return true;
  return FALLBACK_LOGO_PATTERNS.some((pattern) => value.includes(pattern));
}

function isPlaceholderSocial(value: unknown): boolean {
  if (isEmptyValue(value)) return true;
  const normalized = (value as string).trim().replace(/\/$/, "");
  return GENERIC_SOCIAL_URLS.has(normalized) || GENERIC_SOCIAL_URLS.has(`${normalized}/`);
}

function isPlaceholderValue(
  key: keyof LandingPageTheme,
  value: unknown,
  factory: LandingPageTheme,
): boolean {
  if (isEmptyValue(value)) return true;
  if (value === factory[key]) return true;

  if (key === "logoUrl") return isPlaceholderLogo(value);
  if (
    key === "socialInstagram" ||
    key === "socialFacebook" ||
    key === "socialTiktok" ||
    key === "socialWebsite"
  ) {
    return isPlaceholderSocial(value);
  }

  return false;
}

function pickStudioString(
  theme: LandingPageTheme,
  raw: LandingPageConfig,
  factory: LandingPageTheme,
  key: keyof LandingPageTheme,
  studioValue: string | undefined,
): void {
  if (!studioValue?.trim()) return;
  if (!isPlaceholderValue(key, raw[key], factory)) return;
  (theme as Record<string, unknown>)[key as string] = studioValue.trim();
}

/**
 * Saved landing-page configs often contain factory placeholder values.
 * Studio profile data should win until the owner customizes the page editor.
 */
export function applyStudioProfileOverrides(
  theme: LandingPageTheme,
  raw: LandingPageConfig,
  studio: StudioDefaults,
  factory: LandingPageTheme,
): void {
  pickStudioString(theme, raw, factory, "studioName", studio.name);
  pickStudioString(theme, raw, factory, "logoUrl", studio.logoUrl);
  pickStudioString(theme, raw, factory, "ssmNumber", studio.ssm);
  pickStudioString(theme, raw, factory, "mapAddress", studio.address);
  pickStudioString(theme, raw, factory, "description", studio.description);
  pickStudioString(theme, raw, factory, "socialInstagram", studio.instagram);
  pickStudioString(theme, raw, factory, "socialFacebook", studio.facebook);
  pickStudioString(theme, raw, factory, "socialTiktok", studio.tiktok);
  pickStudioString(theme, raw, factory, "socialPinterest", studio.pinterest);
  pickStudioString(theme, raw, factory, "socialThreads", studio.threads);

  if (studio.email?.trim() && isEmptyValue(raw.contactEmail)) {
    theme.contactEmail = studio.email.trim();
  }

  if (studio.mapsLink?.trim() && isEmptyValue(raw.mapsLink)) {
    theme.mapsLink = studio.mapsLink.trim();
  }

  if (studio.whatsapp?.trim()) {
    const phoneIsPlaceholder = isPlaceholderValue(
      "emergencyCustomPhone",
      raw.emergencyCustomPhone,
      factory,
    );
    if (phoneIsPlaceholder || raw.emergencyPhoneType === "system") {
      theme.emergencyCustomPhone = studio.whatsapp.trim();
      theme.emergencyPhoneType = "custom";
    }
  }
}
