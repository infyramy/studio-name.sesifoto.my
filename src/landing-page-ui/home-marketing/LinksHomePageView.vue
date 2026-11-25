<script setup lang="ts">
import { computed, toRef } from "vue";
import {
  ArrowRight,
  Calendar,
  Facebook,
  Instagram,
} from "lucide-vue-next";
import LandingPageBootState from "../LandingPageBootState.vue";
import SiteLogo from "../portfolio/SiteLogo.vue";
import { tLandingPage } from "../i18n";
import type {
  LandingPageTheme,
  ProductEntitlements,
  StudioLanguage,
} from "../types";
import { safeHttpUrl, useLandingPageStyles } from "../useLandingPageStyles";

const SESIFOTO_LOGO_SRC = "/brand/sesifoto.svg";
const SESIFOTO_HOME_URL = "https://sesifoto.my";

const props = withDefaults(
  defineProps<{
    config: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    productEntitlements?: ProductEntitlements;
    loading?: boolean;
    loadError?: string | null;
    surfaceClass?: string;
  }>(),
  {
    language: "en",
    mode: "preview",
    productEntitlements: () => ({ studio: true, crm: true }),
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
const { themeStyle, buttonRadiusClass, gradientOverlayStyle } =
  useLandingPageStyles(styleRef);

const showBooking = computed(
  () => props.config.showHomeBookingButton && props.productEntitlements.studio,
);

const buttonLabels = computed(() => ({
  booking:
    props.config.homeBookingButtonLabel?.trim() ||
    tLandingPage(props.language, "bookNow"),
  services:
    props.config.homeServicesButtonLabel?.trim() ||
    tLandingPage(props.language, "navServices"),
  portfolio:
    props.config.homePortfolioButtonLabel?.trim() ||
    tLandingPage(props.language, "navPortfolio"),
}));

const socials = computed(() => ({
  instagram: safeHttpUrl(props.config.socialInstagram),
  tiktok: safeHttpUrl(props.config.socialTiktok),
  facebook: safeHttpUrl(props.config.socialFacebook),
  threads: safeHttpUrl(props.config.socialThreads),
}));

const hasSocials = computed(
  () => props.config.showSocials && Object.values(socials.value).some(Boolean),
);

const customLinks = computed(() =>
  props.config.showCustomLinks ? props.config.customLinks ?? [] : [],
);

const secondaryButtonStyle = {
  backgroundColor: "var(--card-bg)",
  borderColor: "var(--border-color)",
  color: "var(--text-main)",
  backdropFilter: "var(--card-backdrop)",
  WebkitBackdropFilter: "var(--card-backdrop)",
  boxShadow: "var(--card-shadow)",
};

/** Preview fills device frame; live fills viewport. Same flex + sticky footer. */
const surfaceFillClass = computed(() =>
  props.surfaceClass === "preview-surface" ? "min-h-full" : "min-h-dvh",
);
</script>

<template>
  <div
    :class="[
      'flex w-full max-w-full flex-col overflow-x-clip',
      surfaceFillClass,
      surfaceClass,
    ]"
  >
    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
    <component :is="'style'" v-html="themeStyle" />

    <LandingPageBootState v-if="loading" :theme="config" label="Loading" />

    <LandingPageBootState
      v-else-if="loadError"
      :theme="config"
      :error="loadError"
      @retry="emit('retryLoad')"
    />

    <div v-else class="relative flex w-full flex-1 flex-col">
      <div
        v-if="config.showLanguageSwitcher"
        class="absolute right-4 top-4 z-20 flex items-center gap-1 text-xs font-medium"
      >
        <button
          type="button"
          :class="language === 'bm' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
          @click="emit('languageChange', 'bm')"
        >
          BM
        </button>
        <span class="text-[var(--text-muted)]">|</span>
        <button
          type="button"
          :class="language === 'en' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
          @click="emit('languageChange', 'en')"
        >
          EN
        </button>
      </div>

      <div
        v-if="config.heroUrl"
        class="relative h-[min(36vh,320px)] w-full overflow-hidden"
      >
        <img
          :src="config.heroUrl"
          :alt="config.studioName"
          class="h-full w-full object-cover object-center"
          referrerpolicy="no-referrer"
        />
        <div class="absolute inset-0" :style="gradientOverlayStyle" />
      </div>

      <div
        class="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center px-5 pb-10 text-center"
        :class="config.heroUrl ? '-mt-16' : 'pt-16'"
      >
        <div class="mb-5 flex justify-center">
          <SiteLogo
            :src="config.logoUrl"
            :alt="config.studioName || 'Studio'"
            :logo-style="config.logoStyle"
            variant="header"
            class="scale-150"
          />
        </div>

        <h1
          class="break-words text-2xl font-semibold leading-tight text-[var(--text-main)] sm:text-3xl"
        >
          {{ config.studioName }}
        </h1>
        <p
          v-if="config.heroTagline"
          class="mt-2 break-words text-sm text-[var(--text-main)] opacity-90"
        >
          {{ config.heroTagline }}
        </p>
        <p
          v-if="config.heroSubtitle"
          class="mt-1 break-words text-xs tracking-wide text-[var(--text-muted)]"
        >
          {{ config.heroSubtitle }}
        </p>

        <div v-if="hasSocials" class="mt-5 flex items-center gap-5">
          <a
            v-if="socials.instagram"
            :href="socials.instagram"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
          >
            <Instagram :size="22" />
          </a>
          <a
            v-if="socials.tiktok"
            :href="socials.tiktok"
            aria-label="TikTok"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
          </a>
          <a
            v-if="socials.facebook"
            :href="socials.facebook"
            aria-label="Facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
          >
            <Facebook :size="22" />
          </a>
          <a
            v-if="socials.threads"
            :href="socials.threads"
            aria-label="Threads"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
            </svg>
          </a>
        </div>

        <div class="mt-8 flex w-full flex-col gap-3">
          <button
            v-if="showBooking"
            type="button"
            class="flex w-full items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            :class="buttonRadiusClass"
            :style="{
              backgroundColor: config.primaryColor,
              color: config.primaryTextColor,
            }"
            @click="emit('navigate', '/booking')"
          >
            <Calendar :size="18" />
            {{ buttonLabels.booking }}
          </button>
          <button
            v-if="config.showHomeServicesButton"
            type="button"
            class="flex w-full items-center justify-center gap-2 border px-4 py-4 text-sm font-medium transition-all active:scale-[0.98]"
            :class="buttonRadiusClass"
            :style="secondaryButtonStyle"
            @click="emit('navigate', '/lead-form')"
          >
            {{ buttonLabels.services }}
          </button>
          <button
            v-if="config.showHomePortfolioButton"
            type="button"
            class="flex w-full items-center justify-center gap-2 border px-4 py-4 text-sm font-medium transition-all active:scale-[0.98]"
            :class="buttonRadiusClass"
            :style="secondaryButtonStyle"
            @click="emit('navigate', '/portfolio')"
          >
            {{ buttonLabels.portfolio }}
          </button>
          <a
            v-for="link in customLinks"
            :key="link.id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex w-full items-center justify-center gap-2 border px-4 py-4 text-sm font-medium transition-all active:scale-[0.98]"
            :class="buttonRadiusClass"
            :style="secondaryButtonStyle"
          >
            {{ link.label }}
            <ArrowRight :size="18" />
          </a>
        </div>

        <a
          :href="SESIFOTO_HOME_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-auto inline-flex flex-col items-center gap-2 pt-10 text-[10px] text-[var(--text-muted)] opacity-70 transition-opacity hover:opacity-100"
        >
          <img
            :src="SESIFOTO_LOGO_SRC"
            alt="Sesifoto"
            class="h-7 w-7 rounded-md object-contain"
          />
          <span>{{ tLandingPage(language, "poweredBy") }}</span>
        </a>
      </div>
    </div>
  </div>
</template>
