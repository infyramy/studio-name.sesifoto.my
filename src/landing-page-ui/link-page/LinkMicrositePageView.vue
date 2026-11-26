<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  ChevronRight,
  ExternalLink,
  Facebook,
  Instagram,
  MapPin,
  Menu,
  Phone,
  Tag,
  X,
} from "lucide-vue-next";
import LandingPageBootState from "../LandingPageBootState.vue";
import { tLandingPage } from "../i18n";
import type {
  LandingPageTheme,
  ProductEntitlements,
  StudioLanguage,
} from "../types";
import { safeHttpUrl } from "../useLandingPageStyles";
import type { LinkPageActionItem, LinkPageDesignConfig } from "./types";
import { normalizeLinkPageDesignConfig } from "./normalize";

const SESIFOTO_LOGO_SRC = "/brand/sesifoto.svg";
const SESIFOTO_HOME_URL = "https://sesifoto.my";

const DEFAULT_HERO_PLACEHOLDER =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1400&auto=format&fit=crop";

const props = withDefaults(
  defineProps<{
    config: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    productEntitlements?: ProductEntitlements;
    loading?: boolean;
    loadError?: string | null;
    surfaceClass?: string;
    editable?: boolean;
    activeSection?: string | null;
  }>(),
  {
    language: "en",
    mode: "preview",
    productEntitlements: () => ({ studio: true, crm: true }),
    loading: false,
    loadError: null,
    surfaceClass: "landing-surface",
    editable: false,
    activeSection: null,
  },
);

const emit = defineEmits<{
  navigate: [url: string];
  languageChange: [lang: StudioLanguage];
  retryLoad: [];
  selectSection: [id: string];
}>();

const d = computed<LinkPageDesignConfig>(() =>
  normalizeLinkPageDesignConfig(props.config.linkPageDesign),
);

// Measure container width so preview frames (375px mobile vs 100% desktop) respond accurately
const rootRef = ref<HTMLElement | null>(null);
const containerWidth = ref(1200);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (rootRef.value) {
    containerWidth.value = rootRef.value.clientWidth || window.innerWidth;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(rootRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  if (slideTimer) clearInterval(slideTimer);
});

const isMobile = computed(() => containerWidth.value <= 700);

const effectivePhotoWidth = computed(() => {
  const raw = d.value.imageWidth;
  if (!isSplitLayout.value) return raw;
  if (containerWidth.value < 900) return Math.min(raw, 48);
  if (containerWidth.value < 1120) return Math.min(raw, 55);
  return Math.min(raw, 65);
});

// Load Google Fonts dynamically for heading & body without invalid weight axis 400 errors
const SINGLE_WEIGHT_FONTS = new Set(["Instrument Serif"]);
const loadedFonts = new Set<string>();
function ensureGoogleFonts(fonts: string[]) {
  if (typeof document === "undefined") return;
  for (const font of fonts) {
    const clean = font.trim();
    if (!clean || loadedFonts.has(clean)) continue;
    loadedFonts.add(clean);
    const id = `lp-font-${clean.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    const axis = SINGLE_WEIGHT_FONTS.has(clean)
      ? "ital,wght@0,400;1,400"
      : "ital,wght@0,400;0,500;0,600;0,700;1,400";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean)}:${axis}&display=swap`;
    document.head.appendChild(link);
  }
}

watch(
  () => [d.value.headingFont, d.value.bodyFont],
  ([h, b]) => ensureGoogleFonts([h, b]),
  { immediate: true },
);

// Slideshow support
const activeSlideIdx = ref(0);
let slideTimer: ReturnType<typeof setInterval> | null = null;

const activePhotos = computed(() => {
  const main = d.value.mainImage || props.config.heroUrl;
  const mobile = d.value.mobileImage || main;
  const base = isMobile.value ? mobile : main;

  if (d.value.imageMode === "Slideshow" && d.value.galleryImages.length > 0) {
    const list = base ? [base, ...d.value.galleryImages] : d.value.galleryImages;
    return list;
  }
  return [base || DEFAULT_HERO_PLACEHOLDER];
});

watch(
  () => [d.value.imageMode, d.value.slideInterval, activePhotos.value.length],
  () => {
    if (slideTimer) clearInterval(slideTimer);
    activeSlideIdx.value = 0;
    if (d.value.imageMode === "Slideshow" && activePhotos.value.length > 1) {
      slideTimer = setInterval(() => {
        activeSlideIdx.value =
          (activeSlideIdx.value + 1) % activePhotos.value.length;
      }, (d.value.slideInterval || 5) * 1000);
    }
  },
  { immediate: true },
);

const currentPhoto = computed(
  () => activePhotos.value[activeSlideIdx.value] || DEFAULT_HERO_PLACEHOLDER,
);

// Helpers for color luminance and rgba
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [0, 0, 0];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const isFullBg = computed(() =>
  isMobile.value
    ? d.value.mobileLayout === "Full Background" ||
      (d.value.mobileLayout === "Automatic" &&
        d.value.layout === "Full Background")
    : d.value.layout === "Full Background",
);

const isSplitLayout = computed(
  () =>
    !isMobile.value &&
    ["Split Left", "Split Right", "Editorial", "Portrait Frame"].includes(
      d.value.layout,
    ),
);

const isTopBrandOverlay = computed(
  () =>
    isFullBg.value ||
    (isMobile.value && effectiveMobileLayout.value === "Image Above"),
);

const effectiveMobileLayout = computed(() => {
  if (!isMobile.value) return "";
  if (d.value.mobileLayout !== "Automatic") return d.value.mobileLayout;
  return d.value.layout === "Full Background" ? "Full Background" : "Image Above";
});

const overlayStyle = computed(() => {
  const op = (d.value.opacity ?? 20) / 100;
  const c = rgba(d.value.overlayColor || "#000000", op);
  const topScrim =
    isFullBg.value && d.value.logoPosition.startsWith("Top")
      ? ", linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 26%)"
      : "";

  switch (d.value.overlay) {
    case "Solid":
      return { background: c };
    case "Bottom Gradient":
      return {
        background: `linear-gradient(to top, ${rgba(d.value.overlayColor || "#000000", Math.min(0.82, op + 0.34))} 0%, ${c} 42%, transparent 78%)${topScrim}`,
      };
    case "Top Gradient":
      return {
        background: `linear-gradient(to bottom, ${rgba(d.value.overlayColor || "#000000", Math.min(0.82, op + 0.34))} 0%, ${c} 42%, transparent 78%)`,
      };
    case "Vignette":
      return {
        background: `radial-gradient(circle, transparent 35%, ${c} 100%)${topScrim}`,
      };
    default:
      return topScrim
        ? { background: "linear-gradient(to bottom, rgba(0,0,0,0.24) 0%, transparent 24%)" }
        : { background: "none" };
  }
});

