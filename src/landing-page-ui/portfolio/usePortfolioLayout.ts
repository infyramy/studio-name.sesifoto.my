import { computed, reactive, type Ref } from "vue";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";

export type PortfolioPreviewLayout = HomePreviewLayout;

export function usePortfolioLayout(previewLayout: Ref<PortfolioPreviewLayout>) {
  const forced = computed(() => previewLayout.value);
  const isForcedMobile = computed(() => forced.value === "mobile");
  const isForcedTablet = computed(() => forced.value === "tablet");
  const isForcedNarrow = computed(
    () => isForcedMobile.value || isForcedTablet.value,
  );

  const heroClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 pt-8 pb-6 text-center";
    if (isForcedTablet.value) return "mx-auto max-w-6xl px-5 pt-10 pb-7 text-center";
    return "mx-auto max-w-6xl px-4 pt-10 pb-8 md:px-6 md:pt-14 text-center";
  });

  const heroTitleClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-3 text-3xl font-bold tracking-tight text-[var(--text-main)] break-words";
    }
    return "mb-3 text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-main)] break-words";
  });

  const featuredImageClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 mb-8";
    if (isForcedTablet.value) return "mx-auto max-w-6xl px-5 mb-9";
    return "mx-auto max-w-6xl px-4 md:px-6 mb-10";
  });

  const featuredImageMaxHeightClass = computed(() =>
    isForcedMobile.value ? "max-h-[240px]" : "max-h-[420px]",
  );

  const filtersClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 pb-4";
    return "mx-auto max-w-6xl px-4 md:px-6 pb-6";
  });

  const galleryGridClass = computed(() => {
    if (isForcedMobile.value) return "grid grid-cols-1 gap-5";
    if (isForcedTablet.value) return "grid grid-cols-2 gap-6";
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8";
  });

  const gallerySectionClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 pb-12";
    return "mx-auto max-w-6xl px-4 md:px-6 pb-16";
  });

  const ctaSectionClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-3xl px-4 pb-16 text-center";
    return "mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center";
  });

  const ctaHeadingClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-6 text-xl font-bold leading-snug text-[var(--text-main)] max-w-lg mx-auto break-words";
    }
    return "mb-8 text-2xl md:text-3xl font-bold leading-snug text-[var(--text-main)] max-w-lg mx-auto break-words";
  });

  const ctaButtonsClass = computed(() => {
    if (isForcedNarrow.value) return "flex w-full flex-col items-stretch gap-3";
    return "flex flex-col sm:flex-row items-center justify-center gap-3";
  });

  const ctaButtonClass = computed(() => {
    if (isForcedNarrow.value) {
      return "w-full px-6 py-3 text-xs font-semibold uppercase tracking-wider";
    }
    return "w-full sm:w-auto sm:min-w-[200px] px-6 py-3 text-xs font-semibold uppercase tracking-wider";
  });

  return reactive({
    heroClass,
    heroTitleClass,
    featuredImageClass,
    featuredImageMaxHeightClass,
    filtersClass,
    galleryGridClass,
    gallerySectionClass,
    ctaSectionClass,
    ctaHeadingClass,
    ctaButtonsClass,
    ctaButtonClass,
  });
}
