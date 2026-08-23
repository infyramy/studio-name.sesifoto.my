export const HOME_SECTION_KEYS = [
  "hero",
  "gallery",
  "quote",
  "packages",
  "about",
  "faq",
  "bottom-cta",
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export const DEFAULT_HOME_SECTION_ORDER: HomeSectionKey[] = [
  ...HOME_SECTION_KEYS,
];

export function isHomeSectionKey(value: unknown): value is HomeSectionKey {
  return (
    typeof value === "string" &&
    (HOME_SECTION_KEYS as readonly string[]).includes(value)
  );
}

export function normalizeHomeSectionOrder(input: unknown): HomeSectionKey[] {
  const list = Array.isArray(input) ? input : [];
  const filtered = list
    .filter(isHomeSectionKey)
    .filter((k, idx, arr) => arr.indexOf(k) === idx);

  for (const key of HOME_SECTION_KEYS) {
    if (!filtered.includes(key)) filtered.push(key);
  }

  return filtered;
}
