<script setup lang="ts">
import { computed, h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import ImageCarousel from "@/components/ImageCarousel.vue";
import { useTranslation } from "@/composables/useTranslation";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Facebook,
  Globe,
  HelpCircle,
  Instagram,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-vue-next";

type ThemeMode = "dark" | "light" | "dark-glass";
type EmergencyMethods = "both" | "whatsapp" | "call";
type EmergencyPhoneType = "system" | "custom";
type LogoStyle = "transparent" | "circle" | "square";

type FaqItem = { id: string; question: string; answer: string };

type LandingPageConfig = {
  presetName?: string;
  primaryColor?: string;
  primaryTextColor?: string;
  secondaryColor?: string;
  secondaryTextColor?: string;
  mode?: ThemeMode;
  titleFont?: string;
  bodyFont?: string;
  radius?: "rounded-none" | "rounded-2xl" | "rounded-full";
  showSocials?: boolean;
  showButtons?: boolean;
  socialInstagram?: string;
  socialTiktok?: string;
  socialFacebook?: string;
  socialWebsite?: string;
  showPilihan?: boolean;
  showGallery?: boolean;
  showMaps?: boolean;
  showFaq?: boolean;
  showEmergency?: boolean;
  showFooter?: boolean;
  logoUrl?: string;
  logoStyle?: LogoStyle;
  studioName?: string;
  mainTitle?: string;
  ssmNumber?: string;
  description?: string;
  emergencyPhoneType?: EmergencyPhoneType;
  emergencyCustomPhone?: string;
  emergencyMethods?: EmergencyMethods;
  emergencyText?: string;
  heroUrl?: string;
  mapAddress?: string;
  pilihanSetUrl?: string;
  galleryImages?: string[];
  sectionOrder?: Array<"gallery" | "maps" | "faq" | "emergency" | "footer">;
  faqs?: FaqItem[];
};

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

const bookingOpen = computed(() => studioStore.websiteSettings?.bookingOpen ?? true);

const isInitialLoading = computed(() => {
  // Treat as loading until we have the config driving this page.
  return studioStore.loading || !studioStore.studio || !studioStore.websiteSettings;
});

const initialLoadError = computed(() => studioStore.error);

async function retryInitialLoad() {
  try {
    await studioStore.loadStudio();
  } catch {
    // error is shown via store.error
  }
}

onMounted(async () => {
  // Safety: if user hits this page directly before store hydration
  if (!studioStore.studio && !studioStore.loading) {
    try {
      await studioStore.loadStudio();
    } catch {
      // Let the page render with defaults; other parts may handle errors.
    }
  }
});

const isGalleryOpen = ref(false);
const galleryInitialIndex = ref(0);

function safeHttpUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

const landingConfig = computed<LandingPageConfig>(() => {
  const raw = (studioStore.websiteSettings?.landingPageConfig ?? {}) as any;
  const studio = studioStore.studio;

  const defaults: LandingPageConfig = {
    presetName: "Default",
    primaryColor: "#ffffff",
    primaryTextColor: "#000000",
    secondaryColor: "#050505",
    secondaryTextColor: "#ffffff",
    mode: "dark",
    titleFont: "Cormorant Garamond",
    bodyFont: "Inter",
    radius: "rounded-2xl",
    showSocials: true,
    showButtons: true,
    socialInstagram: studio?.instagram,
    socialFacebook: studio?.facebook,
    socialTiktok: studio?.tiktok,
    socialWebsite: undefined,
    showPilihan: true,
    showGallery: true,
    showMaps: true,
    showFaq: true,
    showEmergency: true,
    showFooter: true,
    logoUrl: (studio as any)?.logo_url || (studio as any)?.logoUrl,
    logoStyle: "square",
    studioName: studio?.name || "Studio",
    mainTitle: "Book your photo session in under a minute",
    ssmNumber: (studio as any)?.ssm,
    description: "Capture meaningful moments with a professional experience.",
    emergencyPhoneType: "system",
    emergencyCustomPhone: "",
    emergencyMethods: "both",
    emergencyText: "Need help? Contact us",
    heroUrl:
      "https://images.unsplash.com/photo-1500964757637-c85e8a162699?q=80&w=2000&auto=format&fit=crop",
    mapAddress: (studio as any)?.address || "",
    pilihanSetUrl: "",
    galleryImages: [],
    sectionOrder: ["gallery", "maps", "faq", "emergency", "footer"],
    faqs: [],
  };

  const merged: LandingPageConfig = {
    ...defaults,
    ...raw,
  };

  if (!Array.isArray(merged.faqs)) merged.faqs = [];
  if (!Array.isArray(merged.galleryImages)) {
    const legacy = (raw as any)?.pilihanSetUrl;
    merged.galleryImages = typeof legacy === "string" && legacy ? [legacy] : [];
  }
  if (!Array.isArray(merged.sectionOrder) || merged.sectionOrder.length === 0) {
    merged.sectionOrder = ["gallery", "maps", "faq", "emergency", "footer"];
  }
  return merged;
});

const showButtonsBlock = computed(() => landingConfig.value.showButtons !== false);

const galleryImagesClean = computed(() => {
  return (landingConfig.value.galleryImages || [])
    .filter((x) => typeof x === "string" && x.trim())
    .slice(0, 5);
});

type SectionKey = "gallery" | "maps" | "faq" | "emergency" | "footer";
const ALL_SECTIONS: SectionKey[] = ["gallery", "maps", "faq", "emergency", "footer"];

function normalizeSectionOrder(input: unknown): SectionKey[] {
  const list = Array.isArray(input) ? input : [];
  const filtered = list
    .filter((k): k is SectionKey => ALL_SECTIONS.includes(k as SectionKey))
    .filter((k, idx, arr) => arr.indexOf(k) === idx);
  for (const k of ALL_SECTIONS) if (!filtered.includes(k)) filtered.push(k);
  return filtered;
}

const orderedSections = computed<SectionKey[]>(() => {
  const cfg = landingConfig.value;
  const enabled: Record<SectionKey, boolean> = {
    gallery: (cfg.showGallery ?? cfg.showPilihan ?? true) && galleryImagesClean.value.length > 0,
    maps: cfg.showMaps === true && !!cfg.mapAddress,
    faq: cfg.showFaq === true && hasFaq.value,
    emergency: cfg.showEmergency === true && !!emergencyPhone.value,
    footer: cfg.showFooter !== false,
  };

  return normalizeSectionOrder(cfg.sectionOrder).filter((k) => enabled[k]);
});

const buttonRadiusClass = computed(
  () => landingConfig.value.radius || "rounded-2xl",
);
const cardRadiusClass = computed(() => {
  const r = landingConfig.value.radius || "rounded-2xl";
  return r === "rounded-full" ? "rounded-2xl" : r;
});

const themeStyle = computed(() => {
  const cfg = landingConfig.value;
  const title = encodeURIComponent(cfg.titleFont || "Inter").replace(/%20/g, "+");
  const body = encodeURIComponent(cfg.bodyFont || "Inter").replace(/%20/g, "+");

  const mode = cfg.mode || "dark";
  const isDark = mode === "dark" || mode === "dark-glass";
  const isDarkGlass = mode === "dark-glass";

  const secondary = cfg.secondaryColor || "#050505";
  const secondaryText = cfg.secondaryTextColor || (isDark ? "#ffffff" : "#000000");

  const textMuted = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)";
  const borderColor = isDarkGlass
    ? "rgba(255,255,255,0.12)"
    : isDark
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.1)";

  const cardBg = isDarkGlass
    ? "rgba(255,255,255,0.03)"
    : mode === "dark"
      ? `color-mix(in srgb, ${secondary}, white 8%)`
      : `color-mix(in srgb, ${secondary}, black 4%)`;

  const iconBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const cardBackdrop = isDarkGlass ? "blur(16px)" : "none";
  const cardShadow = isDarkGlass ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)" : "none";

  const surfaceBackground = isDarkGlass
    ? `background-color: ${secondary};
       background-image:
         radial-gradient(circle at 15% 50%, rgba(67, 20, 7, 0.15), transparent 25%),
         radial-gradient(circle at 85% 30%, rgba(194, 65, 12, 0.08), transparent 25%);`
    : `background-color: ${secondary};`;

  return `
@import url('https://fonts.googleapis.com/css2?family=${title}:wght@400;600;700&family=${body}:wght@300;400;500;600&display=swap');
.landing-surface h1, .landing-surface h2, .landing-surface h3, .landing-surface h4, .landing-surface h5, .landing-surface h6 { font-family: '${cfg.titleFont}', sans-serif; }
.landing-surface {
  --bg-main: ${secondary};
  --text-main: ${secondaryText};
  --text-muted: ${textMuted};
  --border-color: ${borderColor};
  --card-bg: ${cardBg};
  --icon-bg: ${iconBg};
  --card-backdrop: ${cardBackdrop};
  --card-shadow: ${cardShadow};
  color: var(--text-main);
  ${surfaceBackground}
}
`;
});

