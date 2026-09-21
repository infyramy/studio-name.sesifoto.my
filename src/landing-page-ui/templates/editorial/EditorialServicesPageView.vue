<script setup lang="ts">
import { computed, toRef } from "vue";
import EditorialSiteChrome from "./EditorialSiteChrome.vue";
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

    <EditorialSiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <section class="mx-auto max-w-4xl px-4 pb-10 pt-14 text-center md:px-8 md:pt-20">
        <p
          class="lp-reveal-child mb-4 text-[10px] font-medium tracking-[0.35em] uppercase text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ services.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child font-title text-4xl tracking-wide text-[var(--text-main)] md:text-6xl"
          style="--child-i: 1"
        >
          {{ services.title }}
        </h1>
      </section>

      <section
        v-for="category in services.categories"
        :key="category.id"
        class="mx-auto max-w-4xl px-4 pb-16 md:px-8"
      >
        <h2
          class="mb-2 text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--text-muted)]"
        >
          {{ category.label }}
        </h2>
        <div class="mb-2 border-t border-[var(--border-color)]" />

        <article
          v-for="(pkg, index) in category.packages"
          :key="pkg.id"
          class="grid items-center gap-4 border-b border-[var(--border-color)] py-8 md:grid-cols-[4rem_5rem_1fr_auto] md:gap-8"
        >
          <p class="font-title text-3xl text-[var(--text-muted)]">
            {{ String(index + 1).padStart(2, "0") }}
          </p>
          <div class="hidden h-20 w-16 overflow-hidden bg-[var(--icon-bg)] md:block">
            <img
              :src="pkg.imageUrl"
              :alt="pkg.title"
              class="h-full w-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <div>
            <h3 class="font-title text-2xl tracking-wide text-[var(--text-main)]">
              {{ pkg.title }}
            </h3>
            <p class="mt-1 text-sm text-[var(--text-muted)]">{{ pkg.price }}</p>
          </div>
          <button
            type="button"
            class="justify-self-start text-[10px] font-medium tracking-[0.2em] uppercase underline underline-offset-4 text-[var(--text-main)] hover:opacity-70 md:justify-self-end"
            @click="onDetailClick(pkg.detailUrl)"
          >
            {{ pkg.detailLabel }}
          </button>
        </article>
      </section>

      <section
        v-if="services.showCta"
        class="mx-auto max-w-3xl px-4 pb-20 text-center md:px-8 md:pb-28"
      >
        <img
          v-if="services.ctaImageUrl"
          :src="services.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-20 w-32 object-cover"
          referrerpolicy="no-referrer"
        />
        <h2
          class="mx-auto mb-8 max-w-lg font-title text-3xl tracking-wide text-[var(--text-main)] md:text-4xl"
        >
          {{ services.ctaHeading }}
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
            @click="onDetailClick(primaryCta.url)"
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
            @click="onDetailClick(secondaryCta.url)"
          >
            {{ secondaryCta.label }}
          </button>
        </div>
      </section>
    </EditorialSiteChrome>
  </div>
</template>