// CSS variables mapping from LinkPageDesignConfig
const cssVars = computed(() => {
  const cfg = d.value;

  const fontStack = (font: string, fallback: string) =>
    `"${font.replace(/["';]/g, "")}", ${fallback}`;

  const headingSizes: Record<string, string> = {
    Small: "clamp(22px, 3vw, 28px)",
    Medium: "clamp(26px, 3.6vw, 36px)",
    Large: "clamp(32px, 4.4vw, 48px)",
    Display: "clamp(38px, 5.5vw, 62px)",
  };
  const bodySizes: Record<string, string> = {
    Small: "13px",
    Medium: "15px",
    Large: "17px",
  };
  const logoSizes: Record<string, string> = {
    Small: "24px",
    Medium: "32px",
    Large: "44px",
  };
  const headingWeights: Record<string, number> = {
    Regular: 400,
    Medium: 500,
    Semibold: 600,
    Bold: 700,
  };
  const letterSpacings: Record<string, string> = {
    Tight: "-0.025em",
    Normal: "0em",
    Wide: "0.08em",
  };
  const contentWidths: Record<string, string> = {
    Narrow: "400px",
    Standard: "480px",
    Wide: "580px",
  };
  const actionWidths: Record<string, string> = {
    Narrow: "360px",
    Standard: "460px",
    Wide: "560px",
  };
  const gaps: Record<string, string> = {
    Tight: "10px",
    Comfortable: "16px",
    Spacious: "24px",
  };
  const actionGaps: Record<string, string> = {
    Tight: "6px",
    Comfortable: "10px",
    Spacious: "14px",
  };
  const cardRadii: Record<string, string> = {
    None: "0px",
    Small: "10px",
    Medium: "18px",
    Large: "28px",
  };
  const cardShadows: Record<string, string> = {
    None: "none",
    Subtle: "0 12px 36px rgba(0, 0, 0, 0.12)",
    Elevated: "0 24px 60px rgba(0, 0, 0, 0.22)",
  };
  const btnRadii: Record<string, string> = {
    Square: "0px",
    "Soft Rounded": "10px",
    Pill: "9999px",
    Decorative: "0px",
  };
  const tileRadii: Record<string, string> = {
    Square: "0px",
    "Soft Rounded": "12px",
    Pill: "24px",
  };
  const btnHeights: Record<string, string> = {
    Small: "42px",
    Medium: "48px",
    Large: "56px",
  };

  // Position mapping
  const pos = cfg.position || "Bottom Centre";
  const vpos = pos.startsWith("Top")
    ? "flex-start"
    : pos.startsWith("Middle")
      ? "center"
      : "flex-end";
  const hpos = pos.endsWith("Left")
    ? "flex-start"
    : pos.endsWith("Right")
      ? "flex-end"
      : "center";

  const mobilePos =
    cfg.mobilePosition === "Top"
      ? "flex-start"
      : cfg.mobilePosition === "Bottom"
        ? "flex-end"
        : cfg.mobilePosition === "Centre"
          ? "center"
          : vpos;

  const align =
    isMobile.value && cfg.mobileAlignment !== "Automatic"
      ? cfg.mobileAlignment
      : cfg.alignment;
  const items =
    align === "Left" ? "flex-start" : align === "Right" ? "flex-end" : "center";

  const focusX = isMobile.value ? cfg.mobileFocusX : cfg.focusX;
  const focusY = isMobile.value ? cfg.mobileFocusY : cfg.focusY;

  const cardBg =
    cfg.container === "Glass"
      ? rgba(cfg.surface, Math.min(0.85, (cfg.containerOpacity || 80) / 100))
      : cfg.container === "Solid"
        ? rgba(cfg.surface, (cfg.containerOpacity || 100) / 100)
        : "transparent";

  const cardBorder =
    cfg.containerBorder === "Strong"
      ? `1.5px solid ${rgba(cfg.text, 0.25)}`
      : cfg.containerBorder === "Subtle"
        ? `1px solid ${rgba(cfg.text, 0.12)}`
        : cfg.container === "Outline"
          ? `1px solid ${rgba(cfg.text, 0.35)}`
          : "none";

  const mobileImgHeight =
    cfg.mobileImageHeight === "Compact"
      ? "34%"
      : cfg.mobileImageHeight === "Tall"
        ? "56%"
        : "48%";

  return {
    "--lp-primary": cfg.primary,
    "--lp-bg": cfg.background,
    "--lp-text": cfg.text,
    "--lp-surface": cfg.surface,
    "--lp-accent": cfg.accent,
    "--lp-btntext": cfg.buttonText,
    "--lp-photo-ink": "#FFFFFF",
    "--lp-heading": fontStack(cfg.headingFont, "Georgia, serif"),
    "--lp-body": fontStack(cfg.bodyFont, "system-ui, sans-serif"),
    "--lp-heading-size": headingSizes[cfg.headingSize] || headingSizes.Medium,
    "--lp-hw": String(headingWeights[cfg.headingWeight] || 400),
    "--lp-hs": cfg.headingStyle === "Italic" ? "italic" : "normal",
    "--lp-ls": letterSpacings[cfg.letterSpacing] || "0em",
    "--lp-case":
      cfg.headingCase === "Uppercase"
        ? "uppercase"
        : cfg.headingCase === "Lowercase"
          ? "lowercase"
          : "none",
    "--lp-bs": bodySizes[cfg.bodySize] || "15px",
    "--lp-bw": cfg.bodyWeight === "Medium" ? "500" : "400",
    "--lp-logo-size": logoSizes[cfg.logoSize] || "32px",
    "--lp-photo-width": `${effectivePhotoWidth.value}%`,
    "--lp-fit": cfg.imageFit.toLowerCase(),
    "--lp-focus": `${focusX}% ${focusY}%`,
    "--lp-content-width": contentWidths[cfg.width] || "480px",
    "--lp-action-width": actionWidths[cfg.actionWidth] || "460px",
    "--lp-gap": gaps[cfg.spacing] || "16px",
    "--lp-action-gap": actionGaps[cfg.actionGap] || "10px",
    "--lp-card-bg": cardBg,
    "--lp-card-radius": cardRadii[cfg.containerRadius] || "18px",
    "--lp-card-shadow": cardShadows[cfg.containerShadow] || "none",
    "--lp-card-border": cardBorder,
    "--lp-btn-radius": btnRadii[cfg.buttonShape] || "10px",
    "--lp-btn-height": btnHeights[cfg.buttonSize] || "48px",
    "--lp-tile-radius": tileRadii[cfg.tileShape] || "12px",
    "--lp-tile-shadow":
      cfg.tileShadow === "Elevated"
        ? "0 8px 24px rgba(0,0,0,0.08)"
        : cfg.tileShadow === "Subtle"
          ? "0 2px 10px rgba(0,0,0,0.05)"
          : "none",
    "--lp-vpos": vpos,
    "--lp-hpos": hpos,
    "--lp-mobile-vpos": mobilePos,
    "--lp-align": align.toLowerCase(),
    "--lp-items": items,
    "--lp-dec-opacity": String((cfg.decorationOpacity ?? 20) / 100),
    "--lp-mobile-image-height": mobileImgHeight,
  } as Record<string, string>;
});