const gradientOverlayStyle = computed(() => {
  const cfg = landingConfig.value;
  const secondary = cfg.secondaryColor || "#050505";
  return {
    background: `linear-gradient(to bottom, ${secondary}00 0%, ${secondary}00 50%, ${secondary} 100%)`,
  };
});

const emergencyPhone = computed(() => {
  const cfg = landingConfig.value;
  const studioPhone = (studioStore.studio as any)?.whatsapp || "";
  const phone =
    cfg.emergencyPhoneType === "custom" ? cfg.emergencyCustomPhone : studioPhone;
  return phone ? normalizePhone(phone) : "";
});

const whatsappHref = computed(() => {
  const phone = emergencyPhone.value;
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits}`;
});

const callHref = computed(() => {
  const phone = emergencyPhone.value;
  if (!phone) return undefined;
  return `tel:${phone}`;
});

const socials = computed(() => {
  const cfg = landingConfig.value;
  return {
    instagram: safeHttpUrl(cfg.socialInstagram),
    tiktok: safeHttpUrl(cfg.socialTiktok),
    facebook: safeHttpUrl(cfg.socialFacebook),
    website: safeHttpUrl(cfg.socialWebsite),
  };
});

const hasFaq = computed(() => (landingConfig.value.faqs?.length || 0) > 0);

const FaqItemComponent = {
  name: "FaqItem",
  props: {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  setup(props: any) {
    const isOpen = ref(false);
    return () =>
      h(
        "div",
        {
          class: "border-b last:border-0",
          style: { borderColor: "var(--border-color)" },
        },
        [
          h(
            "button",
            {
              type: "button",
              class:
                "w-full py-4 flex justify-between items-center text-left focus:outline-none group",
              onClick: () => (isOpen.value = !isOpen.value),
            },
            [
              h(
                "span",
                {
                  class:
                    "font-medium text-sm md:text-base pr-4 transition-colors text-[var(--text-main)] opacity-90 group-hover:opacity-100",
                },
                props.question,
              ),
              h(ChevronDown, {
                size: 18,
                class: [
                  "flex-shrink-0 transition-transform duration-300 text-[var(--text-muted)]",
                  isOpen.value ? "rotate-180" : "",
                ],
              }),
            ],
          ),
          h(
            "div",
            { class: ["overflow-hidden", isOpen.value ? "block" : "hidden"] },
            [
              h(
                "div",
                {
                  class:
                    "pb-4 text-sm leading-relaxed text-[var(--text-muted)]",
                },
                props.answer,
              ),
            ],
          ),
        ],
      );
  },
};
</script>

<template>
  <div class="landing-surface min-h-dvh w-full overflow-x-hidden">
    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
    <component :is="'style'" v-html="themeStyle" />

    <div
      v-if="isInitialLoading"
      class="min-h-dvh w-full flex items-center justify-center px-6"
      :style="{ backgroundColor: landingConfig.secondaryColor }"
      aria-busy="true"
    >
      <div class="flex flex-col items-center gap-4">
        <div
          class="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"
        />
        <div class="text-xs text-[var(--text-muted)] opacity-80">Loading…</div>

        <div
          v-if="initialLoadError"
          class="mt-2 w-full max-w-[360px] text-center text-xs text-[var(--text-muted)]"
        >
          <div class="mb-2 opacity-90">{{ initialLoadError }}</div>
          <button
            type="button"
            class="inline-flex items-center justify-center px-4 py-2 border text-xs font-medium hover:opacity-90 transition-all"
            :class="buttonRadiusClass"
            :style="{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              backdropFilter: 'var(--card-backdrop)',
              WebkitBackdropFilter: 'var(--card-backdrop)',
              boxShadow: 'var(--card-shadow)',
            }"
            @click="retryInitialLoad"
          >
            Try again
          </button>
        </div>
      </div>
    </div>

    <template v-else>
    <div class="relative w-full max-h-[380px] overflow-hidden h-[min(42vh,380px)]">
      <img
        :src="landingConfig.heroUrl"
        alt="Studio Background"
        class="h-full w-full object-cover object-center"
        referrerpolicy="no-referrer"
      />
      <div class="absolute inset-0" :style="gradientOverlayStyle" />
    </div>

    <div class="relative z-10 w-full max-w-[520px] mx-auto px-5 -mt-24 pb-10">
      <div class="flex flex-col items-center text-center">
        <div class="relative mb-6 mt-2 flex justify-center w-full">
          <img
            v-if="landingConfig.logoStyle === 'transparent' && landingConfig.logoUrl"
            :src="landingConfig.logoUrl"
            alt="Studio Logo"
            class="w-48 md:w-56 h-auto object-contain drop-shadow-md"
            referrerpolicy="no-referrer"
          />
          <div
            v-else-if="landingConfig.logoUrl"
            class="relative flex items-center justify-center overflow-hidden shadow-2xl border"
            :class="
              landingConfig.logoStyle === 'circle'
                ? 'rounded-full w-28 h-28 md:w-32 md:h-32'
                : 'rounded-2xl w-28 h-28 md:w-32 md:h-32'
            "
            :style="{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              backdropFilter: 'var(--card-backdrop)',
              WebkitBackdropFilter: 'var(--card-backdrop)',
              boxShadow: 'var(--card-shadow)',
            }"
          >
            <img
              :src="landingConfig.logoUrl"
              alt="Studio Logo"
              class="w-full h-full object-cover drop-shadow-sm"
              referrerpolicy="no-referrer"
            />
          </div>
        </div>

        <div
          class="mb-3 px-4 py-1.5 rounded-full border text-xs font-medium tracking-wide shadow-sm"
          :style="{
            backgroundColor: 'var(--icon-bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-main)',
          }"
        >
          {{ landingConfig.studioName }}
        </div>

        <h1
          class="text-4xl md:text-5xl font-bold tracking-tight mb-2 drop-shadow-lg text-[var(--text-main)] leading-tight"
        >
          {{ landingConfig.mainTitle }}
        </h1>
        <p
          class="font-light text-base mb-6 text-[var(--text-muted)] max-w-md mx-auto whitespace-pre-line leading-snug"
        >
          {{ landingConfig.description }}
        </p>

        <div
          v-if="landingConfig.showSocials"
          class="flex items-center gap-5 mb-6"
        >
          <a
            v-if="socials.instagram"
            :href="socials.instagram"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-all duration-300 hover:scale-110 hover:-translate-y-1 drop-shadow-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <Instagram :size="24" />
          </a>
          <a
            v-if="socials.facebook"
            :href="socials.facebook"
            aria-label="Facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-all duration-300 hover:scale-110 hover:-translate-y-1 drop-shadow-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <Facebook :size="24" />
          </a>
          <a
            v-if="socials.website"
            :href="socials.website"
            aria-label="Website"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-all duration-300 hover:scale-110 hover:-translate-y-1 drop-shadow-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <Globe :size="24" />
          </a>
        </div>
      </div>

      <div v-if="showButtonsBlock" class="flex flex-col gap-3 w-full mb-6">
        <button
          v-if="bookingOpen"
          type="button"
          class="w-full py-4 px-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          :class="buttonRadiusClass"
          :style="{
            backgroundColor: landingConfig.primaryColor,
            color: landingConfig.primaryTextColor,
          }"
          @click="router.push('/booking')"
        >
          {{ t("bookNow") }}
          <ArrowRight :size="18" />
        </button>
        <button
          v-else
          type="button"
          disabled
          class="w-full py-4 px-4 font-medium flex items-center justify-center gap-2 opacity-70 cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.06)]"
          :class="buttonRadiusClass"
          :style="{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-main)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'var(--card-backdrop)',
            WebkitBackdropFilter: 'var(--card-backdrop)',
            boxShadow: 'var(--card-shadow)',
          }"
        >
          {{ t("bookingUnavailable") }}
        </button>

        <button
          type="button"
          class="w-full border py-4 px-4 font-medium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          :class="buttonRadiusClass"
          :style="{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-main)',
            backdropFilter: 'var(--card-backdrop)',
            WebkitBackdropFilter: 'var(--card-backdrop)',
            boxShadow: 'var(--card-shadow)',
          }"
          @click="router.push('/check-booking')"
        >
          <Calendar :size="18" />
          {{ t("checkBooking") }}
        </button>
      </div>

      <!-- Sections (ordered) -->
      <div class="flex flex-col gap-3 w-full mb-6">
        <div v-for="key in orderedSections" :key="key" class="contents">
          <!-- Gallery -->
          <button
            v-if="key === 'gallery'"
            type="button"
            class="group block w-full text-left border overflow-hidden transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99]"
            :class="cardRadiusClass"
            :style="{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              backdropFilter: 'var(--card-backdrop)',
              WebkitBackdropFilter: 'var(--card-backdrop)',
              boxShadow: 'var(--card-shadow)',
            }"
            @click="
              galleryInitialIndex = 0;
              isGalleryOpen = true;
            "
          >
            <div class="relative w-full h-56 overflow-hidden bg-gray-800">
              <img
                :src="galleryImagesClean[0]"
                alt="Gallery"
                class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                referrerpolicy="no-referrer"
              />
              <div
                class="absolute inset-0"
                :style="{
                  background:
                    'linear-gradient(to top, var(--card-bg) 0%, color-mix(in srgb, var(--card-bg) 0%, transparent) 100%)',
                }"
              />
            </div>
            <div
              class="p-4 text-center flex flex-col items-center justify-center"
              :style="{
                backgroundColor: 'var(--card-bg)',
                backdropFilter: 'var(--card-backdrop)',
                WebkitBackdropFilter: 'var(--card-backdrop)',
              }"
            >
              <h3 class="text-xl font-bold mb-1 text-[var(--text-main)]">
                Gallery
              </h3>
              <p class="text-sm text-[var(--text-muted)]">View our gallery</p>
            </div>
          </button>

          <!-- Maps -->
          <div
            v-else-if="key === 'maps'"
            class="w-full border p-3 flex flex-col gap-2 shadow-xl"
            :class="cardRadiusClass"
            :style="{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              backdropFilter: 'var(--card-backdrop)',
              WebkitBackdropFilter: 'var(--card-backdrop)',
              boxShadow: 'var(--card-shadow)',
            }"
          >
            <div class="relative w-full h-48 rounded-xl overflow-hidden bg-gray-800">
              <iframe
                width="100%"
                height="100%"
                frameborder="0"
                style="border: 0"
                :src="`https://maps.google.com/maps?q=${encodeURIComponent(
                  landingConfig.mapAddress || '',
                )}&t=&z=15&ie=UTF8&iwloc=&output=embed`"
                title="Google Maps Location"
              />
            </div>
            <div class="flex gap-2 pt-1 pb-1">
              <a
                :href="`https://waze.com/ul?q=${encodeURIComponent(
                  landingConfig.mapAddress || '',
                )}`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 border py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                :style="{
                  backgroundColor: 'var(--icon-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }"
              >
                <Navigation :size="16" />
                Waze
              </a>
              <a
                :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  landingConfig.mapAddress || '',
                )}`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 border py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                :style="{
                  backgroundColor: 'var(--icon-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }"
              >
                <MapPin :size="16" />
                Google Maps
              </a>
            </div>
          </div>

          <!-- FAQ -->
          <div
            v-else-if="key === 'faq'"
            class="w-full border p-6 shadow-2xl relative overflow-hidden"
            :class="cardRadiusClass"
            :style="{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              backdropFilter: 'var(--card-backdrop)',
              WebkitBackdropFilter: 'var(--card-backdrop)',
              boxShadow: 'var(--card-shadow)',
            }"
          >
            <div
              class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-3xl pointer-events-none"
              :style="{ backgroundColor: 'var(--icon-bg)' }"
            />

            <h2
              class="text-xl font-bold mb-6 flex items-center gap-3 relative z-10 text-[var(--text-main)]"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center"
                :style="{ backgroundColor: 'var(--icon-bg)' }"
              >
                <HelpCircle :size="16" class="text-[var(--text-muted)]" />
              </div>
              Frequently asked questions
            </h2>

            <div class="flex flex-col relative z-10">
              <FaqItemComponent
                v-for="faq in landingConfig.faqs"
                :key="faq.id"
                :question="faq.question"
                :answer="faq.answer"
              />
            </div>
          </div>

          <!-- Emergency -->
          <div
            v-else-if="key === 'emergency'"
            class="w-full mt-2 flex flex-col items-center gap-3"
          >
            <p class="text-xs font-medium text-[var(--text-muted)]">
              {{ landingConfig.emergencyText }}
            </p>
            <div class="flex flex-row flex-nowrap gap-2 w-full max-w-[340px]">
              <a
                v-if="
                  (landingConfig.emergencyMethods === 'both' ||
                    landingConfig.emergencyMethods === 'whatsapp') &&
                  whatsappHref
                "
                :href="whatsappHref"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 border text-xs sm:text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap"
                :class="buttonRadiusClass"
                :style="{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                  backdropFilter: 'var(--card-backdrop)',
                  WebkitBackdropFilter: 'var(--card-backdrop)',
                  boxShadow: 'var(--card-shadow)',
                }"
              >
                <MessageCircle :size="16" />
                WhatsApp
              </a>
              <a
                v-if="
                  (landingConfig.emergencyMethods === 'both' ||
                    landingConfig.emergencyMethods === 'call') &&
                  callHref
                "
                :href="callHref"
                class="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 border text-xs sm:text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap"
                :class="buttonRadiusClass"
                :style="{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                  backdropFilter: 'var(--card-backdrop)',
                  WebkitBackdropFilter: 'var(--card-backdrop)',
                  boxShadow: 'var(--card-shadow)',
                }"
              >
                <Phone :size="16" />
                Call
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer
        v-if="landingConfig.showFooter"
        class="w-full mt-6 pt-4 flex flex-col items-center justify-center gap-4"
      >
        <div class="flex items-center justify-center gap-4 w-full">
          <div
            v-if="landingConfig.logoUrl"
            class="flex items-center justify-center overflow-hidden"
            :class="
              landingConfig.logoStyle === 'transparent'
                ? 'w-12 h-12'
                : landingConfig.logoStyle === 'circle'
                  ? 'w-10 h-10 rounded-full border border-[var(--border-color)]'
                  : 'w-10 h-10 rounded-xl border border-[var(--border-color)]'
            "
            :style="
              landingConfig.logoStyle !== 'transparent'
                ? {
                    backgroundColor: 'var(--card-bg)',
                    backdropFilter: 'var(--card-backdrop)',
                    WebkitBackdropFilter: 'var(--card-backdrop)',
                    boxShadow: 'var(--card-shadow)',
                  }
                : {}
            "
          >
            <img
              :src="landingConfig.logoUrl"
              alt="Studio Logo"
              class="w-full h-full"
              :class="
                landingConfig.logoStyle === 'transparent'
                  ? 'object-contain'
                  : 'object-cover'
              "
              referrerpolicy="no-referrer"
            />
          </div>
          <div class="flex flex-col text-left text-xs text-[var(--text-muted)]">
            <p
              class="font-bold text-sm text-[var(--text-main)] flex items-baseline gap-1"
            >
              {{ landingConfig.studioName }}
              <span
                v-if="landingConfig.ssmNumber"
                class="text-[10px] font-normal opacity-70"
                >{{ landingConfig.ssmNumber }}</span
              >
            </p>
            <p v-if="landingConfig.mapAddress">{{ landingConfig.mapAddress }}</p>
          </div>
        </div>

        <div class="w-full flex flex-col items-center mt-2">
          <div class="w-12 h-px bg-[var(--border-color)] mb-3 opacity-50" />
          <div class="text-[10px] text-[var(--text-muted)] opacity-70">
            Powered by SesiFoto
          </div>
        </div>
      </footer>
    </div>

    <ImageCarousel
      :show="isGalleryOpen"
      :images="galleryImagesClean"
      :initialIndex="galleryInitialIndex"
      title="Gallery"
      description="View our gallery"
      @close="isGalleryOpen = false"
    />
    </template>
  </div>
</template>

<style scoped>
.landing-surface {
  height: 100dvh;
  overflow-y: auto;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.landing-surface::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
</style>
