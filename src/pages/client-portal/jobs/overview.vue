<template>
  <div v-if="portalData" class="portal-reveal">
    <section class="relative h-[65dvh] min-h-[420px] overflow-hidden">
      <img
        v-if="portalHeroImage"
        :src="portalHeroImage"
        :alt="`${portalData.title} media`"
        loading="eager"
        decoding="async"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/30" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div class="relative mx-auto flex h-full max-w-4xl flex-col justify-end px-5 py-12 text-white sm:px-6">
        <p class="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">
          {{ portalData.title }}
        </p>
        <h1 class="font-medium tracking-tight" style="font-family: 'Cormorant Garamond', serif; font-size: 4rem; line-height: 1.05;">
          {{ portalData.client.name }}
        </h1>
        <div class="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-xs tracking-wide text-white/80">
          <span v-if="portalData.client.phone" class="flex items-center gap-2">
            <Phone class="h-4 w-4" /> {{ portalData.client.phone }}
          </span>
          <span v-if="portalData.client.email" class="flex items-center gap-2">
            <Mail class="h-4 w-4" /> {{ portalData.client.email }}
          </span>
          <span class="flex items-center gap-2">
            <MapPin class="h-4 w-4" />
            {{ primarySession?.venue || "Event details inside" }}
          </span>
        </div>
      </div>
    </section>

    <main class="mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
      <section class="mb-16">
        <h2 class="font-medium tracking-tight" style="font-family: 'Cormorant Garamond', serif; font-size: 2.6rem; line-height: 1.1;">
          Welcome, {{ portalData.client.name }}
        </h2>
        <p class="mt-4 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
          Everything shared with you is available here.
        </p>
      </section>

      <section
        class="mb-16 flex flex-col gap-6 border-y py-8 sm:flex-row sm:items-center sm:justify-between"
        :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
      >
        <div class="flex items-center gap-5">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
          >
            <Clock v-if="portalData.billing.balanceDue > 0" class="h-4 w-4" />
            <Check v-else class="h-4 w-4" />
          </span>
          <div>
            <p class="text-base font-semibold tracking-wide">
              {{
                portalData.billing.balanceDue > 0
                  ? portalData.billing.hasMixedCurrencies
                    ? "Outstanding invoices remain"
                    : `${formatMoney(portalData.billing.balanceDue, portalData.billing.currency)} balance remaining`
                  : "Your event is on track"
              }}
            </p>
            <p class="mt-1.5 text-xs tracking-wider uppercase" :style="{ color: 'var(--p-muted)' }">
              Status: {{ portalData.status.replace(/_/g, " ") }}
            </p>
          </div>
        </div>
        <RouterLink
          :to="{
            name: portalData.billing.balanceDue > 0
              ? 'client-portal-job-payment'
              : 'client-portal-job-overview',
            params: { jobId: currentJobId },
          }"
          class="inline-flex items-center justify-center gap-3 px-6 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase transition hover:opacity-80"
          :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
        >
          {{ portalData.billing.balanceDue > 0 ? "Review payment" : "View progress" }}
          <ArrowRight class="h-3.5 w-3.5" />
        </RouterLink>
      </section>

      <section class="mb-20">
        <div class="mb-10 flex items-end justify-between border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
          <div>
            <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2rem;">Event progress</h2>
          </div>
          <span class="text-[10px] font-semibold uppercase tracking-[0.2em]" :style="{ color: 'var(--p-accent)' }">
            {{ jobSteps.filter((step) => step.done).length }} / {{ jobSteps.length }} complete
          </span>
        </div>
        <ol class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <li
            v-for="step in jobSteps"
            :key="step.label"
            class="relative"
          >
            <div class="mb-4">
              <Check v-if="step.done" class="h-5 w-5" :style="{ color: 'var(--p-accent)' }" />
              <Clock v-else class="h-5 w-5" :style="{ color: 'var(--p-muted)' }" />
            </div>
            <p class="text-[13px] font-semibold tracking-wide" :style="{ color: step.done ? 'var(--p-text)' : 'var(--p-muted)' }">{{ step.label }}</p>
            <p class="mt-2 text-xs leading-relaxed" :style="{ color: 'var(--p-muted)' }">{{ step.note }}</p>
          </li>
        </ol>
      </section>

      <section class="mb-20">
        <div class="mb-10 flex items-end justify-between border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
          <div>
            <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2rem;">Sessions</h2>
          </div>
          <span class="text-[10px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
            {{ portalData.sessions.length }} total
          </span>
        </div>
        <p v-if="!portalData.sessions.length" class="py-6 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
          No sessions scheduled yet.
        </p>
        <div v-else class="grid gap-6">
          <article
            v-for="session in portalData.sessions"
            :key="session.type + session.date"
            class="grid gap-6 sm:grid-cols-[1fr_2fr] items-start"
          >
            <div>
              <p class="text-sm font-semibold capitalize tracking-wide">{{ session.type.replace(/_/g, " ") }}</p>
              <p class="mt-2 text-[10px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-accent)' }">
                {{ session.status }}
              </p>
            </div>
            <div class="grid gap-3 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
              <p class="flex items-center gap-3">
                <CalendarDays class="h-4 w-4" />
                {{ formatDate(session.date) }}
                <span class="mx-2 opacity-30">|</span>
                <Clock class="h-4 w-4" />
                {{ session.startTime || "TBC" }}
              </p>
              <p class="flex items-start gap-3">
                <MapPin class="h-4 w-4 mt-0.5 shrink-0" />
                {{ session.venue || "Venue pending" }}
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div class="mb-10 flex items-end justify-between border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
          <div>
            <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2rem;">Inspiration</h2>
          </div>
          <span class="text-[10px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
            {{ portalData.inspirationImages.length }} images
          </span>
        </div>
        <p
          v-if="!portalData.inspirationImages.length"
          class="py-6 text-sm tracking-wide"
          :style="{ color: 'var(--p-muted)' }"
        >
          No inspiration images shared yet.
        </p>
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <figure
            v-for="image in portalData.inspirationImages"
            :key="image.id"
            class="group overflow-hidden"
          >
            <img
              :src="image.imageUrl"
              :alt="image.label || 'Inspiration image'"
              class="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <figcaption
              v-if="image.label"
              class="mt-3 text-[11px] uppercase tracking-[0.1em]"
              :style="{ color: 'var(--p-muted)' }"
            >
              {{ image.label }}
            </figcaption>
          </figure>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Mail,
  MapPin,
  Phone,
} from "lucide-vue-next";
import { useClientPortalJob } from "@/composables/useClientPortalJob";

const {
  portalData,
  portalHeroImage,
  primarySession,
  jobSteps,
  currentJobId,
  formatDate,
  formatMoney,
} = useClientPortalJob();
</script>

<style scoped>
.portal-reveal {
  animation: portal-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes portal-reveal {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .portal-reveal {
    animation: none;
  }
}
</style>
