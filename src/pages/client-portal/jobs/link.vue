<template>
  <main v-if="portalData" class="portal-reveal mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
    <section>
      <div class="mb-12 border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; line-height: 1.1;">
          Gallery
        </h2>
        <div class="mt-4 flex items-center justify-between gap-4">
          <p class="text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
            Photos shared for your booking.
          </p>
          <span class="shrink-0 text-[10px] tracking-wide" :style="{ color: 'var(--p-muted)' }">
            {{ portalData.galleries.length }}
            {{ portalData.galleries.length === 1 ? "gallery" : "galleries" }}
          </span>
        </div>
      </div>

      <p
        v-if="!portalData.galleries.length"
        class="py-6 text-sm tracking-wide"
        :style="{ color: 'var(--p-muted)' }"
      >
        No published client gallery yet.
      </p>
      <div v-else class="grid gap-8 sm:grid-cols-2">
        <RouterLink
          v-for="gallery in portalData.galleries"
          :key="gallery.id"
          :to="galleryRoute(gallery.id)"
          target="_blank"
          rel="noopener noreferrer"
          class="group block"
        >
          <div
            v-if="gallery.coverUrl"
            class="overflow-hidden"
          >
            <img
              :src="gallery.coverUrl"
              :alt="gallery.title"
              class="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
          <div
            v-else
            class="flex aspect-[4/3] w-full items-center justify-center"
            :style="{ background: 'var(--p-accent-bg)' }"
          >
            <span class="text-sm tracking-wide" :style="{ color: 'var(--p-accent)' }">
              Open gallery
            </span>
          </div>
          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="min-w-0 truncate text-base font-semibold tracking-wide transition group-hover:opacity-80">
              {{ gallery.title }}
            </p>
            <span
              class="flex shrink-0 items-center gap-1.5 text-[11px] font-medium tracking-wide transition group-hover:opacity-70"
              :style="{ color: 'var(--p-muted)' }"
            >
              Open <ExternalLink class="h-3.5 w-3.5" />
            </span>
          </div>
        </RouterLink>
      </div>
    </section>

    <section class="mt-20">
      <div class="mb-8 flex items-end justify-between border-b pb-3" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <h3 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem;">
          Link
        </h3>
        <span class="text-[11px] tracking-wide" :style="{ color: 'var(--p-muted)' }">
          {{ portalData.deliveryLinks.length }}
          {{ portalData.deliveryLinks.length === 1 ? "link" : "links" }}
        </span>
      </div>
      <p
        v-if="!portalData.deliveryLinks.length"
        class="py-4 text-sm tracking-wide"
        :style="{ color: 'var(--p-muted)' }"
      >
        No links available yet.
      </p>
      <div v-else class="grid gap-1">
        <a
          v-for="link in portalData.deliveryLinks"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-center justify-between gap-4 border-b py-4 transition hover:opacity-70"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 35%, transparent)' }"
        >
          <div class="min-w-0">
            <p class="truncate text-base font-semibold tracking-wide">{{ link.name }}</p>
            <p
              v-if="link.expiresAt"
              class="mt-1.5 text-xs tracking-wide"
              :style="{ color: 'var(--p-muted)' }"
            >
              Expires {{ formatDate(link.expiresAt) }}
            </p>
          </div>
          <span class="flex h-10 w-10 shrink-0 items-center justify-center transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <ExternalLink class="h-5 w-5" :style="{ color: 'var(--p-accent)' }" />
          </span>
        </a>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ExternalLink } from "lucide-vue-next";
import { useClientPortalJob } from "@/composables/useClientPortalJob";

const { portalData, galleryRoute, formatDate } = useClientPortalJob();
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
