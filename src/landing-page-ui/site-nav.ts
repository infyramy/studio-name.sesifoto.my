import type { StudioLanguage } from "./types";
import { tLandingPage, type LandingPageUiKey } from "./i18n";

/** Matches page-editor pages. */
export type SiteNavItemKey = "home" | "portfolio" | "leadForm";

export type FixedSiteNavItem = {
  id: string;
  key: SiteNavItemKey;
  url: string;
};

const NAV_LABEL_KEYS: Record<SiteNavItemKey, LandingPageUiKey> = {
  home: "navHome",
  portfolio: "navPortfolio",
  leadForm: "navLeadForm",
};

/** Header left — home + portfolio */
export const SITE_NAV_HEADER_LEFT: FixedSiteNavItem[] = [
  { id: "nav-home", key: "home", url: "/" },
  { id: "nav-portfolio", key: "portfolio", url: "/portfolio" },
];

/** Header right — lead form */
export const SITE_NAV_HEADER_RIGHT: FixedSiteNavItem[] = [
  { id: "nav-lead-form", key: "leadForm", url: "/lead-form" },
];

/** Footer — all page-editor pages */
export const SITE_NAV_FOOTER: FixedSiteNavItem[] = [
  { id: "footer-home", key: "home", url: "/" },
  { id: "footer-portfolio", key: "portfolio", url: "/portfolio" },
  { id: "footer-lead-form", key: "leadForm", url: "/lead-form" },
];

export function getSiteNavLabel(
  language: StudioLanguage,
  key: SiteNavItemKey,
): string {
  return tLandingPage(language, NAV_LABEL_KEYS[key]);
}
