<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { KeyRound, Loader2 } from "lucide-vue-next";
import type { LockedGallery } from "@/services/gallery.service";
import {
  deriveAccessiblePortalAccent,
  readablePortalAccentText,
} from "@/utils/portal-color";

const props = defineProps<{
  gallery: LockedGallery;
  loading: boolean;
  error: string;
  portalPath: string;
}>();

const emit = defineEmits<{ submit: [passcode: string] }>();

const passcode = ref("");
const input = ref<HTMLInputElement | null>(null);
const accent = computed(() =>
  deriveAccessiblePortalAccent(props.gallery.accentColor, ["#0B0D0C", "#000000"], 0.16),
);

function submit() {
  if (props.loading || passcode.value.trim().length < 4) return;
  emit("submit", passcode.value.trim());
}

onMounted(() => input.value?.focus());
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-[#070908] px-5 py-10">
    <section class="w-full max-w-sm rounded-[18px] border border-white/15 bg-[#0b0d0c]/95 px-6 py-7 shadow-[0_22px_64px_rgba(0,0,0,0.48)] sm:px-8">
      <img
        v-if="gallery.studio.logoUrl"
        :src="gallery.studio.logoUrl"
        :alt="gallery.studio.name"
        class="mb-5 h-8 w-auto max-w-[140px] object-contain"
      />
      <p class="text-[11px] font-semibold tracking-wide" :style="{ color: accent }">
        {{ gallery.studio.name }}
      </p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight text-white">
        {{ gallery.title }}
      </h1>
      <p class="mt-2 text-sm leading-6 text-white/55">
        This gallery is protected. Enter the passcode shared by your studio.
      </p>

      <form class="mt-6" @submit.prevent="submit">
        <label for="gallery-passcode" class="text-xs font-medium text-white/65">Passcode</label>
        <div class="mt-2 flex h-12 items-center rounded-xl border border-white/15 bg-black/35 px-4">
          <KeyRound class="mr-3 h-4 w-4 shrink-0" :style="{ color: accent }" />
          <input
            id="gallery-passcode"
            ref="input"
            v-model="passcode"
            type="password"
            minlength="4"
            maxlength="100"
            autocomplete="off"
            placeholder="Enter passcode"
            :disabled="loading"
            :aria-invalid="Boolean(error)"
            aria-describedby="gallery-passcode-error"
            class="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-white outline-none placeholder:text-white/25 disabled:opacity-50"
          />
        </div>
        <p
          id="gallery-passcode-error"
          role="status"
          aria-live="polite"
          class="mt-2 min-h-5 text-xs text-red-300"
        >
          {{ error }}
        </p>
        <button
          type="submit"
          :disabled="loading || passcode.trim().length < 4"
          class="mt-3 flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
          :style="{ background: accent, color: readablePortalAccentText(accent) }"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ loading ? "Checking" : "Open gallery" }}
        </button>
      </form>

      <p class="mt-5 text-center text-xs text-white/45">
        Booked with {{ gallery.studio.name }}?
        <RouterLink :to="portalPath" class="font-medium underline underline-offset-2" :style="{ color: accent }">
          Sign in to your client portal
        </RouterLink>
      </p>
    </section>
  </div>
</template>
