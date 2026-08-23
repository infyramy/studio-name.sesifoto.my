<script setup lang="ts">
import { toRef } from "vue";
import SiteChrome from "../portfolio/SiteChrome.vue";
import type { AboutPageConfig } from "./types";
import type { LandingPageTheme, StudioLanguage } from "../types";
import { useLandingPageStyles } from "../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    about: AboutPageConfig;
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

function onCtaClick(url: string) {
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
      <!-- Hero intro -->
      <section class="mx-auto max-w-4xl px-4 pt-12 pb-8 md:px-6 md:pt-16 text-center">
        <p
          class="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
        >
          {{ about.sectionLabel }}
        </p>
        <h1
          class="mb-3 text-4xl md:text-5xl text-[var(--text-main)]"
        >
          {{ about.title }}
        </h1>
        <p class="text-base text-[var(--text-muted)] font-light">
          {{ about.subtitle }}
        </p>
      </section>

      <section class="mx-auto max-w-4xl px-4 md:px-6 space-y-6 pb-12">
        <img
          v-if="about.heroImageUrl"
          :src="about.heroImageUrl"
          :alt="about.title"
          class="w-full max-h-[480px] object-cover grayscale"
          referrerpolicy="no-referrer"
        />
        <img
          v-if="about.teamImageUrl"
          :src="about.teamImageUrl"
          :alt="about.subtitle"
          class="w-full max-h-[480px] object-cover"
          referrerpolicy="no-referrer"
        />
      </section>

      <!-- Mission -->
      <section class="mx-auto max-w-3xl px-4 md:px-6 py-12 text-center">
        <p class="text-lg md:text-xl font-title leading-relaxed text-[var(--text-main)]">
          {{ about.missionStatement }}
        </p>
      </section>

      <!-- Values -->
      <section class="mx-auto max-w-6xl px-4 md:px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <article v-for="value in about.values" :key="value.id">
            <h3 class="mb-3 text-lg text-[var(--text-main)]">
              {{ value.title }}
            </h3>
            <p class="text-sm leading-relaxed text-[var(--text-muted)]">
              {{ value.description }}
            </p>
          </article>
        </div>
      </section>

      <!-- Process -->
      <section class="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <h2
          class="mb-12 text-center text-3xl md:text-4xl text-[var(--text-main)]"
        >
          {{ about.processLabel }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
          <article
            v-for="step in about.processSteps"
            :key="step.id"
            class="text-center"
          >
            <p class="mb-2 text-xs font-medium text-[var(--text-muted)]">
              {{ step.number }}
            </p>
            <h3 class="mb-2 text-sm font-semibold text-[var(--text-main)]">
              {{ step.title }}
            </h3>
            <p class="text-xs leading-relaxed text-[var(--text-muted)]">
              {{ step.description }}
            </p>
          </article>
        </div>
      </section>

      <!-- Testimonial -->
      <section
        v-if="about.showTestimonial"
        class="mx-auto max-w-6xl px-4 md:px-6 py-16"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div class="overflow-hidden aspect-[3/4] max-h-[520px] bg-[var(--icon-bg)]">
            <img
              v-if="about.testimonial.imageUrl"
              :src="about.testimonial.imageUrl"
              alt=""
              class="h-full w-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <div>
            <blockquote
              class="mb-6 text-xl md:text-2xl font-title leading-relaxed text-[var(--text-main)]"
            >
              "{{ about.testimonial.quote }}"
            </blockquote>
            <p class="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {{ about.testimonial.attribution }}
            </p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section
        v-if="about.showCta"
        class="mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center"
      >
        <img
          v-if="about.ctaImageUrl"
          :src="about.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-28 w-28 object-cover rounded-sm"
          referrerpolicy="no-referrer"
        />
        <h2
          class="mb-8 text-2xl md:text-3xl leading-snug text-[var(--text-main)]"
        >
          {{ about.ctaHeading }}
        </h2>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            class="min-w-[200px] px-6 py-3 text-xs font-semibold uppercase tracking-wider"
            :class="buttonRadiusClass"
            :style="{
              backgroundColor: styleConfig.primaryColor,
              color: styleConfig.primaryTextColor,
            }"
            @click="onCtaClick(about.ctaPrimaryUrl)"
          >
            {{ about.ctaPrimaryLabel }}
          </button>
          <button
            type="button"
            class="min-w-[200px] px-6 py-3 text-xs font-semibold uppercase tracking-wider border"
            :class="buttonRadiusClass"
            :style="{
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              backgroundColor: 'transparent',
            }"
            @click="onCtaClick(about.ctaSecondaryUrl)"
          >
            {{ about.ctaSecondaryLabel }}
          </button>
        </div>
      </section>
    </SiteChrome>
  </div>
</template>
