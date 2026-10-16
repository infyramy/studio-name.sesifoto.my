<template>
  <div
    class="portal-scroll h-dvh overflow-y-auto portal-font transition-colors duration-300"
    :style="[{ background: 'var(--p-shell)', color: 'var(--p-text)' }, themeVars]"
  >
    <PortalLoadingState v-if="loading" label="Loading details form" />

    <PortalErrorState
      v-else-if="error"
      title="Form unavailable"
      :message="error"
    />

    <div
      v-else-if="done"
      class="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div
        class="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        :style="{ background: 'color-mix(in srgb, var(--p-accent) 18%, transparent)' }"
      >
        <Check class="h-8 w-8" :style="{ color: 'var(--p-accent)' }" />
      </div>
      <h1 class="text-2xl font-semibold tracking-tight">Details received</h1>
      <p class="mt-2 text-sm opacity-70">
        {{
          resultQuoteUrl
            ? "Your quotation is ready to review."
            : `${form?.studioName || "The studio"} will follow up soon.`
        }}
      </p>
      <a
        v-if="resultQuoteUrl"
        :href="resultQuoteUrl"
        class="mt-8 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-xl text-sm font-medium"
        :style="{ background: 'var(--p-accent)', color: 'var(--p-shell)' }"
      >
        View quotation
      </a>
      <PoweredBySesifoto class="mt-12" />
    </div>

    <div
      v-else-if="form?.submitted"
      class="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 py-16 text-center"
    >
      <h1 class="text-2xl font-semibold tracking-tight">Already submitted</h1>
      <p class="mt-2 text-sm opacity-70">
        These details were already sent to {{ form.studioName }}.
      </p>
      <a
        v-if="form.quotationPublicUrl"
        :href="form.quotationPublicUrl"
        class="mt-8 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-xl text-sm font-medium"
        :style="{ background: 'var(--p-accent)', color: 'var(--p-shell)' }"
      >
        View quotation
      </a>
      <PoweredBySesifoto class="mt-12" />
    </div>

    <div v-else-if="form" class="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-10 pt-8">
      <header class="mb-8">
        <p class="text-xs font-medium uppercase tracking-wide opacity-50">
          {{ form.studioName }}
        </p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight">
          Complete your details
        </h1>
        <p class="mt-1 text-sm opacity-70">
          Step {{ currentStep + 1 }} of {{ steps.length }} — {{ steps[currentStep].title }}
        </p>
        <div class="mt-4 flex gap-1.5">
          <div
            v-for="(_, index) in steps"
            :key="index"
            class="h-1 flex-1 rounded-full transition-colors"
            :style="{
              background:
                index <= currentStep
                  ? 'var(--p-accent)'
                  : 'color-mix(in srgb, var(--p-text) 12%, transparent)',
            }"
          />
        </div>
      </header>

      <div class="flex-1 space-y-4">
        <template v-if="currentStep === 0">
          <label class="block space-y-1.5">
            <span class="text-xs font-medium opacity-60">Full name</span>
            <input v-model="contactName" type="text" class="field" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-xs font-medium opacity-60">Email</span>
            <input v-model="contactEmail" type="email" class="field" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-xs font-medium opacity-60">Phone</span>
            <input v-model="contactPhone" type="tel" class="field" />
          </label>
        </template>

        <template v-else-if="currentStep === 1">
          <p class="text-sm opacity-70">What service are you interested in?</p>
          <button
            v-for="opt in serviceOptions"
            :key="opt.value"
            type="button"
            class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition"
            :style="
              serviceInterest === opt.value
                ? {
                    borderColor: 'var(--p-accent)',
                    background:
                      'color-mix(in srgb, var(--p-accent) 12%, transparent)',
                  }
                : {
                    borderColor:
                      'color-mix(in srgb, var(--p-text) 14%, transparent)',
                  }
            "
            @click="serviceInterest = opt.value"
          >
            {{ opt.label }}
            <Check
              v-if="serviceInterest === opt.value"
              class="h-4 w-4"
              :style="{ color: 'var(--p-accent)' }"
            />
          </button>
        </template>

        <template v-else-if="currentStep === 2">
          <div class="flex items-start justify-between gap-4">
            <p class="text-sm opacity-70">
              Add each planned session with its date, time, and venue.
            </p>
            <button
              type="button"
              class="shrink-0 text-sm font-medium"
              :style="{ color: 'var(--p-accent)' }"
              @click="openAddSession"
            >
              + Add session
            </button>
          </div>

          <div
            v-if="!sessions.length"
            class="rounded-xl border border-dashed px-5 py-10 text-center"
            :style="{
              borderColor:
                'color-mix(in srgb, var(--p-text) 18%, transparent)',
            }"
          >
            <CalendarDays class="mx-auto h-8 w-8 opacity-30" />
            <p class="mt-3 text-sm font-medium">No sessions yet</p>
            <p class="mt-1 text-xs opacity-60">
              Add a schedule now, or continue and fill it later.
            </p>
            <button
              type="button"
              class="mt-5 rounded-xl px-4 py-2.5 text-sm font-medium"
              :style="{ background: 'var(--p-accent)', color: 'var(--p-shell)' }"
              @click="openAddSession"
            >
              Add session
            </button>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="(plannedSession, index) in sessions"
              :key="index"
              type="button"
              class="group w-full rounded-xl border px-4 py-3 text-left transition"
              :style="{
                borderColor:
                  'color-mix(in srgb, var(--p-text) 14%, transparent)',
              }"
              @click="openEditSession(index)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium">
                    {{ sessionTypeLabel(plannedSession.type) }}
                  </p>
                  <p class="mt-1 text-xs opacity-60">
                    {{ sessionSummary(plannedSession) }}
                  </p>
                  <p v-if="plannedSession.venue" class="mt-1 text-xs opacity-60">
                    {{ plannedSession.venue }}
                    <span v-if="plannedSession.cityState">
                      · {{ plannedSession.cityState }}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-lg p-1.5 opacity-60 hover:opacity-100"
                  aria-label="Remove session"
                  @click.stop="removeSession(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 3">
          <label class="block space-y-1.5">
            <span class="text-xs font-medium opacity-60">Notes for the studio</span>
            <textarea
              v-model="notes"
              rows="5"
              class="field resize-y"
              placeholder="Anything we should know…"
            />
          </label>
        </template>

        <template v-else-if="currentStep === 4">
          <p class="text-sm opacity-70">
            {{
              form.autoCreateQuotation
                ? "Pick at least one package — we will create your quotation."
                : "Pick packages you are interested in (optional)."
            }}
          </p>
          <p v-if="!form.packages.length" class="text-sm opacity-60">
            No packages available yet. You can still submit your details.
          </p>
          <button
            v-for="pkg in form.packages"
            :key="pkg.id"
            type="button"
            class="w-full overflow-hidden rounded-xl border text-left transition"
            :style="
              selectedPackageIds.includes(pkg.id)
                ? {
                    borderColor: 'var(--p-accent)',
                    background:
                      'color-mix(in srgb, var(--p-accent) 12%, transparent)',
                  }
                : {
                    borderColor:
                      'color-mix(in srgb, var(--p-text) 14%, transparent)',
                  }
            "
            @click="togglePackage(pkg.id)"
          >
            <div class="px-4 py-3.5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                      :style="{
                        borderColor: selectedPackageIds.includes(pkg.id)
                          ? 'var(--p-accent)'
                          : 'color-mix(in srgb, var(--p-text) 24%, transparent)',
                        background: selectedPackageIds.includes(pkg.id)
                          ? 'var(--p-accent)'
                          : 'transparent',
                      }"
                    >
                      <Check
                        v-if="selectedPackageIds.includes(pkg.id)"
                        class="h-3 w-3"
                        :style="{ color: 'var(--p-shell)' }"
                      />
                    </span>
                    <p class="text-sm font-semibold">{{ pkg.name }}</p>
                  </div>
                  <p
                    v-if="pkg.description"
                    class="mt-1.5 text-xs leading-relaxed opacity-60"
                  >
                    {{ pkg.description }}
                  </p>
                </div>
                <p class="shrink-0 text-sm font-semibold tabular-nums">
                  {{ formatMoney(pkg.price) }}
                </p>
              </div>
            </div>

            <div
              v-if="pkg.items.length"
              class="space-y-3 border-t px-4 py-3.5"
              :style="{
                borderColor:
                  'color-mix(in srgb, var(--p-text) 10%, transparent)',
                background:
                  'color-mix(in srgb, var(--p-text) 3%, transparent)',
              }"
            >
              <div
                v-for="item in pkg.items"
                :key="item.id"
                class="flex items-start gap-3"
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="h-14 w-14 shrink-0 rounded-lg object-cover"
                  referrerpolicy="no-referrer"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p class="text-xs font-semibold">{{ item.name }}</p>
                    <p class="shrink-0 text-xs tabular-nums opacity-70">
                      {{ formatMoney(item.unitPrice) }}
                      <span v-if="item.pricingUnit">
                        / {{ formatPricingUnit(item.pricingUnit) }}
                      </span>
                      <span v-if="item.quantity > 1"> × {{ item.quantity }}</span>
                    </p>
                  </div>
                  <p
                    v-if="item.shortDescription"
                    class="mt-1 text-xs leading-relaxed opacity-55"
                  >
                    {{ item.shortDescription }}
                  </p>
                  <div
                    v-if="item.category || item.itemType || item.quantityMode"
                    class="mt-1.5 flex flex-wrap gap-x-2 text-[11px] opacity-50"
                  >
                    <span v-if="item.itemType" class="capitalize">{{ item.itemType }}</span>
                    <span v-if="item.category">{{ item.category }}</span>
                    <span v-if="item.quantityMode" class="capitalize">
                      {{ item.quantityMode }} quantity
                    </span>
                  </div>
                  <ul v-if="item.inclusions.length" class="mt-2 space-y-1">
                    <li
                      v-for="(inclusion, index) in item.inclusions"
                      :key="index"
                      class="flex items-start gap-1.5 text-xs opacity-60"
                    >
                      <Check
                        class="mt-0.5 h-3 w-3 shrink-0"
                        :style="{ color: 'var(--p-accent)' }"
                      />
                      <span>{{ inclusion }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </button>
        </template>
      </div>

      <p v-if="stepError" class="mt-4 text-sm text-red-500">{{ stepError }}</p>

      <div class="mt-6 flex gap-2">
        <button
          type="button"
          class="h-11 flex-1 rounded-xl border text-sm font-medium"
          :style="{
            borderColor: 'color-mix(in srgb, var(--p-text) 14%, transparent)',
          }"
          :disabled="submitting"
          @click="currentStep === 0 ? undefined : currentStep--"
          :class="currentStep === 0 ? 'opacity-40 pointer-events-none' : ''"
        >
          Back
        </button>
        <button
          type="button"
          class="h-11 flex-1 rounded-xl text-sm font-medium disabled:opacity-50"
          :style="{ background: 'var(--p-accent)', color: 'var(--p-shell)' }"
          :disabled="submitting"
          @click="onPrimary"
        >
          <span v-if="submitting">Submitting</span>
          <span v-else-if="currentStep === steps.length - 1">Submit</span>
          <span v-else>Continue</span>
        </button>
      </div>

      <PoweredBySesifoto class="mt-auto pt-12" />
    </div>
    <PortalOverlay
      :open="sessionEditorOpen"
      :accent-color="form?.studioBrandColor"
      title-id="lead-session-title"
      description-id="lead-session-description"
      panel-class="max-w-xl"
      @update:open="onSessionEditorOpenChange"
    >
      <div class="border-b border-white/10 px-6 pb-4 pr-14 pt-5">
        <h2 id="lead-session-title" class="text-lg font-semibold">
          {{ editingSessionIndex === null ? "Add session" : "Edit session" }}
        </h2>
        <p id="lead-session-description" class="mt-1 text-sm text-white/55">
          Set date, time, and venue for this session.
        </p>
      </div>

      <div class="max-h-[70dvh] space-y-5 overflow-y-auto px-6 py-5">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-white/60">Type</span>
            <LeadFormSelectField
              v-model="sessionDraft.type"
              :options="sessionTypeOptions"
              placeholder="Select type"
              class="session-control"
            />
          </label>
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-white/60">Date</span>
            <LeadFormDateField
              v-model="sessionDraft.date"
              placeholder="Pick date"
              :invalid="!!sessionDraftErrors.date"
              class="session-control"
            />
            <span v-if="sessionDraftErrors.date" class="field-error">
              {{ sessionDraftErrors.date }}
            </span>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-white/60">Start</span>
            <LeadFormSelectField
              v-model="sessionDraft.startTime"
              :options="startTimeOptions"
              placeholder="Time"
              :invalid="!!sessionDraftErrors.startTime"
              class="session-control"
            />
            <span v-if="sessionDraftErrors.startTime" class="field-error">
              {{ sessionDraftErrors.startTime }}
            </span>
          </label>
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-white/60">End</span>
            <LeadFormSelectField
              v-model="sessionDraft.endTime"
              :options="endTimeOptions"
              placeholder="Time"
              :invalid="!!sessionDraftErrors.endTime"
              class="session-control"
            />
            <span v-if="sessionDraftErrors.endTime" class="field-error">
              {{ sessionDraftErrors.endTime }}
            </span>
          </label>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-white/60">Venue</span>
            <input
              v-model="sessionDraft.venue"
              type="text"
              class="dialog-field"
              placeholder="e.g. Grand Ballroom"
            />
            <span v-if="sessionDraftErrors.venue" class="field-error">
              {{ sessionDraftErrors.venue }}
            </span>
          </label>
          <label class="block space-y-1.5">
            <span class="text-xs font-medium text-white/60">
              City / state <span class="text-white/35">(optional)</span>
            </span>
            <input
              v-model="sessionDraft.cityState"
              type="text"
              class="dialog-field"
              placeholder="e.g. Kuala Lumpur"
            />
          </label>
        </div>
      </div>

      <div class="flex gap-2 border-t border-white/10 px-6 py-4">
        <button
          type="button"
          class="h-11 flex-1 rounded-xl border border-white/15 text-sm font-medium text-white/75"
          @click="closeSessionEditor"
        >
          Cancel
        </button>
        <button
          type="button"
          class="portal-primary h-11 flex-1 rounded-xl text-sm font-medium"
          @click="saveSession"
        >
          {{ editingSessionIndex === null ? "Add session" : "Save session" }}
        </button>
      </div>
    </PortalOverlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { CalendarDays, Check, Trash2 } from "lucide-vue-next";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import PortalOverlay from "@/components/portal/PortalOverlay.vue";
