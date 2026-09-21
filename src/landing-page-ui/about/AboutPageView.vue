<script setup lang="ts">
import { computed, toRef } from "vue";
import SiteChrome from "../portfolio/SiteChrome.vue";
import LandingPageBootState from "../LandingPageBootState.vue";
import type { AboutPageConfig } from "./types";
import type { LandingPageTheme, StudioLanguage } from "../types";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";
import { resolveHomeCtaPreset } from "../home-marketing/cta-presets";
import { useAboutLayout } from "./useAboutLayout";
import { useLandingPageStyles } from "../useLandingPageStyles";

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
const previewLayoutRef = toRef(props, "previewLayout");
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);
const layout = useAboutLayout(previewLayoutRef);

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

    <SiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <!-- Hero intro -->
      <section :class="layout.heroIntroClass">
        <p
          class="lp-reveal-child mb-3 text-xs font-medium tracking-[0.2em] text-[var(--text-muted)]"
          style="--child-i: 0"
        >
          {{ about.sectionLabel }}
        </p>
        <h1
          class="lp-reveal-child"
          :class="layout.heroTitleClass"
          style="--child-i: 1"
        >
          {{ about.title }}
        </h1>
        <p
          class="lp-reveal-child text-base text-[var(--text-muted)] font-light"
          style="--child-i: 2"
        >
          {{ about.subtitle }}
        </p>
      </section>

      <section :class="layout.heroImagesClass">
        <img
          v-if="about.heroImageUrl"
          :src="about.heroImageUrl"
          :alt="about.title"
          class="w-full object-cover grayscale"
          :class="layout.heroImageMaxHeightClass"
          referrerpolicy="no-referrer"
        />
        <img
          v-if="about.teamImageUrl"
          :src="about.teamImageUrl"
          :alt="about.subtitle"
          class="w-full object-cover"
          :class="layout.heroImageMaxHeightClass"
          referrerpolicy="no-referrer"
        />
      </section>

      <!-- Mission -->
      <section :class="layout.missionClass">
        <p :class="layout.missionTextClass">
          {{ about.missionStatement }}
        </p>
      </section>

      <!-- Values -->
      <section :class="layout.sectionPaddingClass">
        <div :class="layout.valuesGridClass">
          <article
            v-for="value in about.values"
            :key="value.id"
            :class="layout.valuesItemClass"
          >
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
      <section :class="layout.processSectionClass">
        <h2 :class="layout.processHeadingClass">
          {{ about.processLabel }}
        </h2>
        <div :class="layout.processGridClass">
          <article
            v-for="step in about.processSteps"
            :key="step.id"
            :class="layout.processItemClass"
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
        :class="layout.sectionPaddingClass"
      >
        <div :class="layout.testimonialGridClass">
          <div
            class="overflow-hidden aspect-[3/4] bg-[var(--icon-bg)]"
            :class="layout.testimonialImageMaxHeightClass"
          >
            <img
              v-if="about.testimonial.imageUrl"
              :src="about.testimonial.imageUrl"
              alt=""
              class="h-full w-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <div>
            <blockquote :class="layout.testimonialQuoteClass">
              "{{ about.testimonial.quote }}"
            </blockquote>
            <p class="text-xs tracking-wide text-[var(--text-muted)]">
              {{ about.testimonial.attribution }}
            </p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section
        v-if="about.showCta"
        :class="layout.ctaSectionClass"
      >
        <img
          v-if="about.ctaImageUrl"
          :src="about.ctaImageUrl"
          alt=""
          class="mx-auto mb-8 h-28 w-28 object-cover rounded-sm"
          referrerpolicy="no-referrer"
        />
        <h2 :class="layout.ctaHeadingClass">
          {{ about.ctaHeading }}
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
            @click="onCtaClick(primaryCta.url)"
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
            @click="onCtaClick(secondaryCta.url)"
          >
            {{ secondaryCta.label }}
          </button>
        </div>
      </section>
    </SiteChrome>
  </div>
</template>
