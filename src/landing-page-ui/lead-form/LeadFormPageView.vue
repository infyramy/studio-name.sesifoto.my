<script setup lang="ts">
import { computed, nextTick, reactive, ref, toRef, watch } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import SiteChrome from "../portfolio/SiteChrome.vue";
import { leadFormT, leadFormValidationMessages } from "./i18n";
import LeadFormDateField from "./LeadFormDateField.vue";
import LeadFormSelectField from "./LeadFormSelectField.vue";
import type { LeadFormPageConfig, LeadFormSubmitPayload } from "./types";
import {
  firstFieldError,
  todayIsoDate,
  validateLeadForm,
  type LeadFormFieldErrors,
  type LeadFormFieldKey,
} from "./validate";
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

const fieldErrorClass = "border-red-500";
const minEventDate = todayIsoDate();

const contactName = ref("");
const contactPhone = ref("");
const eventDate = ref("");
const eventType = ref("");
const serviceInterest = ref<"photo" | "video" | "photo_video">("photo_video");
const venue = ref("");
const notes = ref("");
const submitting = ref(false);
const submitMessage = ref<string | null>(null);
const submitError = ref<string | null>(null);
const fieldErrors = reactive<LeadFormFieldErrors>({});

const recentWorkIndex = ref(0);

const eventTypeOptions = computed(() =>
  props.leadForm.eventTypes.map((type) => ({
    value: type.id,
    label: type.label,
  })),
);

const shellClass = computed(() => {
  if (!props.leadForm.showHero) return "flex min-h-full flex-col";
  return "flex min-h-full flex-col lg:grid lg:grid-cols-[2fr_3fr] lg:min-h-[calc(100vh-8rem)]";
});

const visibleRecentImages = computed(() => {
  const images = props.leadForm.recentWorkImages;
  if (images.length <= 2) return images;
  const start = recentWorkIndex.value;
  return [images[start % images.length], images[(start + 1) % images.length]];
});

watch(
  () => props.leadForm.eventTypes,
  (types) => {
    if (eventType.value && !types.some((type) => type.id === eventType.value)) {
      eventType.value = "";
    }
  },
  { deep: true },
);

function clearFieldError(key: LeadFormFieldKey) {
  if (fieldErrors[key]) delete fieldErrors[key];
}

function runValidation(): boolean {
  const next = validateLeadForm(
    {
      contactName: contactName.value,
      contactPhone: contactPhone.value,
      eventDate: eventDate.value,
      eventType: eventType.value,
      serviceInterest: serviceInterest.value,
      requireEventType: props.leadForm.showEventTypes,
    },
    leadFormValidationMessages(props.language),
  );

  (Object.keys(fieldErrors) as LeadFormFieldKey[]).forEach((key) => {
    delete fieldErrors[key];
  });
  Object.assign(fieldErrors, next);
  return Object.keys(next).length === 0;
}