// Actions grouping
const activeActions = computed(() =>
  d.value.actions
    .filter((a) => a.enabled || a.id === "book")
    .filter((a) => {
      if (a.id === "book" && !props.productEntitlements.studio) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order),
);

const primaryAction = computed(
  () =>
    activeActions.value.find((a) => a.placement === "Primary Action") ??
    activeActions.value[0] ??
    null,
);

const secondaryActions = computed(() =>
  activeActions.value.filter(
    (a) =>
      a.id !== primaryAction.value?.id &&
      (a.placement === "Action Box" || a.placement === "Navigation" || d.value.navPosition === "Inside Action Box"),
  ),
);

const floatingNavActions = computed(() => {
  if (d.value.navPosition === "Inside Action Box" || d.value.navigation === "Hidden") {
    return [];
  }
  return activeActions.value.filter(
    (a) => a.id !== primaryAction.value?.id && a.placement !== "Action Box",
  );
});

const customLinks = computed(() =>
  props.config.showCustomLinks ? props.config.customLinks ?? [] : [],
);

const socials = computed(() => ({
  instagram: safeHttpUrl(props.config.socialInstagram),
  tiktok: safeHttpUrl(props.config.socialTiktok),
  facebook: safeHttpUrl(props.config.socialFacebook),
  threads: safeHttpUrl(props.config.socialThreads),
}));

const hasSocials = computed(
  () => props.config.showSocials && Object.values(socials.value).some(Boolean),
);

// Modal state for in-page actions (Location, Call, Price List, More Menu)
const activeModal = ref<"location" | "call" | "price" | "menu" | null>(null);

function handleActionClick(action: LinkPageActionItem) {
  switch (action.id) {
    case "book":
      emit("navigate", "/booking");
      break;
    case "check":
      emit("navigate", "/check-booking");
      break;
    case "services":
      emit("navigate", "/lead-form");
      break;
    case "portfolio":
      emit("navigate", "/portfolio");
      break;
    case "location":
      activeModal.value = "location";
      break;
    case "call":
      activeModal.value = "call";
      break;
    case "price":
      activeModal.value = "price";
      break;
    default:
      break;
  }
}

function actionIconComponent(id: string) {
  switch (id) {
    case "book":
      return Calendar;
    case "check":
      return CalendarCheck;
    case "location":
      return MapPin;
    case "call":
      return Phone;
    case "price":
      return Tag;
    default:
      return ArrowRight;
  }
}

const studioPhone = computed(
  () => props.config.emergencyCustomPhone?.trim() || "",
);
const whatsappHref = computed(() => {
  const digits = studioPhone.value.replace(/[^0-9]/g, "");
  if (!digits) return "";
  const normalized = digits.startsWith("0") ? `6${digits}` : digits;
  return `https://wa.me/${normalized}`;
});

const surfaceFillClass = computed(() =>
  props.surfaceClass === "preview-surface" ? "h-full min-h-full" : "min-h-dvh",
);
</script>

<template>
  <div
    ref="rootRef"
    :class="['relative flex w-full max-w-full flex-col overflow-x-clip', surfaceFillClass, surfaceClass]"
  >
    <LandingPageBootState v-if="loading" :theme="config" label="Loading" />

    <LandingPageBootState
      v-else-if="loadError"
      :theme="config"
      :error="loadError"
      @retry="emit('retryLoad')"
    />

    <main
      v-else
      class="lp-page"
      :class="{
        mobile: isMobile,
        preview: surfaceClass === 'preview-surface',
        scroll: d.pageHeight === 'Scroll',
        sticky: isMobile && d.mobileSticky,
        'has-lang': config.showLanguageSwitcher,
        'has-bottom-nav': floatingNavActions.length > 0 && !isMobile && d.navPosition === 'Bottom Centre',
      }"
      :data-layout="d.layout"
      :data-mobile-layout="effectiveMobileLayout"
      :data-mobile-position="d.mobilePosition"
      :style="cssVars"
    >
      <!-- Language switcher (if enabled) -->
      <div
        v-if="config.showLanguageSwitcher"
        class="lp-lang"
      >
        <button
          type="button"
          :class="{ active: language === 'bm' }"
          @click="emit('languageChange', 'bm')"
        >
          BM
        </button>
        <span class="sep">|</span>
        <button
          type="button"
          :class="{ active: language === 'en' }"
          @click="emit('languageChange', 'en')"
        >
          EN
        </button>
      </div>

      <!-- Decoration layer -->
      <div
        v-if="d.decoration !== 'None'"
        class="lp-decoration"
        :data-kind="d.decoration"
      />

      <!-- Photo section -->
      <div class="lp-photo" :data-frame="d.frame">
        <img
          :src="currentPhoto"
          :alt="config.studioName || 'Studio'"
          referrerpolicy="no-referrer"
        />
        <div class="lp-shade" :style="overlayStyle" />
      </div>

      <!-- Floating Global Brand (Full Background / Framed / Mobile Image Above) -->
      <div
        v-if="d.logoDisplay !== 'Hidden' && d.logoPosition !== 'Above Actions' && !isSplitLayout"
        class="lp-brand global"
        :data-position="d.logoPosition"
      >
        <div
          v-if="config.logoUrl && d.logoDisplay !== 'Name Only'"
          class="lp-logo-wrap"
          :data-style="config.logoStyle"
        >
          <img
            :src="config.logoUrl"
            :alt="config.studioName || 'Studio'"
            referrerpolicy="no-referrer"
          />
        </div>
        <div
          v-if="d.showName && (d.logoDisplay === 'Both' || d.logoDisplay === 'Name Only' || (!config.logoUrl && d.logoDisplay === 'Logo or Studio Name'))"
          class="lp-wordmark"
        >
          {{ config.studioName }}
        </div>
      </div>

      <!-- Floating Nav (if positioned outside action box) -->
      <nav
        v-if="floatingNavActions.length > 0 && !isMobile"
        class="lp-nav"
        :data-pos="d.navPosition"
        :data-glass="d.navBackground === 'Glass'"
      >
        <button
          v-for="act in floatingNavActions"
          :key="act.id"
          type="button"
          class="lp-nav-button"
          @click="handleActionClick(act)"
        >
          <component
            :is="actionIconComponent(act.id)"
            v-if="d.navigation !== 'Text Links'"
            class="lp-ico"
          />
          <span v-if="d.navigation !== 'Icon Only'">{{ act.label }}</span>
        </button>
      </nav>

      <!-- Main Content & Action Container -->
      <section class="lp-content">
        <div class="lp-content-inner">
          <!-- Brand Above Actions (or inside content column on Split layouts) -->
          <div
            v-if="d.logoDisplay !== 'Hidden' && (d.logoPosition === 'Above Actions' || isSplitLayout)"
            class="lp-brand"
          >
            <div
              v-if="config.logoUrl && d.logoDisplay !== 'Name Only'"
              class="lp-logo-wrap"
              :data-style="config.logoStyle"
            >
              <img
                :src="config.logoUrl"
                :alt="config.studioName || 'Studio'"
                referrerpolicy="no-referrer"
              />
            </div>
            <div
              v-if="d.showName && (d.logoDisplay === 'Both' || d.logoDisplay === 'Name Only' || (!config.logoUrl && d.logoDisplay === 'Logo or Studio Name'))"
              class="lp-wordmark"
            >
              {{ config.studioName }}
            </div>
          </div>

          <!-- Hero Header (Announcement + Headline + Subtitle) -->
          <div
            v-if="
              (d.showAnnouncement && d.announcement) ||
              (d.showHeadline && d.headline) ||
              (d.showSubtitle && d.subtitle)
            "
            class="lp-hero-header"
          >
            <div
              v-if="d.showAnnouncement && d.announcement"
              class="lp-announce"
              :class="{
                badge: d.announcementStyle === 'Badge',
                banner: d.announcementStyle === 'Banner',
              }"
              :data-align="d.announcementAlignment"
            >
              {{ d.announcement }}
            </div>

            <div
              v-if="(d.showHeadline && d.headline) || (d.showSubtitle && d.subtitle)"
              class="lp-copy"
              :data-align="d.headlineAlignment"
            >
              <h1 v-if="d.showHeadline && d.headline">{{ d.headline }}</h1>
              <p v-if="d.showSubtitle && d.subtitle">{{ d.subtitle }}</p>
            </div>
          </div>

          <!-- Actions Box -->
          <div
            class="lp-actions"
            :data-layout="d.actionLayout"
            :data-surface="d.container"
          >
            <!-- Primary Action -->
            <button
              v-if="primaryAction"
              type="button"
              class="lp-primary"
              :data-shape="d.buttonShape"
              :data-style="d.buttonStyle"
              :style="{ width: d.buttonWidth === 'Full Width' ? '100%' : 'auto' }"
              @click="handleActionClick(primaryAction)"
            >
              <component
                :is="actionIconComponent(primaryAction.id)"
                v-if="d.buttonIcon === 'Leading'"
                class="lp-ico"
              />
              <span>{{ primaryAction.label }}</span>
              <ArrowRight
                v-if="d.buttonIcon === 'Trailing'"
                class="lp-ico arrow"
              />
            </button>

            <!-- Primary + Menu Trigger -->
            <button
              v-if="d.actionLayout === 'Primary + Menu' && secondaryActions.length > 0"
              type="button"
              class="lp-secondary"
              @click="activeModal = 'menu'"
            >
              <Menu class="lp-ico" />
              <span>Menu</span>
            </button>

            <!-- Secondary Actions Group -->
            <div
              v-if="secondaryActions.length > 0 && d.actionLayout !== 'Primary + Menu'"
              class="lp-secondary-group"
            >
              <button
                v-for="act in secondaryActions"
                :key="act.id"
                type="button"
                class="lp-secondary"
                :data-style="d.secondaryStyle"
                @click="handleActionClick(act)"
              >
                <component
                  :is="actionIconComponent(act.id)"
                  v-if="act.display !== 'Text Only'"
                  class="lp-ico"
                />
                <span v-if="act.display !== 'Icon Only'">{{ act.label }}</span>
                <ChevronRight
                  v-if="d.actionLayout === 'Vertical Menu'"
                  class="lp-ico chev"
                />
              </button>
            </div>

            <!-- Custom External Links -->
            <div
              v-if="customLinks.length > 0"
              class="lp-custom-links"
            >
              <a
                v-for="link in customLinks"
                :key="link.id"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="lp-secondary"
                :data-style="d.secondaryStyle"
              >
                <span>{{ link.label }}</span>
                <ExternalLink class="lp-ico" style="width: 14px; height: 14px; opacity: 0.6;" />
              </a>
            </div>

            <!-- Social Links -->
            <div v-if="hasSocials" class="lp-socials">
              <a
                v-if="socials.instagram"
                :href="socials.instagram"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram :size="18" />
              </a>
              <a
                v-if="socials.tiktok"
                :href="socials.tiktok"
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
              </a>
              <a
                v-if="socials.facebook"
                :href="socials.facebook"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook :size="18" />
              </a>
              <a
                v-if="socials.threads"
                :href="socials.threads"
                aria-label="Threads"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>
              </a>
            </div>
          </div>

          <!-- Powered by SesiFoto -->
          <a
            v-if="d.showPoweredBy"
            :href="SESIFOTO_HOME_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="lp-powered"
          >
            <img :src="SESIFOTO_LOGO_SRC" alt="SesiFoto" />
            <span>{{ tLandingPage(language, "poweredBy") }}</span>
          </a>
        </div>
      </section>

      <!-- Action Modals (Location / Call / Price List / Menu) -->
      <div
        v-if="activeModal"
        class="lp-modal-backdrop"
        @click.self="activeModal = null"
      >
        <div class="lp-modal" role="dialog" aria-modal="true">
          <div class="lp-modal-head">
            <h2>
              <template v-if="activeModal === 'location'">Studio Location</template>
              <template v-else-if="activeModal === 'call'">Contact Studio</template>
              <template v-else-if="activeModal === 'price'">Price List</template>
              <template v-else>Menu</template>
            </h2>
            <button
              type="button"
              class="lp-modal-close"
              aria-label="Close"
              @click="activeModal = null"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="lp-modal-body">
            <!-- Location Modal -->
            <template v-if="activeModal === 'location'">
              <p v-if="config.mapAddress" class="lp-modal-address">
                {{ config.mapAddress }}
              </p>
              <p v-else class="lp-modal-muted">
                Studio address is not configured yet.
              </p>
              <a
                v-if="config.mapsLink"
                :href="config.mapsLink"
                target="_blank"
                rel="noopener noreferrer"
                class="lp-modal-btn"
              >
                <MapPin :size="16" />
                Open in Maps
              </a>
            </template>

            <!-- Call / WhatsApp Modal -->
            <template v-else-if="activeModal === 'call'">
              <p v-if="studioPhone" class="lp-modal-address">
                {{ studioPhone }}
              </p>
              <p v-else class="lp-modal-muted">
                Contact phone number is not configured yet.
              </p>
              <div class="lp-modal-stack">
                <a
                  v-if="studioPhone"
                  :href="`tel:${studioPhone}`"
                  class="lp-modal-btn"
                >
                  <Phone :size="16" />
                  Call Now
                </a>
                <a
                  v-if="whatsappHref"
                  :href="whatsappHref"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="lp-modal-btn secondary"
                >
                  WhatsApp Studio
                </a>
              </div>
            </template>

            <!-- Price List Modal -->
            <template v-else-if="activeModal === 'price'">
              <div
                v-if="config.featuredPackages && config.featuredPackages.length > 0"
                class="lp-price-list"
              >
                <div
                  v-for="pkg in config.featuredPackages"
                  :key="pkg.id"
                  class="lp-price-row"
                >
                  <span>{{ pkg.title }}</span>
                  <strong>{{ pkg.price }}</strong>
                </div>
              </div>
              <p v-else class="lp-modal-muted">
                Select Start Booking to view available packages and time slots.
              </p>
              <button
                type="button"
                class="lp-modal-btn"
                style="margin-top: 16px"
                @click="activeModal = null; emit('navigate', '/booking')"
              >
                Start Booking
              </button>
            </template>

            <!-- Menu Modal -->
            <template v-else-if="activeModal === 'menu'">
              <div class="lp-modal-stack">
                <button
                  v-for="act in secondaryActions"
                  :key="act.id"
                  type="button"
                  class="lp-menu-item"
                  @click="activeModal = null; handleActionClick(act)"
                >
                  <component :is="actionIconComponent(act.id)" :size="18" />
                  <span>{{ act.label }}</span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.lp-page {
  --pad: clamp(18px, 3.5vw, 52px);
  position: relative;
  isolation: isolate;
  flex: 1 1 auto;
  min-height: 100svh;
  display: grid;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--lp-bg);
  color: var(--lp-text);
  font-family: var(--lp-body);
  font-weight: var(--lp-bw);
  font-size: var(--lp-bs);
  grid-template-columns: minmax(0, var(--lp-photo-width)) minmax(320px, 1fr);
}

