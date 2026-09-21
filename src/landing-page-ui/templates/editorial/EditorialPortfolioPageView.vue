<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import EditorialSiteChrome from "./EditorialSiteChrome.vue";
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

    <EditorialSiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <section class="mx-auto max-w-4xl px-4 pb-6 pt-14 text-center md:px-8 md:pt-20">
        <p
          class="lp-reveal-child mb-4 text-[10px] font-medium tracking-[0.35em] uppercase text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ portfolio.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child mb-4 font-title text-4xl tracking-wide text-[var(--text-main)] md:text-6xl"
          style="--child-i: 1"
        >
          {{ portfolio.title }}
        </h1>
        <p
          class="lp-reveal-child mx-auto max-w-xl text-sm leading-relaxed text-[var(--text-muted)]"
          style="--child-i: 2"
        >
          {{ portfolio.subtitle }}
        </p>
      </section>

      <section
        v-if="portfolio.featuredImageUrl"
        class="mx-auto max-w-5xl px-4 pb-10 md:px-8"
      >
        <img
          :src="portfolio.featuredImageUrl"
          :alt="portfolio.title"
          class="lp-reveal-media w-full max-h-[70vh] object-cover"
          referrerpolicy="no-referrer"
        />
      </section>

      <section class="mx-auto max-w-5xl px-4 pb-8 md:px-8">
        <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-[var(--border-color)] py-4">
          <button
            v-for="cat in portfolio.categories"
            :key="cat.id"
            type="button"
            class="text-[10px] font-medium tracking-[0.22em] uppercase transition-colors"
            :class="
              activeCategoryId === cat.id
                ? 'text-[var(--text-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            "
            @click="activeCategoryId = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>
      </section>

      <section class="mx-auto max-w-5xl px-4 pb-16 md:px-8 md:pb-24">
        <div class="grid gap-x-8 gap-y-14 sm:grid-cols-2">
          <article v-for="item in filteredItems" :key="item.id" class="group">
            <div class="mb-4 overflow-hidden aspect-[3/4] bg-[var(--icon-bg)]">
              <img
                :src="item.imageUrl"
                :alt="item.title"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                referrerpolicy="no-referrer"
              />
            </div>
            <h3
              class="text-center font-title text-xl tracking-wide text-[var(--text-main)]"
            >
              {{ item.title }}
            </h3>
            <p
              class="mt-1 text-center text-[10px] tracking-[0.18em] uppercase text-[var(--text-muted)]"
            >
              {{ item.subtitle }}
            </p>
          </article>
        </div>
      </section>

      <section
        v-if="portfolio.showCta"
        class="mx-auto max-w-3xl px-4 pb-20 text-center md:px-8 md:pb-28"
      >
        <img
          v-if="portfolio.ctaImageUrl"
          :src="portfolio.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-24 w-24 object-cover"
          referrerpolicy="no-referrer"
        />
        <p
          class="mb-3 text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-muted)]"
        >
          {{ portfolio.ctaSectionLabel }}
        </p>
        <h2
          class="mb-8 font-title text-3xl tracking-wide text-[var(--text-main)] md:text-4xl"
        >
          {{ portfolio.ctaHeading }}
        </h2>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button
            v-if="primaryCta"
            type="button"
            class="px-8 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase"
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
            class="border px-8 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase"
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
      </section>
    </EditorialSiteChrome>
  </div>
</template>