import PoweredBySesifoto from "@/components/PoweredBySesifoto.vue";
import LeadFormDateField from "@/landing-page-ui/lead-form/LeadFormDateField.vue";
import LeadFormSelectField from "@/landing-page-ui/lead-form/LeadFormSelectField.vue";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  SESSION_TYPE_OPTIONS,
  sessionTypeLabel,
} from "@/lib/session-types";
import {
  fetchPublicLeadDetails,
  submitPublicLeadDetails,
  type PublicLeadDetailsForm,
  type PublicLeadDetailsSession,
} from "@/services/public-lead-details.service";

const route = useRoute();
const loading = ref(true);
const error = ref("");
const form = ref<PublicLeadDetailsForm | null>(null);
const currentStep = ref(0);
const stepError = ref("");
const submitting = ref(false);
const done = ref(false);
const resultQuoteUrl = ref<string | null>(null);

const contactName = ref("");
const contactEmail = ref("");
const contactPhone = ref("");
const serviceInterest = ref("photo_video");
const notes = ref("");
const selectedPackageIds = ref<string[]>([]);
const sessions = ref<PublicLeadDetailsSession[]>([]);
const sessionEditorOpen = ref(false);
const editingSessionIndex = ref<number | null>(null);
const sessionSaveAttempted = ref(false);
const sessionDraft = reactive<PublicLeadDetailsSession>({
  type: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  cityState: "",
});

