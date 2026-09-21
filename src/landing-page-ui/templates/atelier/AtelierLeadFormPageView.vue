<script setup lang="ts">
import { computed, nextTick, reactive, ref, toRef, watch } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import AtelierSiteChrome from "./AtelierSiteChrome.vue";
import LandingPageBootState from "../../LandingPageBootState.vue";
import { leadFormT, leadFormValidationMessages } from "../../lead-form/i18n";
import LeadFormDateField from "../../lead-form/LeadFormDateField.vue";
import LeadFormSelectField from "../../lead-form/LeadFormSelectField.vue";
import type {
  LeadFormPageConfig,
  LeadFormSubmitPayload,
} from "../../lead-form/types";
import {
  firstFieldError,
  todayIsoDate,
  validateLeadForm,
  type LeadFormFieldErrors,
  type LeadFormFieldKey,
} from "../../lead-form/validate";
import type { LandingPageTheme, StudioLanguage } from "../../types";
import type { HomePreviewLayout } from "../../home-marketing/useHomeLayout";
import { useLandingPageStyles } from "../../useLandingPageStyles";
import { tLandingPage } from "../../i18n";

const SESIFOTO_LOGO_SRC = "/brand/sesifoto.svg";
const SESIFOTO_HOME_URL = "https://sesifoto.my";

const props = withDefaults(
  defineProps<{
    leadForm: LeadFormPageConfig;
    styleConfig: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    previewLayout?: HomePreviewLayout;
    loading?: boolean;
    loadError?: string | null;
    crmEnabled?: boolean;
    surfaceClass?: string;
  }>(),
  {
    language: "bm",
    mode: "preview",
    previewLayout: null,
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

    <LandingPageBootState
      v-if="loading"
      :theme="styleConfig"
      label="Loading"
    />

    <LandingPageBootState
      v-else-if="loadError"
      :theme="styleConfig"
      :error="loadError"
      @retry="emit('retryLoad')"
    />

    <AtelierSiteChrome
      v-else
      :style-config="styleConfig"
      :language="language"
      :mode="mode"
      :preview-layout="previewLayout"
      @navigate="emit('navigate', $event)"
      @language-change="emit('languageChange', $event)"
    >
      <div class="mx-auto max-w-xl px-4 py-12 md:px-8 md:py-16" data-lp-reveal>
        <section
          v-if="leadForm.showHero"
          class="mb-12 text-center"
        >
          <div
            v-if="leadForm.heroImageUrl"
            class="mx-auto mb-8 aspect-[4/3] max-h-[280px] w-full overflow-hidden bg-[var(--icon-bg)]"
          >
            <img
              :src="leadForm.heroImageUrl"
              alt=""
              class="h-full w-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <p
            class="lp-reveal-child mb-3 text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-muted)]"
            style="--child-i: 0"
          >
            {{ brandLabel }}
          </p>
          <h1
            class="lp-reveal-child mb-3 font-title text-3xl tracking-wide text-[var(--text-main)] md:text-4xl"
            style="--child-i: 1"
          >
            {{ leadForm.heroHeading }}
          </h1>
          <p
            class="lp-reveal-child mb-3 font-title text-sm italic text-[var(--text-muted)]"
            style="--child-i: 2"
          >
            {{ leadForm.heroSubtitle }}
          </p>
          <p
            class="lp-reveal-child mx-auto max-w-md text-xs leading-relaxed text-[var(--text-muted)]"
            style="--child-i: 3"
          >
            {{ leadForm.heroDescription }}
          </p>
        </section>

        <div class="bg-[var(--bg-main)] text-[var(--text-main)]">
          <div>
            <template v-if="leadForm.showFormHeader">
              <p
                class="lp-reveal-child mb-2 text-center text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--text-muted)]"
                style="--child-i: 0"
              >
                {{ leadForm.sectionLabel }}
              </p>
              <h2
                class="lp-reveal-child mb-3 text-center font-title text-2xl tracking-wide text-[var(--text-main)] md:text-3xl"
                style="--child-i: 1"
              >
                {{ leadForm.formHeading }}
              </h2>
              <p class="mb-8 text-center text-sm text-[var(--text-muted)]">
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
                :class="
                  leadForm.showEventTypes
                    ? 'grid gap-6 sm:grid-cols-2'
                    : 'grid gap-6'
                "
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

            <a
              v-if="leadForm.showSubmitFooter"
              :href="SESIFOTO_HOME_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-10 inline-flex w-full flex-col items-center gap-2 text-center text-[10px] tracking-[0.15em] text-[var(--text-muted)] opacity-80 transition-opacity hover:opacity-100"
            >
              <img
                :src="SESIFOTO_LOGO_SRC"
                alt="SesiFoto"
                class="h-8 w-8 rounded-md object-contain"
              />
              <span>{{ tLandingPage(language, "poweredBy") }}</span>
            </a>
          </div>
        </div>
      </div>
    </AtelierSiteChrome>
  </div>
</template>
