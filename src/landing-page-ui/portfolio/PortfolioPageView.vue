<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import SiteChrome from "./SiteChrome.vue";
import type { PortfolioPageConfig } from "./types";
import type { LandingPageTheme, StudioLanguage } from "../types";
import { useLandingPageStyles } from "../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    portfolio: PortfolioPageConfig;
    styleConfig: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    loading?: boolean;
    loadError?: string | null;
    surfaceClass?: string;
  }>(),
  {
    language: "en",
    mode: "preview",
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
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);

const filteredItems = computed(() => {
  if (activeCategoryId.value === "all") return props.portfolio.items;
  return props.portfolio.items.filter(
    (item) => item.categoryId === activeCategoryId.value,
  );
});

function onCtaClick(url: string) {
  emit("navigate", url);
}
</script>

<template>
  <div :class="['min-h-full', surfaceClass]">
    <component :is="'style'" v-html="themeStyle" />

    <div
      v-if="loading"
      class="flex min-h-[60vh] items-center justify-center py-24 text-[var(--text-muted)]"
    >
      Loading...
    </div>

    <div
      v-else-if="loadError"
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-24 text-center"
    >
      <p class="text-[var(--text-muted)]">{{ loadError }}</p>
      <button
        type="button"
        class="rounded-md border px-4 py-2 text-sm"
        :class="buttonRadiusClass"
        @click="emit('retryLoad')"
      >
        Try again
      </button>
    </div>

    <SiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <!-- Hero -->
      <section class="mx-auto max-w-6xl px-4 pt-10 pb-8 md:px-6 md:pt-14 text-center">
        <p
          class="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
        >
          {{ portfolio.sectionLabel }}
        </p>
        <h1
          class="mb-3 text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-main)]"
        >
          {{ portfolio.title }}
        </h1>
        <p class="mx-auto max-w-xl text-base text-[var(--text-muted)] font-light">
          {{ portfolio.subtitle }}
        </p>
      </section>

      <section class="mx-auto max-w-6xl px-4 md:px-6 mb-10">
        <img
          v-if="portfolio.featuredImageUrl"
          :src="portfolio.featuredImageUrl"
          :alt="portfolio.title"
          class="w-full max-h-[420px] object-cover rounded-sm"
          referrerpolicy="no-referrer"
        />
      </section>

      <!-- Gallery filters -->
      <section class="mx-auto max-w-6xl px-4 md:px-6 pb-6">
        <div class="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <button
            v-for="cat in portfolio.categories"
            :key="cat.id"
            type="button"
            class="px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors"
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
      <section class="mx-auto max-w-6xl px-4 md:px-6 pb-16">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <article v-for="item in filteredItems" :key="item.id" class="group">
            <div class="overflow-hidden mb-3 aspect-[3/4] bg-[var(--icon-bg)]">
              <img
                :src="item.imageUrl"
                :alt="item.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                referrerpolicy="no-referrer"
              />
            </div>
            <h3 class="text-sm font-bold uppercase tracking-wide text-[var(--text-main)]">
              {{ item.title }}
            </h3>
            <p class="mt-1 text-xs text-[var(--text-muted)] uppercase tracking-wide">
              {{ item.subtitle }}
            </p>
          </article>
        </div>
      </section>

      <!-- CTA -->
      <section
        v-if="portfolio.showCta"
        class="mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center"
      >
        <img
          v-if="portfolio.ctaImageUrl"
          :src="portfolio.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-28 w-28 object-cover rounded-sm"
          referrerpolicy="no-referrer"
        />
        <p
          class="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
        >
          {{ portfolio.ctaSectionLabel }}
        </p>
        <h2
          class="mb-8 text-2xl md:text-3xl font-bold leading-snug text-[var(--text-main)] max-w-lg mx-auto"
        >
          {{ portfolio.ctaHeading }}
        </h2>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            class="min-w-[200px] px-6 py-3 text-xs font-semibold uppercase tracking-wider"
            :class="buttonRadiusClass"
            :style="{
              backgroundColor: styleConfig.primaryColor,
              color: styleConfig.primaryTextColor,
            }"
            @click="onCtaClick(portfolio.ctaPrimaryUrl)"
          >
            {{ portfolio.ctaPrimaryLabel }}
          </button>
          <button
            type="button"
            class="min-w-[200px] px-6 py-3 text-xs font-semibold uppercase tracking-wider border"
            :class="buttonRadiusClass"
            :style="{
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              backgroundColor: 'transparent',
            }"
            @click="onCtaClick(portfolio.ctaSecondaryUrl)"
          >
            {{ portfolio.ctaSecondaryLabel }}
          </button>
        </div>
      </section>
    </SiteChrome>
  </div>
</template>
