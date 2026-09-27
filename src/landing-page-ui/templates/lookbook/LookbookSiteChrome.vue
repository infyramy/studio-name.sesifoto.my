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
import SiteLogo from "../../portfolio/SiteLogo.vue";

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

const mobileMenuSurfaceStyle = computed(() => {
  const t = props.styleConfig;
  const isDark = (t.mode || "dark") !== "light";
  const bg = isDark ? "#0a0a0a" : "#faf9f7";
  const fg = isDark ? "#fafafa" : "#111111";
  return {
    backgroundColor: bg,
    color: fg,
    ["--bg-main" as string]: bg,
    ["--text-main" as string]: fg,
    ["--text-muted" as string]: isDark
      ? "rgba(255,255,255,0.55)"
      : "rgba(0,0,0,0.5)",
    ["--border-color" as string]: isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.08)",
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
      class="lp-reveal-header sticky top-0 z-40 w-full shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-main)]/90 backdrop-blur-md"
    >
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 md:px-8 md:py-5">
        <div class="flex items-center gap-3">
          <button
            type="button"
            :class="[
              mobileMenuButtonClass,
              'h-9 w-9 shrink-0 items-center justify-center text-[var(--text-main)]',
            ]"
            :aria-expanded="mobileMenuOpen"
            :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
            @click="toggleMobileMenu"
          >
            <Menu v-if="!mobileMenuOpen" class="h-5 w-5" />
            <X v-else class="h-5 w-5" />
          </button>

          <nav
            :class="[
              desktopNavClass,
              'items-center gap-6 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]',
            ]"
          >
            <a
              v-for="link in headerNavLeft"
              :key="link.id"
              :href="link.url"
              class="transition-colors hover:text-[var(--text-main)]"
              @click="onNavClick(link.url, $event)"
            >
              {{ link.label }}
            </a>
          </nav>
        </div>

        <a
          href="/"
          class="min-w-0 justify-self-center truncate text-center font-title text-base tracking-[0.18em] text-[var(--text-main)] md:text-lg"
          :aria-label="styleConfig.studioName || 'Home'"
          @click="goHome"
        >
          <SiteLogo
            v-if="styleConfig.logoUrl"
            :src="styleConfig.logoUrl"
            :alt="styleConfig.studioName || 'Home'"
            :logo-style="styleConfig.logoStyle"
            variant="header"
          />
          <template v-else>
            {{ styleConfig.studioName }}
          </template>
        </a>

        <div class="flex items-center justify-end gap-5">
          <nav
            :class="[
              desktopNavClass,
              'items-center gap-6 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]',
            ]"
          >
            <a
              v-for="link in headerNavRight"
              :key="link.id"
              :href="link.url"
              class="transition-colors hover:text-[var(--text-main)]"
              @click="onNavClick(link.url, $event)"
            >
              {{ link.label }}
            </a>
          </nav>

          <div
            v-if="styleConfig.showLanguageSwitcher"
            :class="[
              forceMobileChrome ? 'hidden' : 'hidden md:flex',
              'items-center gap-1 text-[10px] tracking-[0.16em] text-[var(--text-muted)]',
            ]"
          >
            <button
              type="button"
              class="transition-colors"
              :class="language === 'bm' ? 'text-[var(--text-main)]' : ''"
              @click="setLanguage('bm')"
            >
              Bm
            </button>
            <span>/</span>
            <button
              type="button"
              class="transition-colors"
              :class="language === 'en' ? 'text-[var(--text-main)]' : ''"
              @click="setLanguage('en')"
            >
              En
            </button>
          </div>
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
                  class="font-title text-xl tracking-[0.14em]"
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
                class="lp-mobile-menu__link uppercase tracking-[0.18em]"
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
                :class="language === 'bm' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
                @click="setLanguage('bm')"
              >
                Bm
              </button>
              <span class="text-[var(--text-muted)]">/</span>
              <button
                type="button"
                class="transition-opacity"
                :class="language === 'en' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
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

    <footer
      class="lp-reveal-footer w-full shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-main)]"
    >
      <div class="px-4 py-14 md:px-8 md:py-20">
        <p
          v-if="styleConfig.studioName"
          class="mb-10 max-w-4xl font-title text-4xl leading-[0.95] tracking-tight text-[var(--text-main)] md:text-6xl lg:text-7xl"
        >
          {{ styleConfig.studioName }}
        </p>

        <div
          class="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]"
        >
          <a
            v-for="link in footerNav"
            :key="link.id"
            :href="link.url"
            class="transition-colors hover:text-[var(--text-main)]"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
        </div>

        <div class="space-y-1 text-xs text-[var(--text-muted)]">
          <p v-if="styleConfig.mapAddress">{{ styleConfig.mapAddress }}</p>
          <p v-if="styleConfig.contactEmail">{{ styleConfig.contactEmail }}</p>
          <p v-if="footerPhone && whatsappHref">
            <a
              :href="whatsappHref"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[var(--text-main)]"
            >{{ footerPhone }}</a>
          </p>
          <p v-if="mapsHref">
            <a
              :href="mapsHref"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[var(--text-main)]"
            >Google Maps</a>
          </p>
        </div>

        <div
          class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-color)] pt-6 text-[10px] tracking-[0.12em] text-[var(--text-muted)]"
        >
          <p>{{ styleConfig.footerCopyright }}</p>
          <div
            v-if="styleConfig.showSocials && socialLinks.length"
            class="flex gap-5 uppercase tracking-[0.18em]"
          >
            <a
              v-for="link in socialLinks"
              :key="link.href"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[var(--text-main)]"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
