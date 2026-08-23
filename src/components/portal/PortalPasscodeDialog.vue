<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { KeyRound, Loader2 } from "lucide-vue-next";
import PortalOverlay from "./PortalOverlay.vue";
import type { PortalAccessGate } from "@/services/portal.service";
import {
  deriveAccessiblePortalAccent,
  portalHexToRgba,
  readablePortalAccentText,
} from "@/utils/portal-color";

type PortalPasscodeSubmit =
  | { mode: "unlock"; passcode: string }
  | { mode: "change"; currentPasscode: string; newPasscode: string };

const props = defineProps<{
  open: boolean;
  mode: "unlock" | "change";
  loading?: boolean;
  gate?: PortalAccessGate | null;
  accentColor?: string | null;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  submit: [payload: PortalPasscodeSubmit];
}>();

const passcode = ref("");
const currentPasscode = ref("");
const newPasscode = ref("");
const confirmPasscode = ref("");
const accessInput = ref<HTMLInputElement | null>(null);
const validationError = ref("");
const validationId = computed(() => `portal-${props.mode}-passcode-validation`);
const titleId = computed(() => `portal-${props.mode}-passcode-title`);
const descriptionId = computed(() => `portal-${props.mode}-passcode-description`);
const modalAccent = computed(() => props.gate?.accentColor ?? props.accentColor);
const gateAccent = computed(() =>
  deriveAccessiblePortalAccent(
    modalAccent.value,
    ["#0B0D0C", "#000000"],
    0.16,
  ),
);
const gateStyle = computed(() => ({
  "--gate-accent": gateAccent.value,
  "--gate-accent-text": readablePortalAccentText(gateAccent.value),
  "--gate-accent-bg": portalHexToRgba(gateAccent.value, 0.16),
  "--gate-accent-ring": portalHexToRgba(gateAccent.value, 0.32),
}));

const canSubmit = computed(() =>
  props.mode === "unlock"
    ? passcode.value.length >= 4
    : currentPasscode.value.length >= 4
      && newPasscode.value.length >= 4
      && confirmPasscode.value.length >= 4,
);

function clearSensitiveFields() {
  passcode.value = "";
  currentPasscode.value = "";
  newPasscode.value = "";
  confirmPasscode.value = "";
  validationError.value = "";
}

function handleOpenChange(open: boolean) {
  if (!open && props.loading) return;
  if (!open) clearSensitiveFields();
  emit("update:open", open);
}

function submit() {
  validationError.value = "";
  if (!canSubmit.value || props.loading) return;

  if (props.mode === "unlock") {
    emit("submit", { mode: "unlock", passcode: passcode.value });
    return;
  }

  if (newPasscode.value !== confirmPasscode.value) {
    validationError.value = "New passcodes do not match.";
    return;
  }
  if (currentPasscode.value === newPasscode.value) {
    validationError.value = "Choose a different new passcode.";
    return;
  }

  emit("submit", {
    mode: "change",
    currentPasscode: currentPasscode.value,
    newPasscode: newPasscode.value,
  });
}

watch(
  () => [props.open, props.mode] as const,
  ([open], previous) => {
    if (!open || open !== previous?.[0]) clearSensitiveFields();
    if (open && props.mode === "unlock") {
      void nextTick(() => accessInput.value?.focus());
    }
  },
);

defineExpose({ clearSensitiveFields });
</script>

