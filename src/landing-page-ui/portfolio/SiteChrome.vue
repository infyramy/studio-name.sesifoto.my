<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { Facebook, Instagram, Mail, MapPin, Menu, MessageCircle, X } from "lucide-vue-next";
import { useLandingPageEnter } from "../useLandingPageEnter";
import {
  getSiteNavLabel,
  SITE_NAV_FOOTER,
  SITE_NAV_HEADER_LEFT,
  SITE_NAV_HEADER_RIGHT,
} from "../site-nav";
import type { HomePreviewLayout } from "../home-marketing/useHomeLayout";
import type { LandingPageTheme, StudioLanguage } from "../types";
import { normalizePhone, safeHttpUrl } from "../useLandingPageStyles";

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
  const links: { href: string; label: string; icon: "instagram" | "facebook" }[] =
    [];
  const ig = safeHttpUrl(props.styleConfig.socialInstagram);
  const fb = safeHttpUrl(props.styleConfig.socialFacebook);
  if (ig) links.push({ href: ig, label: "Instagram", icon: "instagram" });
  if (fb) links.push({ href: fb, label: "Facebook", icon: "facebook" });
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

const hasFooterContact = computed(
  () =>
    !!props.styleConfig.ssmNumber?.trim() ||
    !!props.styleConfig.mapAddress?.trim() ||
    !!props.styleConfig.contactEmail?.trim() ||
    !!whatsappHref.value ||
    !!mapsHref.value,
);

const forceMobileChrome = computed(
  () =>
    props.previewLayout === "mobile" || props.previewLayout === "tablet",
);

const mobileOnlyClass = computed(() =>
  forceMobileChrome.value ? "" : "md:hidden",
);

const desktopNavClass = computed(() =>
  forceMobileChrome.value ? "hidden" : "hidden md:flex",
);

const mobileMenuButtonClass = computed(() =>
  forceMobileChrome.value ? "inline-flex" : "inline-flex md:hidden",
);

const headerBarClass = computed(() =>
  forceMobileChrome.value
    ? "mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3"
    : "mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 md:gap-3 md:px-6 md:py-4",
);

const brandLinkClass = computed(() =>
  forceMobileChrome.value
    ? "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-opacity hover:opacity-80"
    : "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 md:px-2 transition-opacity hover:opacity-80",
);

const logoClass = computed(() =>
  forceMobileChrome.value
    ? "h-9 w-auto max-w-[140px] object-contain"
    : "h-9 w-auto max-w-[140px] object-contain md:h-12 md:max-w-none",
);

