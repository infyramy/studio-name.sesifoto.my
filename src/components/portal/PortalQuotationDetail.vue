<template>
  <div class="quote-page portal-reveal">
    <section class="quote-hero quote-hero--fallback">
      <div class="quote-hero__veil" />
      <div class="quote-hero__content">
        <div class="quote-hero__brand">
          <img
            v-if="quote.studio.logoUrl"
            :src="quote.studio.logoUrl"
            :alt="quote.studio.name"
            class="quote-hero__logo"
          />
          <p v-else class="quote-hero__studio">{{ quote.studio.name }}</p>
        </div>
        <h1 class="quote-hero__title">
          Hi {{ clientFirstName }},
          <template v-if="quote.canRespond">
            please review this quotation of {{ money(quote.total) }}.
          </template>
          <template v-else-if="quote.status === 'accepted'">
            this quotation was accepted.
          </template>
          <template v-else-if="quote.status === 'declined'">
            this quotation was declined.
          </template>
          <template v-else-if="quote.status === 'draft'">
            this quotation is still a draft and is not open for response yet.
          </template>
          <template v-else-if="quote.status === 'superseded'">
            this quotation was replaced by a newer quotation.
          </template>
          <template v-else>
            this quotation is closed.
          </template>
        </h1>
      </div>
    </section>

    <main class="quote-main">
      <article class="quote-card" :style="cardStyle">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-lg font-semibold tracking-tight sm:text-xl">
                Quotation #{{ quote.number }}
              </h2>
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                :style="statusBadgeStyle"
              >
                {{ statusLabel }}
              </span>
            </div>
            <p
              v-if="quote.title"
              class="mt-1 text-sm"
              :style="{ color: 'var(--p-muted)' }"
            >
              {{ quote.title }}
            </p>
          </div>
        </div>

        <div class="quote-meta">
          <div>
            <p class="quote-meta__label">From</p>
            <p class="quote-meta__value">{{ quote.studio.name }}</p>
          </div>
          <div>
            <p class="quote-meta__label">To</p>
            <p class="quote-meta__value">{{ quote.clientName || "—" }}</p>
          </div>
          <div>
            <p class="quote-meta__label">Issue date</p>
            <p class="quote-meta__value">
              {{ formatDateLong(quote.issueDate) }}
            </p>
          </div>
          <div>
            <p class="quote-meta__label">Valid until</p>
            <p class="quote-meta__value">
              {{ quote.validUntil ? formatDateLong(quote.validUntil) : "—" }}
            </p>
          </div>
        </div>

        <template v-if="quote.canRespond">
          <button
            type="button"
            class="quote-cta"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
            :disabled="!!acting"
            @click="emit('accept')"
          >
            <Loader2
              v-if="acting === 'accept'"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ acting === "accept" ? "Accepting..." : "Accept quotation" }}
          </button>
          <button
            type="button"
            class="quote-ghost"
            :style="{ color: 'var(--p-muted)' }"
            :disabled="!!acting"
            @click="emit('decline')"
          >
            <Loader2
              v-if="acting === 'decline'"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ acting === "decline" ? "Declining..." : "Decline" }}
          </button>
          <p v-if="actionError" class="quote-error">{{ actionError }}</p>
        </template>
        <div
          v-else
          class="quote-done-note"
          :style="{
            background: 'color-mix(in srgb, var(--p-accent-bg) 80%, transparent)',
            color: 'var(--p-accent)',
          }"
        >
            {{
              quote.status === "accepted"
                ? "Quotation accepted"
                : quote.status === "declined"
                  ? "Quotation declined"
                  : quote.status === "draft"
                    ? "Draft — not sent yet"
                    : quote.status === "superseded"
                      ? "Replaced by newer quotation"
                      : "Quotation closed"
            }}
          </div>
      </article>

      <article class="quote-card mt-4" :style="cardStyle">
        <h3 class="text-base font-semibold">Items</h3>

        <div class="quote-table-wrap mt-5">
          <div class="quote-table-head">
            <span>Item</span>
            <span class="text-center">Qty</span>
            <span class="text-right">Price</span>
            <span class="text-right">Amount</span>
          </div>

          <div
            v-if="!quote.items.length"
            class="py-8 text-center text-sm"
            :style="{ color: 'var(--p-muted)' }"
          >
            No line items on this quotation.
          </div>

          <div
            v-for="item in quote.items"
            :key="item.id"
            class="quote-table-row"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold leading-snug">
                {{ item.description }}
              </p>
              <p
                v-if="item.detail"
                class="mt-1 whitespace-pre-line text-xs leading-relaxed"
                :style="{ color: 'var(--p-muted)' }"
              >
                {{ item.detail }}
              </p>
            </div>
            <p class="text-center text-sm tabular-nums">
              {{ formatQty(item.quantity) }}
            </p>
            <p class="text-right text-sm tabular-nums">
              {{ money(item.unitPrice) }}
            </p>
            <p class="text-right text-sm font-medium tabular-nums">
              {{ money(item.amount) }}
            </p>
          </div>
        </div>

        <div class="quote-totals">
          <div v-if="showBreakdown" class="quote-totals__row">
            <span :style="{ color: 'var(--p-muted)' }">Subtotal</span>
            <span class="tabular-nums">{{ money(quote.subtotal) }}</span>
          </div>
          <div v-if="quote.discount > 0" class="quote-totals__row">
            <span :style="{ color: 'var(--p-muted)' }">Discount</span>
            <span class="tabular-nums">−{{ money(quote.discount) }}</span>
          </div>
          <div v-if="quote.tax > 0" class="quote-totals__row">
            <span :style="{ color: 'var(--p-muted)' }">Tax</span>
            <span class="tabular-nums">{{ money(quote.tax) }}</span>
          </div>
          <div v-if="quote.rounding !== 0" class="quote-totals__row">
            <span :style="{ color: 'var(--p-muted)' }">Rounding</span>
            <span class="tabular-nums">{{ money(quote.rounding) }}</span>
          </div>
          <div class="quote-totals__due">
            <span>Total</span>
            <span class="tabular-nums">{{ money(quote.total) }}</span>
          </div>
        </div>
      </article>

      <article
        v-if="quote.terms"
        class="quote-card mt-4"
        :style="cardStyle"
      >
        <h3 class="text-base font-semibold">Terms</h3>
        <p
          class="mt-3 whitespace-pre-line text-sm leading-relaxed"
          :style="{ color: 'var(--p-muted)' }"
        >
          {{ quote.terms }}
        </p>
      </article>

      <article
        v-if="quote.notes"
        class="quote-card mt-4"
        :style="cardStyle"
      >
        <h3 class="text-base font-semibold">Notes</h3>
        <p
          class="mt-3 whitespace-pre-line text-sm leading-relaxed"
          :style="{ color: 'var(--p-muted)' }"
        >
          {{ quote.notes }}
        </p>
      </article>

      <p class="quote-powered" :style="{ color: 'var(--p-muted)' }">
        Powered by Sesifoto
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";
import type { PublicQuotation } from "@/services/public-quotation.service";

