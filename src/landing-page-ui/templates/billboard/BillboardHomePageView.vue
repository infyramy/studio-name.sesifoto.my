<script setup lang="ts">
import { computed, toRef } from "vue";
import BillboardSiteChrome from "./BillboardSiteChrome.vue";
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

    <BillboardSiteChrome
      v-else
      :style-config="config"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <template v-for="sectionKey in homeSectionOrder" :key="sectionKey">
        <!-- Hero: giant type + inset poster image -->
        <section
          v-if="sectionKey === 'hero'"
          class="border-b border-[var(--border-color)]"
        >
          <div class="px-4 pt-10 md:px-6 md:pt-14">
            <p
              class="lp-reveal-child mb-3 text-sm font-medium tracking-[0.08em] text-[var(--text-muted)]"
              style="--child-i: 0"
            >
              {{ config.heroSubtitle }}
            </p>
            <h1
              class="lp-reveal-child max-w-5xl font-title text-5xl leading-[0.92] tracking-tight text-[var(--text-main)] sm:text-6xl md:text-7xl lg:text-8xl"
              style="--child-i: 1"
            >
              {{ config.heroTagline }}
            </h1>
            <div class="lp-reveal-child mt-8" style="--child-i: 2">
              <button
                type="button"
                class="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold tracking-[0.06em]"
                :style="{
                  backgroundColor: config.primaryColor,
                  color: config.primaryTextColor,
                }"
                @click="onCtaClick('/portfolio')"
              >
                {{ tLandingPage(language, "homeHeroCta") }}
              </button>
            </div>
          </div>
          <div class="mt-10 px-4 pb-10 md:mt-12 md:px-6 md:pb-14">
            <div class="relative ml-auto aspect-[16/10] w-full max-w-4xl overflow-hidden bg-[var(--icon-bg)] md:w-[85%]">
              <img
                v-if="config.heroUrl"
                :src="config.heroUrl"
                :alt="config.heroTagline"
                class="h-full w-full object-cover"
                referrerpolicy="no-referrer"
              />
              <div
                class="absolute bottom-0 left-0 px-3 py-2 text-[10px] font-semibold tracking-[0.14em]"
                :style="{
                  backgroundColor: config.primaryColor,
                  color: config.primaryTextColor,
                }"
              >
                Featured
              </div>
            </div>
          </div>
        </section>

        <!-- Gallery: poster wall with offset cards -->
        <section
          v-else-if="sectionKey === 'gallery' && config.showHomeGallery"
          class="border-b border-[var(--border-color)] px-4 py-12 md:px-6 md:py-16"
        >
          <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="mb-1 text-xs font-semibold tracking-[0.14em] text-[var(--text-muted)]">
                {{ tLandingPage(language, "homeGalleryLabel") }}
              </p>
              <h2 class="font-title text-3xl tracking-tight text-[var(--text-main)] md:text-5xl">
                {{ tLandingPage(language, "homeGalleryTitle") }}
              </h2>
            </div>
            <button
              type="button"
              class="border-2 border-[var(--text-main)] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[var(--text-main)]"
              @click="onCtaClick('/portfolio')"
            >
              {{ tLandingPage(language, "homeGalleryViewAll") }}
            </button>
          </div>

          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="(item, index) in config.galleryItems"
              :key="item.id"
              class="group"
              :class="index % 3 === 1 ? 'lg:mt-10' : index % 3 === 2 ? 'lg:mt-4' : ''"
            >
              <div class="overflow-hidden border-4 border-[var(--text-main)] bg-[var(--icon-bg)]">
                <div class="aspect-[3/4]">
                  <img
                    :src="item.imageUrl"
                    :alt="item.caption"
                    class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    referrerpolicy="no-referrer"
                  />
                </div>
                <div
                  class="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                  :style="{
                    backgroundColor: config.primaryColor,
                    color: config.primaryTextColor,
                  }"
                >
                  <span class="truncate font-medium">{{ item.caption }}</span>
                  <span class="shrink-0 opacity-70">
                    {{ String(index + 1).padStart(2, "0") }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Quote: solid color poster block -->
        <section
          v-else-if="sectionKey === 'quote' && config.showHomeQuote"
          class="px-4 py-10 md:px-6 md:py-14"
          :style="{
            backgroundColor: config.primaryColor,
            color: config.primaryTextColor,
          }"
        >
          <p class="max-w-4xl font-title text-3xl leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {{ config.quoteText }}
          </p>
        </section>

        <!-- Packages: stacked poster rows -->
        <section
          v-else-if="sectionKey === 'packages' && config.showHomePackages"
          class="border-b border-[var(--border-color)] px-4 py-12 md:px-6 md:py-16"
        >
          <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="mb-1 text-xs font-semibold tracking-[0.14em] text-[var(--text-muted)]">
                {{ tLandingPage(language, "homePackagesLabel") }}
              </p>
              <h2 class="font-title text-3xl tracking-tight text-[var(--text-main)] md:text-5xl">
                {{ tLandingPage(language, "homePackagesTitle") }}
              </h2>
            </div>
            <button
              type="button"
              class="border-2 border-[var(--text-main)] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[var(--text-main)]"
              @click="onCtaClick('/services')"
            >
              {{ tLandingPage(language, "homePackagesViewAll") }}
            </button>
          </div>

          <div class="space-y-4">
            <article
              v-for="(pkg, index) in config.featuredPackages"
              :key="pkg.id"
              class="grid overflow-hidden border-2 border-[var(--text-main)] md:grid-cols-[9rem_1fr_auto]"
            >
              <div class="aspect-[4/5] bg-[var(--icon-bg)] md:aspect-auto md:h-full">
                <img
                  :src="pkg.imageUrl"
                  :alt="pkg.title"
                  class="h-full w-full object-cover"
                  referrerpolicy="no-referrer"
                />
              </div>
              <div class="flex flex-col justify-center gap-1 px-5 py-5">
                <p class="text-xs tracking-[0.14em] text-[var(--text-muted)]">
                  {{ String(index + 1).padStart(2, "0") }}
                </p>
                <h3 class="font-title text-2xl tracking-tight text-[var(--text-main)] md:text-3xl">
                  {{ pkg.title }}
                </h3>
                <p class="text-sm text-[var(--text-muted)]">{{ pkg.price }}</p>
              </div>
              <button
                type="button"
                class="flex items-center justify-center px-6 py-4 text-sm font-semibold tracking-[0.08em] md:min-w-[9rem]"
                :style="{
                  backgroundColor: config.primaryColor,
                  color: config.primaryTextColor,
                }"
                @click="onCtaClick(pkg.detailUrl)"
              >
                {{ tLandingPage(language, "homePackageChoose") }}
              </button>
            </article>
          </div>
        </section>

        <!-- About: split band -->
        <section
          v-else-if="sectionKey === 'about' && config.showHomeAbout"
          class="grid border-b border-[var(--border-color)] md:grid-cols-2"
        >
          <div
            v-if="config.aboutSnippetImageUrl"
            class="min-h-[18rem] bg-[var(--icon-bg)] md:min-h-[28rem]"
          >
            <img
              :src="config.aboutSnippetImageUrl"
              alt=""
              class="h-full w-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <div
            class="flex flex-col justify-center gap-5 px-5 py-10 md:px-10 md:py-14"
            :class="config.aboutSnippetImageUrl ? '' : 'md:col-span-2'"
            :style="{
              backgroundColor: config.aboutSnippetImageUrl
                ? 'transparent'
                : undefined,
            }"
          >
            <p class="text-xs font-semibold tracking-[0.14em] text-[var(--text-muted)]">
              {{ config.aboutSnippetLabel }}
            </p>
            <p class="font-title text-2xl leading-snug tracking-tight text-[var(--text-main)] md:text-4xl">
              {{ config.aboutSnippetText }}
            </p>
            <button
              type="button"
              class="w-fit border-2 border-[var(--text-main)] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[var(--text-main)]"
              @click="onCtaClick('/about-us')"
            >
              {{ config.aboutSnippetCtaLabel }}
            </button>
          </div>
        </section>

        <section
          v-else-if="sectionKey === 'faq' && config.showHomeFaq && config.faqs.length"
          id="faq"
          class="border-b border-[var(--border-color)] px-4 py-12 md:px-6 md:py-16"
        >
          <p class="mb-1 text-xs font-semibold tracking-[0.14em] text-[var(--text-muted)]">
            {{ tLandingPage(language, "homeFaqLabel") }}
          </p>
          <h2 class="mb-8 font-title text-3xl tracking-tight text-[var(--text-main)] md:text-5xl">
            {{ tLandingPage(language, "homeFaqTitle") }}
          </h2>
          <div class="max-w-3xl space-y-0 border-t-2 border-[var(--text-main)]">
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
          class="px-4 py-12 md:px-6 md:py-16"
          :style="{
            backgroundColor: config.primaryColor,
            color: config.primaryTextColor,
          }"
        >
          <img
            v-if="config.homeCtaImageUrl"
            :src="config.homeCtaImageUrl"
            alt=""
            class="mb-6 h-20 w-20 object-cover"
            referrerpolicy="no-referrer"
          />
          <h2 class="mb-8 max-w-3xl font-title text-4xl leading-tight tracking-tight md:text-6xl">
            {{ config.homeCtaHeading }}
          </h2>
          <div class="flex flex-wrap gap-3">
            <button
              v-if="primaryCta"
              type="button"
              class="border-2 px-5 py-3 text-sm font-semibold tracking-[0.06em]"
              :class="buttonRadiusClass"
              :style="{
                borderColor: 'currentColor',
                backgroundColor: 'transparent',
                color: 'inherit',
              }"
              @click="onCtaClick(primaryCta.url)"
            >
              {{ primaryCta.label }}
            </button>
            <button
              v-if="secondaryCta"
              type="button"
              class="px-5 py-3 text-sm font-semibold tracking-[0.06em]"
              :class="buttonRadiusClass"
              :style="{
                backgroundColor: config.primaryTextColor,
                color: config.primaryColor,
              }"
              @click="onCtaClick(secondaryCta.url)"
            >
              {{ secondaryCta.label }}
            </button>
          </div>
        </section>
      </template>
    </BillboardSiteChrome>
  </div>
</template>
