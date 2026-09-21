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

const mobileNavLinks = computed(() => [
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

/** Display utility must live in one class — do not pair `hidden` with bare `flex`. */
const desktopNavClass = computed(() =>
  forceMobileChrome.value ? "hidden" : "hidden md:flex",
);

const desktopOnlyClass = computed(() =>
  forceMobileChrome.value ? "hidden" : "hidden md:block",
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
      animateEnter ? 'lp-chrome--animate' : '',
    ]"
  >
    <header class="lp-reveal-header sticky top-0 z-40 w-full shrink-0 bg-[var(--bg-main)]">
      <div class="mx-auto max-w-5xl px-4 pt-5 md:px-8 md:pt-7">
        <div class="relative flex items-center justify-center">
          <button
            type="button"
            :class="[
              mobileMenuButtonClass,
              'absolute left-0 h-9 w-9 items-center justify-center text-[var(--text-main)]',
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
            class="flex min-w-0 flex-col items-center gap-1 transition-opacity hover:opacity-70"
            :aria-label="styleConfig.studioName || 'Home'"
            @click="goHome"
          >
            <img
              v-if="styleConfig.logoUrl"
              :src="styleConfig.logoUrl"
              :alt="styleConfig.studioName || 'Home'"
              class="h-8 w-auto max-w-[160px] object-contain md:h-10"
              referrerpolicy="no-referrer"
            />
            <span
              v-else-if="styleConfig.studioName"
              class="truncate text-center font-title text-2xl tracking-[0.08em] text-[var(--text-main)] md:text-3xl"
            >
              {{ styleConfig.studioName }}
            </span>
          </a>

          <div
            v-if="styleConfig.showLanguageSwitcher"
            :class="[
              desktopOnlyClass,
              'absolute right-0 text-[10px] font-medium tracking-[0.2em]',
            ]"
          >
            <button
              type="button"
              class="transition-opacity"
              :class="language === 'bm' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
              @click="setLanguage('bm')"
            >
              BM
            </button>
            <span class="mx-1 text-[var(--text-muted)]">/</span>
            <button
              type="button"
              class="transition-opacity"
              :class="language === 'en' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
              @click="setLanguage('en')"
            >
              EN
            </button>
          </div>
        </div>

        <div class="mt-4 border-t border-[var(--border-color)]" />

        <nav
          :class="[
            desktopNavClass,
            'items-center justify-center gap-8 py-3 text-[11px] font-medium tracking-[0.22em] text-[var(--text-muted)]',
          ]"
        >
          <a
            v-for="link in [...headerNavLeft, ...headerNavRight]"
            :key="link.id"
            :href="link.url"
            class="transition-colors hover:text-[var(--text-main)]"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
        </nav>
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
                  class="font-title text-xl tracking-[0.08em]"
                >
                  {{ styleConfig.studioName }}
                </span>
              </a>
              <div class="h-10 w-10 shrink-0" aria-hidden="true" />
            </div>

            <nav class="lp-mobile-menu__nav">
              <a
                v-for="(link, index) in mobileNavLinks"
                :key="link.id"
                :href="link.url"
                class="lp-mobile-menu__link tracking-[0.18em]"
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
                BM
              </button>
              <span class="text-[var(--text-muted)]">/</span>
              <button
                type="button"
                class="transition-opacity"
                :class="language === 'en' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
                @click="setLanguage('en')"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <main class="w-full min-w-0 flex-1 overflow-x-clip">
      <slot />
    </main>

    <footer class="lp-reveal-footer w-full shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-main)]">
      <div class="mx-auto max-w-5xl px-4 py-10 text-center md:px-8 md:py-12">
        <p
          v-if="styleConfig.studioName"
          class="mb-5 font-title text-xl tracking-[0.12em] text-[var(--text-main)]"
        >
          {{ styleConfig.studioName }}
        </p>

        <nav
          class="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] tracking-[0.2em] text-[var(--text-muted)]"
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
        </nav>

        <div
          class="mb-5 space-y-1 text-xs leading-relaxed text-[var(--text-muted)]"
        >
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

        <p class="mb-4 text-[10px] tracking-[0.14em] text-[var(--text-muted)]">
          {{ styleConfig.footerCopyright }}
        </p>

        <div
          v-if="styleConfig.showSocials && socialLinks.length"
          class="flex items-center justify-center gap-5 text-[10px] tracking-[0.2em] text-[var(--text-muted)]"
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
</template>