.lp-page.preview {
  min-height: 100%;
}

.lp-page.scroll {
  height: auto;
  min-height: 100svh;
  overflow: visible;
}

.lp-lang {
  position: absolute;
  top: 16px;
  right: 18px;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.04em;
  font-weight: 500;
  padding: 5px 11px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--lp-surface) 82%, transparent);
  color: var(--lp-text);
  border: 1px solid color-mix(in srgb, var(--lp-text) 12%, transparent);
  backdrop-filter: blur(10px);
}
.lp-page:not(.mobile)[data-layout="Full Background"] .lp-lang,
.lp-page.mobile[data-mobile-layout="Full Background"] .lp-lang,
.lp-page.mobile[data-mobile-layout="Image Above"] .lp-lang {
  background: rgba(16, 16, 16, 0.32);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.18);
}
.lp-lang button {
  opacity: 0.65;
  transition: opacity 0.15s ease;
  cursor: pointer;
}
.lp-lang button.active {
  opacity: 1;
  font-weight: 700;
}
.lp-lang .sep {
  opacity: 0.35;
}

.lp-photo {
  position: relative;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  grid-column: 1;
  grid-row: 1;
  background: var(--lp-accent);
  isolation: isolate;
}
.lp-photo img {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  object-fit: var(--lp-fit);
  object-position: var(--lp-focus);
  display: block;
}
.lp-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.lp-photo[data-frame="Rounded"] {
  border-radius: 24px;
}
.lp-photo[data-frame="Arch"] {
  border-radius: 50% 50% 8px 8px / 35% 35% 8px 8px;
}
.lp-photo[data-frame="Organic"] {
  border-radius: 42% 0 0 15% / 24% 0 0 20%;
}
.lp-photo[data-frame="Circle"] {
  border-radius: 50%;
  aspect-ratio: 1;
  align-self: center;
  max-height: 90%;
  width: 100%;
}