const props = defineProps<{
  quote: PublicQuotation;
  acting?: "accept" | "decline" | null;
  actionError?: string;
}>();

const emit = defineEmits<{
  accept: [];
  decline: [];
}>();

const clientFirstName = computed(() => {
  const name = props.quote.clientName?.trim() || "there";
  return name.split(/\s+/)[0] || name;
});

const statusLabel = computed(() => {
  switch (props.quote.status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "approved":
      return "Approved";
    case "converted":
      return "Converted";
    case "superseded":
      return "Superseded";
    default:
      return props.quote.status;
  }
});

const showBreakdown = computed(
  () =>
    props.quote.discount > 0 ||
    props.quote.tax > 0 ||
    props.quote.rounding !== 0,
);

const statusBadgeStyle = computed(() => {
  const status = props.quote.status;
  if (status === "accepted" || status === "approved" || status === "converted") {
    return {
      background: "color-mix(in srgb, #16a34a 18%, transparent)",
      color: "#16a34a",
    };
  }
  if (status === "declined" || status === "superseded") {
    return {
      background: "color-mix(in srgb, #ef4444 16%, transparent)",
      color: "#ef4444",
    };
  }
  if (status === "sent") {
    return {
      background: "color-mix(in srgb, #3b82f6 16%, transparent)",
      color: "#3b82f6",
    };
  }
  return {
    background: "color-mix(in srgb, var(--p-muted) 18%, transparent)",
    color: "var(--p-muted)",
  };
});

