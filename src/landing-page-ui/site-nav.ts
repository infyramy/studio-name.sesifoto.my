import type { StudioLanguage } from "./types";
import { tLandingPage, type LandingPageUiKey } from "./i18n";

export type SiteNavItemKey =
  | "aboutUs"
  | "portfolio"
  | "packages"
  | "contactUs"
  | "faq";

export type FixedSiteNavItem = {
  id: string;
  key: SiteNavItemKey;
  url: string;
};

const NAV_LABEL_KEYS: Record<SiteNavItemKey, LandingPageUiKey> = {
  aboutUs: "navAboutUs",
  portfolio: "navPortfolio",
  packages: "navPackages",
  contactUs: "navContactUs",
  faq: "navFaq",
};

export const SITE_NAV_HEADER_LEFT: FixedSiteNavItem[] = [
  { id: "nav-about", key: "aboutUs", url: "/about-us" },
  { id: "nav-portfolio", key: "portfolio", url: "/portfolio" },
  { id: "nav-packages", key: "packages", url: "/services" },
];

export const SITE_NAV_HEADER_RIGHT: FixedSiteNavItem[] = [
  { id: "nav-contact", key: "contactUs", url: "/lead-form" },
  { id: "nav-faq", key: "faq", url: "/#faq" },
];

export const SITE_NAV_FOOTER: FixedSiteNavItem[] = [
  { id: "footer-about", key: "aboutUs", url: "/about-us" },
  { id: "footer-portfolio", key: "portfolio", url: "/portfolio" },
  { id: "footer-packages", key: "packages", url: "/services" },
  { id: "footer-contact", key: "contactUs", url: "/lead-form" },
  { id: "footer-faq", key: "faq", url: "/#faq" },
];

export function getSiteNavLabel(
  language: StudioLanguage,
  key: SiteNavItemKey,
): string {
  return tLandingPage(language, NAV_LABEL_KEYS[key]);
}
