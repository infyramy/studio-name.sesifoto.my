export const SESSION_TYPE_OPTIONS = [
  { value: "akad_nikah", label: "Akad Nikah" },
  { value: "sanding", label: "Sanding" },
  { value: "solemnization", label: "Solemnization" },
  { value: "reception", label: "Reception" },
  { value: "engagement", label: "Engagement" },
  { value: "pre_wedding", label: "Pre-Wedding" },
  { value: "portrait", label: "Portrait Session" },
  { value: "family", label: "Family Session" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
] as const;

export function sessionTypeLabel(value?: string | null): string {
  if (!value?.trim()) return "Session";
  const key = value.trim().toLowerCase();
  const known = SESSION_TYPE_OPTIONS.find((option) => option.value === key);
  if (known) return known.label;
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