const sessionTypeOptions = SESSION_TYPE_OPTIONS.map((option) => ({ ...option }));
const timeSlots = Array.from({ length: 36 }, (_, index) => {
  const totalMinutes = 360 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = totalMinutes % 60 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

const steps = [
  { title: "Contact" },
  { title: "Service" },
  { title: "Timeline" },
  { title: "Notes" },
  { title: "Packages" },
];

const serviceOptions = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "photo_video", label: "Photo + Video" },
];

const { themeVars, setAccent } = usePortalTheme({
  accentOverride: () => form.value?.studioBrandColor || undefined,
});

watch(
  () => form.value?.studioBrandColor,
  (color) => {
    if (color) setAccent(color);
  },
);

const token = computed(() => String(route.params.token || ""));

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatPricingUnit(value: string | null) {
  if (!value) return "";
  const labels: Record<string, string> = {
    per_session: "session",
    per_item: "item",
    per_hour: "hour",
    per_day: "day",
    per_album: "album",
    per_person: "person",
  };
  return labels[value] || value.replace(/^per_/, "").replaceAll("_", " ");
}

function togglePackage(id: string) {
  selectedPackageIds.value = selectedPackageIds.value[0] === id ? [] : [id];
}

function createEmptySession(): PublicLeadDetailsSession {
  return {
    type: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    cityState: "",
  };
}

