import type { StudioLanguage } from "../types";
import { tLandingPage, type LandingPageUiKey } from "../i18n";

export type HomeCtaPresetId =
  | "book_appointment"
  | "view_packages"
  | "contact_us"
  | "view_portfolio"
  | "none";

export type HomeCtaPreset = {
  id: HomeCtaPresetId;
  url: string;
  labelKey: LandingPageUiKey;
};

export const HOME_CTA_PRESETS: HomeCtaPreset[] = [
  {
    id: "book_appointment",
    url: "/check-booking",
    labelKey: "homeCtaBookAppointment",
  },
  {
    id: "view_packages",
    url: "/services",
    labelKey: "homeCtaViewPackages",
  },
  {
    id: "contact_us",
    url: "/lead-form",
    labelKey: "homeCtaContactUs",
  },
  {
    id: "view_portfolio",
    url: "/portfolio",
    labelKey: "homeCtaViewPortfolio",
  },
];

export const HOME_CTA_PRESET_IDS = [
  ...HOME_CTA_PRESETS.map((p) => p.id),
  "none",
] as const;

export function isHomeCtaPresetId(value: unknown): value is HomeCtaPresetId {
  return (
    typeof value === "string" &&
    (HOME_CTA_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function resolveHomeCtaPreset(
  presetId: HomeCtaPresetId,
  language: StudioLanguage,
): { label: string; url: string } | null {
  if (presetId === "none") return null;
  const preset = HOME_CTA_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  return {
    label: tLandingPage(language, preset.labelKey),
    url: preset.url,
  };
}

export function homeCtaPresetLabel(
  presetId: HomeCtaPresetId,
  language: StudioLanguage,
): string {
  if (presetId === "none") return "None";
  const preset = HOME_CTA_PRESETS.find((p) => p.id === presetId);
  if (!preset) return presetId;
  return tLandingPage(language, preset.labelKey);
}
