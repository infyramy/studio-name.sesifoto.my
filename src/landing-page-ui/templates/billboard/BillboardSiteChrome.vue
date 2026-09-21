<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { Menu, X } from "lucide-vue-next";
import { useLandingPageEnter } from "../../useLandingPageEnter";
import {
  getSiteNavLabel,
  SITE_NAV_FOOTER,
  SITE_NAV_HEADER_LEFT,
  SITE_NAV_HEADER_RIGHT,
} from "../../site-nav";
import type { HomePreviewLayout } from "../../home-marketing/useHomeLayout";
import type { LandingPageTheme, StudioLanguage } from "../../types";
import { normalizePhone, safeHttpUrl } from "../../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    styleConfig: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    previewLayout?: HomePreviewLayout;
  }>(),
  {
    language: "en",
    mode: "preview",
    previewLayout: null,
  },
);

const emit = defineEmits<{
  languageChange: [lang: StudioLanguage];
  navigate: [url: string];
}>();

const mobileMenuOpen = ref(false);
const chromeRef = ref<HTMLElement | null>(null);
const animateEnter = computed(() => props.mode === "live");

useLandingPageEnter(chromeRef, animateEnter);

const headerNavLeft = computed(() =>
  SITE_NAV_HEADER_LEFT.map((item) => ({
    ...item,
    label: getSiteNavLabel(props.language, item.key),
  })),
);

const headerNavRight = computed(() =>
  SITE_NAV_HEADER_RIGHT.map((item) => ({
    ...item,
    label: getSiteNavLabel(props.language, item.key),
  })),
);

const allNavLinks = computed(() => [
  ...headerNavLeft.value,
  ...headerNavRight.value,
]);

const footerNav = computed(() =>
  SITE_NAV_FOOTER.map((item) => ({
    ...item,
    label: getSiteNavLabel(props.language, item.key),
  })),
);

const socialLinks = computed(() => {
  const links: { href: string; label: string }[] = [];
  const ig = safeHttpUrl(props.styleConfig.socialInstagram);
  const fb = safeHttpUrl(props.styleConfig.socialFacebook);
  if (ig) links.push({ href: ig, label: "Instagram" });
  if (fb) links.push({ href: fb, label: "Facebook" });
  return links;
});

const footerPhone = computed(() => {
  const phone =
    props.styleConfig.emergencyPhoneType === "custom"
      ? props.styleConfig.emergencyCustomPhone
      : "";
  return phone ? normalizePhone(phone) : "";
});

