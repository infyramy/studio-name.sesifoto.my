<script setup lang="ts">
import { computed, toRef } from "vue";
import LookbookSiteChrome from "./LookbookSiteChrome.vue";
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
          {{ services.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child font-title text-5xl tracking-tight text-[var(--text-main)] md:text-7xl"
          style="--child-i: 1"
        >
          {{ services.title }}
        </h1>
      </section>

      <section
        v-for="category in services.categories"
        :key="category.id"
        class="px-5 pb-16 md:px-10 md:pb-20 lg:px-14"
      >
        <h2
          class="mb-8 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]"
        >
          {{ category.label }}
        </h2>

        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          <article
            v-for="(pkg, index) in category.packages"
            :key="pkg.id"
            class="group"
          >
            <div class="relative aspect-[3/4] overflow-hidden bg-[var(--icon-bg)]">
              <img
                :src="pkg.imageUrl"
                :alt="pkg.title"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                referrerpolicy="no-referrer"
              />
              <span
                class="absolute left-3 top-3 text-[10px] tracking-[0.2em] text-white/90 mix-blend-difference"
              >
                {{ String(index + 1).padStart(2, "0") }}
              </span>
            </div>
            <div class="mt-4 space-y-1">
              <h3 class="font-title text-xl tracking-tight text-[var(--text-main)] md:text-2xl">
                {{ pkg.title }}
              </h3>
              <p class="text-sm text-[var(--text-muted)]">{{ pkg.price }}</p>
              <button
                type="button"
                class="pt-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-main)] underline-offset-8 hover:underline"
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
        class="relative overflow-hidden bg-zinc-950 px-5 py-20 text-white md:px-10 md:py-28 lg:px-14"
      >
        <h2 class="mb-8 max-w-3xl font-title text-4xl tracking-tight md:text-5xl">
          {{ services.ctaHeading }}
        </h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="primaryCta"
            type="button"
            class="border border-white bg-white px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-80"
            :class="buttonRadiusClass"
            @click="onDetailClick(primaryCta.url)"
          >
            {{ primaryCta.label }}
          </button>
          <button
            v-if="secondaryCta"
            type="button"
            class="border border-white/60 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/10"
            :class="buttonRadiusClass"
            @click="onDetailClick(secondaryCta.url)"
          >
            {{ secondaryCta.label }}
          </button>
        </div>
      </section>
    </LookbookSiteChrome>
  </div>
</template>
