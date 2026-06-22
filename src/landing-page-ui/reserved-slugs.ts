/** Slugs that collide with public app routes — cannot be used as landing page slugs */
export const RESERVED_PAGE_SLUGS = [
  "booking",
  "booking-cart",
  "check-booking",
  "theme",
  "success",
  "payment",
  "lookup",
  "studio-not-found",
] as const;

export type ReservedPageSlug = (typeof RESERVED_PAGE_SLUGS)[number];

export function isReservedPageSlug(slug: string): boolean {
  return (RESERVED_PAGE_SLUGS as readonly string[]).includes(slug);
}