<template>
  <PortalOverlay
    v-if="mode === 'unlock'"
    :open="open"
    :dismissible="false"
    :show-close="false"
    :accent-color="modalAccent"
    :title-id="titleId"
    :description-id="descriptionId"
    container-class="!p-0"
    panel-class="min-h-dvh max-w-none rounded-none border-0 bg-[#070908] shadow-none"
    :style="gateStyle"
    @update:open="handleOpenChange"
  >
    <img
      v-if="gate?.heroUrl"
      :src="gate.heroUrl"
      :alt="`${gate.clientName} portal cover`"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-black/70" />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/90"
    />

    <div class="relative flex min-h-dvh w-full items-center justify-center px-5 py-10">
      <section class="w-full max-w-sm rounded-[18px] border border-white/15 bg-[#0b0d0c]/95 px-6 py-7 shadow-[0_22px_64px_rgba(0,0,0,0.48)] backdrop-blur-md sm:px-8">
        <p
          v-if="gate?.clientName"
          class="text-[11px] font-semibold uppercase tracking-[0.22em]"
          :style="{ color: 'var(--gate-accent)' }"
        >
          {{ gate.clientName }}
        </p>
        <h1
          :id="titleId"
          class="text-2xl font-semibold tracking-tight text-white"
          :class="gate?.clientName ? 'mt-2' : ''"
        >
          Enter access code
        </h1>
        <p :id="descriptionId" class="mt-2 text-sm leading-6 text-white/55">
          Use the code shared by your studio.
        </p>

        <form class="mt-6" @submit.prevent="submit">
          <label for="portal-unlock-passcode" class="text-xs font-medium text-white/65">
            Access code
          </label>
          <div class="gate-input mt-2 flex h-12 items-center rounded-xl border border-white/15 bg-black/35 px-4 transition">
            <KeyRound class="mr-3 h-4 w-4 shrink-0" :style="{ color: 'var(--gate-accent)' }" />
            <input
              id="portal-unlock-passcode"
              ref="accessInput"
              v-model="passcode"
              autofocus
              type="password"
              minlength="4"
              maxlength="64"
              autocomplete="current-password"
              placeholder="Enter your code"
              :disabled="loading"
              :aria-invalid="Boolean(validationError)"
              :aria-describedby="validationId"
              class="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-white outline-none placeholder:text-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <p
            :id="validationId"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            class="mt-2 min-h-5 text-xs text-red-300"
          >
            {{ validationError }}
          </p>
          <button
            type="submit"
            :disabled="loading || !canSubmit"
            class="gate-submit mt-3 flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold transition hover:brightness-105 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
            :style="{ background: 'var(--gate-accent)', color: 'var(--gate-accent-text)' }"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? "Checking..." : "Continue" }}
          </button>
        </form>
      </section>
    </div>
  </PortalOverlay>

  <PortalOverlay
    v-else
    :open="open"
    :dismissible="!loading"
    :show-close="!loading"
    :accent-color="accentColor"
    :title-id="titleId"
    :description-id="descriptionId"
    panel-class="max-w-[430px]"
    @update:open="handleOpenChange"
  >
    <header class="border-b border-white/10 px-5 py-5 pr-14 sm:px-6 sm:pr-14">
      <h2 :id="titleId" class="text-lg font-semibold tracking-tight text-white">
        Change portal passcode
      </h2>
      <p :id="descriptionId" class="mt-1 text-sm leading-5 text-white/50">
        This replaces the current portal share link.
      </p>
    </header>

    <form class="px-5 py-5 sm:px-6" @submit.prevent="submit">
      <div class="space-y-4">
        <label class="block text-xs font-medium text-white/70" for="portal-current-passcode">
          Current passcode
          <input
            id="portal-current-passcode"
            v-model="currentPasscode"
            autofocus
            type="password"
            minlength="4"
            maxlength="64"
            autocomplete="current-password"
            :disabled="loading"
            :aria-invalid="Boolean(validationError)"
            :aria-describedby="validationId"
            class="portal-focus mt-2 h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[var(--portal-overlay-accent)] disabled:opacity-50"
          />
        </label>
        <label class="block text-xs font-medium text-white/70" for="portal-new-passcode">
          New passcode
          <input
            id="portal-new-passcode"
            v-model="newPasscode"
            type="password"
            minlength="4"
            maxlength="64"
            autocomplete="new-password"
            :disabled="loading"
            :aria-invalid="Boolean(validationError)"
            :aria-describedby="validationId"
            class="portal-focus mt-2 h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 text-sm text-white outline-none transition focus:border-[var(--portal-overlay-accent)] disabled:opacity-50"
          />
        </label>
        <label class="block text-xs font-medium text-white/70" for="portal-confirm-passcode">
          Confirm new passcode
          <input
            id="portal-confirm-passcode"
            v-model="confirmPasscode"
            type="password"
            minlength="4"
            maxlength="64"
            autocomplete="new-password"
            :disabled="loading"
            :aria-invalid="Boolean(validationError)"
            :aria-describedby="validationId"
            class="portal-focus mt-2 h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 text-sm text-white outline-none transition focus:border-[var(--portal-overlay-accent)] disabled:opacity-50"
          />
        </label>
      </div>

      <p
        :id="validationId"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="mt-3 min-h-5 text-xs text-red-300"
      >
        {{ validationError }}
      </p>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          :disabled="loading"
          class="portal-focus h-10 rounded-xl border border-white/15 px-4 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          @click="handleOpenChange(false)"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="loading || !canSubmit"
          class="portal-primary portal-focus flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ loading ? "Saving..." : "Change passcode" }}
        </button>
      </div>
    </form>
  </PortalOverlay>
</template>

<style scoped>
.gate-input:focus-within {
  border-color: var(--gate-accent);
  box-shadow: 0 0 0 3px var(--gate-accent-ring);
}

.gate-submit:focus-visible {
  box-shadow: 0 0 0 3px var(--gate-accent-ring);
}
</style>
