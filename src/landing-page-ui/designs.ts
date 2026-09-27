import type { LandingPageDesignId } from "./types";
import { normalizeLandingPageDesignId } from "./types";

export type LandingPageDesignOption = {
  id: LandingPageDesignId;
  label: string;
};

export const LANDING_PAGE_DESIGNS: LandingPageDesignOption[] = [
  { id: "classic", label: "Classic" },
  { id: "editorial", label: "Editorial" },
  { id: "atelier", label: "Atelier" },
  { id: "billboard", label: "Billboard" },
  { id: "lookbook", label: "Lookbook" },
];

export function resolveLandingPageDesignId(
  value: unknown,
): LandingPageDesignId {
  return normalizeLandingPageDesignId(value);
}

export function isEditorialDesign(value: unknown): boolean {
  return resolveLandingPageDesignId(value) === "editorial";
}

export function isAtelierDesign(value: unknown): boolean {
  return resolveLandingPageDesignId(value) === "atelier";
}

export function isBillboardDesign(value: unknown): boolean {
  return resolveLandingPageDesignId(value) === "billboard";
}

export function isLookbookDesign(value: unknown): boolean {
  return resolveLandingPageDesignId(value) === "lookbook";
}
