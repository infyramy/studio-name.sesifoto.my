<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-vue-next";
import SiteChrome from "../portfolio/SiteChrome.vue";
import { leadFormT } from "./i18n";
import type { LeadFormPageConfig, LeadFormSubmitPayload } from "./types";
import type { LandingPageTheme, StudioLanguage } from "../types";
import { useLandingPageStyles } from "../useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    leadForm: LeadFormPageConfig;
    styleConfig: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    loading?: boolean;
    loadError?: string | null;
    crmEnabled?: boolean;
    surfaceClass?: string;
  }>(),
  {
    language: "bm",
    mode: "preview",
    loading: false,
    loadError: null,
    crmEnabled: true,
    surfaceClass: "landing-surface",
  },
);

const emit = defineEmits<{
  navigate: [url: string];
  languageChange: [lang: StudioLanguage];
  retryLoad: [];
  submit: [payload: LeadFormSubmitPayload];
  openGallery: [index: number];
}>();

const styleRef = toRef(props, "styleConfig");
const { themeStyle, buttonRadiusClass } = useLandingPageStyles(styleRef);

const t = computed(() => leadFormT(props.language));

const brandLabel = computed(
  () => props.leadForm.brandLabel?.trim() || props.styleConfig.studioName,
);

const fieldClass =
  "w-full border-0 border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--text-main)] placeholder:text-[var(--text-muted)]";

const contactName = ref("");
const contactPhone = ref("");
const eventDate = ref("");
const eventType = ref(props.leadForm.eventTypes[0]?.id ?? "wedding");
const serviceInterest = ref<"photo" | "video" | "photo_video">("photo_video");
const venue = ref("");
const notes = ref("");
const submitting = ref(false);
const submitMessage = ref<string | null>(null);
const submitError = ref<string | null>(null);

const recentWorkIndex = ref(0);

const visibleRecentImages = computed(() => {
  const images = props.leadForm.recentWorkImages;
  if (images.length <= 2) return images;
  const start = recentWorkIndex.value;
  return [images[start % images.length], images[(start + 1) % images.length]];
});

function prevRecentWork() {
  const len = props.leadForm.recentWorkImages.length;
  if (len <= 2) return;
  recentWorkIndex.value = (recentWorkIndex.value - 1 + len) % len;
}

function nextRecentWork() {
  const len = props.leadForm.recentWorkImages.length;
  if (len <= 2) return;
  recentWorkIndex.value = (recentWorkIndex.value + 1) % len;
}

async function onSubmit() {
  submitMessage.value = null;
  submitError.value = null;

  if (!contactName.value.trim() || !contactPhone.value.trim()) {
    submitError.value = t.value.submitError;
    return;
  }

  if (props.mode === "preview") {
    submitMessage.value = t.value.previewOnly;
    return;
  }

  if (!props.crmEnabled) {
    submitError.value = t.value.crmRequired;
    return;
  }

  submitting.value = true;
  emit("submit", {
    contactName: contactName.value.trim(),
    contactPhone: contactPhone.value.trim(),
    eventDate: eventDate.value || undefined,
    eventType: eventType.value || undefined,
    serviceInterest: serviceInterest.value,
    venue: venue.value.trim() || undefined,
    notes: notes.value.trim() || undefined,
  });
}

function markSubmitSuccess() {
  submitting.value = false;
  submitMessage.value = t.value.submitSuccess;
  contactName.value = "";
  contactPhone.value = "";
  eventDate.value = "";
  venue.value = "";
  notes.value = "";
}

function markSubmitFailure(message?: string) {
  submitting.value = false;
  submitError.value = message || t.value.submitError;
}

function setServiceInterest(value: string) {
  if (value === "photo" || value === "video" || value === "photo_video") {
    serviceInterest.value = value;
  }
}

defineExpose({ markSubmitSuccess, markSubmitFailure });
</script>

