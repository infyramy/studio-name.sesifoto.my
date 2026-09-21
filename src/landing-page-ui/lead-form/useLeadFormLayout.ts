import { computed, reactive, type Ref } from "vue";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";

export type LeadFormPreviewLayout = HomePreviewLayout;

export function useLeadFormLayout(previewLayout: Ref<LeadFormPreviewLayout>) {
  const forced = computed(() => previewLayout.value);
  const isForcedMobile = computed(() => forced.value === "mobile");
  const isForcedTablet = computed(() => forced.value === "tablet");
  const isForcedNarrow = computed(
    () => isForcedMobile.value || isForcedTablet.value,
  );

  function shellClass(showHero: boolean) {
    if (!showHero) return "flex min-h-full flex-col";
    if (isForcedNarrow.value) return "flex min-h-full flex-col";
    return "flex min-h-full flex-col lg:grid lg:grid-cols-[2fr_3fr] lg:min-h-[calc(100vh-8rem)]";
  }

  const heroAsideClass = computed(() => {
    if (isForcedNarrow.value) {
      return "lp-reveal-media relative min-h-[42vh]";
    }
    return "lp-reveal-media relative min-h-[42vh] lg:min-h-full";
  });

  const heroContentClass = computed(() => {
    if (isForcedMobile.value) {
      return "relative flex h-full flex-col justify-end p-5 text-white";
    }
    if (isForcedTablet.value) {
      return "relative flex h-full flex-col justify-end p-6 text-white";
    }
    return "relative flex h-full flex-col justify-end p-6 md:p-10 text-white";
  });

  const heroTitleClass = computed(() => {
    if (isForcedMobile.value) {
      return "lp-reveal-child mb-3 max-w-md text-2xl leading-tight break-words";
    }
    if (isForcedTablet.value) {
      return "lp-reveal-child mb-3 max-w-md text-3xl leading-tight break-words";
    }
    return "lp-reveal-child mb-3 max-w-md text-3xl md:text-4xl leading-tight break-words";
  });

  const formPanelClass = computed(() => {
    if (isForcedMobile.value) {
      return "mx-auto max-w-xl px-4 py-6";
    }
    if (isForcedTablet.value) {
      return "mx-auto max-w-xl px-5 py-8";
    }
    return "mx-auto max-w-xl px-5 py-8 md:px-10 md:py-10";
  });

  const formHeadingClass = computed(() => {
    if (isForcedMobile.value) {
      return "lp-reveal-child mb-2 text-2xl leading-tight text-[var(--text-main)] break-words";
    }
    return "lp-reveal-child mb-2 text-3xl leading-tight text-[var(--text-main)] break-words";
  });

  function dateTypeGridClass(showEventTypes: boolean) {
    if (!showEventTypes) return "grid gap-6";
    if (isForcedNarrow.value) return "grid gap-6 grid-cols-1";
    return "grid gap-6 sm:grid-cols-2";
  }

  return reactive({
    shellClass,
    heroAsideClass,
    heroContentClass,
    heroTitleClass,
    formPanelClass,
    formHeadingClass,
    dateTypeGridClass,
  });
}
