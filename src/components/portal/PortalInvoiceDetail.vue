<template>
  <div class="invoice-page portal-reveal">
    <section
      class="invoice-hero"
      :class="{ 'invoice-hero--fallback': !heroUrl }"
    >
      <img
        v-if="heroUrl"
        :src="heroUrl"
        alt=""
        class="invoice-hero__img"
      />
      <div class="invoice-hero__veil" />
      <div class="invoice-hero__content">
        <div class="invoice-hero__brand">
          <img
            v-if="studioLogoUrl"
            :src="studioLogoUrl"
            :alt="studioName"
            class="invoice-hero__logo"
          />
          <p v-else class="invoice-hero__studio">{{ studioName }}</p>
        </div>
        <h1 class="invoice-hero__title">
          Hi {{ clientFirstName }},
          <template v-if="invoice && invoice.balanceDue > 0">
            Your payment of
            {{ formatMoney(invoice.balanceDue, invoice.currency) }} is due
            <template v-if="invoice.dueDate">
              on {{ formatDateLong(invoice.dueDate) }}
            </template>
            .
          </template>
          <template v-else-if="invoice">
            This invoice is paid in full.
          </template>
        </h1>
      </div>
    </section>

    <main class="invoice-main">
      <div
        v-if="!invoice"
        class="invoice-card text-center"
        :style="cardStyle"
      >
        <p class="text-sm" :style="{ color: 'var(--p-muted)' }">
          Invoice not found.
        </p>
      </div>

      <template v-else>
        <div
          v-if="termsGate?.active"
          class="invoice-card mb-4"
          :style="{
            ...cardStyle,
            borderColor: 'color-mix(in srgb, var(--p-border) 55%, transparent)',
            background: 'color-mix(in srgb, var(--p-accent-bg) 70%, transparent)',
          }"
        >
          <p class="text-sm font-medium">
            {{
              termsGate.requireSignature
                ? "Accept and sign the terms before paying."
                : "Accept the terms before paying."
            }}
          </p>
          <a
            v-if="termsGate.termsUrl"
            :href="termsGate.termsUrl"
            class="mt-4 inline-flex h-11 items-center justify-center px-5 text-xs font-semibold tracking-wide transition hover:opacity-80"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
          >
            Open terms
          </a>
        </div>

        <article class="invoice-card invoice-print-root" :style="cardStyle">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-semibold tracking-tight sm:text-xl">
                  Invoice #{{ invoice.number }}
                </h2>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  :style="statusBadgeStyle"
                >
                  {{ statusLabel }}
                </span>
              </div>
              <p
                v-if="invoice.title"
                class="mt-1 text-sm"
                :style="{ color: 'var(--p-muted)' }"
              >
                {{ invoice.title }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1 print:hidden">
              <button
                type="button"
                class="invoice-icon-btn"
                data-tooltip="Print"
                aria-label="Print invoice"
                :disabled="isPrinting"
                @click="emit('print')"
              >
                <Loader2 v-if="isPrinting" class="h-4 w-4 animate-spin" />
                <Printer v-else class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="invoice-icon-btn"
                data-tooltip="Download"
                aria-label="Download invoice"
                :disabled="isDownloading"
                @click="emit('download')"
              >
                <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
                <Download v-else class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="invoice-icon-btn"
                data-tooltip="Receipt"
                aria-label="View payment receipt"
                :disabled="!hasReceipt"
                @click="emit('receipt')"
              >
                <ReceiptText class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="invoice-meta">
            <div>
              <p class="invoice-meta__label">From</p>
              <p class="invoice-meta__value">{{ studioName }}</p>
            </div>
            <div>
              <p class="invoice-meta__label">To</p>
              <p class="invoice-meta__value">
                {{ invoice.clientName || clientName || "—" }}
              </p>
            </div>
            <div>
              <p class="invoice-meta__label">Issue date</p>
              <p class="invoice-meta__value">
                {{
                  invoice.issueDate
                    ? formatDateLong(invoice.issueDate)
                    : "—"
                }}
              </p>
            </div>
            <div>
              <p class="invoice-meta__label">Due date</p>
              <p class="invoice-meta__value">
                {{
                  invoice.dueDate ? formatDateLong(invoice.dueDate) : "—"
                }}
              </p>
            </div>
          </div>

          <button
            v-if="invoice.balanceDue > 0"
            type="button"
            class="invoice-pay print:hidden"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
            :disabled="!!activeCheckout || !!termsGate?.active"
            @click="emit('pay')"
          >
            <Loader2
              v-if="activeCheckout === checkoutKey"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{
              activeCheckout === checkoutKey
                ? "Opening checkout..."
                : "Pay now"
            }}
          </button>
          <div
            v-else
            class="invoice-paid-note print:hidden"
            :style="{
              background: 'color-mix(in srgb, var(--p-accent-bg) 80%, transparent)',
              color: 'var(--p-accent)',
            }"
          >
            Paid in full
          </div>
        </article>

        <article class="invoice-card mt-4" :style="cardStyle">
          <h3 class="text-base font-semibold">Items</h3>

          <div class="invoice-table-wrap mt-5">
            <div class="invoice-table-head">
              <span>Item</span>
              <span class="text-center">Qty</span>
              <span class="text-right">Price</span>
              <span class="text-right">Amount</span>
            </div>

            <div
              v-if="!(invoice.items || []).length"
              class="py-8 text-center text-sm"
              :style="{ color: 'var(--p-muted)' }"
            >
              No line items on this invoice.
            </div>

            <div
              v-for="item in invoice.items || []"
              :key="item.id"
              class="invoice-table-row"
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
                {{ formatMoney(item.unitPrice, invoice.currency) }}
              </p>
              <p class="text-right text-sm font-medium tabular-nums">
                {{ formatMoney(item.amount, invoice.currency) }}
              </p>
            </div>
          </div>

          <div class="invoice-totals">
            <div
              v-if="showBreakdown"
              class="invoice-totals__row"
            >
              <span :style="{ color: 'var(--p-muted)' }">Subtotal</span>
              <span class="tabular-nums">
                {{ formatMoney(invoice.subtotal, invoice.currency) }}
              </span>
            </div>
            <div
              v-if="invoice.discount > 0"
              class="invoice-totals__row"
            >
              <span :style="{ color: 'var(--p-muted)' }">Discount</span>
              <span class="tabular-nums">
                −{{ formatMoney(invoice.discount, invoice.currency) }}
              </span>
            </div>
            <div
              v-if="invoice.tax > 0"
              class="invoice-totals__row"
            >
              <span :style="{ color: 'var(--p-muted)' }">Tax</span>
              <span class="tabular-nums">
                {{ formatMoney(invoice.tax, invoice.currency) }}
              </span>
            </div>
            <div
              v-if="invoice.rounding !== 0"
              class="invoice-totals__row"
            >
              <span :style="{ color: 'var(--p-muted)' }">Rounding</span>
              <span class="tabular-nums">
                {{ formatMoney(invoice.rounding, invoice.currency) }}
              </span>
            </div>
            <div class="invoice-totals__row">
              <span :style="{ color: 'var(--p-muted)' }">Total</span>
              <span class="tabular-nums">
                {{ formatMoney(invoice.total, invoice.currency) }}
              </span>
            </div>
            <div
              v-for="payment in invoice.payments || []"
              :key="payment.id"
              class="invoice-totals__row"
            >
              <span :style="{ color: 'var(--p-muted)' }">
                Payment on {{ formatDateLong(payment.paidAt) }}
              </span>
              <span class="tabular-nums">
                {{ formatMoney(payment.amount, invoice.currency) }}
              </span>
            </div>
            <div
              v-if="!(invoice.payments || []).length && invoice.paidAmount > 0"
              class="invoice-totals__row"
            >
              <span :style="{ color: 'var(--p-muted)' }">Paid</span>
              <span class="tabular-nums">
                {{ formatMoney(invoice.paidAmount, invoice.currency) }}
              </span>
            </div>
            <div class="invoice-totals__due">
              <span>Amount due</span>
              <span class="tabular-nums">
                {{ formatMoney(invoice.balanceDue, invoice.currency) }}
              </span>
            </div>
          </div>
        </article>

        <article
          v-if="invoice.notes"
          class="invoice-card mt-4"
          :style="cardStyle"
        >
          <h3 class="text-base font-semibold">Notes</h3>
          <p
            class="mt-3 whitespace-pre-line text-sm leading-relaxed"
            :style="{ color: 'var(--p-muted)' }"
          >
            {{ invoice.notes }}
          </p>
        </article>

        <p
          class="invoice-powered print:hidden"
          :style="{ color: 'var(--p-muted)' }"
        >
          Powered by Sesifoto
        </p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Download, Loader2, Printer, ReceiptText } from "lucide-vue-next";