const whatsappHref = computed(() => {
  const phone = footerPhone.value;
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits}`;
});

const mapsHref = computed(() => {
  const link = safeHttpUrl(props.styleConfig.mapsLink);
  if (link) return link;
  const address = props.styleConfig.mapAddress?.trim();
  if (!address) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
});

const forceMobileChrome = computed(
  () =>
    props.previewLayout === "mobile" || props.previewLayout === "tablet",
);

const desktopNavClass = computed(() =>
  forceMobileChrome.value ? "hidden" : "hidden md:flex",
);

const mobileMenuButtonClass = computed(() =>
  forceMobileChrome.value ? "inline-flex" : "inline-flex md:hidden",
);

const mobileMenuShellClass = computed(() =>
  forceMobileChrome.value
    ? "lp-mobile-menu lp-mobile-menu--embedded"
    : "lp-mobile-menu",
);

const barStyle = computed(() => ({
  backgroundColor: props.styleConfig.primaryColor,
  color: props.styleConfig.primaryTextColor,
}));

const mobileMenuSurfaceStyle = computed(() => {
  const t = props.styleConfig;
  return {
    backgroundColor: t.primaryColor,
    color: t.primaryTextColor,
    ["--bg-main" as string]: t.primaryColor,
    ["--text-main" as string]: t.primaryTextColor,
    ["--text-muted" as string]: "color-mix(in srgb, var(--text-main) 70%, transparent)",
    ["--border-color" as string]: "color-mix(in srgb, var(--text-main) 25%, transparent)",
  };
});

function lockBodyScroll(lock: boolean) {
  if (typeof document === "undefined") return;
  if (forceMobileChrome.value) return;
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

watch(mobileMenuOpen, (open) => {
  lockBodyScroll(open);
});

watch(
  () => props.previewLayout,
  () => {
    closeMobileMenu();
  },
);

onUnmounted(() => {
  lockBodyScroll(false);
});

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

function onNavClick(url: string, event: MouseEvent) {
  if (url.startsWith("http")) return;
  event.preventDefault();
  closeMobileMenu();
  emit("navigate", url);
}

function goHome(event: MouseEvent) {
  onNavClick("/", event);
}

function setLanguage(lang: StudioLanguage) {
  emit("languageChange", lang);
  closeMobileMenu();
}
</script>

<template>
  <div
    ref="chromeRef"
    :class="[
      'relative flex min-h-full w-full max-w-full flex-col',
      animateEnter ? 'lp-chrome--animate' : '',
    ]"
  >
    <header
      class="lp-reveal-header sticky top-0 z-40 w-full shrink-0"
      :style="barStyle"
    >
      <div class="flex items-center gap-3 px-4 py-3 md:px-6 md:py-3.5">
        <button
          type="button"
          :class="[
            mobileMenuButtonClass,
            'h-9 w-9 shrink-0 items-center justify-center',
          ]"
          :aria-expanded="mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
          @click="toggleMobileMenu"
        >
          <Menu v-if="!mobileMenuOpen" class="h-5 w-5" />
          <X v-else class="h-5 w-5" />
        </button>

        <a
          href="/"
          class="min-w-0 truncate font-title text-lg font-semibold tracking-tight md:text-xl"
          :aria-label="styleConfig.studioName || 'Home'"
          @click="goHome"
        >
          <img
            v-if="styleConfig.logoUrl"
            :src="styleConfig.logoUrl"
            :alt="styleConfig.studioName || 'Home'"
            class="h-8 w-auto max-w-[150px] object-contain"
            referrerpolicy="no-referrer"
          />
          <template v-else>
            {{ styleConfig.studioName }}
          </template>
        </a>

        <nav
          :class="[
            desktopNavClass,
            'ml-auto items-center gap-5 text-xs font-medium tracking-[0.06em]',
          ]"
        >
          <a
            v-for="link in allNavLinks"
            :key="link.id"
            :href="link.url"
            class="capitalize opacity-85 transition-opacity hover:opacity-100"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
        </nav>

        <div
          v-if="styleConfig.showLanguageSwitcher"
          :class="[
            forceMobileChrome ? 'hidden' : 'hidden md:flex',
            'ml-2 items-center gap-1 text-[10px] font-medium tracking-[0.12em]',
          ]"
        >
          <button
            type="button"
            class="transition-opacity"
            :class="language === 'bm' ? 'opacity-100' : 'opacity-55'"
            @click="setLanguage('bm')"
          >
            Bm
          </button>
          <span class="opacity-40">/</span>
          <button
            type="button"
            class="transition-opacity"
            :class="language === 'en' ? 'opacity-100' : 'opacity-55'"
            @click="setLanguage('en')"
          >
            En
          </button>
        </div>

        <a
          href="/lead-form"
          :class="[
            forceMobileChrome
              ? 'ml-auto inline-flex'
              : 'ml-3 hidden md:inline-flex',
            'shrink-0 items-center border-2 px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em]',
          ]"
          :style="{
            borderColor: 'currentColor',
            color: 'inherit',
          }"
          @click="onNavClick('/lead-form', $event)"
        >
          Book
        </a>
      </div>

      <!-- Marquee ticker -->
      <div
        class="overflow-hidden border-t border-current/20 py-1.5 text-[10px] tracking-[0.22em]"
        aria-hidden="true"
      >
        <div class="bb-marquee flex w-max gap-10 whitespace-nowrap opacity-80">
          <span
            v-for="n in 8"
            :key="n"
          >
            {{ styleConfig.studioName || "Studio" }} · Now booking ·
          </span>
        </div>
      </div>
    </header>

    <Teleport to="body" :disabled="forceMobileChrome">
      <Transition name="lp-menu">
        <div
          v-if="mobileMenuOpen"
          :class="mobileMenuShellClass"
          :style="mobileMenuSurfaceStyle"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div class="lp-mobile-menu__panel">
            <div class="lp-mobile-menu__top">
              <button
                type="button"
                class="lp-mobile-menu__close"
                aria-label="Close menu"
                @click="closeMobileMenu"
              >
                <X class="h-5 w-5" />
              </button>
              <a
                href="/"
                class="lp-mobile-menu__brand"
                :aria-label="styleConfig.studioName || 'Home'"
                @click="goHome"
              >
                <span
                  v-if="styleConfig.studioName"
                  class="font-title text-xl tracking-tight"
                >
                  {{ styleConfig.studioName }}
                </span>
              </a>
              <div class="h-10 w-10 shrink-0" aria-hidden="true" />
            </div>

            <nav class="lp-mobile-menu__nav">
              <a
                v-for="(link, index) in allNavLinks"
                :key="link.id"
                :href="link.url"
                class="lp-mobile-menu__link capitalize tracking-[0.06em]"
                :style="{ '--menu-i': index }"
                @click="onNavClick(link.url, $event)"
              >
                {{ link.label }}
              </a>
            </nav>

            <div
              v-if="styleConfig.showLanguageSwitcher"
              class="lp-mobile-menu__lang"
            >
              <button
                type="button"
                class="transition-opacity"
                :class="language === 'bm' ? 'opacity-100' : 'opacity-55'"
                @click="setLanguage('bm')"
              >
                Bm
              </button>
              <span class="opacity-40">/</span>
              <button
                type="button"
                class="transition-opacity"
                :class="language === 'en' ? 'opacity-100' : 'opacity-55'"
                @click="setLanguage('en')"
              >
                En
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <main class="w-full min-w-0 flex-1 overflow-x-clip">
      <slot />
    </main>

    <footer class="lp-reveal-footer w-full shrink-0" :style="barStyle">
      <div class="px-4 py-10 md:px-6 md:py-14">
        <p
          v-if="styleConfig.studioName"
          class="mb-6 font-title text-4xl leading-none tracking-tight md:text-6xl lg:text-7xl"
        >
          {{ styleConfig.studioName }}
        </p>

        <div class="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm opacity-85">
          <a
            v-for="link in footerNav"
            :key="link.id"
            :href="link.url"
            class="capitalize transition-opacity hover:opacity-100"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
        </div>

        <div class="space-y-1 text-xs opacity-75">
          <p v-if="styleConfig.mapAddress">{{ styleConfig.mapAddress }}</p>
          <p v-if="styleConfig.contactEmail">{{ styleConfig.contactEmail }}</p>
          <p v-if="footerPhone && whatsappHref">
            <a
              :href="whatsappHref"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:opacity-100"
            >{{ footerPhone }}</a>
          </p>
          <p v-if="mapsHref">
            <a
              :href="mapsHref"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:opacity-100"
            >Google Maps</a>
          </p>
        </div>

        <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] opacity-70">
          <p>{{ styleConfig.footerCopyright }}</p>
          <div
            v-if="styleConfig.showSocials && socialLinks.length"
            class="flex gap-4"
          >
            <a
              v-for="link in socialLinks"
              :key="link.href"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:opacity-100"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.bb-marquee {
  animation: bb-marquee 28s linear infinite;
}

@keyframes bb-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bb-marquee {
    animation: none;
  }
}
</style>