.lp-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: var(--lp-dec-opacity);
  background-repeat: repeat;
}
.lp-decoration[data-kind="Paper Texture"] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' opacity='.26' filter='url(%23n)'/%3E%3C/svg%3E");
}
.lp-decoration[data-kind="Geometric"],
.lp-decoration[data-kind="Traditional"] {
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 24px,
    var(--lp-accent) 24px 25px,
    transparent 25px 50px
  );
  mask-image: linear-gradient(100deg, transparent 70%, #000);
}
.lp-decoration[data-kind="Botanical"],
.lp-decoration[data-kind="Organic"] {
  background:
    radial-gradient(ellipse at 102% 0%, var(--lp-accent) 0 9%, transparent 9.2%),
    radial-gradient(ellipse at 95% 5%, var(--lp-accent) 0 6%, transparent 6.2%);
}

.lp-content {
  position: relative;
  container-type: inline-size;
  min-width: 0;
  min-height: 0;
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: var(--lp-hpos);
  justify-content: var(--lp-vpos);
  padding: clamp(18px, 5cqi, 48px);
  gap: 18px;
  z-index: 2;
  text-align: var(--lp-align);
  overflow-y: auto;
}

.lp-content-inner {
  width: 100%;
  max-width: var(--lp-content-width);
  display: flex;
  flex-direction: column;
  align-items: var(--lp-items);
  gap: var(--lp-gap);
}

