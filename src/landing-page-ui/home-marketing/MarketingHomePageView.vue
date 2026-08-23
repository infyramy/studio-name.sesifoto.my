<script setup lang="ts">
import { computed, toRef } from "vue";
import SiteChrome from "../portfolio/SiteChrome.vue";
import { tLandingPage } from "../i18n";
import { resolveHomeCtaPreset } from "./cta-presets";
import { normalizeHomeSectionOrder } from "./section-order";
import HomeFaqAccordionItem from "./HomeFaqAccordionItem.vue";
import {
  useHomeLayout,
  type HomePreviewLayout,
} from "./useHomeLayout";
import type { LandingPageTheme, StudioLanguage } from "../types";
import { useLandingPageStyles } from "../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    config: LandingPageTheme;
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

const styleRef = toRef(props, "config");
const previewLayoutRef = toRef(props, "previewLayout");
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);
const layout = useHomeLayout(previewLayoutRef);

const homeSectionOrder = computed(() =>
  normalizeHomeSectionOrder(props.config.homeSectionOrder),
);

const primaryCta = computed(() =>
  resolveHomeCtaPreset(props.config.homeCtaPrimaryPreset, props.language),
);

const secondaryCta = computed(() =>
  resolveHomeCtaPreset(props.config.homeCtaSecondaryPreset, props.language),
);

function onCtaClick(url: string) {
  emit("navigate", url);
}
</script>

