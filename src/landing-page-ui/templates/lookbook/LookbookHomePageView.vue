<script setup lang="ts">
import { computed, toRef } from "vue";
import LookbookSiteChrome from "./LookbookSiteChrome.vue";
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

function openGalleryLink(url: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
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

    <LookbookSiteChrome
      v-else
      :style-config="config"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <template v-for="sectionKey in homeSectionOrder" :key="sectionKey">
        <!-- Hero: cinematic dark full-bleed runway -->
        <section
          v-if="sectionKey === 'hero'"
          class="relative min-h-[82vh] w-full overflow-hidden bg-zinc-950 md:min-h-[92vh]"
        >
          <img
            v-if="config.heroUrl"
            :src="config.heroUrl"
            :alt="config.heroTagline"
            class="absolute inset-0 h-full w-full scale-105 object-cover"
            referrerpolicy="no-referrer"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"
          />

          <div
            class="relative z-10 flex min-h-[82vh] flex-col justify-end px-5 pb-12 md:min-h-[92vh] md:px-10 md:pb-16 lg:px-14"
          >
            <p
              class="lp-reveal-child mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-white/70"
              style="--child-i: 0"
            >
              {{ config.heroSubtitle }}
            </p>
            <h1
              class="lp-reveal-child max-w-4xl font-title text-5xl leading-[0.92] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
              style="--child-i: 1"
            >
              {{ config.heroTagline }}
            </h1>
            <button
              type="button"
              class="lp-reveal-child mt-8 inline-flex w-fit items-center border border-white/70 px-7 py-3 text-[10px] font-medium uppercase tracking-[0.28em] text-white transition-colors hover:bg-white hover:text-black"
              :class="buttonRadiusClass"
              style="--child-i: 2"
              @click="onCtaClick('/portfolio')"
            >
              {{ tLandingPage(language, "homeHeroCta") }}
            </button>
          </div>
        </section>

        <!-- Gallery: tall staggered lookbook wall -->
        <section
          v-else-if="
            sectionKey === 'gallery' &&
            config.showHomeGallery &&
            (config.galleryItems.length > 0 || mode === 'preview')
          "
          class="px-5 py-16 md:px-10 md:py-24 lg:px-14"
        >
          <div class="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                class="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]"
              >
                {{ tLandingPage(language, "homeGalleryLabel") }}
              </p>
              <h2
                class="font-title text-3xl tracking-tight text-[var(--text-main)] md:text-5xl"
              >
                {{ tLandingPage(language, "homeGalleryTitle") }}
              </h2>
            </div>
            <button
              type="button"
              class="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-main)] underline-offset-8 hover:underline"
              @click="onCtaClick('/portfolio')"
            >
              {{ tLandingPage(language, "homeGalleryViewAll") }}
            </button>
          </div>

          <div
            v-if="mode === 'preview' && config.galleryItems.length === 0"
            class="rounded-sm border border-dashed border-[var(--border-color)] px-6 py-20 text-center"
          >
            <p class="text-sm text-[var(--text-muted)]">
              Galleries will appear here once selected from Client Gallery.
            </p>
          </div>
          <template v-else>
            <div class="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10">
              <article
                v-for="(item, index) in config.galleryItems"
                :key="item.id"
                class="group"
                :class="[
                  index % 2 === 1 ? 'sm:mt-16 lg:mt-24' : '',
                  item.url ? 'cursor-pointer' : '',
                ]"
                @click="item.url && openGalleryLink(item.url)"
              >
                <div
                  class="aspect-[3/4] overflow-hidden bg-[var(--icon-bg)]"
                >
                  <img
                    :src="item.imageUrl"
                    :alt="item.caption"
                    class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    referrerpolicy="no-referrer"
                  />
                </div>
                <div
                  class="mt-3 flex items-baseline justify-between gap-3"
                >
                  <p
                    class="truncate text-sm tracking-wide text-[var(--text-main)]"
                  >
                    {{ item.caption }}
                  </p>
                  <span
                    class="shrink-0 text-[10px] tracking-[0.2em] text-[var(--text-muted)]"
                  >
                    {{ String(index + 1).padStart(2, "0") }}
                  </span>
                </div>
              </article>
            </div>
          </template>
        </section>

        <!-- Quote: oversized quiet type -->
        <section
          v-else-if="sectionKey === 'quote' && config.showHomeQuote"
          class="px-5 py-20 md:px-10 md:py-28 lg:px-14"
        >
          <p
            class="mx-auto max-w-4xl text-center font-title text-3xl leading-[1.15] tracking-tight text-[var(--text-main)] md:text-5xl lg:text-6xl"
          >
            {{ config.quoteText }}
          </p>
        </section>

        <!-- Packages: vertical runway cards -->
        <section
          v-else-if="
            sectionKey === 'packages' &&
            config.showHomePackages &&
            (config.featuredPackages.length > 0 || mode === 'preview')
          "
          class="px-5 py-16 md:px-10 md:py-24 lg:px-14"
        >
          <div class="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                class="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]"
              >
                {{ tLandingPage(language, "homePackagesLabel") }}
              </p>
              <h2
                class="font-title text-3xl tracking-tight text-[var(--text-main)] md:text-5xl"
              >
                {{ tLandingPage(language, "homePackagesTitle") }}
              </h2>
            </div>
            <button
              v-if="config.featuredPackages.length > 0"
              type="button"
              class="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-main)] underline-offset-8 hover:underline"
              @click="onCtaClick('/lead-form')"
            >
              {{ tLandingPage(language, "homePackagesViewAll") }}
            </button>
          </div>

          <div
            v-if="mode === 'preview' && config.featuredPackages.length === 0"
            class="rounded-sm border border-dashed border-[var(--border-color)] px-6 py-20 text-center"
          >
            <p class="text-sm text-[var(--text-muted)]">
              Packages will appear here once selected.
            </p>
          </div>
          <div
            v-else
            class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10"
          >
            <article
              v-for="(pkg, index) in config.featuredPackages"
              :key="pkg.id"
              class="group"
            >
              <div
                class="relative aspect-[3/4] overflow-hidden bg-[var(--icon-bg)]"
              >
                <img
                  v-if="pkg.imageUrl"
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
                <h3
                  class="font-title text-xl tracking-tight text-[var(--text-main)] md:text-2xl"
                >
                  {{ pkg.title }}
                </h3>
                <p class="text-sm text-[var(--text-muted)]">{{ pkg.price }}</p>
                <button
                  type="button"
                  class="pt-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-main)] underline-offset-8 hover:underline"
                  @click="onCtaClick(pkg.detailUrl)"
                >
                  {{ tLandingPage(language, "homePackageChoose") }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- About: editorial split on light -->
        <section
          v-else-if="sectionKey === 'about' && config.showHomeAbout"
          class="grid items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-14 md:px-10 md:py-24 lg:px-14"
        >
          <div
            v-if="config.aboutSnippetImageUrl"
            class="aspect-[3/4] overflow-hidden bg-[var(--icon-bg)]"
          >
            <img
              :src="config.aboutSnippetImageUrl"
              alt=""
              class="h-full w-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <div
            class="flex flex-col justify-center"
            :class="config.aboutSnippetImageUrl ? '' : 'md:col-span-2 md:max-w-2xl'"
          >
            <p
              class="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]"
            >
              {{ config.aboutSnippetLabel }}
            </p>
            <p
              class="mb-8 font-title text-2xl leading-snug tracking-tight text-[var(--text-main)] md:text-4xl"
            >
              {{ config.aboutSnippetText }}
            </p>
            <button
              type="button"
              class="w-fit text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-main)] underline-offset-8 hover:underline"
              @click="onCtaClick('/portfolio')"
            >
              {{ config.aboutSnippetCtaLabel }}
            </button>
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'faq' && config.showHomeFaq && config.faqs.length"
          id="faq"
          class="px-5 py-16 md:px-10 md:py-24 lg:px-14"
        >
          <p
            class="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]"
          >
            {{ tLandingPage(language, "homeFaqLabel") }}
          </p>
          <h2
            class="mb-10 font-title text-3xl tracking-tight text-[var(--text-main)] md:text-5xl"
          >
            {{ tLandingPage(language, "homeFaqTitle") }}
          </h2>
          <div class="max-w-2xl space-y-0 border-t border-[var(--border-color)]">
            <HomeFaqAccordionItem
              v-for="faq in config.faqs"
              :key="faq.id"
              :question="faq.question"
              :answer="faq.answer"
            />
          </div>
        </section>

        <!-- Bottom CTA: dark climax band -->
        <section
          v-else-if="sectionKey === 'bottom-cta' && config.showHomeCta"
          class="relative overflow-hidden bg-zinc-950 px-5 py-20 text-white md:px-10 md:py-28 lg:px-14"
        >
          <img
            v-if="config.homeCtaImageUrl"
            :src="config.homeCtaImageUrl"
            alt=""
            class="absolute inset-0 h-full w-full object-cover opacity-35"
            referrerpolicy="no-referrer"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          <div class="relative z-10 max-w-3xl space-y-8">
            <h2
              class="font-title text-4xl leading-[1.05] tracking-tight md:text-6xl"
            >
              {{ config.homeCtaHeading }}
            </h2>
            <div class="flex flex-wrap gap-3">
              <button
                v-if="primaryCta"
                type="button"
                class="border border-white bg-white px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-80"
                :class="buttonRadiusClass"
                @click="onCtaClick(primaryCta.url)"
              >
                {{ primaryCta.label }}
              </button>
              <button
                v-if="secondaryCta"
                type="button"
                class="border border-white/60 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/10"
                :class="buttonRadiusClass"
                @click="onCtaClick(secondaryCta.url)"
              >
                {{ secondaryCta.label }}
              </button>
            </div>
          </div>
        </section>
      </template>
    </LookbookSiteChrome>
  </div>
</template>