.lp-brand {
  display: flex;
  flex-direction: column;
  align-items: var(--lp-items);
  gap: 8px;
  max-width: 100%;
}
.lp-brand.global {
  position: absolute;
  z-index: 3;
  top: clamp(20px, 3.8vh, 38px);
  align-items: center;
}
.lp-brand.global[data-position="Top Centre"] {
  left: 50%;
  transform: translateX(-50%);
}
.lp-brand.global[data-position="Top Left"] {
  left: var(--pad);
  align-items: flex-start;
}
.lp-brand.global[data-position="Top Right"] {
  right: var(--pad);
  align-items: flex-end;
}
.lp-page.has-lang .lp-brand.global[data-position="Top Right"] {
  top: 56px;
}

.lp-logo-wrap {
  height: calc(var(--lp-logo-size) * 1.35);
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.lp-logo-wrap img {
  height: 100%;
  width: auto;
  max-width: 160px;
  object-fit: contain;
  display: block;
}
.lp-logo-wrap[data-style="circle"] {
  width: calc(var(--lp-logo-size) * 1.4);
  height: calc(var(--lp-logo-size) * 1.4);
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: var(--lp-surface);
}
.lp-logo-wrap[data-style="circle"] img,
.lp-logo-wrap[data-style="square"] img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lp-logo-wrap[data-style="square"] {
  width: calc(var(--lp-logo-size) * 1.4);
  height: calc(var(--lp-logo-size) * 1.4);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: var(--lp-surface);
}

.lp-wordmark {
  font-family: var(--lp-heading);
  font-size: var(--lp-logo-size);
  font-weight: var(--lp-hw);
  font-style: var(--lp-hs);
  letter-spacing: var(--lp-ls);
  text-transform: var(--lp-case);
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.lp-hero-header {
  display: flex;
  flex-direction: column;
  align-items: var(--lp-items);
  gap: 10px;
  width: 100%;
  max-width: var(--lp-action-width);
}

.lp-announce[data-align="Left"],
.lp-copy[data-align="Left"] {
  align-self: flex-start;
  align-items: flex-start;
  text-align: left;
}
.lp-announce[data-align="Centre"],
.lp-copy[data-align="Centre"] {
  align-self: center;
  align-items: center;
  text-align: center;
}
.lp-announce[data-align="Right"],
.lp-copy[data-align="Right"] {
  align-self: flex-end;
  align-items: flex-end;
  text-align: right;
}

.lp-announce {
  font-size: calc(var(--lp-bs) * 0.8);
  font-weight: 500;
  letter-spacing: 0.03em;
  max-width: 100%;
  line-height: 1.35;
}
.lp-announce.badge {
  border: 1px solid currentColor;
  border-radius: 9999px;
  padding: 5px 13px;
  backdrop-filter: blur(8px);
}
.lp-announce.banner {
  background: var(--lp-primary);
  color: var(--lp-btntext);
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.lp-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 100%;
}
.lp-copy h1 {
  font-family: var(--lp-heading);
  font-size: var(--lp-heading-size);
  font-weight: var(--lp-hw);
  font-style: var(--lp-hs);
  letter-spacing: var(--lp-ls);
  text-transform: var(--lp-case);
  line-height: 1.08;
  margin: 0;
}
.lp-copy p {
  margin: 0;
  font-size: var(--lp-bs);
  font-weight: var(--lp-bw);
  opacity: 0.86;
  line-height: 1.45;
}

.lp-actions {
  width: 100%;
  max-width: var(--lp-action-width);
  display: flex;
  flex-direction: column;
  gap: var(--lp-action-gap);
  align-items: var(--lp-items);
}
.lp-actions[data-surface]:not([data-surface="None"]) {
  padding: clamp(16px, 2.5vw, 22px);
  border-radius: var(--lp-card-radius);
  background: var(--lp-card-bg);
  color: var(--lp-text);
  box-shadow: var(--lp-card-shadow);
  border: var(--lp-card-border);
}
.lp-actions[data-surface="Solid"] {
  border: 1px solid color-mix(in srgb, var(--lp-text) 8%, transparent);
}
.lp-actions[data-surface="Glass"] {
  backdrop-filter: blur(20px);
}

.lp-ico {
  width: 19px;
  height: 19px;
  flex: none;
}

.lp-primary,
.lp-secondary,
.lp-nav-button {
  border: 0;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  line-height: 1.25;
  text-align: center;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  text-decoration: none;
  color: inherit;
}

.lp-primary {
  min-height: var(--lp-btn-height);
  max-width: 100%;
  padding: 12px 22px;
  background: var(--lp-primary);
  color: var(--lp-btntext);
  border: 1px solid var(--lp-primary);
  border-radius: var(--lp-btn-radius);
  font-size: var(--lp-bs);
  font-weight: 600;
}
.lp-primary[data-style="Outline"] {
  background: transparent;
  color: var(--lp-primary);
}
.lp-primary[data-style="Outline"]:hover {
  background: var(--lp-primary);
  color: var(--lp-btntext);
}
.lp-primary[data-style="Minimal"] {
  background: transparent;
  color: var(--lp-primary);
  border-color: transparent;
  text-decoration: underline;
  text-underline-offset: 5px;
}
.lp-primary[data-shape="Decorative"] {
  border-radius: 3px;
  padding: 13px 26px;
  letter-spacing: 0.015em;
  box-shadow:
    inset 0 0 0 3.5px var(--lp-primary),
    inset 0 0 0 4.5px color-mix(in srgb, var(--lp-btntext) 26%, transparent);
}
.lp-primary[data-shape="Decorative"][data-style="Outline"] {
  background: transparent;
  color: var(--lp-primary);
  border: 1.5px solid var(--lp-primary);
  box-shadow:
    inset 0 0 0 3.5px transparent,
    inset 0 0 0 4.5px color-mix(in srgb, var(--lp-primary) 26%, transparent);
}
.lp-primary[data-shape="Decorative"][data-style="Outline"]:hover {
  background: var(--lp-primary);
  color: var(--lp-btntext);
  box-shadow:
    inset 0 0 0 3.5px var(--lp-primary),
    inset 0 0 0 4.5px color-mix(in srgb, var(--lp-btntext) 26%, transparent);
}
.lp-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.lp-primary .arrow {
  margin-left: auto;
}

.lp-secondary-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  gap: var(--lp-action-gap);
}
.lp-secondary {
  font-size: calc(var(--lp-bs) * 0.9);
  padding: 9px 12px;
  border-radius: var(--lp-btn-radius);
}
.lp-secondary:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.lp-secondary[data-style="Outline"] {
  border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
}
.lp-secondary[data-style="Soft Fill"] {
  background: color-mix(in srgb, var(--lp-primary) 10%, transparent);
}
.lp-secondary[data-style="Solid"] {
  background: var(--lp-primary);
  color: var(--lp-btntext);
}

/* Action layout modes */
.lp-actions[data-layout="Vertical Menu"] .lp-secondary-group,
.lp-actions[data-layout="Distributed Actions"] .lp-secondary-group {
  flex-direction: column;
  gap: 0;
  align-items: stretch;
  border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  margin-top: 4px;
}
.lp-actions[data-layout="Vertical Menu"] .lp-secondary,
.lp-actions[data-layout="Distributed Actions"] .lp-secondary {
  justify-content: flex-start;
  padding: 12px 10px;
  min-height: 46px;
  border-radius: 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
}
.lp-actions[data-layout="Vertical Menu"] .lp-secondary .chev {
  margin-left: auto;
  opacity: 0.45;
  width: 16px;
  height: 16px;
}

.lp-actions[data-layout="Action Tiles"] .lp-secondary-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--lp-action-gap);
  order: -1;
}
.lp-actions[data-layout="Action Tiles"] .lp-secondary {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: 78px;
  padding: 15px;
  background: var(--lp-surface);
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: var(--lp-tile-radius);
  box-shadow: var(--lp-tile-shadow);
  text-align: left;
}

