import type { LeadFormPageConfig } from "./types";

export type LeadFormServiceOption = {
  value: string;
  label: string;
};

const DEFAULT_OPTIONS: LeadFormServiceOption[] = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "photo_video", label: "Photo + Video" },
];

export function resolveLeadFormServiceOptions(
  leadForm: LeadFormPageConfig,
  t: { photo: string; video: string; both: string },
): LeadFormServiceOption[] {
  const raw = (leadForm as LeadFormPageConfig & {
    serviceInterestOptions?: LeadFormServiceOption[];
  }).serviceInterestOptions;

  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((o) => ({
        value: String(o.value || "").trim(),
        label: String(o.label || "").trim(),
      }))
      .filter((o) => o.value && o.label);
  }

  return [
    { value: "photo", label: t.photo },
    { value: "video", label: t.video },
    { value: "photo_video", label: t.both },
  ];
}

export function defaultLeadServiceValue(
  options: LeadFormServiceOption[],
): string {
  return options[0]?.value ?? DEFAULT_OPTIONS[0]!.value;
}