function resetSessionDraft(source?: PublicLeadDetailsSession) {
  Object.assign(sessionDraft, source ? { ...source } : createEmptySession());
  sessionSaveAttempted.value = false;
}

function openAddSession() {
  editingSessionIndex.value = null;
  resetSessionDraft();
  sessionEditorOpen.value = true;
}

function openEditSession(index: number) {
  const selected = sessions.value[index];
  if (!selected) return;
  editingSessionIndex.value = index;
  resetSessionDraft(selected);
  sessionEditorOpen.value = true;
}

function closeSessionEditor() {
  sessionEditorOpen.value = false;
  editingSessionIndex.value = null;
  sessionSaveAttempted.value = false;
}

function onSessionEditorOpenChange(open: boolean) {
  if (!open) {
    closeSessionEditor();
    return;
  }
  sessionEditorOpen.value = true;
}

function removeSession(index: number) {
  sessions.value = sessions.value.filter((_, itemIndex) => itemIndex !== index);
  if (editingSessionIndex.value === index) closeSessionEditor();
}

function formatSessionDate(value?: string) {
  if (!value) return "Date pending";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime12(value?: string) {
  if (!value) return "";
  const [hoursText, minutes = "00"] = value.split(":");
  const hours = Number(hoursText);
  if (!Number.isFinite(hours)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${suffix}`;
}

function sessionSummary(plannedSession: PublicLeadDetailsSession) {
  const parts = [formatSessionDate(plannedSession.date)];
  if (plannedSession.startTime) {
    parts.push(
      plannedSession.endTime
        ? `${formatTime12(plannedSession.startTime)}–${formatTime12(plannedSession.endTime)}`
        : formatTime12(plannedSession.startTime),
    );
  }
  return parts.join(" · ");
}

const startTimeOptions = computed(() => {
  const slots = sessionDraft.endTime
    ? timeSlots.filter((time) => time < sessionDraft.endTime!)
    : timeSlots.slice(0, -1);
  const available = slots.length ? slots : timeSlots.slice(0, -1);
  return available.map((value) => ({ value, label: formatTime12(value) }));
});

const endTimeOptions = computed(() => {
  const available = !sessionDraft.startTime
    ? timeSlots
    : timeSlots.filter((time) => time > sessionDraft.startTime!);
  return available.map((value) => ({ value, label: formatTime12(value) }));
});

const sessionDraftErrors = computed(() => {
  if (!sessionSaveAttempted.value) {
    return { date: "", startTime: "", endTime: "", venue: "" };
  }
  return {
    date: sessionDraft.date ? "" : "Date is required",
    startTime: !sessionDraft.startTime
      ? "Start time is required"
      : sessionDraft.endTime && sessionDraft.startTime >= sessionDraft.endTime
        ? "Start must be before end"
        : "",
    endTime: !sessionDraft.endTime
      ? "End time is required"
      : sessionDraft.startTime && sessionDraft.endTime <= sessionDraft.startTime
        ? "End must be after start"
        : "",
    venue: sessionDraft.venue?.trim() ? "" : "Venue is required",
  };
});

function saveSession() {
  sessionSaveAttempted.value = true;
  if (Object.values(sessionDraftErrors.value).some(Boolean)) return;

  const payload: PublicLeadDetailsSession = {
    type: sessionDraft.type || undefined,
    date: sessionDraft.date,
    startTime: sessionDraft.startTime,
    endTime: sessionDraft.endTime,
    venue: sessionDraft.venue?.trim(),
    cityState: sessionDraft.cityState?.trim() || undefined,
  };

  if (editingSessionIndex.value === null) {
    sessions.value = [...sessions.value, payload];
  } else {
    sessions.value = sessions.value.map((item, index) =>
      index === editingSessionIndex.value ? payload : item,
    );
  }
  closeSessionEditor();
}

function validateStep(): boolean {
  stepError.value = "";
  if (currentStep.value === 0) {
    if (!contactName.value.trim() || !contactEmail.value.trim() || !contactPhone.value.trim()) {
      stepError.value = "Name, email, and phone are required.";
      return false;
    }
  }
  if (currentStep.value === 1 && !serviceInterest.value) {
    stepError.value = "Pick a service.";
    return false;
  }
  if (currentStep.value === 4) {
    if (
      form.value?.autoCreateQuotation &&
      selectedPackageIds.value.length === 0
    ) {
      stepError.value = "Select at least one package.";
      return false;
    }
  }
  return true;
}

async function onPrimary() {
  if (!validateStep()) return;
  if (currentStep.value < steps.length - 1) {
    currentStep.value += 1;
    return;
  }
  await submit();
}

async function submit() {
  if (!token.value || submitting.value) return;
  submitting.value = true;
  stepError.value = "";
  try {
    const result = await submitPublicLeadDetails(token.value, {
      contactName: contactName.value.trim(),
      contactEmail: contactEmail.value.trim(),
      contactPhone: contactPhone.value.trim(),
      serviceInterest: serviceInterest.value,
      notes: notes.value.trim() || undefined,
      sessions: sessions.value,
      packageIds: selectedPackageIds.value,
    });
    resultQuoteUrl.value = result.quotationPublicUrl;
    done.value = true;
  } catch (e: any) {
    stepError.value =
      e?.data?.message || e?.message || "Could not submit details.";
  } finally {
    submitting.value = false;
  }
}

async function load() {
  if (!token.value) {
    error.value = "This link is missing or invalid.";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const data = await fetchPublicLeadDetails(token.value);
    form.value = data;
    if (data.studioBrandColor) setAccent(data.studioBrandColor);
    contactName.value = data.contactName || "";
    contactEmail.value = data.contactEmail || "";
    contactPhone.value = data.contactPhone || "";
    serviceInterest.value = data.serviceInterest || "photo_video";
    notes.value = data.notes || "";
    selectedPackageIds.value = [...(data.selectedPackageIds || [])];
    sessions.value = Array.isArray(data.sessions)
      ? data.sessions.map((plannedSession) => ({ ...plannedSession }))
      : [];
  } catch (e: any) {
    error.value =
      e?.data?.message || e?.message || "Unable to load this form.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--p-text) 14%, transparent);
  background: color-mix(in srgb, var(--p-text) 4%, transparent);
  padding: 0.7rem 0.9rem;
  font-size: 0.875rem;
  color: var(--p-text);
  outline: none;
}
.field:focus {
  border-color: var(--p-accent);
}
.field-error {
  display: block;
  font-size: 0.75rem;
  color: #ef4444;
}
.dialog-field {
  width: 100%;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: white;
  outline: none;
}
.dialog-field:focus {
  border-color: var(--portal-overlay-accent);
}
.session-control {
  --bg-main: #111412;
  --text-main: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.5);
  --border-color: rgba(255, 255, 255, 0.15);
  --icon-bg: rgba(255, 255, 255, 0.08);
}
</style>