.lp-actions[data-layout="Floating Card"] .lp-secondary-group,
.lp-actions[data-layout="Bottom Dock"] .lp-secondary-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
  gap: 4px;
  width: 100%;
  padding-top: 4px;
}
.lp-actions[data-layout="Floating Card"] .lp-secondary,
.lp-actions[data-layout="Bottom Dock"] .lp-secondary {
  flex-direction: column;
  min-width: 0;
  gap: 6px;
  padding: 9px 4px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.25;
}

.lp-actions[data-layout="Minimal Links"] .lp-secondary-group {
  gap: 6px 18px;
  padding-top: 4px;
}
.lp-actions[data-layout="Minimal Links"] .lp-secondary {
  padding: 5px 4px;
  min-height: 36px;
  font-size: 13px;
}

.lp-custom-links {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
  padding-top: 2px;
}

.lp-socials {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  width: 100%;
  padding-top: 10px;
  margin-top: 2px;
  border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  opacity: 0.78;
}
.lp-socials a {
  color: inherit;
  transition: opacity 0.15s ease;
}
.lp-socials a:hover {
  opacity: 1;
}

.lp-powered {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  opacity: 0.68;
  text-decoration: none;
  color: inherit;
  padding-top: 6px;
}
.lp-powered img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

/* Desktop layout variations */
.lp-page[data-layout="Split Right"],
.lp-page[data-layout="Editorial"] {
  grid-template-columns: minmax(320px, 1fr) minmax(0, var(--lp-photo-width));
}
.lp-page[data-layout="Split Right"] .lp-photo,
.lp-page[data-layout="Editorial"] .lp-photo {
  grid-column: 2;
}
.lp-page[data-layout="Split Right"] .lp-content,
.lp-page[data-layout="Editorial"] .lp-content {
  grid-column: 1;
}
.lp-page[data-layout="Editorial"] .lp-photo {
  margin: clamp(20px, 3vw, 36px) clamp(20px, 3vw, 36px) clamp(20px, 3vw, 36px) 0;
}
.lp-page[data-layout="Portrait Frame"] .lp-photo {
  margin: var(--pad) 0 var(--pad) var(--pad);
}

.lp-page[data-layout="Full Background"] {
  display: flex;
  flex-direction: column;
}
.lp-page[data-layout="Full Background"] .lp-photo {
  position: absolute;
  inset: 0;
}
.lp-page[data-layout="Full Background"] .lp-content {
  position: relative;
  flex: 1 1 auto;
  justify-content: var(--lp-vpos);
  align-items: var(--lp-hpos);
  padding: clamp(80px, 12vh, 110px) var(--pad) clamp(28px, 5vh, 48px);
}
.lp-page:not(.mobile)[data-layout="Full Background"] .lp-brand.global {
  color: var(--lp-photo-ink);
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
}
.lp-page:not(.mobile)[data-layout="Full Background"] .lp-content-inner,
.lp-page.mobile[data-mobile-layout="Full Background"] .lp-content-inner {
  color: var(--lp-photo-ink);
}
.lp-page:not(.mobile)[data-layout="Full Background"] .lp-hero-header,
.lp-page.mobile[data-mobile-layout="Full Background"] .lp-hero-header {
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);
}
.lp-page:not(.mobile)[data-layout="Full Background"] .lp-powered,
.lp-page.mobile[data-mobile-layout="Full Background"] .lp-powered {
  color: var(--lp-photo-ink);
  opacity: 0.85;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
}

.lp-page[data-layout="Framed Image"] {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(220px, 1fr) auto;
  padding: clamp(20px, 3vh, 32px) var(--pad) clamp(24px, 4vh, 40px);
  gap: 20px;
}
.lp-page[data-layout="Framed Image"] .lp-photo {
  grid-row: 1;
  grid-column: 1;
  margin: clamp(54px, 8vh, 78px) auto 0;
  width: var(--lp-photo-width);
  max-width: 100%;
  min-height: 200px;
}
.lp-page[data-layout="Framed Image"] .lp-content {
  grid-row: 2;
  grid-column: 1;
  padding: 0;
  justify-content: center;
  align-items: center;
}

/* Floating Nav */
.lp-nav {
  position: absolute;
  z-index: 4;
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
}
.lp-nav[data-pos="Top Left"] { top: 24px; left: var(--pad); }
.lp-nav[data-pos="Top Centre"] { top: 24px; left: 50%; transform: translateX(-50%); }
.lp-nav[data-pos="Top Right"] { top: 24px; right: var(--pad); }
.lp-nav[data-pos="Bottom Centre"] { bottom: 18px; left: 50%; transform: translateX(-50%); }
.lp-nav[data-pos="Left Side"] { top: 50%; left: 20px; transform: translateY(-50%); flex-direction: column; }
.lp-nav[data-pos="Right Side"] { top: 50%; right: 20px; transform: translateY(-50%); flex-direction: column; }
.lp-nav-button {
  font-size: 13px;
  padding: 7px 10px;
  border-radius: 8px;
}
.lp-page[data-layout="Full Background"] .lp-nav {
  color: var(--lp-photo-ink);
}
.lp-page.has-bottom-nav .lp-content {
  padding-bottom: 76px;
}