const cardStyle = computed(() => ({
  background: "var(--p-card, var(--p-shell))",
  borderColor: "color-mix(in srgb, var(--p-border) 45%, transparent)",
  color: "var(--p-text)",
}));

function formatDateLong(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function money(value: number) {
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: props.quote.currency || "MYR",
    }).format(value);
  } catch {
    return `RM ${Number(value || 0).toFixed(2)}`;
  }
}
</script>

<style scoped>
.quote-page {
  min-height: 100%;
}

.quote-hero {
  position: relative;
  min-height: 240px;
  overflow: hidden;
  color: #fff;
}

.quote-hero--fallback {
  background:
    radial-gradient(
      ellipse at 30% 20%,
      color-mix(in srgb, var(--p-accent, #8b7355) 35%, transparent),
      transparent 55%
    ),
    linear-gradient(160deg, #1a1a1a 0%, #2c2c2c 48%, #151515 100%);
}

.quote-hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.55)
  );
}

.quote-hero__content {
  position: relative;
  z-index: 1;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  max-width: 42rem;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.25rem 4.5rem;
  text-align: center;
}

.quote-hero__brand {
  margin-bottom: 1.5rem;
}

.quote-hero__logo {
  height: 3rem;
  width: auto;
  max-width: 10rem;
  object-fit: contain;
}

.quote-hero__studio {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.quote-hero__title {
  max-width: 28rem;
  font-family: "Cormorant Garamond", serif;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 500;
  line-height: 1.25;
}

.quote-main {
  position: relative;
  z-index: 2;
  margin: -2.5rem auto 0;
  max-width: 42rem;
  padding: 0 1.25rem 3rem;
}

.quote-card {
  border-radius: 0.75rem;
  border-width: 1px;
  border-style: solid;
  padding: 1.5rem;
  box-shadow: 0 12px 40px -28px rgba(0, 0, 0, 0.45);
}

.quote-meta {
  margin-top: 1.75rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem 1rem;
}

@media (min-width: 640px) {
  .quote-meta {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.quote-meta__label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--p-muted);
}

.quote-meta__value {
  margin-top: 0.35rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  word-break: break-word;
}

.quote-cta {
  margin-top: 1.75rem;
  display: inline-flex;
  height: 3rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.quote-cta:hover:not(:disabled) {
  opacity: 0.85;
}

.quote-cta:disabled {
  pointer-events: none;
  opacity: 0.5;
}

.quote-ghost {
  margin-top: 0.85rem;
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  padding: 0.5rem;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.quote-ghost:hover:not(:disabled) {
  opacity: 0.85;
}

.quote-ghost:disabled {
  pointer-events: none;
  opacity: 0.5;
}

.quote-error {
  margin: 1rem 0 0;
  font-size: 0.85rem;
  color: #c45c5c;
}

.quote-done-note {
  margin-top: 1.75rem;
  display: flex;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.08em;
}

.quote-table-wrap {
  overflow-x: auto;
}

.quote-table-head,
.quote-table-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 3rem 5.5rem 5.5rem;
  gap: 0.75rem;
  align-items: start;
}

.quote-table-head {
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
  padding-bottom: 0.65rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--p-muted);
}

.quote-table-row {
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 30%, transparent);
  padding: 1rem 0;
}

.quote-totals {
  margin-top: 1.25rem;
  margin-left: auto;
  display: flex;
  width: 100%;
  max-width: 18rem;
  flex-direction: column;
  gap: 0.55rem;
  font-size: 0.875rem;
}

.quote-totals__row,
.quote-totals__due {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.quote-totals__due {
  margin-top: 0.35rem;
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
  font-size: 1rem;
  font-weight: 700;
}

.quote-powered {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.65rem;
  letter-spacing: 0.14em;
}

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
