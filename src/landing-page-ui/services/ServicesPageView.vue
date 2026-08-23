<script setup lang="ts">
import { toRef } from "vue";
import SiteChrome from "../portfolio/SiteChrome.vue";
import type { ServicesPageConfig } from "./types";
import type { LandingPageTheme, StudioLanguage } from "../types";
import { useLandingPageStyles } from "../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    services: ServicesPageConfig;
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

const styleRef = toRef(props, "styleConfig");
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);

function gridClass(columns: 2 | 3) {
  return columns === 2
    ? "grid-cols-1 sm:grid-cols-2"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

function packageClass(
  columns: 2 | 3,
  index: number,
  total: number,
): string {
  if (columns !== 3 || total % 3 !== 1 || index !== total - 1) return "";
  return "lg:col-span-3 lg:max-w-xs lg:mx-auto";
}

function onDetailClick(url: string) {
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
      <section class="mx-auto max-w-6xl px-4 pt-12 pb-10 md:px-6 md:pt-16 text-center">
        <p
          class="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-[var(--text-muted)]"
        >
          {{ services.sectionLabel }}
        </p>
        <h1
          class="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-[var(--text-main)]"
        >
          {{ services.title }}
        </h1>
      </section>

      <!-- Categories -->
      <section
        v-for="category in services.categories"
        :key="category.id"
        class="mx-auto max-w-6xl px-4 md:px-6 pb-14 md:pb-16"
      >
        <h2
          class="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-main)]"
        >
          {{ category.label }}
        </h2>
        <div class="mb-8 border-t border-[var(--border-color)]" />

        <div class="grid gap-8 md:gap-10" :class="gridClass(category.columns)">
          <article
            v-for="(pkg, index) in category.packages"
            :key="pkg.id"
            class="group"
            :class="packageClass(category.columns, index, category.packages.length)"
          >
            <div class="overflow-hidden mb-4 aspect-[4/5] bg-[var(--icon-bg)]">
              <img
                :src="pkg.imageUrl"
                :alt="pkg.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                referrerpolicy="no-referrer"
              />
            </div>
            <h3 class="text-sm font-bold text-[var(--text-main)]">
              {{ pkg.title }}
            </h3>
            <p class="mt-1 text-sm text-[var(--text-muted)]">
              {{ pkg.price }}
            </p>
            <button
              type="button"
              class="mt-3 text-xs font-medium uppercase tracking-wide underline underline-offset-4 text-[var(--text-main)] hover:opacity-70 transition-opacity"
              @click="onDetailClick(pkg.detailUrl)"
            >
              {{ pkg.detailLabel }}
            </button>
          </article>
        </div>
      </section>

      <!-- CTA -->
      <section
        v-if="services.showCta"
        class="mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center"
      >
        <img
          v-if="services.ctaImageUrl"
          :src="services.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-24 w-40 object-cover rounded-sm"
          referrerpolicy="no-referrer"
        />
        <h2
          class="mb-8 text-2xl md:text-3xl font-normal leading-snug text-[var(--text-main)] max-w-lg mx-auto"
        >
          {{ services.ctaHeading }}
        </h2>
        <button
          type="button"
          class="min-w-[220px] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider"
          :class="buttonRadiusClass"
          :style="{
            backgroundColor: styleConfig.primaryColor,
            color: styleConfig.primaryTextColor,
          }"
          @click="onDetailClick(services.ctaPrimaryUrl)"
        >
          {{ services.ctaPrimaryLabel }}
        </button>
      </section>
    </SiteChrome>
  </div>
</template>
