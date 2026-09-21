<script setup lang="ts">
import { computed, toRef } from "vue";
import AtelierSiteChrome from "./AtelierSiteChrome.vue";
import LandingPageBootState from "../../LandingPageBootState.vue";
import type { ServicesPageConfig } from "../../services/types";
import type { LandingPageTheme, StudioLanguage } from "../../types";
import type { HomePreviewLayout } from "../../home-marketing/useHomeLayout";
import { resolveHomeCtaPreset } from "../../home-marketing/cta-presets";
import { useLandingPageStyles } from "../../useLandingPageStyles";

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
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);

const primaryCta = computed(() =>
  resolveHomeCtaPreset(props.services.ctaPrimaryPreset, props.language),
);

const secondaryCta = computed(() =>
  resolveHomeCtaPreset(props.services.ctaSecondaryPreset, props.language),
);

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

    <AtelierSiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <section class="px-4 pb-8 pt-10 md:px-8 md:pt-12">
        <p
          class="lp-reveal-child mb-2 text-[10px] tracking-[0.2em] text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ services.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child font-title text-4xl tracking-tight text-[var(--text-main)] md:text-6xl"
          style="--child-i: 1"
        >
          {{ services.title }}
        </h1>
      </section>

      <section
        v-for="category in services.categories"
        :key="category.id"
        class="pb-12"
      >
        <div class="mb-4 flex items-center gap-3 px-4 md:px-8">
          <h2 class="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">
            {{ category.label }}
          </h2>
          <div class="h-px flex-1 bg-[var(--border-color)]" />
        </div>

        <div class="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:gap-4 md:px-8">
          <article
            v-for="(pkg, index) in category.packages"
            :key="pkg.id"
            class="w-[70vw] max-w-xs shrink-0 border border-[var(--border-color)] sm:w-64"
          >
            <div class="relative aspect-[4/5] overflow-hidden bg-[var(--icon-bg)]">
              <img
                :src="pkg.imageUrl"
                :alt="pkg.title"
                class="h-full w-full object-cover"
                referrerpolicy="no-referrer"
              />
              <span
                class="absolute left-2 top-2 border border-white/50 bg-black/35 px-1.5 py-0.5 text-[10px] tracking-[0.14em] text-white"
              >
                {{ String(index + 1).padStart(2, "0") }}
              </span>
            </div>
            <div class="space-y-2 p-4">
              <h3 class="font-title text-xl tracking-tight text-[var(--text-main)]">
                {{ pkg.title }}
              </h3>
              <p class="text-sm text-[var(--text-muted)]">{{ pkg.price }}</p>
              <button
                type="button"
                class="text-[11px] tracking-[0.1em] text-[var(--text-main)] underline-offset-4 hover:underline"
                @click="onDetailClick(pkg.detailUrl)"
              >
                {{ pkg.detailLabel }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section
        v-if="services.showCta"
        class="px-4 pb-16 md:px-8 md:pb-24"
      >
        <div class="relative overflow-hidden border border-[var(--border-color)]">
          <img
            v-if="services.ctaImageUrl"
            :src="services.ctaImageUrl"
            alt=""
            class="absolute inset-0 h-full w-full object-cover opacity-25"
            referrerpolicy="no-referrer"
          />
          <div class="relative space-y-5 px-6 py-12 md:px-10 md:py-14">
            <h2 class="max-w-xl font-title text-3xl tracking-tight text-[var(--text-main)] md:text-4xl">
              {{ services.ctaHeading }}
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
                @click="onDetailClick(primaryCta.url)"
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
                @click="onDetailClick(secondaryCta.url)"
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
