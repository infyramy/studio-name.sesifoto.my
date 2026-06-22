<script setup lang="ts">
import { computed, h, ref, toRef } from "vue";
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
  Quote,
} from "lucide-vue-next";
import { tLandingPage, type LandingPageUiKey } from "./i18n";
import { getGalleryImagesClean, getOrderedSections } from "./normalize";
import type { LandingPageTheme, ProductEntitlements, StudioLanguage } from "./types";
import {
  normalizePhone,
  safeHttpUrl,
  useLandingPageStyles,
} from "./useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    config: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    productEntitlements?: ProductEntitlements;
    bookingOpen?: boolean;
    studioPhone?: string;
    loading?: boolean;
    loadError?: string | null;
    surfaceClass?: string;
    activeSection?: string | null;
    editable?: boolean;
  }>(),
  {
    language: "en",
    mode: "preview",
    productEntitlements: () => ({ studio: true, crm: true }),
    bookingOpen: true,
    studioPhone: "",
    loading: false,
    loadError: null,
    surfaceClass: "landing-surface",
    activeSection: null,
    editable: false,
  },
);

const emit = defineEmits<{
  bookNow: [];
  checkBooking: [];
  crmInquiry: [];
  openGallery: [index: number];
  retryLoad: [];
  selectSection: [id: string];
  editField: [payload: { field: "studioName" | "mainTitle" | "description"; value: string }];
}>();

const theme = toRef(props, "config");
const {
  buttonRadiusClass,
  cardRadiusClass,
  themeStyle,
  gradientOverlayStyle,
} = useLandingPageStyles(theme);

const t = (key: LandingPageUiKey) => tLandingPage(props.language, key);

const galleryImagesClean = computed(() => getGalleryImagesClean(props.config));

const orderedSections = computed(() =>
  getOrderedSections(props.config, {
    studioPhone: props.studioPhone,
    preview: props.mode === "preview",
  }),
);

const showBookNowEnabled = computed(
  () =>
    props.config.showButtons !== false &&
    props.config.showBookNowButton &&
    props.productEntitlements.studio &&
    props.bookingOpen,
);

const showBookNowClosed = computed(
  () =>
    props.config.showButtons !== false &&
    props.config.showBookNowButton &&
    props.productEntitlements.studio &&
    !props.bookingOpen,
);

const showCheckBookingEnabled = computed(
  () =>
    props.config.showButtons !== false &&
    props.config.showCheckBookingButton &&
    props.productEntitlements.studio,
);

const showCrmInquiryEnabled = computed(
  () =>
    props.config.showButtons !== false &&
    props.config.showCrmInquiryButton &&
    props.productEntitlements.crm,
);

const showButtonsBlock = computed(
  () =>
    showBookNowEnabled.value ||
    showBookNowClosed.value ||
    showCheckBookingEnabled.value ||
    showCrmInquiryEnabled.value ||
    showCustomLinksBlock.value,
);

const showCustomLinksBlock = computed(() => {
  if (props.mode === "preview") {
    return props.config.showCustomLinks;
  }
  return props.config.showCustomLinks && (props.config.customLinks?.length ?? 0) > 0;
});

const visibleCustomLinks = computed(() => props.config.customLinks ?? []);

const socials = computed(() => ({
  instagram: safeHttpUrl(props.config.socialInstagram),
  tiktok: safeHttpUrl(props.config.socialTiktok),
  facebook: safeHttpUrl(props.config.socialFacebook),
  website: safeHttpUrl(props.config.socialWebsite),
}));

const emergencyPhone = computed(() => {
  const phone =
    props.config.emergencyPhoneType === "custom"
      ? props.config.emergencyCustomPhone
      : props.studioPhone;
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

const TikTokIcon = (iconProps: { size?: number; class?: string }) => {
  const size = iconProps.size ?? 24;
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      class: iconProps.class,
    },
    [h("path", { d: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" })],
  );
};

const FaqItem = {
  name: "FaqItem",
  props: {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  setup(faqProps: { question: string; answer: string }) {
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
                faqProps.question,
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
                faqProps.answer,
              ),
            ],
          ),
        ],
      );
  },
};

