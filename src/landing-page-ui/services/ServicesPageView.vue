<script setup lang="ts">
import { computed, toRef } from "vue";
import SiteChrome from "../portfolio/SiteChrome.vue";
import LandingPageBootState from "../LandingPageBootState.vue";
import type { ServicesPageConfig } from "./types";
import type { LandingPageTheme, StudioLanguage } from "../types";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";
import { resolveHomeCtaPreset } from "../home-marketing/cta-presets";
import { useServicesLayout } from "./useServicesLayout";
import { useLandingPageStyles } from "../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    services: ServicesPageConfig;
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

const styleRef = toRef(props, "styleConfig");
const previewLayoutRef = toRef(props, "previewLayout");
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);
const layout = useServicesLayout(previewLayoutRef);

const primaryCta = computed(() =>
  resolveHomeCtaPreset(props.services.ctaPrimaryPreset, props.language),
);

const secondaryCta = computed(() =>
  resolveHomeCtaPreset(props.services.ctaSecondaryPreset, props.language),
);

function packageClass(
  columns: 2 | 3,
  index: number,
  total: number,
): string {
  if (props.previewLayout === "mobile" || props.previewLayout === "tablet") {
    return "";
  }
  if (columns !== 3 || total % 3 !== 1 || index !== total - 1) return "";
  return "col-span-full max-w-xs mx-auto";
}

function onDetailClick(url: string) {
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
          class="lp-reveal-child mb-4 text-xs font-medium tracking-[0.25em] text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ services.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child"
          :class="layout.heroTitleClass"
          style="--child-i: 1"
        >
          {{ services.title }}
        </h1>
      </section>

      <!-- Categories -->
      <section
        v-for="category in services.categories"
        :key="category.id"
        :class="layout.categorySectionClass"
      >
        <h2
          class="mb-4 text-xs font-semibold tracking-[0.2em] text-[var(--text-main)]"
        >
          {{ category.label }}
        </h2>
        <div class="mb-8 border-t border-[var(--border-color)]" />

        <div :class="layout.packageGridClass(category.columns)">
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
              class="mt-3 text-xs font-medium tracking-wide underline underline-offset-4 text-[var(--text-main)] hover:opacity-70 transition-opacity"
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
        :class="layout.ctaSectionClass"
      >
        <img
          v-if="services.ctaImageUrl"
          :src="services.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-24 w-40 object-cover rounded-sm"
          referrerpolicy="no-referrer"
        />
        <h2
          class="max-w-lg mx-auto"
          :class="layout.ctaHeadingClass"
        >
          {{ services.ctaHeading }}
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
            @click="onDetailClick(primaryCta.url)"
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
            @click="onDetailClick(secondaryCta.url)"
          >
            {{ secondaryCta.label }}
          </button>
        </div>
      </section>
    </SiteChrome>
  </div>
</template>
