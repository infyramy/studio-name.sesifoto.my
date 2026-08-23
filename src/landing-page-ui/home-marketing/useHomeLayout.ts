import { computed, type Ref, reactive } from "vue";

export type HomePreviewLayout = "mobile" | "tablet" | "desktop" | null;

export function useHomeLayout(previewLayout: Ref<HomePreviewLayout>) {
  const forced = computed(() => previewLayout.value);

  const isForcedMobile = computed(() => forced.value === "mobile");
  const isForcedTablet = computed(() => forced.value === "tablet");
  const isForcedNarrow = computed(
    () => isForcedMobile.value || isForcedTablet.value,
  );

  const heroGridClass = computed(() => {
    if (isForcedNarrow.value) {
      return "grid min-h-0 grid-cols-1";
    }
    return "grid min-h-[420px] md:min-h-[520px] lg:grid-cols-2";
  });

  const heroTextOrderClass = computed(() => {
    if (isForcedNarrow.value) return "order-2";
    return "order-2 lg:order-1";
  });

  const heroImageOrderClass = computed(() => {
    if (isForcedNarrow.value) return "order-1";
    return "order-1 lg:order-2";
  });

  const heroImageMinHeightClass = computed(() => {
    if (isForcedMobile.value) return "min-h-[220px]";
    if (isForcedTablet.value) return "min-h-[280px]";
    return "min-h-[280px] lg:min-h-full";
  });

  const heroTitleClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-5 text-3xl leading-tight text-[var(--text-main)] break-words";
    }
    if (isForcedTablet.value) {
      return "mb-6 text-4xl leading-tight text-[var(--text-main)] break-words";
    }
    return "mb-6 text-4xl md:text-5xl lg:text-6xl leading-tight text-[var(--text-main)] break-words";
  });

  const heroContentPaddingClass = computed(() => {
    if (isForcedMobile.value) {
      return "relative flex flex-col justify-center px-4 py-10 sm:px-6";
    }
    return "relative flex flex-col justify-center px-6 py-16 md:px-12 lg:px-16";
  });

  const sectionPaddingClass = computed(() => {
    if (isForcedMobile.value) {
      return "mx-auto max-w-6xl px-4 py-10 text-center";
    }
    if (isForcedTablet.value) {
      return "mx-auto max-w-6xl px-5 py-14 text-center";
    }
    return "mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20 text-center";
  });

  const sectionPaddingPlainClass = computed(() => {
    if (isForcedMobile.value) {
      return "mx-auto max-w-6xl px-4 py-10";
    }
    if (isForcedTablet.value) {
      return "mx-auto max-w-6xl px-5 py-14";
    }
    return "mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20";
  });

  const galleryGridClass = computed(() => {
    if (isForcedMobile.value) return "flex flex-wrap justify-center gap-3";
    if (isForcedTablet.value) return "flex flex-wrap justify-center gap-4";
    return "flex flex-wrap justify-center gap-4 md:gap-6";
  });

  const galleryItemClass = computed(() => {
    if (isForcedMobile.value) {
      return "w-[calc(50%-0.375rem)] max-w-[200px] min-w-0 text-center";
    }
    if (isForcedTablet.value) {
      return "w-[calc(50%-0.5rem)] max-w-[240px] min-w-0 text-center";
    }
    return "w-[calc(50%-0.75rem)] md:w-[calc(25%-1.125rem)] max-w-[280px] min-w-0 text-center";
  });

  const packagesGridClass = computed(() => {
    if (isForcedMobile.value) return "flex flex-wrap justify-center gap-6";
    if (isForcedTablet.value) return "flex flex-wrap justify-center gap-6";
    return "flex flex-wrap justify-center gap-8";
  });

  const packagesItemClass = computed(() => {
    if (isForcedMobile.value) {
      return "w-full max-w-[320px] min-w-0 text-center";
    }
    if (isForcedTablet.value) {
      return "w-[calc(50%-0.75rem)] max-w-[300px] min-w-0 text-center";
    }
    return "w-full md:w-[calc(33.333%-1.375rem)] max-w-[360px] min-w-0 text-center";
  });

  const faqListClass = computed(() => "mx-auto w-full max-w-2xl text-left");

  const quoteSectionClass = computed(() => {
    if (isForcedMobile.value) {
      return "px-4 py-10 text-center";
    }
    return "px-4 py-12 md:py-16 text-center";
  });

  const quoteTextClass = computed(() => {
    if (isForcedMobile.value) {
      return "text-xl font-title italic text-[var(--text-main)] break-words";
    }
    if (isForcedTablet.value) {
      return "text-2xl font-title italic text-[var(--text-main)] break-words";
    }
    return "text-2xl md:text-3xl font-title italic text-[var(--text-main)] break-words";
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

  const sectionHeadingClass = computed(() => {
    if (isForcedMobile.value) {
      return "mb-8 text-2xl text-[var(--text-main)] break-words";
    }
    if (isForcedTablet.value) {
      return "mb-9 text-3xl text-[var(--text-main)] break-words";
    }
    return "mb-10 text-3xl md:text-4xl text-[var(--text-main)] break-words";
  });

  const aboutGridClass = computed(() => {
    if (isForcedNarrow.value) {
      return "grid grid-cols-1 items-center gap-8 text-center";
    }
    return "grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10";
  });

  const aboutTextClass = computed(() =>
    isForcedNarrow.value ? "min-w-0 text-center" : "min-w-0 text-center md:text-left",
  );

  return reactive({
    heroGridClass,
    heroTextOrderClass,
    heroImageOrderClass,
    heroImageMinHeightClass,
    heroTitleClass,
    heroContentPaddingClass,
    sectionPaddingClass,
    sectionPaddingPlainClass,
    galleryGridClass,
    galleryItemClass,
    packagesGridClass,
    packagesItemClass,
    faqListClass,
    quoteSectionClass,
    quoteTextClass,
    ctaButtonsClass,
    ctaButtonClass,
    sectionHeadingClass,
    aboutGridClass,
    aboutTextClass,
  });
}
