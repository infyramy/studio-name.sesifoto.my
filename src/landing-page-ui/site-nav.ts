import type { StudioLanguage } from "./types";
import { tLandingPage, type LandingPageUiKey } from "./i18n";

/** Matches page-editor pages. */
export type SiteNavItemKey =
  | "home"
  | "aboutUs"
  | "portfolio"
  | "services"
  | "leadForm";

export type FixedSiteNavItem = {
  id: string;
  key: SiteNavItemKey;
  url: string;
};

const NAV_LABEL_KEYS: Record<SiteNavItemKey, LandingPageUiKey> = {
  home: "navHome",
  aboutUs: "navAboutUs",
  portfolio: "navPortfolio",
  services: "navServices",
  leadForm: "navLeadForm",
};

/** Header left — page editor order start */
export const SITE_NAV_HEADER_LEFT: FixedSiteNavItem[] = [
  { id: "nav-home", key: "home", url: "/" },
  { id: "nav-about", key: "aboutUs", url: "/about-us" },
  { id: "nav-portfolio", key: "portfolio", url: "/portfolio" },
];

/** Header right — remaining pages */
export const SITE_NAV_HEADER_RIGHT: FixedSiteNavItem[] = [
  { id: "nav-services", key: "services", url: "/services" },
  { id: "nav-lead-form", key: "leadForm", url: "/lead-form" },
];

/** Footer — all page-editor pages */
export const SITE_NAV_FOOTER: FixedSiteNavItem[] = [
  { id: "footer-home", key: "home", url: "/" },
  { id: "footer-about", key: "aboutUs", url: "/about-us" },
  { id: "footer-portfolio", key: "portfolio", url: "/portfolio" },
  { id: "footer-services", key: "services", url: "/services" },
  { id: "footer-lead-form", key: "leadForm", url: "/lead-form" },
];

export function getSiteNavLabel(
  language: StudioLanguage,
  key: SiteNavItemKey,
): string {
  return tLandingPage(language, NAV_LABEL_KEYS[key]);
}
