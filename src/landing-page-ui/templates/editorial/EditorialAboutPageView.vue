<script setup lang="ts">
import { computed, toRef } from "vue";
import EditorialSiteChrome from "./EditorialSiteChrome.vue";
import LandingPageBootState from "../../LandingPageBootState.vue";
import type { AboutPageConfig } from "../../about/types";
import type { LandingPageTheme, StudioLanguage } from "../../types";
import type { HomePreviewLayout } from "../../home-marketing/useHomeLayout";
import { resolveHomeCtaPreset } from "../../home-marketing/cta-presets";
import { useLandingPageStyles } from "../../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    about: AboutPageConfig;
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
  resolveHomeCtaPreset(props.about.ctaPrimaryPreset, props.language),
);

const secondaryCta = computed(() =>
  resolveHomeCtaPreset(props.about.ctaSecondaryPreset, props.language),
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
      <section class="mx-auto max-w-3xl px-4 pb-10 pt-14 text-center md:px-8 md:pt-20">
        <p
          class="lp-reveal-child mb-4 text-[10px] font-medium tracking-[0.35em] uppercase text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ about.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child mb-4 font-title text-4xl tracking-wide text-[var(--text-main)] md:text-6xl"
          style="--child-i: 1"
        >
          {{ about.title }}
        </h1>
        <p
          class="lp-reveal-child text-sm leading-relaxed text-[var(--text-muted)]"
          style="--child-i: 2"
        >
          {{ about.subtitle }}
        </p>
      </section>

      <section
        v-if="about.heroImageUrl || about.teamImageUrl"
        class="mx-auto max-w-md px-4 pb-12 md:px-8"
      >
        <img
          v-if="about.heroImageUrl"
          :src="about.heroImageUrl"
          :alt="about.title"
          class="mb-4 w-full object-cover grayscale"
          referrerpolicy="no-referrer"
        />
        <img
          v-if="about.teamImageUrl"
          :src="about.teamImageUrl"
          :alt="about.subtitle"
          class="w-full object-cover"
          referrerpolicy="no-referrer"
        />
      </section>

      <section
        v-if="about.showMission"
        class="mx-auto max-w-2xl px-4 pb-16 md:px-8"
      >
        <p
          class="text-center font-title text-2xl leading-relaxed tracking-wide text-[var(--text-main)] md:text-3xl"
        >
          {{ about.missionStatement }}
        </p>
      </section>

      <section
        v-if="about.showValues"
        class="mx-auto max-w-2xl space-y-10 px-4 pb-16 md:px-8"
      >
        <article
          v-for="value in about.values"
          :key="value.id"
          class="border-t border-[var(--border-color)] pt-8"
        >
          <h3 class="mb-3 font-title text-2xl tracking-wide text-[var(--text-main)]">
            {{ value.title }}
          </h3>
          <p class="text-sm leading-relaxed text-[var(--text-muted)]">
            {{ value.description }}
          </p>
        </article>
      </section>

      <section
        v-if="about.showProcess"
        class="mx-auto max-w-2xl px-4 pb-16 md:px-8"
      >
        <h2
          class="mb-8 text-center font-title text-3xl tracking-wide text-[var(--text-main)]"
        >
          {{ about.processLabel }}
        </h2>
        <article
          v-for="step in about.processSteps"
          :key="step.id"
          class="grid gap-2 border-t border-[var(--border-color)] py-8 md:grid-cols-[4rem_1fr]"
        >
          <p class="font-title text-2xl text-[var(--text-muted)]">
            {{ step.number }}
          </p>
          <div>
            <h3 class="mb-2 text-sm font-semibold tracking-wide text-[var(--text-main)]">
              {{ step.title }}
            </h3>
            <p class="text-sm leading-relaxed text-[var(--text-muted)]">
              {{ step.description }}
            </p>
          </div>
        </article>
      </section>

      <section
        v-if="about.showTestimonial"
        class="mx-auto max-w-2xl px-4 pb-16 md:px-8"
      >
        <div
          v-if="about.testimonial.imageUrl"
          class="mx-auto mb-8 aspect-[3/4] max-h-[360px] w-full max-w-xs overflow-hidden bg-[var(--icon-bg)]"
        >
          <img
            :src="about.testimonial.imageUrl"
            alt=""
            class="h-full w-full object-cover"
            referrerpolicy="no-referrer"
          />
        </div>
        <blockquote
          class="mb-4 text-center font-title text-2xl leading-relaxed tracking-wide text-[var(--text-main)]"
        >
          "{{ about.testimonial.quote }}"
        </blockquote>
        <p
          class="text-center text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)]"
        >
          {{ about.testimonial.attribution }}
        </p>
      </section>

      <section
        v-if="about.showCta"
        class="mx-auto max-w-3xl px-4 pb-20 text-center md:px-8 md:pb-28"
      >
        <img
          v-if="about.ctaImageUrl"
          :src="about.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-24 w-24 object-cover"
          referrerpolicy="no-referrer"
        />
        <h2
          class="mb-8 font-title text-3xl tracking-wide text-[var(--text-main)] md:text-4xl"
        >
          {{ about.ctaHeading }}
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
