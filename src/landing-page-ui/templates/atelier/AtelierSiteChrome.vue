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

const showDesktopRail = computed(() => !forceMobileChrome.value);

const mobileMenuButtonClass = computed(() =>
  forceMobileChrome.value ? "inline-flex" : "inline-flex md:hidden",
);

const mobileTopBarClass = computed(() =>
  forceMobileChrome.value ? "flex" : "flex md:hidden",
);

const desktopRailClass = computed(() =>
  forceMobileChrome.value ? "hidden" : "hidden md:flex",
);

const mobileMenuShellClass = computed(() =>
  forceMobileChrome.value
    ? "lp-mobile-menu lp-mobile-menu--embedded"
    : "lp-mobile-menu",
);

const mobileMenuSurfaceStyle = computed(() => {
  const t = props.styleConfig;
  const isDark = (t.mode || "dark") !== "light";
  const bg = t.secondaryColor || (isDark ? "#050505" : "#f7f7f5");
  const fg = t.secondaryTextColor || (isDark ? "#ffffff" : "#111111");
  return {
    backgroundColor: bg,
    color: fg,
    ["--bg-main" as string]: bg,
    ["--text-main" as string]: fg,
    ["--text-muted" as string]: isDark
      ? "rgba(255,255,255,0.65)"
      : "rgba(0,0,0,0.55)",
    ["--border-color" as string]: isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.1)",
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
      showDesktopRail ? 'md:flex-row' : '',
      animateEnter ? 'lp-chrome--animate' : '',
    ]"
  >
    <!-- Mobile top bar -->
    <header
      :class="[
        mobileTopBarClass,
        'lp-reveal-header sticky top-0 z-40 w-full shrink-0 items-center justify-between gap-3 border-b border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3',
      ]"
    >
      <button
        type="button"
        :class="[
          mobileMenuButtonClass,
          'h-9 w-9 items-center justify-center text-[var(--text-main)]',
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
        class="min-w-0 truncate font-title text-base tracking-[0.06em] text-[var(--text-main)]"
        :aria-label="styleConfig.studioName || 'Home'"
        @click="goHome"
      >
        <img
          v-if="styleConfig.logoUrl"
          :src="styleConfig.logoUrl"
          :alt="styleConfig.studioName || 'Home'"
          class="mx-auto h-7 w-auto max-w-[140px] object-contain"
          referrerpolicy="no-referrer"
        />
        <template v-else>
          {{ styleConfig.studioName }}
        </template>
      </a>

      <div class="h-9 w-9 shrink-0" aria-hidden="true" />
    </header>

    <!-- Desktop left rail -->
    <aside
      :class="[
        desktopRailClass,
        'lp-reveal-header sticky top-0 z-40 h-dvh w-[11.5rem] shrink-0 flex-col justify-between border-r border-[var(--border-color)] bg-[var(--bg-main)] px-5 py-8',
      ]"
    >
      <div class="space-y-10">
        <a
          href="/"
          class="block transition-opacity hover:opacity-70"
          :aria-label="styleConfig.studioName || 'Home'"
          @click="goHome"
        >
          <img
            v-if="styleConfig.logoUrl"
            :src="styleConfig.logoUrl"
            :alt="styleConfig.studioName || 'Home'"
            class="h-8 w-auto max-w-full object-contain"
            referrerpolicy="no-referrer"
          />
          <span
            v-else-if="styleConfig.studioName"
            class="block font-title text-lg leading-tight tracking-[0.02em] text-[var(--text-main)]"
          >
            {{ styleConfig.studioName }}
          </span>
        </a>

        <nav class="flex flex-col gap-3">
          <a
            v-for="link in allNavLinks"
            :key="link.id"
            :href="link.url"
            class="text-[11px] tracking-[0.08em] text-[var(--text-muted)] capitalize transition-colors hover:text-[var(--text-main)]"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
        </nav>
      </div>

      <div class="space-y-4">
        <div
          v-if="styleConfig.showLanguageSwitcher"
          class="flex items-center gap-1 text-[10px] tracking-[0.14em]"
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
        <p
          v-if="styleConfig.studioName"
          class="text-[9px] leading-relaxed tracking-[0.16em] text-[var(--text-muted)]"
        >
          Atelier
        </p>
      </div>
    </aside>

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
                  class="font-title text-xl tracking-[0.04em]"
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
                class="lp-mobile-menu__link capitalize tracking-[0.08em]"
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

    <div class="flex min-w-0 flex-1 flex-col">
      <main class="w-full min-w-0 flex-1 overflow-x-clip">
        <slot />
      </main>

      <footer
        class="lp-reveal-footer w-full shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-main)]"
      >
        <div class="px-4 py-8 md:px-8 md:py-10">
          <div
            class="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--border-color)] pb-4"
          >
            <p
              v-if="styleConfig.studioName"
              class="font-title text-sm tracking-[0.2em] text-[var(--text-main)]"
            >
              {{ styleConfig.studioName }}
            </p>
            <p class="text-[10px] tracking-[0.14em] text-[var(--text-muted)]">
              {{ styleConfig.footerCopyright }}
            </p>
          </div>

          <div class="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[var(--text-muted)]">
            <a
              v-for="link in footerNav"
              :key="link.id"
              :href="link.url"
              class="capitalize transition-colors hover:text-[var(--text-main)]"
              @click="onNavClick(link.url, $event)"
            >
              {{ link.label }}
            </a>
          </div>

          <div
            class="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]"
          >
            <span v-if="styleConfig.mapAddress">{{ styleConfig.mapAddress }}</span>
            <span v-if="styleConfig.contactEmail">{{ styleConfig.contactEmail }}</span>
            <a
              v-if="footerPhone && whatsappHref"
              :href="whatsappHref"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[var(--text-main)]"
            >{{ footerPhone }}</a>
            <a
              v-if="mapsHref"
              :href="mapsHref"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[var(--text-main)]"
            >Google Maps</a>
          </div>

          <div
            v-if="styleConfig.showSocials && socialLinks.length"
            class="mt-4 flex flex-wrap gap-4 text-[11px] tracking-[0.1em] text-[var(--text-muted)]"
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
      </footer>
    </div>
  </div>
</template>
