<script setup lang="ts">
import { Loader2, RefreshCw, X } from "lucide-vue-next";
import { useAppUpdate } from "@/composables/useAppUpdate";

const { showBanner, isReloading, reload, dismiss } = useAppUpdate();
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="-translate-y-3 opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="-translate-y-3 opacity-0"
  >
    <div
      v-if="showBanner"
      class="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[10000] flex justify-center px-3 print:hidden"
    >
      <div
        class="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-neutral-900/95 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-lg backdrop-blur"
        role="status"
        aria-live="polite"
      >
        <p class="truncate font-medium">New version available</p>
        <button
          type="button"
          class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-neutral-900 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-70"
          :disabled="isReloading"
          @click="reload"
        >
          <Loader2 v-if="isReloading" class="h-3.5 w-3.5 animate-spin" />
          <RefreshCw v-else class="h-3.5 w-3.5" />
          Reload
        </button>
        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Dismiss"
          :disabled="isReloading"
          @click="dismiss"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
