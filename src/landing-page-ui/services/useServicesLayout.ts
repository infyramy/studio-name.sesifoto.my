import { computed, reactive, type Ref } from "vue";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";

export type ServicesPreviewLayout = HomePreviewLayout;

export function useServicesLayout(previewLayout: Ref<ServicesPreviewLayout>) {
  const forced = computed(() => previewLayout.value);
  const isForcedMobile = computed(() => forced.value === "mobile");
  const isForcedTablet = computed(() => forced.value === "tablet");
  const isForcedNarrow = computed(
    () => isForcedMobile.value || isForcedTablet.value,
  );

  const heroClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 pt-10 pb-8 text-center";
    if (isForcedTablet.value) return "mx-auto max-w-6xl px-5 pt-12 pb-9 text-center";
    return "mx-auto max-w-6xl px-4 pt-12 pb-10 md:px-6 md:pt-16 text-center";
  });

  const heroTitleClass = computed(() => {
    if (isForcedMobile.value) {
      return "text-3xl font-normal tracking-tight text-[var(--text-main)] break-words";
    }
    if (isForcedTablet.value) {
      return "text-4xl font-normal tracking-tight text-[var(--text-main)] break-words";
    }
    return "text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-[var(--text-main)] break-words";
  });

  const categorySectionClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-6xl px-4 pb-10";
    if (isForcedTablet.value) return "mx-auto max-w-6xl px-5 pb-12";
    return "mx-auto max-w-6xl px-4 md:px-6 pb-14 md:pb-16";
  });

  function packageGridClass(columns: 2 | 3) {
    if (isForcedMobile.value) return "grid grid-cols-1 gap-6";
    if (isForcedTablet.value) {
      return columns === 2 ? "grid grid-cols-2 gap-6" : "grid grid-cols-2 gap-6";
    }
    return columns === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10";
  }

  const ctaSectionClass = computed(() => {
    if (isForcedMobile.value) return "mx-auto max-w-3xl px-4 pb-16 text-center";
    return "mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center";
  });

  const ctaHeadingClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-6 text-xl font-normal leading-snug text-[var(--text-main)] max-w-lg mx-auto break-words";
    }
    return "mb-8 text-2xl md:text-3xl font-normal leading-snug text-[var(--text-main)] max-w-lg mx-auto break-words";
  });

  const ctaButtonsClass = computed(() => {
    if (isForcedNarrow.value) return "flex w-full flex-col items-stretch gap-3";
    return "flex flex-col sm:flex-row items-center justify-center gap-3";
  });

  const ctaButtonClass = computed(() => {
    if (isForcedNarrow.value) {
      return "w-full px-8 py-3.5 text-xs font-semibold uppercase tracking-wider";
    }
    return "w-full sm:w-auto sm:min-w-[220px] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider";
  });

  return reactive({
    heroClass,
    heroTitleClass,
    categorySectionClass,
    packageGridClass,
    ctaSectionClass,
    ctaHeadingClass,
    ctaButtonsClass,
    ctaButtonClass,
  });
}
