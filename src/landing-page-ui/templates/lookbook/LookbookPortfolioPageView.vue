<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import LookbookSiteChrome from "./LookbookSiteChrome.vue";
import LandingPageBootState from "../../LandingPageBootState.vue";
import type { PortfolioPageConfig } from "../../portfolio/types";
import type { LandingPageTheme, StudioLanguage } from "../../types";
import type { HomePreviewLayout } from "../../home-marketing/useHomeLayout";
import { resolveHomeCtaPreset } from "../../home-marketing/cta-presets";
import { useLandingPageStyles } from "../../useLandingPageStyles";

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
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);

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

function openGalleryLink(url: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
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

    <LookbookSiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <section class="px-5 py-14 md:px-10 md:py-20 lg:px-14">
        <p
          class="lp-reveal-child mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ portfolio.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child mb-4 font-title text-5xl tracking-tight text-[var(--text-main)] md:text-7xl"
          style="--child-i: 1"
        >
          {{ portfolio.title }}
        </h1>
        <p
          class="lp-reveal-child max-w-xl text-sm leading-relaxed text-[var(--text-muted)]"
          style="--child-i: 2"
        >
          {{ portfolio.subtitle }}
        </p>
      </section>

      <section
        v-if="portfolio.featuredImageUrl"
        class="px-5 pb-10 md:px-10 lg:px-14"
      >
        <div class="relative aspect-[16/9] overflow-hidden bg-[var(--icon-bg)] md:aspect-[21/9]">
          <img
            :src="portfolio.featuredImageUrl"
            :alt="portfolio.title"
            class="lp-reveal-media h-full w-full object-cover"
            referrerpolicy="no-referrer"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </section>

      <template
        v-if="
          portfolio.showGallery &&
          (portfolio.items.length > 0 || mode === 'preview')
        "
      >
        <section
          v-if="mode === 'preview' && portfolio.items.length === 0"
          class="px-5 py-16 md:px-10 lg:px-14"
        >
          <div
            class="rounded-sm border border-dashed border-[var(--border-color)] px-6 py-20 text-center"
          >
            <p class="text-sm text-[var(--text-muted)]">
              Galleries will appear here once selected from Client Gallery.
            </p>
          </div>
        </section>
        <template v-else>
          <section class="px-5 pb-6 md:px-10 lg:px-14">
            <div class="flex flex-wrap gap-x-6 gap-y-2">
              <button
                v-for="cat in portfolio.categories"
                :key="cat.id"
                type="button"
                class="text-[10px] font-medium uppercase tracking-[0.22em] transition-colors"
                :class="
                  activeCategoryId === cat.id
                    ? 'text-[var(--text-main)] underline underline-offset-8'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                "
                @click="activeCategoryId = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>
          </section>

          <section class="px-5 pb-16 md:px-10 md:pb-24 lg:px-14">
            <div class="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10">
              <article
                v-for="(item, index) in filteredItems"
                :key="item.id"
                class="group"
                :class="[
                  index % 2 === 1 ? 'sm:mt-14 lg:mt-20' : '',
                  item.url ? 'cursor-pointer' : '',
                ]"
                @click="item.url && openGalleryLink(item.url)"
              >
                <div class="aspect-[3/4] overflow-hidden bg-[var(--icon-bg)]">
                  <img
                    :src="item.imageUrl"
                    :alt="item.title"
                    class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    referrerpolicy="no-referrer"
                  />
                </div>
                <div class="mt-3 space-y-0.5">
                  <h3 class="font-title text-lg tracking-tight text-[var(--text-main)]">
                    {{ item.title }}
                  </h3>
                  <p class="text-xs text-[var(--text-muted)]">{{ item.subtitle }}</p>
                </div>
              </article>
            </div>
          </section>
        </template>
      </template>

      <section
        v-if="portfolio.showCta"
        class="relative overflow-hidden bg-zinc-950 px-5 py-20 text-white md:px-10 md:py-28 lg:px-14"
      >
        <div class="relative z-10 max-w-3xl">
          <p class="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-white/60">
            {{ portfolio.ctaSectionLabel }}
          </p>
          <h2 class="mb-8 font-title text-4xl tracking-tight md:text-5xl">
            {{ portfolio.ctaHeading }}
          </h2>
          <div class="flex flex-wrap gap-3">
            <button
              v-if="primaryCta"
              type="button"
              class="border border-white bg-white px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-80"
              :class="buttonRadiusClass"
              @click="onCtaClick(primaryCta.url)"
            >
              {{ primaryCta.label }}
            </button>
            <button
              v-if="secondaryCta"
              type="button"
              class="border border-white/60 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/10"
              :class="buttonRadiusClass"
              @click="onCtaClick(secondaryCta.url)"
            >
              {{ secondaryCta.label }}
            </button>
          </div>
        </div>
      </section>
    </LookbookSiteChrome>
  </div>
</template>