<template>
  <div :class="['min-h-full', surfaceClass]">
    <component :is="'style'" v-html="themeStyle" />

    <div
      v-if="loading"
      class="flex min-h-[60vh] items-center justify-center py-24 text-[var(--text-muted)]"
    >
      Loading...
    </div>

    <div
      v-else-if="loadError"
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-24 text-center"
    >
      <p class="text-[var(--text-muted)]">{{ loadError }}</p>
      <button
        type="button"
        class="rounded-md border px-4 py-2 text-sm"
        :class="buttonRadiusClass"
        @click="emit('retryLoad')"
      >
        Try again
      </button>
    </div>

    <SiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <div class="lg:grid lg:grid-cols-[2fr_3fr] lg:min-h-[calc(100vh-8rem)]">
        <aside class="relative min-h-[42vh] lg:min-h-full">
          <img
            :src="leadForm.heroImageUrl"
            alt=""
            class="absolute inset-0 h-full w-full object-cover"
            referrerpolicy="no-referrer"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10"
          />
          <div class="relative flex h-full flex-col justify-end p-6 md:p-10 text-white">
            <p class="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] opacity-90">
              {{ brandLabel }}
            </p>
            <h1 class="mb-3 max-w-md text-3xl md:text-4xl leading-tight">
              {{ leadForm.heroHeading }}
            </h1>
            <p class="mb-4 max-w-md text-sm italic font-title opacity-90">
              {{ leadForm.heroSubtitle }}
            </p>
            <p class="max-w-md text-xs leading-relaxed opacity-80">
              {{ leadForm.heroDescription }}
            </p>
          </div>
        </aside>

        <div class="bg-[var(--bg-main)] text-[var(--text-main)]">
          <div class="mx-auto max-w-xl px-5 py-8 md:px-10 md:py-10">
            <p
              class="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]"
            >
              {{ leadForm.sectionLabel }}
            </p>
            <h2 class="mb-2 text-3xl leading-tight text-[var(--text-main)]">
              {{ leadForm.formHeading }}
            </h2>
            <p class="mb-8 text-sm text-[var(--text-muted)]">
              {{ leadForm.priceNote }}
              <strong class="font-semibold text-[var(--text-main)]">{{
                leadForm.priceAmount
              }}</strong>
            </p>

            <section
              v-if="leadForm.showRecentWork && leadForm.recentWorkImages.length"
              class="mb-8"
            >
              <div class="mb-3 flex items-center justify-between">
                <p class="text-[10px] font-semibold uppercase tracking-[0.2em]">
                  {{ leadForm.recentWorkLabel }}
                </p>
                <div
                  v-if="leadForm.recentWorkImages.length > 2"
                  class="flex gap-1"
                >
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-color)] text-[var(--text-main)]"
                    aria-label="Previous"
                    @click="prevRecentWork"
                  >
                    <ChevronLeft class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-color)] text-[var(--text-main)]"
                    aria-label="Next"
                    @click="nextRecentWork"
                  >
                    <ChevronRight class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="(image, index) in visibleRecentImages"
                  :key="`${image}-${index}`"
                  type="button"
                  class="aspect-[4/3] overflow-hidden bg-[var(--icon-bg)]"
                  @click="emit('openGallery', recentWorkIndex + index)"
                >
                  <img
                    :src="image"
                    alt=""
                    class="h-full w-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                </button>
              </div>
              <p class="mt-2 text-[11px] text-[var(--text-muted)]">
                {{ leadForm.recentWorkCaption }}
              </p>
            </section>

            <form class="space-y-6" @submit.prevent="onSubmit">
              <div>
                <label
                  class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-main)]"
                >
                  {{ t.nameLabel }}
                </label>
                <input
                  v-model="contactName"
                  type="text"
                  :placeholder="t.namePlaceholder"
                  :class="fieldClass"
                />
              </div>

              <div>
                <label
                  class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-main)]"
                >
                  {{ t.whatsappLabel }}
                </label>
                <input
                  v-model="contactPhone"
                  type="tel"
                  :placeholder="t.whatsappPlaceholder"
                  :class="fieldClass"
                />
              </div>

              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-main)]"
                  >
                    {{ t.eventDateLabel }}
                  </label>
                  <div class="relative">
                    <input v-model="eventDate" type="date" :class="[fieldClass, 'pr-8']" />
                    <Calendar
                      class="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                  </div>
                </div>
                <div>
                  <label
                    class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-main)]"
                  >
                    {{ t.eventTypeLabel }}
                  </label>
                  <select v-model="eventType" :class="fieldClass">
                    <option
                      v-for="type in leadForm.eventTypes"
                      :key="type.id"
                      :value="type.id"
                    >
                      {{ type.label }}
                    </option>
                  </select>
                </div>
              </div>
              <p class="text-[11px] text-[var(--text-muted)]">{{ t.eventDateHint }}</p>

              <div>
                <label
                  class="mb-3 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-main)]"
                >
                  {{ t.serviceLabel }}
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in [
                      { key: 'photo', label: t.photo },
                      { key: 'video', label: t.video },
                      { key: 'photo_video', label: t.both },
                    ]"
                    :key="option.key"
                    type="button"
                    class="rounded-full border px-4 py-2 text-xs transition-colors"
                    :class="buttonRadiusClass"
                    :style="
                      serviceInterest === option.key
                        ? {
                            backgroundColor: styleConfig.primaryColor,
                            color: styleConfig.primaryTextColor,
                            borderColor: styleConfig.primaryColor,
                          }
                        : {
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-muted)',
                            backgroundColor: 'transparent',
                          }
                    "
                    @click="setServiceInterest(option.key)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div>
                <label
                  class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-main)]"
                >
                  {{ t.locationLabel }}
                </label>
                <input
                  v-model="venue"
                  type="text"
                  :placeholder="t.locationPlaceholder"
                  :class="fieldClass"
                />
              </div>

              <div>
                <label
                  class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-main)]"
                >
                  {{ t.notesLabel }}
                </label>
                <textarea
                  v-model="notes"
                  rows="3"
                  :placeholder="t.notesPlaceholder"
                  :class="[fieldClass, 'resize-none']"
                />
              </div>

              <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
              <p v-if="submitMessage" class="text-sm text-green-700">{{ submitMessage }}</p>

              <button
                type="submit"
                class="w-full px-6 py-3.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                :class="buttonRadiusClass"
                :style="{
                  backgroundColor: styleConfig.primaryColor,
                  color: styleConfig.primaryTextColor,
                }"
                :disabled="submitting"
              >
                {{ submitting ? t.sending : leadForm.submitLabel }}
              </button>

              <p class="text-center text-[11px] text-[var(--text-muted)]">
                {{ leadForm.privacyNote }}
              </p>
            </form>

            <p
              v-if="leadForm.showPoweredBy"
              class="mt-10 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]"
            >
              {{ leadForm.poweredByLabel }}
            </p>
          </div>
        </div>
      </div>
    </SiteChrome>
  </div>
</template>
