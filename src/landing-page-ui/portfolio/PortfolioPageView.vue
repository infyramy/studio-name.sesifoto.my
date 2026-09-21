<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import SiteChrome from "./SiteChrome.vue";
import LandingPageBootState from "../LandingPageBootState.vue";
import type { PortfolioPageConfig } from "./types";
import type { LandingPageTheme, StudioLanguage } from "../types";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";
import { resolveHomeCtaPreset } from "../home-marketing/cta-presets";
import { usePortfolioLayout } from "./usePortfolioLayout";
import { useLandingPageStyles } from "../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    portfolio: PortfolioPageConfig;
    styleConfig: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    previewLayout?: HomePreviewLayout;
    loading?: boolean;
    loadError?: string | null;
    surfaceClass?: string;
  }>(),
  {
    language: "en",
    mode: "preview",
    previewLayout: null,
    loading: false,
    loadError: null,
    surfaceClass: "landing-surface",
  },
);

const emit = defineEmits<{
  navigate: [url: string];
  languageChange: [lang: StudioLanguage];
  retryLoad: [];
}>();

const activeCategoryId = ref("all");

const styleRef = toRef(props, "styleConfig");
const previewLayoutRef = toRef(props, "previewLayout");
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);
const layout = usePortfolioLayout(previewLayoutRef);

const filteredItems = computed(() => {
  if (activeCategoryId.value === "all") return props.portfolio.items;
  return props.portfolio.items.filter(
    (item) => item.categoryId === activeCategoryId.value,
  );
});

const primaryCta = computed(() =>
  resolveHomeCtaPreset(props.portfolio.ctaPrimaryPreset, props.language),
);

const secondaryCta = computed(() =>
  resolveHomeCtaPreset(props.portfolio.ctaSecondaryPreset, props.language),
);

function onCtaClick(url: string) {
  emit("navigate", url);
}
</script>

<template>
  <div :class="['min-h-full', surfaceClass]">
    <component :is="'style'" v-html="themeStyle" />

    <LandingPageBootState
      v-if="loading"
      :theme="styleConfig"
      label="Loading"
    />

    <LandingPageBootState
      v-else-if="loadError"
      :theme="styleConfig"
      :error="loadError"
      @retry="emit('retryLoad')"
    />

    <SiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <!-- Hero -->
      <section :class="layout.heroClass">
        <p
          class="lp-reveal-child mb-3 text-xs font-medium tracking-[0.2em] text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ portfolio.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child"
          :class="layout.heroTitleClass"
          style="--child-i: 1"
        >
          {{ portfolio.title }}
        </h1>
        <p
          class="lp-reveal-child mx-auto max-w-xl text-base text-[var(--text-muted)] font-light"
          style="--child-i: 2"
        >
          {{ portfolio.subtitle }}
        </p>
      </section>

      <section :class="layout.featuredImageClass">
        <img
          v-if="portfolio.featuredImageUrl"
          :src="portfolio.featuredImageUrl"
          :alt="portfolio.title"
          class="lp-reveal-media w-full object-cover rounded-sm"
          :class="layout.featuredImageMaxHeightClass"
          referrerpolicy="no-referrer"
        />
      </section>

      <!-- Gallery filters -->
      <section :class="layout.filtersClass">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button
            v-for="cat in portfolio.categories"
            :key="cat.id"
            type="button"
            class="px-3 py-1.5 text-xs font-medium tracking-wide transition-colors"
            :class="
              activeCategoryId === cat.id
                ? 'text-[var(--text-main)] border-b-2 border-[var(--text-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            "
            @click="activeCategoryId = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>
      </section>

      <!-- Gallery grid -->
      <section :class="layout.gallerySectionClass">
        <div :class="layout.galleryGridClass">
          <article v-for="item in filteredItems" :key="item.id" class="group">
            <div class="overflow-hidden mb-3 aspect-[3/4] bg-[var(--icon-bg)]">
              <img
                :src="item.imageUrl"
                :alt="item.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                referrerpolicy="no-referrer"
              />
            </div>
            <h3 class="text-sm font-bold tracking-wide text-[var(--text-main)]">
              {{ item.title }}
            </h3>
            <p class="mt-1 text-xs text-[var(--text-muted)] tracking-wide">
              {{ item.subtitle }}
            </p>
          </article>
        </div>
      </section>

      <!-- CTA -->
      <section
        v-if="portfolio.showCta"
        :class="layout.ctaSectionClass"
      >
        <img
          v-if="portfolio.ctaImageUrl"
          :src="portfolio.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-28 w-28 object-cover rounded-sm"
          referrerpolicy="no-referrer"
        />
        <p
          class="mb-3 text-xs font-medium tracking-[0.2em] text-[var(--text-muted)]"
        >
          {{ portfolio.ctaSectionLabel }}
        </p>
        <h2 :class="layout.ctaHeadingClass">
          {{ portfolio.ctaHeading }}
        </h2>
        <div :class="layout.ctaButtonsClass">
          <button
            v-if="primaryCta"
            type="button"
            :class="[layout.ctaButtonClass, buttonRadiusClass]"
            :style="{
              backgroundColor: styleConfig.primaryColor,
              color: styleConfig.primaryTextColor,
            }"
            @click="onCtaClick(primaryCta.url)"
          >
            {{ primaryCta.label }}
          </button>
          <button
            v-if="secondaryCta"
            type="button"
            class="border"
            :class="[layout.ctaButtonClass, buttonRadiusClass]"
            :style="{
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              backgroundColor: 'transparent',
            }"
            @click="onCtaClick(secondaryCta.url)"
          >
            {{ secondaryCta.label }}
          </button>
        </div>
      </section>
    </SiteChrome>
  </div>
</template>