function onBookNow() {
  if (props.mode === "preview") return;
  emit("bookNow");
}

function onCheckBooking() {
  if (props.mode === "preview") return;
  emit("checkBooking");
}

function onCrmInquiry() {
  if (props.mode === "preview") return;
  emit("crmInquiry");
}

function onCustomLinkClick(event: MouseEvent) {
  if (isPreviewInteractive()) {
    event.preventDefault();
    emit("selectSection", "buttons");
  }
}

function onGalleryClick(event: MouseEvent) {
  if (isPreviewInteractive()) {
    event.stopPropagation();
    emit("selectSection", "gallery");
    return;
  }
  emit("openGallery", 0);
}

function onRetry() {
  emit("retryLoad");
}

type EditableField = "studioName" | "mainTitle" | "description";

const editingField = ref<EditableField | null>(null);
const editDraft = ref("");
const editOriginal = ref("");

function isPreviewInteractive() {
  return props.mode === "preview";
}

function sectionClass(id: string) {
  if (!isPreviewInteractive()) return "";
  const active = props.activeSection === id;
  return [
    "rounded-xl transition-all duration-200",
    active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:ring-1 hover:ring-foreground/20 hover:ring-offset-2 hover:ring-offset-background",
    "cursor-pointer",
  ];
}

function onSectionClick(id: string, event: MouseEvent) {
  if (!isPreviewInteractive()) return;
  event.stopPropagation();
  emit("selectSection", id);
}

function startEdit(field: EditableField, current: string, event: MouseEvent) {
  if (!props.editable || !isPreviewInteractive()) return;
  event.stopPropagation();
  editingField.value = field;
  editOriginal.value = current;
  editDraft.value = current;
}

function commitEdit() {
  if (!editingField.value) return;
  emit("editField", { field: editingField.value, value: editDraft.value });
  editingField.value = null;
}

function cancelEdit() {
  editDraft.value = editOriginal.value;
  editingField.value = null;
}

function onEditKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && editingField.value !== "description") {
    event.preventDefault();
    commitEdit();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    cancelEdit();
  }
}

function textEditClass() {
  if (!props.editable || !isPreviewInteractive()) return "";
  return "cursor-text hover:opacity-80 transition-all hover:ring-2 hover:ring-primary/40 rounded-md px-2 -mx-2";
}
</script>

