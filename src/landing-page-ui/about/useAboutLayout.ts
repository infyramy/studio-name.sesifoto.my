import { computed, reactive, type Ref } from "vue";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";

export type AboutPreviewLayout = HomePreviewLayout;

export function useAboutLayout(previewLayout: Ref<AboutPreviewLayout>) {
  const forced = computed(() => previewLayout.value);
  const isForcedMobile = computed(() => forced.value === "mobile");
  const isForcedTablet = computed(() => forced.value === "tablet");
  const isForcedNarrow = computed(
    () => isForcedMobile.value || isForcedTablet.value,
  );

  const heroIntroClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-4xl px-4 pt-10 pb-6 text-center";
    if (isForcedTablet.value) return "mx-auto max-w-4xl px-5 pt-14 pb-7 text-center";
    return "mx-auto max-w-4xl px-4 pt-12 pb-8 md:px-6 md:pt-16 text-center";
  });

  const heroTitleClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-3 text-3xl text-[var(--text-main)] break-words";
    }
    if (isForcedTablet.value) {
      return "mb-3 text-4xl text-[var(--text-main)] break-words";
    }
    return "mb-3 text-4xl md:text-5xl text-[var(--text-main)] break-words";
  });

  const heroImagesClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-4xl px-4 space-y-4 pb-10";
    if (isForcedTablet.value) return "mx-auto max-w-4xl px-5 space-y-5 pb-11";
    return "mx-auto max-w-4xl px-4 md:px-6 space-y-6 pb-12";
  });

  const heroImageMaxHeightClass = computed(() =>
    isForcedMobile.value ? "max-h-[280px]" : "max-h-[480px]",
  );

  const missionClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-3xl px-4 py-10 text-center";
    if (isForcedTablet.value) return "mx-auto max-w-3xl px-5 py-11 text-center";
    return "mx-auto max-w-3xl px-4 md:px-6 py-12 text-center";
  });

  const missionTextClass = computed(() => {
    if (isForcedMobile.value) {
      return "text-base font-title leading-relaxed text-[var(--text-main)] break-words";
    }
    return "text-lg md:text-xl font-title leading-relaxed text-[var(--text-main)] break-words";
  });

  const sectionPaddingClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 py-10";
    if (isForcedTablet.value) return "mx-auto max-w-6xl px-5 py-12";
    return "mx-auto max-w-6xl px-4 md:px-6 py-12";
  });

  const valuesGridClass = computed(() => {
    if (isForcedMobile.value) return "flex flex-wrap justify-center gap-8";
    if (isForcedTablet.value) return "flex flex-wrap justify-center gap-9";
    return "flex flex-wrap justify-center gap-10";
  });

  const valuesItemClass = computed(() => {
    if (isForcedMobile.value) {
      return "w-full max-w-[360px] min-w-0 text-center";
    }
    if (isForcedTablet.value) {
      return "w-full max-w-[400px] min-w-0 text-center";
    }
    return "w-full md:w-[calc(33.333%-1.667rem)] max-w-[360px] min-w-0 text-center";
  });

  const processHeadingClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-8 text-center text-2xl text-[var(--text-main)] break-words";
    }
    if (isForcedTablet.value) {
      return "mb-10 text-center text-3xl text-[var(--text-main)] break-words";
    }
    return "mb-12 text-center text-3xl md:text-4xl text-[var(--text-main)] break-words";
  });

  const processGridClass = computed(() => {
    if (isForcedMobile.value) return "flex flex-wrap justify-center gap-6";
    if (isForcedTablet.value) return "flex flex-wrap justify-center gap-7";
    return "flex flex-wrap justify-center gap-8";
  });

  const processItemClass = computed(() => {
    if (isForcedMobile.value) {
      return "w-[calc(50%-0.75rem)] max-w-[200px] min-w-0 text-center";
    }
    if (isForcedTablet.value) {
      return "w-[calc(50%-0.875rem)] max-w-[220px] min-w-0 text-center";
    }
    return "w-[calc(50%-1rem)] md:w-[calc(20%-1.28rem)] max-w-[200px] min-w-0 text-center";
  });

  const processSectionClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 py-12";
    if (isForcedTablet.value) return "mx-auto max-w-6xl px-5 py-14";
    return "mx-auto max-w-6xl px-4 md:px-6 py-16";
  });

  const testimonialGridClass = computed(() => {
    if (isForcedNarrow.value) {
      return "grid grid-cols-1 gap-8 items-center";
    }
    return "grid grid-cols-1 md:grid-cols-2 gap-10 items-center";
  });

  const testimonialImageMaxHeightClass = computed(() =>
    isForcedMobile.value ? "max-h-[360px]" : "max-h-[520px]",
  );

  const testimonialQuoteClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-6 text-lg font-title leading-relaxed text-[var(--text-main)] break-words";
    }
    return "mb-6 text-xl md:text-2xl font-title leading-relaxed text-[var(--text-main)] break-words";
  });

  const ctaSectionClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-3xl px-4 pb-16 text-center";
    if (isForcedTablet.value) return "mx-auto max-w-3xl px-5 pb-16 text-center";
    return "mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center";
  });

  const ctaHeadingClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-6 text-xl leading-snug text-[var(--text-main)] break-words";
    }
    return "mb-8 text-2xl md:text-3xl leading-snug text-[var(--text-main)] break-words";
  });

  const ctaButtonsClass = computed(() => {
    if (isForcedNarrow.value) {
      return "flex w-full flex-col items-stretch gap-3";
    }
    return "flex flex-col sm:flex-row items-center justify-center gap-3";
  });

  const ctaButtonClass = computed(() => {
    if (isForcedNarrow.value) {
      return "w-full px-6 py-3 text-xs font-semibold uppercase tracking-wider";
    }
    return "w-full sm:w-auto sm:min-w-[200px] px-6 py-3 text-xs font-semibold uppercase tracking-wider";
  });

  return reactive({
    heroIntroClass,
    heroTitleClass,
    heroImagesClass,
    heroImageMaxHeightClass,
    missionClass,
    missionTextClass,
    sectionPaddingClass,
    valuesGridClass,
    valuesItemClass,
    processHeadingClass,
    processGridClass,
    processItemClass,
    processSectionClass,
    testimonialGridClass,
    testimonialImageMaxHeightClass,
    testimonialQuoteClass,
    ctaSectionClass,
    ctaHeadingClass,
    ctaButtonsClass,
    ctaButtonClass,
  });
}
