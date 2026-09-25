<script setup lang="ts">
import { computed, toRef } from "vue";
import AtelierSiteChrome from "./AtelierSiteChrome.vue";
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

    <AtelierSiteChrome
      v-else
      :style-config="config"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <template v-for="sectionKey in homeSectionOrder" :key="sectionKey">
        <!-- Hero: title over full-bleed frame with contact-sheet stamp -->
        <section
          v-if="sectionKey === 'hero'"
          class="relative min-h-[78vh] w-full overflow-hidden md:min-h-[88vh]"
        >
          <img
            v-if="config.heroUrl"
            :src="config.heroUrl"
            :alt="config.heroTagline"
            class="absolute inset-0 h-full w-full object-cover"
            referrerpolicy="no-referrer"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

          <div class="absolute left-4 top-4 z-10 md:left-6 md:top-6">
            <span
              class="inline-block border border-white/50 px-2 py-1 text-[10px] tracking-[0.2em] text-white/90"
            >
              {{ config.heroSubtitle || "01" }}
            </span>
          </div>

          <div
            class="relative z-10 flex min-h-[78vh] flex-col justify-end px-4 pb-10 md:min-h-[88vh] md:px-8 md:pb-14"
          >
            <h1
              class="lp-reveal-child max-w-4xl font-title text-5xl leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
              style="--child-i: 0"
            >
              {{ config.heroTagline }}
            </h1>
            <button
              type="button"
              class="lp-reveal-child mt-8 inline-flex w-fit items-center gap-2 bg-white px-5 py-3 text-xs font-medium tracking-[0.12em] text-black transition-opacity hover:opacity-80"
              style="--child-i: 1"
              @click="onCtaClick('/portfolio')"
            >
              {{ tLandingPage(language, "homeHeroCta") }}
            </button>
          </div>
        </section>

        <!-- Gallery: contact-sheet wall -->
        <section
          v-else-if="sectionKey === 'gallery' && config.showHomeGallery"
          class="px-3 py-10 md:px-4 md:py-14"
        >
          <div class="mb-4 flex items-center justify-between gap-3 px-1">
            <div>
              <p class="text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
                {{ tLandingPage(language, "homeGalleryLabel") }}
              </p>
              <h2 class="font-title text-2xl tracking-tight text-[var(--text-main)] md:text-3xl">
                {{ tLandingPage(language, "homeGalleryTitle") }}
              </h2>
            </div>
            <button
              type="button"
              class="text-[11px] tracking-[0.1em] text-[var(--text-main)] underline-offset-4 hover:underline"
              @click="onCtaClick('/portfolio')"
            >
              {{ tLandingPage(language, "homeGalleryViewAll") }}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 md:gap-1.5">
            <article
              v-for="(item, index) in config.galleryItems"
              :key="item.id"
              class="group relative overflow-hidden bg-[var(--icon-bg)]"
              :class="
                index === 0
                  ? 'col-span-2 aspect-[16/10] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[22rem]'
                  : 'aspect-square'
              "
            >
              <img
                :src="item.imageUrl"
                :alt="item.caption"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                referrerpolicy="no-referrer"
              />
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <span class="truncate text-[10px] text-white/90">{{ item.caption }}</span>
                <span class="shrink-0 text-[10px] tracking-[0.16em] text-white/70">
                  {{ String(index + 1).padStart(2, "0") }}
                </span>
              </div>
            </article>
          </div>
        </section>

        <!-- Quote: film slate strip -->
        <section
          v-else-if="sectionKey === 'quote' && config.showHomeQuote"
          class="px-4 py-12 md:px-8 md:py-16"
        >
          <div
            class="border border-[var(--border-color)] bg-[var(--bg-main)] px-5 py-8 md:px-10 md:py-12"
          >
            <div class="mb-6 flex gap-1" aria-hidden="true">
              <span
                v-for="n in 8"
                :key="n"
                class="h-3 w-3 border border-[var(--border-color)]"
                :class="n % 2 === 0 ? 'bg-[var(--text-main)]' : 'bg-transparent'"
              />
            </div>
            <p class="font-title text-2xl leading-snug tracking-tight text-[var(--text-main)] md:text-4xl">
              {{ config.quoteText }}
            </p>
          </div>
        </section>

        <!-- Packages: horizontal film strip -->
        <section
          v-else-if="sectionKey === 'packages' && config.showHomePackages"
          class="py-12 md:py-16"
        >
          <div class="mb-6 flex items-end justify-between gap-3 px-4 md:px-8">
            <div>
              <p class="text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
                {{ tLandingPage(language, "homePackagesLabel") }}
              </p>
              <h2 class="font-title text-2xl tracking-tight text-[var(--text-main)] md:text-3xl">
                {{ tLandingPage(language, "homePackagesTitle") }}
              </h2>
            </div>
            <button
              type="button"
              class="text-[11px] tracking-[0.1em] text-[var(--text-main)] underline-offset-4 hover:underline"
              @click="onCtaClick('/lead-form')"
            >
              {{ tLandingPage(language, "homePackagesViewAll") }}
            </button>
          </div>

          <div
            class="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:gap-4 md:px-8"
          >
            <article
              v-for="(pkg, index) in config.featuredPackages"
              :key="pkg.id"
              class="w-[72vw] max-w-sm shrink-0 border border-[var(--border-color)] sm:w-72"
            >
              <div class="relative aspect-[4/5] overflow-hidden bg-[var(--icon-bg)]">
                <img
                  :src="pkg.imageUrl"
                  :alt="pkg.title"
                  class="h-full w-full object-cover"
                  referrerpolicy="no-referrer"
                />
                <span
                  class="absolute left-2 top-2 border border-white/60 bg-black/40 px-1.5 py-0.5 text-[10px] tracking-[0.16em] text-white"
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
                  class="pt-1 text-[11px] tracking-[0.1em] text-[var(--text-main)] underline-offset-4 hover:underline"
                  @click="onCtaClick(pkg.detailUrl)"
                >
                  {{ tLandingPage(language, "homePackageChoose") }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- About: overlapping frame -->
        <section
          v-else-if="sectionKey === 'about' && config.showHomeAbout"
          class="relative px-4 py-14 md:px-8 md:py-20"
        >
          <div class="relative mx-auto max-w-4xl">
            <div
              v-if="config.aboutSnippetImageUrl"
              class="aspect-[5/4] w-full overflow-hidden bg-[var(--icon-bg)] md:w-[70%]"
            >
              <img
                :src="config.aboutSnippetImageUrl"
                alt=""
                class="h-full w-full object-cover"
                referrerpolicy="no-referrer"
              />
            </div>
            <div
              class="border border-[var(--border-color)] bg-[var(--bg-main)] p-6 md:absolute md:bottom-6 md:right-0 md:w-[48%] md:p-8"
              :class="config.aboutSnippetImageUrl ? 'mt-0 md:mt-0' : ''"
            >
              <p class="mb-2 text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
                {{ config.aboutSnippetLabel }}
              </p>
              <p class="mb-5 font-title text-xl leading-snug tracking-tight text-[var(--text-main)] md:text-2xl">
                {{ config.aboutSnippetText }}
              </p>
              <button
                type="button"
                class="text-[11px] tracking-[0.1em] text-[var(--text-main)] underline-offset-4 hover:underline"
                @click="onCtaClick('/portfolio')"
              >
                {{ config.aboutSnippetCtaLabel }} →
              </button>
            </div>
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'faq' && config.showHomeFaq && config.faqs.length"
          id="faq"
          class="px-4 py-14 md:px-8 md:py-20"
        >
          <p class="mb-1 text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
            {{ tLandingPage(language, "homeFaqLabel") }}
          </p>
          <h2 class="mb-6 font-title text-2xl tracking-tight text-[var(--text-main)] md:text-3xl">
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

        <section
          v-else-if="sectionKey === 'bottom-cta' && config.showHomeCta"
          class="px-4 pb-16 pt-4 md:px-8 md:pb-24"
        >
          <div class="relative overflow-hidden border border-[var(--border-color)]">
            <img
              v-if="config.homeCtaImageUrl"
              :src="config.homeCtaImageUrl"
              alt=""
              class="absolute inset-0 h-full w-full object-cover opacity-30"
              referrerpolicy="no-referrer"
            />
            <div class="relative space-y-6 px-6 py-12 md:px-10 md:py-16">
              <h2 class="max-w-xl font-title text-3xl leading-tight tracking-tight text-[var(--text-main)] md:text-5xl">
                {{ config.homeCtaHeading }}
              </h2>
              <div class="flex flex-wrap gap-3">
                <button
                  v-if="primaryCta"
                  type="button"
                  class="px-5 py-3 text-xs tracking-[0.12em]"
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
                  class="border px-5 py-3 text-xs tracking-[0.12em]"
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
            </div>
          </div>
        </section>
      </template>
    </AtelierSiteChrome>
  </div>
</template>