<template>
  <div
    :class="[
      surfaceClass,
      surfaceClass === 'preview-surface' ? 'min-h-full' : 'min-h-dvh',
      'w-full overflow-x-hidden',
    ]"
  >
    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
    <component :is="'style'" v-html="themeStyle" />

    <div
      v-if="loading"
      class="min-h-dvh w-full flex items-center justify-center px-6"
      :style="{ backgroundColor: config.secondaryColor }"
      aria-busy="true"
    >
      <div class="flex flex-col items-center gap-4">
        <div
          class="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"
        />
        <div class="text-xs text-[var(--text-muted)] opacity-80">
          {{ t("loading") }}
        </div>

        <div
          v-if="loadError"
          class="mt-2 w-full max-w-[360px] text-center text-xs text-[var(--text-muted)]"
        >
          <div class="mb-2 opacity-90">{{ loadError }}</div>
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
            @click="onRetry"
          >
            {{ t("tryAgain") }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="loadError"
      class="min-h-dvh w-full flex items-center justify-center px-6"
      :style="{ backgroundColor: config.secondaryColor }"
    >
      <div class="flex flex-col items-center gap-4 max-w-[360px] text-center">
        <div class="text-sm text-[var(--text-muted)] opacity-90">
          {{ loadError }}
        </div>
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
          @click="onRetry"
        >
          {{ t("tryAgain") }}
        </button>
      </div>
    </div>

    <template v-else>
      <div
        data-section="hero"
        class="relative w-full max-h-[380px] overflow-hidden h-[min(42vh,380px)]"
        :class="sectionClass('hero')"
        @click="onSectionClick('hero', $event)"
      >
        <img
          :src="config.heroUrl"
          alt="Studio Background"
          class="h-full w-full object-cover object-center"
          referrerpolicy="no-referrer"
        />
        <div class="absolute inset-0" :style="gradientOverlayStyle" />
      </div>

      <div class="relative z-10 w-full max-w-[520px] mx-auto px-5 -mt-24 pb-10">
        <div
          data-section="header"
          class="flex flex-col items-center text-center"
          :class="sectionClass('header')"
          @click="onSectionClick('header', $event)"
        >
          <div class="relative mb-6 mt-2 flex justify-center w-full">
            <img
              v-if="config.logoStyle === 'transparent' && config.logoUrl"
              :src="config.logoUrl"
              alt="Studio Logo"
              class="w-48 md:w-56 h-auto object-contain drop-shadow-md"
              referrerpolicy="no-referrer"
            />
            <div
              v-else-if="config.logoUrl"
              class="relative flex items-center justify-center overflow-hidden shadow-2xl border"
              :class="
                config.logoStyle === 'circle'
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
                :src="config.logoUrl"
                alt="Studio Logo"
                class="w-full h-full object-cover drop-shadow-sm"
                referrerpolicy="no-referrer"
              />
            </div>
          </div>

          <div
            v-if="editingField !== 'studioName'"
            class="mb-3 px-4 py-1.5 rounded-full border text-xs font-medium tracking-wide shadow-sm"
            :class="textEditClass()"
            :style="{
              backgroundColor: 'var(--icon-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }"
            @click="startEdit('studioName', config.studioName, $event)"
          >
            {{ config.studioName }}
          </div>
          <input
            v-else
            v-model="editDraft"
            class="mb-3 px-4 py-1.5 rounded-full border text-xs font-medium tracking-wide shadow-sm w-full max-w-[200px] text-center bg-background/90 backdrop-blur text-foreground outline-none ring-1 ring-primary/50 transition-all focus:ring-2 focus:ring-primary"
            @blur="commitEdit"
            @keydown="onEditKeydown"
            @click.stop
          />

          <h1
            v-if="editingField !== 'mainTitle'"
            class="text-4xl md:text-5xl font-bold tracking-tight mb-2 drop-shadow-lg text-[var(--text-main)] leading-tight"
            :class="textEditClass()"
            @click="startEdit('mainTitle', config.mainTitle, $event)"
          >
            {{ config.mainTitle }}
          </h1>
          <input
            v-else
            v-model="editDraft"
            class="text-4xl md:text-5xl font-bold tracking-tight mb-2 w-full max-w-[440px] text-center bg-background/90 backdrop-blur text-foreground outline-none ring-1 ring-primary/50 transition-all focus:ring-2 focus:ring-primary rounded-xl px-4 py-2 shadow-sm"
            @blur="commitEdit"
            @keydown="onEditKeydown"
            @click.stop
          />
          <p
            v-if="editingField !== 'description'"
            class="font-light text-base mb-6 text-[var(--text-muted)] max-w-md mx-auto whitespace-pre-line leading-snug"
            :class="textEditClass()"
            @click="startEdit('description', config.description, $event)"
          >
            {{ config.description }}
          </p>
          <textarea
            v-else
            v-model="editDraft"
            class="font-light text-base mb-6 text-foreground w-full max-w-md mx-auto min-h-[120px] bg-background/90 backdrop-blur outline-none ring-1 ring-primary/50 transition-all focus:ring-2 focus:ring-primary rounded-xl px-4 py-3 shadow-sm text-center resize-none leading-snug"
            @blur="commitEdit"
            @keydown="onEditKeydown"
            @click.stop
          />

          <div
            v-if="config.showSocials"
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
              v-if="socials.tiktok"
              :href="socials.tiktok"
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
              class="transition-all duration-300 hover:scale-110 hover:-translate-y-1 drop-shadow-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <TikTokIcon :size="24" />
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

        <div
          v-if="showButtonsBlock"
          data-section="buttons"
          class="flex flex-col gap-3 w-full mb-6"
          :class="sectionClass('buttons')"
          @click="onSectionClick('buttons', $event)"
        >
          <button
            v-if="showBookNowEnabled"
            type="button"
            class="w-full py-4 px-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            :class="buttonRadiusClass"
            :style="{
              backgroundColor: config.primaryColor,
              color: config.primaryTextColor,
            }"
            @click="onBookNow"
          >
            {{ t("bookNow") }}
            <ArrowRight :size="18" />
          </button>
          <button
            v-else-if="showBookNowClosed"
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
            v-if="showCrmInquiryEnabled"
            type="button"
            class="w-full py-4 px-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            :class="buttonRadiusClass"
            :style="{
              backgroundColor: config.primaryColor,
              color: config.primaryTextColor,
            }"
            @click="onCrmInquiry"
          >
            {{ t("sendInquiry") }}
            <ArrowRight :size="18" />
          </button>

          <button
            v-if="showCheckBookingEnabled"
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
            @click="onCheckBooking"
          >
            <Calendar :size="18" />
            {{ t("checkBooking") }}
          </button>

          <template v-if="showCustomLinksBlock">
            <a
              v-for="link in visibleCustomLinks"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
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
              @click="onCustomLinkClick"
            >
              {{ link.label }}
              <ArrowRight :size="18" />
            </a>
          </template>
        </div>

        <div class="flex flex-col gap-3 w-full mb-6">
          <div v-for="key in orderedSections" :key="key" class="contents">
            <button
              v-if="key === 'gallery'"
              type="button"
              data-section="gallery"
              class="group block w-full text-left border overflow-hidden transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              :class="[cardRadiusClass, sectionClass('gallery')]"
              :style="{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                backdropFilter: 'var(--card-backdrop)',
                WebkitBackdropFilter: 'var(--card-backdrop)',
                boxShadow: 'var(--card-shadow)',
              }"
              @click="onGalleryClick($event)"
            >
              <div class="relative w-full h-56 overflow-hidden bg-gray-800">
                <img
                  v-if="galleryImagesClean[0]"
                  :src="galleryImagesClean[0]"
                  alt="Gallery"
                  class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  referrerpolicy="no-referrer"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-sm text-[var(--text-muted)]"
                >
                  {{ t("galleryTitle") }}
                </div>
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
                  {{ t("galleryTitle") }}
                </h3>
                <p class="text-sm text-[var(--text-muted)]">
                  {{ t("galleryDesc") }}
                </p>
              </div>
            </button>

            <div
              v-else-if="key === 'testimonials'"
              data-section="testimonials"
              class="w-full border p-6 shadow-2xl relative overflow-hidden"
              :class="[cardRadiusClass, sectionClass('testimonials')]"
              @click="onSectionClick('testimonials', $event)"
              :style="{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                backdropFilter: 'var(--card-backdrop)',
                WebkitBackdropFilter: 'var(--card-backdrop)',
                boxShadow: 'var(--card-shadow)',
              }"
            >
              <h2
                class="text-xl font-bold mb-6 flex items-center gap-3 text-[var(--text-main)]"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :style="{ backgroundColor: 'var(--icon-bg)' }"
                >
                  <Quote :size="16" class="text-[var(--text-muted)]" />
                </div>
                {{ t("testimonialsTitle") }}
              </h2>

              <div class="flex flex-col gap-4">
                <div
                  v-for="item in config.testimonials"
                  :key="item.id"
                  class="border p-4"
                  :class="cardRadiusClass"
                  :style="{
                    backgroundColor: 'var(--icon-bg)',
                    borderColor: 'var(--border-color)',
                  }"
                >
                  <p class="text-sm italic text-[var(--text-main)] mb-3">
                    "{{ item.quote }}"
                  </p>
                  <p class="text-sm font-semibold text-[var(--text-main)]">
                    {{ item.author }}
                  </p>
                  <p
                    v-if="item.subtitle"
                    class="text-xs text-[var(--text-muted)] mt-0.5"
                  >
                    {{ item.subtitle }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-else-if="key === 'maps'"
              data-section="maps"
              class="w-full border p-3 flex flex-col gap-2 shadow-xl"
              :class="[cardRadiusClass, sectionClass('maps')]"
              @click="onSectionClick('maps', $event)"
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
                    config.mapAddress || '',
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`"
                  title="Google Maps Location"
                />
              </div>
              <div class="flex gap-2 pt-1 pb-1">
                <a
                  :href="`https://waze.com/ul?q=${encodeURIComponent(
                    config.mapAddress || '',
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
                  {{ t("waze") }}
                </a>
                <a
                  :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    config.mapAddress || '',
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
                  {{ t("googleMaps") }}
                </a>
              </div>
            </div>

            <div
              v-else-if="key === 'faq'"
              data-section="faq"
              class="w-full border p-6 shadow-2xl relative overflow-hidden"
              :class="[cardRadiusClass, sectionClass('faq')]"
              @click="onSectionClick('faq', $event)"
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
                {{ t("frequentlyAskedQuestions") }}
              </h2>

              <div class="flex flex-col relative z-10">
                <FaqItem
                  v-for="faq in config.faqs"
                  :key="faq.id"
                  :question="faq.question"
                  :answer="faq.answer"
                />
              </div>
            </div>

            <div
              v-else-if="key === 'emergency'"
              data-section="emergency"
              class="w-full mt-2 flex flex-col items-center gap-3"
              :class="sectionClass('emergency')"
              @click="onSectionClick('emergency', $event)"
            >
              <p class="text-xs font-medium text-[var(--text-muted)]">
                {{ config.emergencyText }}
              </p>
              <div class="flex flex-row flex-nowrap gap-2 w-full max-w-[340px]">
                <a
                  v-if="
                    (config.emergencyMethods === 'both' ||
                      config.emergencyMethods === 'whatsapp') &&
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
                  {{ t("whatsapp") }}
                </a>
                <a
                  v-if="
                    (config.emergencyMethods === 'both' ||
                      config.emergencyMethods === 'call') &&
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
                  {{ t("callUs") }}
                </a>
              </div>
            </div>

            <footer
              v-else-if="key === 'footer'"
              data-section="footer"
              class="w-full mt-6 pt-4 flex flex-col items-center justify-center gap-4"
              :class="sectionClass('footer')"
              @click="onSectionClick('footer', $event)"
            >
              <div class="flex items-center justify-center gap-4 w-full">
                <div
                  v-if="config.logoUrl"
                  class="flex items-center justify-center overflow-hidden"
                  :class="
                    config.logoStyle === 'transparent'
                      ? 'w-12 h-12'
                      : config.logoStyle === 'circle'
                        ? 'w-10 h-10 rounded-full border border-[var(--border-color)]'
                        : 'w-10 h-10 rounded-xl border border-[var(--border-color)]'
                  "
                  :style="
                    config.logoStyle !== 'transparent'
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
                    :src="config.logoUrl"
                    alt="Studio Logo"
                    class="w-full h-full"
                    :class="
                      config.logoStyle === 'transparent'
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
                    {{ config.studioName }}
                    <span
                      v-if="config.ssmNumber"
                      class="text-[10px] font-normal opacity-70"
                    >{{ config.ssmNumber }}</span>
                  </p>
                  <p v-if="config.mapAddress">{{ config.mapAddress }}</p>
                </div>
              </div>

              <div class="w-full flex flex-col items-center mt-2">
                <div class="w-12 h-px bg-[var(--border-color)] mb-3 opacity-50" />
                <div class="text-[10px] text-[var(--text-muted)] opacity-70">
                  {{ t("poweredBy") }}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <slot name="gallery-modal" />
    </template>
  </div>
</template>

<style scoped>
.landing-surface {
  height: 100dvh;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.preview-surface {
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.landing-surface::-webkit-scrollbar,
.preview-surface::-webkit-scrollbar {
  display: none;
}
</style>