import { invoiceStatusLabel } from "@/composables/useInvoicePage";
import type { PortalInvoice } from "@/services/portal.service";

const props = defineProps<{
  invoice: PortalInvoice | null;
  studioName: string;
  studioLogoUrl?: string | null;
  clientName?: string | null;
  heroUrl?: string | null;
  termsGate?: {
    active: boolean;
    requireSignature?: boolean;
    termsUrl?: string | null;
  } | null;
  activeCheckout?: string | null;
  checkoutKey?: string;
  isDownloading?: boolean;
  isPrinting?: boolean;
}>();

const emit = defineEmits<{
  pay: [];
  download: [];
  print: [];
  receipt: [];
}>();

const clientFirstName = computed(() => {
  const name =
    props.invoice?.clientName?.trim()
    || props.clientName?.trim()
    || "there";
  return name.split(/\s+/)[0] || name;
});

const statusLabel = computed(() => invoiceStatusLabel(props.invoice));

const hasReceipt = computed(() => {
  const inv = props.invoice;
  if (!inv) return false;
  return inv.paidAmount > 0 || (inv.payments || []).length > 0;
});

const showBreakdown = computed(() => {
  const inv = props.invoice;
  if (!inv) return false;
  return inv.discount > 0 || inv.tax > 0 || inv.rounding !== 0;
});