const footerInnerClass = computed(() =>
  forceMobileChrome.value
    ? "mx-auto max-w-6xl px-4 py-8 text-center"
    : "mx-auto max-w-6xl px-4 py-8 text-center md:px-6 md:py-10",
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
    <header
      class="lp-reveal-header sticky top-0 z-40 w-full shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-main)]"
    >
      <div :class="headerBarClass">
        <button
          type="button"
          :class="[
            mobileMenuButtonClass,
            'h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border-color)] text-[var(--text-main)]',
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
            'items-center gap-5 text-xs font-medium tracking-wide',
          ]"
        >
          <a
            v-for="link in headerNavLeft"
            :key="link.id"
            :href="link.url"
            class="text-[var(--text-main)] transition-opacity hover:opacity-70"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
        </nav>

        <a
          href="/"
          :class="brandLinkClass"
          :aria-label="styleConfig.studioName || 'Home'"
          @click="goHome"
        >
          <img
            v-if="styleConfig.logoUrl"
            :src="styleConfig.logoUrl"
            :alt="styleConfig.studioName || 'Home'"
            :class="logoClass"
            referrerpolicy="no-referrer"
          />
          <span
            v-else-if="styleConfig.studioName"
            class="truncate text-center text-base font-semibold"
          >
            {{ styleConfig.studioName }}
          </span>
        </a>

        <div :class="[desktopNavClass, 'items-center gap-5']">
          <nav class="flex items-center gap-5 text-xs font-medium tracking-wide">
            <a
              v-for="link in headerNavRight"
              :key="link.id"
              :href="link.url"
              class="text-[var(--text-main)] transition-opacity hover:opacity-70"
              @click="onNavClick(link.url, $event)"
            >
              {{ link.label }}
            </a>
          </nav>
          <div
            v-if="styleConfig.showLanguageSwitcher"
            class="ml-2 flex items-center gap-1 text-xs font-medium"
          >
            <button
              type="button"
              class="transition-opacity"
              :class="language === 'bm' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
              @click="setLanguage('bm')"
            >
              BM
            </button>
            <span class="text-[var(--text-muted)]">|</span>
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

        <div
          :class="['h-10 w-10 shrink-0', mobileOnlyClass]"
          aria-hidden="true"
        />
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
                <img
                  v-if="styleConfig.logoUrl"
                  :src="styleConfig.logoUrl"
                  :alt="styleConfig.studioName"
                  class="h-9 w-auto max-w-[140px] object-contain"
                  referrerpolicy="no-referrer"
                />
                <span
                  v-else-if="styleConfig.studioName"
                  class="text-base font-semibold"
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
                class="lp-mobile-menu__link"
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
              <span class="text-[var(--text-muted)]">|</span>
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

    <footer
      class="lp-reveal-footer w-full shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-main)]"
    >
      <div :class="footerInnerClass">
        <div class="mb-6 flex justify-center">
          <a
            v-if="styleConfig.logoUrl"
            href="/"
            class="inline-flex transition-opacity hover:opacity-70"
            :aria-label="styleConfig.studioName || 'Home'"
            @click="goHome"
          >
            <img
              :src="styleConfig.logoUrl"
              :alt="styleConfig.studioName"
              class="h-10 w-auto max-w-[160px] object-contain opacity-90"
              referrerpolicy="no-referrer"
            />
          </a>
        </div>

        <nav
          class="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs tracking-wide text-[var(--text-muted)]"
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
          v-if="hasFooterContact"
          class="mb-6 flex flex-col items-center gap-2 text-xs text-[var(--text-muted)]"
        >
          <p class="font-semibold text-[var(--text-main)]">
            {{ styleConfig.studioName }}
            <span
              v-if="styleConfig.ssmNumber"
              class="ml-1 font-normal opacity-70"
            >{{ styleConfig.ssmNumber }}</span>
          </p>
          <p
            v-if="styleConfig.mapAddress"
            class="flex items-center justify-center gap-1.5 text-center"
          >
            <MapPin class="h-3.5 w-3.5 shrink-0" />
            <span>{{ styleConfig.mapAddress }}</span>
          </p>
          <div
            class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          >
            <a
              v-if="whatsappHref"
              :href="whatsappHref"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 hover:underline"
            >
              <MessageCircle class="h-3.5 w-3.5 shrink-0" />
              <span>{{ footerPhone }}</span>
            </a>
            <a
              v-if="styleConfig.contactEmail"
              :href="`mailto:${styleConfig.contactEmail}`"
              class="inline-flex items-center gap-1.5 hover:underline"
            >
              <Mail class="h-3.5 w-3.5 shrink-0" />
              <span>{{ styleConfig.contactEmail }}</span>
            </a>
            <a
              v-if="mapsHref"
              :href="mapsHref"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 hover:underline"
            >
              <MapPin class="h-3.5 w-3.5 shrink-0" />
              <span>Google Maps</span>
            </a>
          </div>
        </div>

        <p class="mb-4 break-words text-xs text-[var(--text-muted)]">
          {{ styleConfig.footerCopyright }}
        </p>

        <div
          v-if="styleConfig.showSocials && socialLinks.length"
          class="flex items-center justify-center gap-4"
        >
          <a
            v-for="link in socialLinks"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-main)] hover:opacity-70"
            :aria-label="link.label"
          >
            <Instagram v-if="link.icon === 'instagram'" class="h-4 w-4" />
            <Facebook v-else class="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
