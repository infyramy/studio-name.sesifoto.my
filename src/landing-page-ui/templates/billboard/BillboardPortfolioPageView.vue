<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import BillboardSiteChrome from "./BillboardSiteChrome.vue";
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

    <BillboardSiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <section class="border-b border-[var(--border-color)] px-4 py-10 md:px-6 md:py-14">
        <p
          class="lp-reveal-child mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ portfolio.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child mb-3 font-title text-5xl tracking-tight text-[var(--text-main)] md:text-7xl"
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
        class="border-b border-[var(--border-color)] px-4 py-6 md:px-6"
      >
        <div class="relative overflow-hidden border-4 border-[var(--text-main)]">
          <img
            :src="portfolio.featuredImageUrl"
            :alt="portfolio.title"
            class="lp-reveal-media max-h-[60vh] w-full object-cover"
            referrerpolicy="no-referrer"
          />
          <div
            class="absolute bottom-0 left-0 px-3 py-2 text-[10px] font-semibold tracking-[0.14em]"
            :style="{
              backgroundColor: styleConfig.primaryColor,
              color: styleConfig.primaryTextColor,
            }"
          >
            Featured
          </div>
        </div>
      </section>

      <section class="px-4 py-5 md:px-6">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in portfolio.categories"
            :key="cat.id"
            type="button"
            class="border-2 px-3 py-1.5 text-xs font-semibold tracking-[0.08em] capitalize"
            :class="
              activeCategoryId === cat.id
                ? 'border-transparent'
                : 'border-[var(--text-main)] text-[var(--text-main)]'
            "
            :style="
              activeCategoryId === cat.id
                ? {
                    backgroundColor: styleConfig.primaryColor,
                    color: styleConfig.primaryTextColor,
                  }
                : undefined
            "
            @click="activeCategoryId = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>
      </section>

      <section class="px-4 pb-14 md:px-6 md:pb-20">
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(item, index) in filteredItems"
            :key="item.id"
            class="group"
            :class="index % 3 === 1 ? 'lg:mt-8' : ''"
          >
            <div class="overflow-hidden border-4 border-[var(--text-main)] bg-[var(--icon-bg)]">
              <div class="aspect-[3/4]">
                <img
                  :src="item.imageUrl"
                  :alt="item.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  referrerpolicy="no-referrer"
                />
              </div>
              <div
                class="space-y-0.5 px-3 py-2"
                :style="{
                  backgroundColor: styleConfig.primaryColor,
                  color: styleConfig.primaryTextColor,
                }"
              >
                <h3 class="truncate font-title text-base">{{ item.title }}</h3>
                <p class="truncate text-[10px] opacity-75">{{ item.subtitle }}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        v-if="portfolio.showCta"
        class="px-4 py-12 md:px-6 md:py-16"
        :style="{
          backgroundColor: styleConfig.primaryColor,
          color: styleConfig.primaryTextColor,
        }"
      >
        <p class="mb-2 text-xs font-semibold tracking-[0.14em] opacity-75">
          {{ portfolio.ctaSectionLabel }}
        </p>
        <h2 class="mb-8 max-w-3xl font-title text-4xl tracking-tight md:text-5xl">
          {{ portfolio.ctaHeading }}
        </h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="primaryCta"
            type="button"
            class="border-2 px-5 py-3 text-sm font-semibold"
            :class="buttonRadiusClass"
            :style="{ borderColor: 'currentColor', background: 'transparent' }"
            @click="onCtaClick(primaryCta.url)"
          >
            {{ primaryCta.label }}
          </button>
          <button
            v-if="secondaryCta"
            type="button"
            class="px-5 py-3 text-sm font-semibold"
            :class="buttonRadiusClass"
            :style="{
              backgroundColor: styleConfig.primaryTextColor,
              color: styleConfig.primaryColor,
            }"
            @click="onCtaClick(secondaryCta.url)"
          >
            {{ secondaryCta.label }}
          </button>
        </div>
      </section>
    </BillboardSiteChrome>
  </div>
</template>
