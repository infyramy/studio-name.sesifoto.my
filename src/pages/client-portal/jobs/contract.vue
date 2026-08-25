<template>
  <main v-if="portalData" class="portal-reveal mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
    <section>
      <div class="mb-12 border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; line-height: 1.1;">
          Contracts
        </h2>
        <div class="mt-4 flex items-center justify-between">
          <p class="text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
            Documents shared for your booking.
          </p>
          <span class="text-[10px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
            {{ portalData.contracts.length }} files
          </span>
        </div>
      </div>
      <p v-if="!portalData.contracts.length" class="py-6 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
        No contracts available yet.
      </p>
      <div v-else class="grid gap-6">
        <article
          v-for="doc in portalData.contracts"
          :key="doc.id"
          class="flex items-start gap-4 py-2"
        >
          <span
            class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
            :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
          >
            <FileText class="h-4 w-4" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-semibold tracking-wide">{{ doc.title }}</p>
            <p class="mt-1.5 text-xs tracking-wider uppercase" :style="{ color: 'var(--p-muted)' }">
              Updated {{ formatDate(doc.updatedAt) }}
            </p>
          </div>
          <p class="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]" :style="{ color: 'var(--p-text)' }">
            {{ doc.status }}
          </p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { FileText } from "lucide-vue-next";
import { useClientPortalJob } from "@/composables/useClientPortalJob";

const { portalData, formatDate } = useClientPortalJob();
</script>

<style scoped>
.portal-reveal {
  animation: portal-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes portal-reveal {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .portal-reveal { animation: none; }
}
</style>