async function focusFirstError() {
  const key = firstFieldError(fieldErrors);
  if (!key) return;
  await nextTick();
  const el = document.getElementById(`lead-field-${key}`);
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
  if (el instanceof HTMLElement) {
    const focusable = el.querySelector<HTMLElement>(
      "input, textarea, button, [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();
  }
}

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

  if (!runValidation()) {
    await focusFirstError();
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
  eventType.value = "";
  venue.value = "";
  notes.value = "";
  (Object.keys(fieldErrors) as LeadFormFieldKey[]).forEach((key) => {
    delete fieldErrors[key];
  });
}

function markSubmitFailure(message?: string) {
  submitting.value = false;
  submitError.value = message || t.value.submitError;
}

function setServiceInterest(value: string) {
  if (value === "photo" || value === "video" || value === "photo_video") {
    serviceInterest.value = value;
    clearFieldError("serviceInterest");
  }
}

function onEventDateUpdate(value: string) {
  eventDate.value = value;
  clearFieldError("eventDate");
}

function onEventTypeUpdate(value: string) {
  eventType.value = value;
  clearFieldError("eventType");
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
      <div :class="shellClass">
        <aside
          v-if="leadForm.showHero"
          class="relative min-h-[42vh] lg:min-h-full"
        >
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
            <p class="mb-3 text-[10px] font-medium tracking-[0.3em] opacity-90">
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

        <div class="bg-[var(--bg-main)] text-[var(--text-main)] min-h-full">
          <div class="mx-auto max-w-xl px-5 py-8 md:px-10 md:py-10">
            <template v-if="leadForm.showFormHeader">
              <p
                class="mb-2 text-[10px] font-semibold tracking-[0.25em] text-[var(--text-muted)]"
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
            </template>

            <section
              v-if="leadForm.showRecentWork && leadForm.recentWorkImages.length"
              class="mb-8"
            >
              <div class="mb-3 flex items-center justify-between">
                <p class="text-[10px] font-semibold tracking-[0.2em]">
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

            <form class="space-y-6" novalidate @submit.prevent="onSubmit">
              <div id="lead-field-contactName">
                <label
                  class="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[var(--text-main)]"
                >
                  {{ t.nameLabel }}
                </label>
                <input
                  v-model="contactName"
                  type="text"
                  autocomplete="name"
                  :placeholder="t.namePlaceholder"
                  :aria-invalid="!!fieldErrors.contactName"
                  :class="[
                    fieldClass,
                    fieldErrors.contactName ? fieldErrorClass : '',
                  ]"
                  @input="clearFieldError('contactName')"
                />
                <p
                  v-if="fieldErrors.contactName"
                  class="mt-1.5 text-xs text-red-600"
                >
                  {{ fieldErrors.contactName }}
                </p>
              </div>

              <div id="lead-field-contactPhone">
                <label
                  class="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[var(--text-main)]"
                >
                  {{ t.whatsappLabel }}
                </label>
                <input
                  v-model="contactPhone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  :placeholder="t.whatsappPlaceholder"
                  :aria-invalid="!!fieldErrors.contactPhone"
                  :class="[
                    fieldClass,
                    fieldErrors.contactPhone ? fieldErrorClass : '',
                  ]"
                  @input="clearFieldError('contactPhone')"
                />
                <p
                  v-if="fieldErrors.contactPhone"
                  class="mt-1.5 text-xs text-red-600"
                >
                  {{ fieldErrors.contactPhone }}
                </p>
              </div>

              <div
                class="grid gap-6"
                :class="leadForm.showEventTypes ? 'sm:grid-cols-2' : ''"
              >
                <div id="lead-field-eventDate">
                  <label
                    class="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[var(--text-main)]"
                  >
                    {{ t.eventDateLabel }}
                  </label>
                  <LeadFormDateField
                    :model-value="eventDate"
                    :placeholder="t.eventDatePlaceholder"
                    :min-date="minEventDate"
                    :invalid="!!fieldErrors.eventDate"
                    :clear-label="t.clearDate"
                    @update:model-value="onEventDateUpdate"
                  />
                  <p
                    v-if="fieldErrors.eventDate"
                    class="mt-1.5 text-xs text-red-600"
                  >
                    {{ fieldErrors.eventDate }}
                  </p>
                </div>

                <div v-if="leadForm.showEventTypes" id="lead-field-eventType">
                  <label
                    class="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[var(--text-main)]"
                  >
                    {{ t.eventTypeLabel }}
                  </label>
                  <LeadFormSelectField
                    :model-value="eventType"
                    :options="eventTypeOptions"
                    :placeholder="t.eventTypePlaceholder"
                    :invalid="!!fieldErrors.eventType"
                    @update:model-value="onEventTypeUpdate"
                  />
                  <p
                    v-if="fieldErrors.eventType"
                    class="mt-1.5 text-xs text-red-600"
                  >
                    {{ fieldErrors.eventType }}
                  </p>
                </div>
              </div>
              <p class="text-[11px] text-[var(--text-muted)]">{{ t.eventDateHint }}</p>

              <div id="lead-field-serviceInterest">
                <label
                  class="mb-3 block text-[10px] font-semibold tracking-[0.15em] text-[var(--text-main)]"
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
                    :aria-pressed="serviceInterest === option.key"
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
                <p
                  v-if="fieldErrors.serviceInterest"
                  class="mt-1.5 text-xs text-red-600"
                >
                  {{ fieldErrors.serviceInterest }}
                </p>
              </div>

              <div id="lead-field-venue">
                <label
                  class="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[var(--text-main)]"
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

              <div id="lead-field-notes">
                <label
                  class="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[var(--text-main)]"
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

              <template v-if="leadForm.showSubmitFooter">
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
              </template>
            </form>

            <p
              v-if="leadForm.showSubmitFooter && leadForm.showPoweredBy"
              class="mt-10 text-center text-[10px] tracking-[0.2em] text-[var(--text-muted)]"
            >
              {{ leadForm.poweredByLabel }}
            </p>
          </div>
        </div>
      </div>
    </SiteChrome>
  </div>
</template>