const statusBadgeStyle = computed(() => {
  const label = statusLabel.value;
  if (label === "Paid") {
    return {
      background: "color-mix(in srgb, #16a34a 18%, transparent)",
      color: "#16a34a",
    };
  }
  if (label === "Partially paid") {
    return {
      background: "color-mix(in srgb, #3b82f6 16%, transparent)",
      color: "#3b82f6",
    };
  }
  if (label === "Overdue") {
    return {
      background: "color-mix(in srgb, #ef4444 16%, transparent)",
      color: "#ef4444",
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

function formatMoney(value: number, currency: string | null) {
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency || "MYR",
    }).format(value);
  } catch {
    return `RM ${value.toFixed(2)}`;
  }
}
</script>

<style scoped>
.invoice-page {
  min-height: 100%;
}

.invoice-hero {
  position: relative;
  min-height: 240px;
  overflow: hidden;
  color: #fff;
}

.invoice-hero--fallback {
  background:
    radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--p-accent, #8b7355) 35%, transparent), transparent 55%),
    linear-gradient(160deg, #1a1a1a 0%, #2c2c2c 48%, #151515 100%);
}

.invoice-hero__img {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.invoice-hero__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.72)),
    rgba(0, 0, 0, 0.25);
}

.invoice-hero--fallback .invoice-hero__veil {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55));
}

.invoice-hero__content {
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

.invoice-hero__brand {
  margin-bottom: 1.5rem;
}

.invoice-hero__logo {
  height: 3rem;
  width: auto;
  max-width: 10rem;
  object-fit: contain;
}

.invoice-hero__studio {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.invoice-hero__title {
  max-width: 28rem;
  font-family: "Cormorant Garamond", serif;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 500;
  line-height: 1.25;
}

.invoice-main {
  position: relative;
  z-index: 2;
  margin: -2.5rem auto 0;
  max-width: 42rem;
  padding: 0 1.25rem 3rem;
}

.invoice-card {
  border-radius: 0.75rem;
  border-width: 1px;
  border-style: solid;
  padding: 1.5rem;
  box-shadow: 0 12px 40px -28px rgba(0, 0, 0, 0.45);
}

.invoice-icon-btn {
  position: relative;
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: var(--p-muted);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.invoice-icon-btn:hover {
  background: color-mix(in srgb, var(--p-border) 35%, transparent);
  color: var(--p-text);
}

.invoice-icon-btn:disabled {
  opacity: 0.5;
}

.invoice-icon-btn[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 0.45rem);
  left: 50%;
  z-index: 5;
  padding: 0.3rem 0.55rem;
  border-radius: 0.35rem;
  background: color-mix(in srgb, var(--p-text) 92%, #000);
  color: var(--p-shell);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(2px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.invoice-icon-btn[data-tooltip]:hover::after,
.invoice-icon-btn[data-tooltip]:focus-visible::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (hover: none) {
  .invoice-icon-btn[data-tooltip]::after {
    display: none;
  }
}

.invoice-meta {
  margin-top: 1.75rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem 1rem;
}

@media (min-width: 640px) {
  .invoice-meta {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.invoice-meta__label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--p-muted);
}

.invoice-meta__value {
  margin-top: 0.35rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  word-break: break-word;
}

.invoice-pay {
  margin-top: 1.75rem;
  display: inline-flex;
  height: 3rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  transition: opacity 0.15s ease;
}

.invoice-pay:hover {
  opacity: 0.85;
}

.invoice-pay:disabled {
  pointer-events: none;
  opacity: 0.5;
}

.invoice-paid-note {
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

.invoice-table-wrap {
  overflow-x: auto;
}

.invoice-table-head,
.invoice-table-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 3rem 5.5rem 5.5rem;
  gap: 0.75rem;
  align-items: start;
}

.invoice-table-head {
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
  padding-bottom: 0.65rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--p-muted);
}

.invoice-table-row {
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 30%, transparent);
  padding: 1rem 0;
}

.invoice-totals {
  margin-top: 1.25rem;
  margin-left: auto;
  display: flex;
  width: 100%;
  max-width: 18rem;
  flex-direction: column;
  gap: 0.55rem;
  font-size: 0.875rem;
}

.invoice-totals__row,
.invoice-totals__due {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.invoice-totals__due {
  margin-top: 0.35rem;
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
  font-size: 1rem;
  font-weight: 700;
}

.invoice-powered {
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

@media print {
  .invoice-hero {
    min-height: auto;
    color: #111;
  }

  .invoice-hero__img,
  .invoice-hero__veil {
    display: none;
  }

  .invoice-hero__content {
    padding: 0 0 1rem;
    text-align: left;
    align-items: flex-start;
    color: #111;
  }

  .invoice-hero__title {
    color: #111;
  }

  .invoice-main {
    margin-top: 0;
    max-width: none;
    padding: 0;
  }

  .invoice-card {
    box-shadow: none;
    border-color: #e5e7eb;
  }
}
</style>
