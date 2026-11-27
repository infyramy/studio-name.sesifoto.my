import logoLight from "@/assets/logo/logo-light.png";

/**
 * Sesifoto mark used when an image URL is missing or fails to load.
 * Prefer this over empty slots / generic icons for brand image fields.
 */
export const DEFAULT_SESIFOTO_IMAGE = logoLight as string;

/** Public path (no bundler hash): useful in serialized theme JSON / static HTML. */
export const DEFAULT_SESIFOTO_IMAGE_PUBLIC = "/logo-light.png";

/** Dark plate behind the light Sesifoto mark so it stays readable. */
export const DEFAULT_SESIFOTO_IMAGE_BG = "#0b0d0c";

export function isMissingImageUrl(url?: string | null): boolean {
  return !(typeof url === "string" && url.trim().length > 0);
}

/** True when src is the Sesifoto default mark (bundled or /logo-light.png). */
export function isDefaultSesifotoImage(url?: string | null): boolean {
  if (typeof url !== "string" || !url.trim()) return false;
  const u = url.trim();
  if (u === DEFAULT_SESIFOTO_IMAGE || u === DEFAULT_SESIFOTO_IMAGE_PUBLIC) {
    return true;
  }
  return /(?:^|\/)logo-light(?:\.[a-zA-Z0-9]+)?\.png(?:\?|$)/.test(u);
}

/** Returns a usable image src; empty/null → Sesifoto logo. */
export function resolveImageUrl(
  url?: string | null,
  fallback: string = DEFAULT_SESIFOTO_IMAGE,
): string {
  const trimmed = typeof url === "string" ? url.trim() : "";
  return trimmed || fallback;
}
