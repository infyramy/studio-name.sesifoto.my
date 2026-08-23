<script setup lang="ts">
import { Download, MoreHorizontal, Share } from "lucide-vue-next";
import PortalOverlay from "./PortalOverlay.vue";

defineProps<{
  open: boolean;
  isIosSafari: boolean;
  hasDifferentSavedPortal: boolean;
  accentColor?: string | null;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();
</script>

<template>
  <PortalOverlay
    :open="open"
    :accent-color="accentColor"
    title-id="portal-install-title"
    description-id="portal-install-description"
    panel-class="max-w-md"
    @update:open="emit('update:open', $event)"
  >
    <header class="px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pr-14 sm:pt-6">
      <h2 id="portal-install-title" class="text-lg font-semibold tracking-tight text-white">
        {{
          hasDifferentSavedPortal
            ? "Another portal is saved"
            : isIosSafari
              ? "Save to Home Screen"
              : "Install unavailable"
        }}
      </h2>
      <p id="portal-install-description" class="mt-1.5 text-sm leading-5 text-white/50">
        <template v-if="hasDifferentSavedPortal">
          This device can keep one installed SESIFOTO portal.
        </template>
        <template v-else-if="isIosSafari">
          Add this client portal directly from Safari.
        </template>
        <template v-else>
          Keep using the portal here, or try a current Chrome, Edge, or Safari browser.
        </template>
      </p>
    </header>

    <ol
      v-if="isIosSafari && !hasDifferentSavedPortal"
      class="mx-5 divide-y divide-white/10 rounded-xl border border-white/10 bg-black/20 sm:mx-6"
    >
      <li class="flex items-center gap-3 px-4 py-3.5">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-overlay-accent-soft)] text-[var(--portal-overlay-accent)]">
          <Share class="h-4 w-4" />
        </span>
        <div>
          <strong class="block text-sm font-medium text-white">Tap Share</strong>
          <span class="text-xs text-white/45">Use Safari's Share button.</span>
        </div>
      </li>
      <li class="flex items-center gap-3 px-4 py-3.5">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-overlay-accent-soft)] text-[var(--portal-overlay-accent)]">
          <MoreHorizontal class="h-4 w-4" />
        </span>
        <div>
          <strong class="block text-sm font-medium text-white">Add to Home Screen</strong>
          <span class="text-xs text-white/45">Scroll down if the option is hidden.</span>
        </div>
      </li>
      <li class="flex items-center gap-3 px-4 py-3.5">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--portal-overlay-accent-soft)] text-[var(--portal-overlay-accent)]">
          <Download class="h-4 w-4" />
        </span>
        <div>
          <strong class="block text-sm font-medium text-white">Tap Add</strong>
          <span class="text-xs text-white/45">The portal appears on your Home Screen.</span>
        </div>
      </li>
    </ol>

    <div
      v-else-if="hasDifferentSavedPortal"
      class="mx-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm leading-6 text-white/60 sm:mx-6"
    >
      Remove the existing SESIFOTO app, then clear this site's saved data before installing this portal.
    </div>

    <footer class="flex justify-end px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
      <button
        type="button"
        class="portal-primary portal-focus h-10 rounded-xl px-5 text-sm font-semibold transition hover:brightness-105"
        @click="emit('update:open', false)"
      >
        Done
      </button>
    </footer>
  </PortalOverlay>
</template>
