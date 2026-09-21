<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import AtelierSiteChrome from "./AtelierSiteChrome.vue";
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

    <AtelierSiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <section class="px-4 pb-6 pt-10 md:px-8 md:pt-12">
        <p
          class="lp-reveal-child mb-2 text-[10px] tracking-[0.2em] text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ portfolio.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child mb-3 font-title text-4xl tracking-tight text-[var(--text-main)] md:text-6xl"
          style="--child-i: 1"
        >
          {{ portfolio.title }}
        </h1>
        <p
          class="lp-reveal-child max-w-lg text-sm leading-relaxed text-[var(--text-muted)]"
          style="--child-i: 2"
        >
          {{ portfolio.subtitle }}
        </p>
      </section>

      <section
        v-if="portfolio.featuredImageUrl"
        class="px-3 pb-6 md:px-4"
      >
        <div class="relative overflow-hidden">
          <img
            :src="portfolio.featuredImageUrl"
            :alt="portfolio.title"
            class="lp-reveal-media max-h-[55vh] w-full object-cover"
            referrerpolicy="no-referrer"
          />
          <span
            class="absolute left-3 top-3 border border-white/50 bg-black/35 px-2 py-1 text-[10px] tracking-[0.16em] text-white"
          >
            Featured
          </span>
        </div>
      </section>

      <section class="px-4 pb-4 md:px-8">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in portfolio.categories"
            :key="cat.id"
            type="button"
            class="border px-3 py-1.5 text-[11px] tracking-[0.1em] capitalize transition-colors"
            :class="
              activeCategoryId === cat.id
                ? 'border-[var(--text-main)] text-[var(--text-main)]'
                : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            "
            @click="activeCategoryId = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>
      </section>

      <section class="px-3 pb-14 md:px-4 md:pb-20">
        <div class="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 md:gap-1.5">
          <article
            v-for="(item, index) in filteredItems"
            :key="item.id"
            class="group relative aspect-square overflow-hidden bg-[var(--icon-bg)]"
          >
            <img
              :src="item.imageUrl"
              :alt="item.title"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              referrerpolicy="no-referrer"
            />
            <div
              class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <h3 class="truncate font-title text-sm text-white">{{ item.title }}</h3>
              <p class="truncate text-[10px] text-white/70">
                {{ item.subtitle || String(index + 1).padStart(2, "0") }}
              </p>
            </div>
          </article>
        </div>
      </section>

      <section
        v-if="portfolio.showCta"
        class="px-4 pb-16 md:px-8 md:pb-24"
      >
        <div class="relative overflow-hidden border border-[var(--border-color)]">
          <img
            v-if="portfolio.ctaImageUrl"
            :src="portfolio.ctaImageUrl"
            alt=""
            class="absolute inset-0 h-full w-full object-cover opacity-25"
            referrerpolicy="no-referrer"
          />
          <div class="relative space-y-5 px-6 py-12 md:px-10 md:py-14">
            <p class="text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
              {{ portfolio.ctaSectionLabel }}
            </p>
            <h2 class="max-w-xl font-title text-3xl tracking-tight text-[var(--text-main)] md:text-4xl">
              {{ portfolio.ctaHeading }}
            </h2>
            <div class="flex flex-wrap gap-3">
              <button
                v-if="primaryCta"
                type="button"
                class="px-5 py-3 text-xs tracking-[0.12em]"
                :class="buttonRadiusClass"
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
                class="border px-5 py-3 text-xs tracking-[0.12em]"
                :class="buttonRadiusClass"
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
          </div>
        </div>
      </section>
    </AtelierSiteChrome>
  </div>
</template>