/* Mobile Layout Overrides */
.lp-page.mobile {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: var(--lp-mobile-image-height) minmax(0, 1fr);
  --pad: 14px;
  gap: 0;
  height: 100svh;
  min-height: 100svh;
  overflow: hidden;
}
.lp-page.mobile.preview {
  height: 100%;
  min-height: 100%;
}
.lp-page.mobile.scroll {
  height: auto;
  overflow-y: auto;
}
.lp-page.mobile .lp-photo {
  position: relative;
  inset: auto;
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 0;
}
.lp-page.mobile .lp-content {
  grid-column: 1;
  grid-row: 2;
  position: relative;
  inset: auto;
  padding: 10px var(--pad) 12px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.lp-page.mobile .lp-content-inner {
  gap: clamp(6px, 1.2vh, 10px);
}
.lp-page.mobile .lp-hero-header {
  gap: 4px;
}
.lp-page.mobile .lp-copy {
  gap: 2px;
}
.lp-page.mobile .lp-copy h1 {
  font-size: min(var(--lp-heading-size), 24px);
  line-height: 1.1;
}
.lp-page.mobile .lp-copy p {
  font-size: 12.5px;
  line-height: 1.3;
}
.lp-page.mobile .lp-announce {
  font-size: 11px;
  padding: 3px 10px;
}
.lp-page.mobile .lp-wordmark {
  font-size: min(var(--lp-logo-size), 26px);
}
.lp-page.mobile .lp-logo-wrap {
  height: min(calc(var(--lp-logo-size) * 1.1), 36px);
}
.lp-page.mobile .lp-logo-wrap[data-style="circle"],
.lp-page.mobile .lp-logo-wrap[data-style="square"] {
  width: min(calc(var(--lp-logo-size) * 1.1), 36px);
  height: min(calc(var(--lp-logo-size) * 1.1), 36px);
  aspect-ratio: 1;
  flex-shrink: 0;
}
.lp-page.mobile .lp-actions {
  gap: 6px;
}
.lp-page.mobile .lp-actions[data-surface]:not([data-surface="None"]) {
  padding: 12px 14px;
}
.lp-page.mobile .lp-primary {
  min-height: 40px;
  padding: 9px 16px;
  font-size: 13.5px;
}
.lp-page.mobile .lp-actions[data-layout="Floating Card"] .lp-secondary,
.lp-page.mobile .lp-actions[data-layout="Bottom Dock"] .lp-secondary {
  padding: 6px 2px;
  gap: 4px;
  font-size: 11px;
}
.lp-page.mobile .lp-socials {
  padding-top: 6px;
  gap: 16px;
}
.lp-page.mobile .lp-powered {
  padding-top: 2px;
  font-size: 10px;
}
.lp-page.mobile[data-mobile-position="Top"] .lp-content {
  justify-content: flex-start;
}
.lp-page.mobile[data-mobile-position="Centre"] .lp-content {
  justify-content: center;
}
.lp-page.mobile[data-mobile-position="Bottom"] .lp-content {
  justify-content: flex-end;
}
.lp-page.mobile .lp-brand.global {
  position: absolute;
  top: 12px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}
.lp-page.mobile[data-mobile-layout="Full Background"] .lp-brand.global,
.lp-page.mobile[data-mobile-layout="Image Above"] .lp-brand.global {
  color: var(--lp-photo-ink);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}
.lp-page.mobile[data-mobile-layout="Image Below"] {
  grid-template-rows: minmax(0, 1fr) var(--lp-mobile-image-height);
}
.lp-page.mobile[data-mobile-layout="Image Below"] .lp-photo {
  grid-row: 2;
}
.lp-page.mobile[data-mobile-layout="Image Below"] .lp-content {
  grid-row: 1;
  padding-top: 14px;
}
.lp-page.mobile[data-mobile-layout="Image Below"]:has(.lp-brand.global) .lp-content {
  padding-top: 56px;
}
.lp-page.mobile[data-mobile-layout="Full Background"] {
  display: flex;
  flex-direction: column;
  height: 100svh;
  min-height: 100svh;
}
.lp-page.mobile.preview[data-mobile-layout="Full Background"] {
  height: 100%;
  min-height: 100%;
}
.lp-page.mobile[data-mobile-layout="Full Background"] .lp-photo {
  position: absolute;
  inset: 0;
  height: 100%;
}
.lp-page.mobile[data-mobile-layout="Full Background"] .lp-content {
  position: relative;
  flex: 1 1 auto;
  justify-content: var(--lp-mobile-vpos);
  padding: 64px var(--pad) max(18px, env(safe-area-inset-bottom));
}
.lp-page.mobile.sticky .lp-primary {
  position: sticky;
  bottom: 10px;
  z-index: 6;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
}

/* Modal styling */
.lp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(16, 20, 18, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.lp-modal {
  width: min(440px, 100%);
  max-height: 85svh;
  overflow-y: auto;
  background: #fffdf9;
  color: #262523;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
}
.lp-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 12px;
  border-bottom: 1px solid #ece9e2;
}
.lp-modal-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.lp-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f1ec;
  display: grid;
  place-items: center;
  border: 0;
  cursor: pointer;
}
.lp-modal-body {
  padding: 18px 22px 22px;
}
.lp-modal-address {
  margin: 0 0 14px;
  line-height: 1.5;
  font-size: 14px;
}
.lp-modal-muted {
  margin: 0;
  font-size: 14px;
  color: #6b7068;
}
.lp-modal-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lp-modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 16px;
  border-radius: 10px;
  background: var(--lp-primary, #344b3d);
  color: var(--lp-btntext, #fff);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: 0;
  cursor: pointer;
}
.lp-modal-btn.secondary {
  background: #f3f1ec;
  color: #262523;
}
.lp-price-list {
  display: flex;
  flex-direction: column;
}
.lp-price-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ece9e2;
  font-size: 14px;
}
.lp-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  background: #f5f3ee;
  border-radius: 10px;
  border: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}
</style>
