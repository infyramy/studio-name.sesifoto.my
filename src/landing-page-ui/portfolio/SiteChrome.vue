<script setup lang="ts">
import { computed, ref } from "vue";
import { Facebook, Instagram, Mail, MapPin, Menu, MessageCircle, X } from "lucide-vue-next";
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

const mobileMenuPanelClass = computed(() =>
  forceMobileChrome.value ? "block" : "md:hidden",
);

function onNavClick(url: string, event: MouseEvent) {
  if (url.startsWith("http")) return;
  event.preventDefault();
  mobileMenuOpen.value = false;
  emit("navigate", url);
}

function setLanguage(lang: StudioLanguage) {
  emit("languageChange", lang);
  mobileMenuOpen.value = false;
}
</script>

<template>
  <div class="flex min-h-full w-full max-w-full flex-col overflow-x-hidden">
    <header class="w-full shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 md:gap-3 md:px-6 md:py-4"
      >
        <button
          type="button"
          :class="[
            mobileMenuButtonClass,
            'h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border-color)] text-[var(--text-main)]',
          ]"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
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
            class="uppercase text-[var(--text-main)] transition-opacity hover:opacity-70"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="flex min-w-0 flex-1 justify-center px-1 md:px-2">
          <img
            v-if="styleConfig.logoUrl"
            :src="styleConfig.logoUrl"
            :alt="styleConfig.studioName"
            class="h-9 w-auto max-w-[140px] object-contain md:h-12 md:max-w-none"
            referrerpolicy="no-referrer"
          />
          <span v-else class="truncate text-base font-semibold md:text-lg">
            {{ styleConfig.studioName }}
          </span>
        </div>

        <div :class="[desktopNavClass, 'items-center gap-5']">
          <nav class="flex items-center gap-5 text-xs font-medium tracking-wide">
            <a
              v-for="link in headerNavRight"
              :key="link.id"
              :href="link.url"
              class="uppercase text-[var(--text-main)] transition-opacity hover:opacity-70"
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
              class="uppercase transition-opacity"
              :class="language === 'bm' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
              @click="setLanguage('bm')"
            >
              BM
            </button>
            <span class="text-[var(--text-muted)]">|</span>
            <button
              type="button"
              class="uppercase transition-opacity"
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

      <div
        v-if="mobileMenuOpen"
        :class="[
          mobileMenuPanelClass,
          'border-t border-[var(--border-color)] bg-[var(--bg-main)]',
        ]"
      >
        <nav class="mx-auto flex max-w-6xl flex-col px-4 py-3">
          <a
            v-for="link in mobileNavLinks"
            :key="link.id"
            :href="link.url"
            class="border-b border-[var(--border-color)] py-3 text-sm font-medium uppercase tracking-wide text-[var(--text-main)] last:border-b-0"
            @click="onNavClick(link.url, $event)"
          >
            {{ link.label }}
          </a>
          <div
            v-if="styleConfig.showLanguageSwitcher"
            class="flex items-center gap-3 pt-4 text-xs font-medium"
          >
            <button
              type="button"
              class="uppercase transition-opacity"
              :class="language === 'bm' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
              @click="setLanguage('bm')"
            >
              BM
            </button>
            <span class="text-[var(--text-muted)]">|</span>
            <button
              type="button"
              class="uppercase transition-opacity"
              :class="language === 'en' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'"
              @click="setLanguage('en')"
            >
              EN
            </button>
          </div>
        </nav>
      </div>
    </header>

    <main class="w-full min-w-0 flex-1">
      <slot />
    </main>

    <footer class="w-full shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-main)]">
      <div class="mx-auto max-w-6xl px-4 py-8 text-center md:px-6 md:py-10">
        <div class="mb-6 flex justify-center">
          <img
            v-if="styleConfig.logoUrl"
            :src="styleConfig.logoUrl"
            :alt="styleConfig.studioName"
            class="h-10 w-auto max-w-[160px] object-contain opacity-90"
            referrerpolicy="no-referrer"
          />
        </div>

        <nav
          class="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs uppercase tracking-wide text-[var(--text-muted)]"
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
