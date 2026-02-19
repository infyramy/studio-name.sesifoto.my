import { useStudioStore } from "@/stores/studio";

/**
 * Format a YYYY-MM-DD date string for display (e.g. "20 Feb 2026").
 * Parses as local date to avoid timezone off-by-one.
 * Respects studio language (BM → ms-MY, EN → en-MY).
 */
export function useDateFormat() {
  const studioStore = useStudioStore();

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    // Parse as local date to avoid UTC midnight shifting the calendar date
    const [y, m, d] = dateStr.split("-").map(Number);
    if (y == null || m == null || d == null) return dateStr;
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return dateStr;
    const locale = studioStore.currentLanguage === "BM" ? "ms-MY" : "en-MY";
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return { formatDate };
}
