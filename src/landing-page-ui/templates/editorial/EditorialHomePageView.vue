<script setup lang="ts">
import { computed, toRef } from "vue";
import EditorialSiteChrome from "./EditorialSiteChrome.vue";
import LandingPageBootState from "../../LandingPageBootState.vue";
import { tLandingPage } from "../../i18n";
import { resolveHomeCtaPreset } from "../../home-marketing/cta-presets";
import { normalizeHomeSectionOrder } from "../../home-marketing/section-order";
import HomeFaqAccordionItem from "../../home-marketing/HomeFaqAccordionItem.vue";
import type { HomePreviewLayout } from "../../home-marketing/useHomeLayout";
import type { LandingPageTheme, StudioLanguage } from "../../types";
import { useLandingPageStyles } from "../../useLandingPageStyles";

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
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);

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
  <div :class="['min-h-full w-full max-w-full overflow-x-clip', surfaceClass]">
    <component :is="'style'" v-html="themeStyle" />

    <LandingPageBootState
      v-if="loading"
      :theme="config"
      label="Loading"
    />

    <LandingPageBootState
      v-else-if="loadError"
      :theme="config"
      :error="loadError"
      @retry="emit('retryLoad')"
    />

    <EditorialSiteChrome
      v-else
      :style-config="config"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <template v-for="sectionKey in homeSectionOrder" :key="sectionKey">
        <section
          v-if="sectionKey === 'hero'"
          class="relative min-h-[70vh] w-full overflow-hidden md:min-h-[80vh]"
        >
          <img
            v-if="config.heroUrl"
            :src="config.heroUrl"
            :alt="config.heroTagline"
            class="absolute inset-0 h-full w-full object-cover"
            referrerpolicy="no-referrer"
          />
          <div class="absolute inset-0 bg-black/45" />
          <div
            class="relative z-10 mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-end px-4 pb-16 text-center text-white md:min-h-[80vh] md:px-8 md:pb-20"
          >
            <p
              class="lp-reveal-child mb-4 text-[10px] font-medium tracking-[0.35em] uppercase opacity-80"
              style="--child-i: 0"
            >
              {{ config.heroSubtitle }}
            </p>
            <h1
              class="lp-reveal-child mb-8 max-w-3xl font-title text-4xl leading-tight tracking-wide sm:text-5xl md:text-6xl"
              style="--child-i: 1"
            >
              {{ config.heroTagline }}
            </h1>
            <button
              type="button"
              class="lp-reveal-child border border-white/70 px-8 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase text-white transition-opacity hover:opacity-80"
              :class="buttonRadiusClass"
              style="--child-i: 2"
              @click="onCtaClick('/portfolio')"
            >
              {{ tLandingPage(language, "homeHeroCta") }}
            </button>
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'gallery' && config.showHomeGallery"
          class="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24"
        >
          <p
            class="mb-3 text-center text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-muted)]"
          >
            {{ tLandingPage(language, "homeGalleryLabel") }}
          </p>
          <h2
            class="mb-12 text-center font-title text-3xl tracking-wide text-[var(--text-main)] md:text-4xl"
          >
            {{ tLandingPage(language, "homeGalleryTitle") }}
          </h2>
          <div class="grid gap-10 sm:grid-cols-2">
            <article
              v-for="item in config.galleryItems"
              :key="item.id"
              class="group"
            >
              <div class="mb-4 aspect-[3/4] overflow-hidden bg-[var(--icon-bg)]">
                <img
                  :src="item.imageUrl"
                  :alt="item.caption"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  referrerpolicy="no-referrer"
                />
              </div>
              <p
                class="text-center text-xs tracking-[0.18em] uppercase text-[var(--text-muted)]"
              >
                {{ item.caption }}
              </p>
            </article>
          </div>
          <div class="mt-12 text-center">
            <button
              type="button"
              class="border px-8 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase"
              :class="buttonRadiusClass"
              :style="{
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)',
              }"
              @click="onCtaClick('/portfolio')"
            >
              {{ tLandingPage(language, "homeGalleryViewAll") }}
            </button>
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'quote' && config.showHomeQuote"
          class="mx-auto max-w-3xl px-4 py-20 text-center md:px-8 md:py-28"
        >
          <p
            class="font-title text-2xl leading-snug tracking-wide text-[var(--text-main)] md:text-4xl"
          >
            {{ config.quoteText }}
          </p>
        </section>

        <section
          v-else-if="sectionKey === 'packages' && config.showHomePackages"
          class="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24"
        >
          <p
            class="mb-3 text-center text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-muted)]"
          >
            {{ tLandingPage(language, "homePackagesLabel") }}
          </p>
          <h2
            class="mb-12 text-center font-title text-3xl tracking-wide text-[var(--text-main)] md:text-4xl"
          >
            {{ tLandingPage(language, "homePackagesTitle") }}
          </h2>
          <div class="space-y-10">
            <article
              v-for="(pkg, index) in config.featuredPackages"
              :key="pkg.id"
              class="grid items-center gap-6 border-t border-[var(--border-color)] pt-10 md:grid-cols-[auto_1fr_auto] md:gap-10"
            >
              <p
                class="font-title text-4xl text-[var(--text-muted)] md:text-5xl"
              >
                {{ String(index + 1).padStart(2, "0") }}
              </p>
              <div class="flex gap-5">
                <div
                  class="hidden h-28 w-20 shrink-0 overflow-hidden bg-[var(--icon-bg)] sm:block"
                >
                  <img
                    :src="pkg.imageUrl"
                    :alt="pkg.title"
                    class="h-full w-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3
                    class="font-title text-2xl tracking-wide text-[var(--text-main)]"
                  >
                    {{ pkg.title }}
                  </h3>
                  <p class="mt-1 text-sm text-[var(--text-muted)]">
                    {{ pkg.price }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="justify-self-start border px-5 py-2 text-[10px] font-semibold tracking-[0.22em] uppercase md:justify-self-end"
                :class="buttonRadiusClass"
                :style="{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }"
                @click="onCtaClick(pkg.detailUrl)"
              >
                {{ tLandingPage(language, "homePackageChoose") }}
              </button>
            </article>
          </div>
          <div class="mt-12 text-center">
            <button
              type="button"
              class="border px-8 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase"
              :class="buttonRadiusClass"
              :style="{
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)',
              }"
              @click="onCtaClick('/lead-form')"
            >
              {{ tLandingPage(language, "homePackagesViewAll") }}
            </button>
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'about' && config.showHomeAbout"
          class="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24"
        >
          <div
            v-if="config.aboutSnippetImageUrl"
            class="mx-auto mb-10 aspect-[3/4] max-h-[420px] w-full max-w-sm overflow-hidden bg-[var(--icon-bg)]"
          >
            <img
              :src="config.aboutSnippetImageUrl"
              alt=""
              class="h-full w-full object-cover grayscale"
              referrerpolicy="no-referrer"
            />
          </div>
          <p
            class="mb-4 text-center text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-muted)]"
          >
            {{ config.aboutSnippetLabel }}
          </p>
          <p
            class="mb-8 text-center font-title text-xl leading-relaxed text-[var(--text-main)] md:text-2xl"
          >
            {{ config.aboutSnippetText }}
          </p>
          <div class="text-center">
            <button
              type="button"
              class="text-[10px] font-semibold tracking-[0.28em] uppercase text-[var(--text-main)] hover:opacity-70"
              @click="onCtaClick('/portfolio')"
            >
              {{ config.aboutSnippetCtaLabel }} →
            </button>
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'faq' && config.showHomeFaq && config.faqs.length"
          id="faq"
          class="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24"
        >
          <p
            class="mb-3 text-center text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-muted)]"
          >
            {{ tLandingPage(language, "homeFaqLabel") }}
          </p>
          <h2
            class="mb-10 text-center font-title text-3xl tracking-wide text-[var(--text-main)]"
          >
            {{ tLandingPage(language, "homeFaqTitle") }}
          </h2>
          <div class="space-y-0 border-t border-[var(--border-color)]">
            <HomeFaqAccordionItem
              v-for="faq in config.faqs"
              :key="faq.id"
              :question="faq.question"
              :answer="faq.answer"
            />
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'bottom-cta' && config.showHomeCta"
          class="mx-auto max-w-3xl px-4 pb-20 pt-4 text-center md:px-8 md:pb-28"
        >
          <img
            v-if="config.homeCtaImageUrl"
            :src="config.homeCtaImageUrl"
            alt=""
            class="mx-auto mb-8 h-20 w-20 object-cover"
            referrerpolicy="no-referrer"
          />
          <h2
            class="mb-8 font-title text-3xl leading-snug tracking-wide text-[var(--text-main)] md:text-4xl"
          >
            {{ config.homeCtaHeading }}
          </h2>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button
              v-if="primaryCta"
              type="button"
              class="px-8 py-3 text-[10px] font-semibold tracking-[0.28em] uppercase"
              :class="buttonRadiusClass"
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
      </template>
    </EditorialSiteChrome>
  </div>
</template>
