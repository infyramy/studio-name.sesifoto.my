<template>
  <main v-if="portalData" class="portal-reveal mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
    <section>
      <div class="mb-12 border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; line-height: 1.1;">
          Links
        </h2>
        <div class="mt-4 flex items-center justify-between">
          <p class="text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
            Your published gallery and external delivery links.
          </p>
        </div>
      </div>

      <div class="grid gap-16 lg:grid-cols-2 lg:gap-12">
        <div>
          <div class="mb-6 flex items-end justify-between border-b pb-3" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
            <h3 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem;">Gallery</h3>
            <RouterLink
              v-if="portalData.gallery"
              :to="galleryRoute(portalData.gallery.id)"
              class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition hover:opacity-70"
              :style="{ color: 'var(--p-text)' }"
            >
              Open <ExternalLink class="h-3.5 w-3.5" />
            </RouterLink>
          </div>
          <p
            v-if="!portalData.gallery"
            class="py-4 text-sm tracking-wide"
            :style="{ color: 'var(--p-muted)' }"
          >
            No published client gallery yet.
          </p>
          <RouterLink
            v-else
            :to="galleryRoute(portalData.gallery.id)"
            class="group block"
          >
            <p class="mb-4 text-base font-semibold tracking-wide transition group-hover:opacity-80">{{ portalData.gallery.title }}</p>
            <div v-if="portalData.gallery.preview.length" class="grid grid-cols-3 gap-3">
              <div
                v-for="media in portalData.gallery.preview"
                :key="media.id"
                class="overflow-hidden bg-transparent"
              >
                <img
                  :src="media.url"
                  :alt="media.label || portalData.gallery.title"
                  class="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
            <div
              v-else-if="portalData.gallery.coverUrl"
              class="overflow-hidden bg-transparent"
            >
              <img
                :src="portalData.gallery.coverUrl"
                :alt="portalData.gallery.title"
                class="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </RouterLink>
        </div>

        <div>
          <div class="mb-6 flex items-end justify-between border-b pb-3" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
            <h3 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem;">Delivery</h3>
            <span class="text-[10px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
              {{ portalData.deliveryLinks.length }} links
            </span>
          </div>
          <p
            v-if="!portalData.deliveryLinks.length"
            class="py-4 text-sm tracking-wide"
            :style="{ color: 'var(--p-muted)' }"
          >
            No delivery links available yet.
          </p>
          <div v-else class="grid gap-6">
            <a
              v-for="link in portalData.deliveryLinks"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-between gap-4 py-2 transition hover:opacity-70"
            >
              <div class="min-w-0">
                <p class="truncate text-base font-semibold tracking-wide">{{ link.name }}</p>
                <p
                  v-if="link.expiresAt"
                  class="mt-1.5 text-xs tracking-wider uppercase"
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
        </div>
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
