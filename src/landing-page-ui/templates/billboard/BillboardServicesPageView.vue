<script setup lang="ts">
import { computed, toRef } from "vue";
import BillboardSiteChrome from "./BillboardSiteChrome.vue";
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
        class="border-b border-[var(--border-color)] px-4 py-10 md:px-6"
      >
        <h2
          class="mb-5 inline-block px-3 py-1 text-xs font-semibold tracking-[0.12em]"
          :style="{
            backgroundColor: styleConfig.primaryColor,
            color: styleConfig.primaryTextColor,
          }"
        >
          {{ category.label }}
        </h2>

        <div class="space-y-3">
          <article
            v-for="(pkg, index) in category.packages"
            :key="pkg.id"
            class="grid overflow-hidden border-2 border-[var(--text-main)] md:grid-cols-[7rem_1fr_auto]"
          >
            <div class="aspect-square bg-[var(--icon-bg)] md:aspect-auto">
              <img
                :src="pkg.imageUrl"
                :alt="pkg.title"
                class="h-full w-full object-cover"
                referrerpolicy="no-referrer"
              />
            </div>
            <div class="flex flex-col justify-center px-4 py-4">
              <p class="text-[10px] tracking-[0.14em] text-[var(--text-muted)]">
                {{ String(index + 1).padStart(2, "0") }}
              </p>
              <h3 class="font-title text-xl tracking-tight text-[var(--text-main)] md:text-2xl">
                {{ pkg.title }}
              </h3>
              <p class="text-sm text-[var(--text-muted)]">{{ pkg.price }}</p>
            </div>
            <button
              type="button"
              class="px-5 py-4 text-sm font-semibold tracking-[0.06em]"
              :style="{
                backgroundColor: styleConfig.primaryColor,
                color: styleConfig.primaryTextColor,
              }"
              @click="onDetailClick(pkg.detailUrl)"
            >
              {{ pkg.detailLabel }}
            </button>
          </article>
        </div>
      </section>

      <section
        v-if="services.showCta"
        class="px-4 py-12 md:px-6 md:py-16"
        :style="{
          backgroundColor: styleConfig.primaryColor,
          color: styleConfig.primaryTextColor,
        }"
      >
        <h2 class="mb-8 max-w-3xl font-title text-4xl tracking-tight md:text-5xl">
          {{ services.ctaHeading }}
        </h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="primaryCta"
            type="button"
            class="border-2 px-5 py-3 text-sm font-semibold"
            :class="buttonRadiusClass"
            :style="{ borderColor: 'currentColor', background: 'transparent' }"
            @click="onDetailClick(primaryCta.url)"
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
            @click="onDetailClick(secondaryCta.url)"
          >
            {{ secondaryCta.label }}
          </button>
        </div>
      </section>
    </BillboardSiteChrome>
  </div>
</template>