<template>
  <div :class="['min-h-full w-full max-w-full overflow-x-hidden', surfaceClass]">
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
      :style-config="config"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <template v-for="sectionKey in homeSectionOrder" :key="sectionKey">
        <!-- Hero -->
        <section
          v-if="sectionKey === 'hero'"
          class="relative w-full overflow-hidden"
        >
          <div :class="layout.heroGridClass">
            <div
              :class="[layout.heroContentPaddingClass, layout.heroTextOrderClass]"
            >
              <p
                class="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
              >
                {{ config.heroSubtitle }}
              </p>
              <h1 :class="layout.heroTitleClass">
                {{ config.heroTagline }}
              </h1>
              <button
                type="button"
                class="self-start px-5 py-3 text-xs font-semibold uppercase tracking-wider border sm:px-6"
                :class="buttonRadiusClass"
                :style="{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                  backgroundColor: 'transparent',
                }"
                @click="onCtaClick('/portfolio')"
              >
                {{ tLandingPage(language, 'homeHeroCta') }}
              </button>
            </div>
            <div
              :class="[
                'relative overflow-hidden',
                layout.heroImageOrderClass,
                layout.heroImageMinHeightClass,
              ]"
            >
              <img
                v-if="config.heroUrl"
                :src="config.heroUrl"
                :alt="config.heroTagline"
                class="absolute inset-0 h-full w-full object-cover"
                referrerpolicy="no-referrer"
              />
            </div>
          </div>
        </section>

        <!-- Gallery -->
        <section
          v-else-if="sectionKey === 'gallery' && config.showHomeGallery"
          :class="layout.sectionPaddingClass"
        >
          <p
            class="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
          >
            {{ tLandingPage(language, 'homeGalleryLabel') }}
          </p>
          <h2 :class="layout.sectionHeadingClass">
            {{ tLandingPage(language, 'homeGalleryTitle') }}
          </h2>
          <div :class="layout.galleryGridClass">
            <article
              v-for="item in config.galleryItems"
              :key="item.id"
              :class="['group', layout.galleryItemClass]"
            >
              <div class="mb-3 aspect-[3/4] overflow-hidden bg-[var(--icon-bg)]">
                <img
                  :src="item.imageUrl"
                  :alt="item.caption"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  referrerpolicy="no-referrer"
                />
              </div>
              <p
                class="break-words text-xs uppercase tracking-wide text-[var(--text-muted)]"
              >
                {{ item.caption }}
              </p>
            </article>
          </div>
          <button
            type="button"
            class="mt-8 px-6 py-3 text-xs font-semibold uppercase tracking-wider border sm:mt-10 sm:px-8"
            :class="buttonRadiusClass"
            :style="{
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }"
            @click="onCtaClick('/portfolio')"
          >
            {{ tLandingPage(language, 'homeGalleryViewAll') }}
          </button>
        </section>

        <!-- Quote -->
        <section
          v-else-if="sectionKey === 'quote' && config.showHomeQuote"
          :class="layout.quoteSectionClass"
        >
          <p :class="layout.quoteTextClass">
            {{ config.quoteText }}
          </p>
        </section>

        <!-- Packages -->
        <section
          v-else-if="sectionKey === 'packages' && config.showHomePackages"
          :class="layout.sectionPaddingClass"
        >
          <p
            class="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
          >
            {{ tLandingPage(language, 'homePackagesLabel') }}
          </p>
          <h2 :class="layout.sectionHeadingClass">
            {{ tLandingPage(language, 'homePackagesTitle') }}
          </h2>
          <div :class="layout.packagesGridClass">
            <article
              v-for="pkg in config.featuredPackages"
              :key="pkg.id"
              :class="layout.packagesItemClass"
            >
              <div class="mb-4 aspect-[4/5] overflow-hidden bg-[var(--icon-bg)]">
                <img
                  :src="pkg.imageUrl"
                  :alt="pkg.title"
                  class="h-full w-full object-cover"
                  referrerpolicy="no-referrer"
                />
              </div>
              <h3
                class="break-words text-sm font-bold uppercase tracking-wide text-[var(--text-main)]"
              >
                {{ pkg.title }}
              </h3>
              <p class="mt-1 mb-4 text-sm text-[var(--text-muted)]">{{ pkg.price }}</p>
              <button
                type="button"
                class="px-5 py-2 text-xs font-semibold uppercase tracking-wider border"
                :class="buttonRadiusClass"
                :style="{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }"
                @click="onCtaClick(pkg.detailUrl)"
              >
                {{ tLandingPage(language, 'homePackageChoose') }}
              </button>
            </article>
          </div>
          <button
            type="button"
            class="mt-8 px-6 py-3 text-xs font-semibold uppercase tracking-wider border sm:mt-10 sm:px-8"
            :class="buttonRadiusClass"
            :style="{
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }"
            @click="onCtaClick('/services')"
          >
            {{ tLandingPage(language, 'homePackagesViewAll') }}
          </button>
        </section>

        <!-- About snippet -->
        <section
          v-else-if="sectionKey === 'about' && config.showHomeAbout"
          :class="layout.sectionPaddingPlainClass"
        >
          <div :class="layout.aboutGridClass">
            <div
              class="mx-auto w-full max-w-md overflow-hidden aspect-[3/4] max-h-[360px] bg-[var(--icon-bg)] sm:max-h-[420px] md:max-h-[480px]"
            >
              <img
                v-if="config.aboutSnippetImageUrl"
                :src="config.aboutSnippetImageUrl"
                alt=""
                class="h-full w-full object-cover grayscale"
                referrerpolicy="no-referrer"
              />
            </div>
            <div :class="layout.aboutTextClass">
              <p
                class="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
              >
                {{ config.aboutSnippetLabel }}
              </p>
              <p
                class="mb-6 break-words text-base leading-relaxed text-[var(--text-muted)]"
              >
                {{ config.aboutSnippetText }}
              </p>
              <button
                type="button"
                class="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] hover:opacity-70"
                @click="onCtaClick('/about-us')"
              >
                {{ config.aboutSnippetCtaLabel }} →
              </button>
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section
          v-else-if="sectionKey === 'faq' && config.showHomeFaq && config.faqs.length"
          id="faq"
          :class="layout.sectionPaddingClass"
        >
          <p
            class="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
          >
            {{ tLandingPage(language, 'homeFaqLabel') }}
          </p>
          <h2 :class="layout.sectionHeadingClass">
            {{ tLandingPage(language, 'homeFaqTitle') }}
          </h2>
          <div :class="layout.faqListClass">
            <HomeFaqAccordionItem
              v-for="faq in config.faqs"
              :key="faq.id"
              :question="faq.question"
              :answer="faq.answer"
            />
          </div>
        </section>

        <!-- CTA -->
        <section
          v-else-if="sectionKey === 'bottom-cta' && config.showHomeCta"
          class="mx-auto max-w-3xl px-4 pb-16 pt-2 text-center md:px-6 md:pb-20"
        >
          <img
            v-if="config.homeCtaImageUrl"
            :src="config.homeCtaImageUrl"
            alt=""
            class="mx-auto mb-6 h-24 w-24 object-cover rounded-sm sm:mb-8 sm:h-28 sm:w-28"
            referrerpolicy="no-referrer"
          />
          <h2
            class="mb-6 break-words text-xl leading-snug text-[var(--text-main)] sm:mb-8 sm:text-2xl md:text-3xl"
          >
            {{ config.homeCtaHeading }}
          </h2>
          <div :class="layout.ctaButtonsClass">
            <button
              v-if="primaryCta"
              type="button"
              :class="[layout.ctaButtonClass, buttonRadiusClass]"
              :style="{
                backgroundColor: config.primaryColor,
                color: config.primaryTextColor,
              }"
              @click="onCtaClick(primaryCta.url)"
            >
              {{ primaryCta.label }}
            </button>
            <button
              v-if="secondaryCta"
              type="button"
              :class="[layout.ctaButtonClass, buttonRadiusClass, 'border']"
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
      </template>
    </SiteChrome>
  </div>
</template>
