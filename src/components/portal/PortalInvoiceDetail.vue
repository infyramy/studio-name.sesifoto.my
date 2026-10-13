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
      <button
        type="button"
        class="portal-hero-theme-toggle print:hidden"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDark ? 'Light mode' : 'Dark mode'"
        @click="emit('toggleTheme', $event)"
      >
        <PortalThemeIcon :is-dark="!!isDark" icon-class="h-[1.125rem] w-[1.125rem]" />
      </button>
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
            {{
              formatMoney(
                installmentDue(invoice),
                invoice.currency,
              )
            }}
            is due
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
          <div class="flex items-start justify-between gap-3 sm:gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 class="break-words text-lg font-semibold tracking-tight sm:text-xl">
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
                class="mt-1 break-words text-sm"
                :style="{ color: 'var(--p-muted)' }"
              >
                {{ invoice.title }}
              </p>
            </div>
            <div class="hidden shrink-0 items-center gap-1 sm:flex print:hidden">
              <button
                v-for="action in documentActions"
                :key="action.key"
                type="button"
                class="invoice-icon-btn"
                :data-tooltip="action.label"
                :aria-label="action.ariaLabel"
                :disabled="action.disabled"
                @click="action.run"
              >
                <Loader2 v-if="action.busy" class="h-4 w-4 animate-spin" />
                <component :is="action.icon" v-else class="h-4 w-4" />
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
                : payButtonLabel(invoice)
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

          <div class="invoice-actions sm:hidden print:hidden">
            <button
              v-for="action in documentActions"
              :key="action.key"
              type="button"
              class="invoice-action"
              :aria-label="action.ariaLabel"
              :disabled="action.disabled"
              @click="action.run"
            >
              <Loader2 v-if="action.busy" class="h-4 w-4 animate-spin" />
              <component :is="action.icon" v-else class="h-4 w-4" />
              <span>{{ action.label }}</span>
            </button>
          </div>
        </article>

        <article class="invoice-card mt-4" :style="cardStyle">
          <div class="invoice-lines__head">
            <span>Item</span>
            <span>Amount</span>
          </div>

          <p
            v-if="!lines.length"
            class="invoice-lines__empty"
            :style="{ color: 'var(--p-muted)' }"
          >
            No line items on this invoice.
          </p>

          <ul v-else class="invoice-lines">
            <li v-for="line in lines" :key="line.id" class="invoice-line">
              <p class="invoice-line__name">
                {{ line.name }}
                <span class="invoice-line__qty">
                  × {{ formatQty(line.quantity) }}
                </span>
              </p>
              <p class="invoice-line__amount">
                {{ formatMoney(line.amount, invoice.currency) }}
              </p>
              <div v-if="line.blocks.length" class="invoice-line__detail">
                <template v-for="(block, blockIndex) in line.blocks" :key="blockIndex">
                  <p v-if="block.kind === 'paragraph'" class="whitespace-pre-line">{{ block.text }}</p>
                  <ul v-else class="invoice-line__list">
                    <li
                      v-for="(entry, entryIndex) in block.items"
                      :key="entryIndex"
                      :class="{ 'invoice-line__group': entry.children.length }"
                    >
                      {{ entry.text }}
                      <ul v-if="entry.children.length" class="invoice-line__sublist">
                        <li v-for="(child, childIndex) in entry.children" :key="childIndex">
                          {{ child }}
                        </li>
                      </ul>
                    </li>
                  </ul>
                </template>
              </div>
            </li>
          </ul>

          <dl class="invoice-summary">
            <div class="invoice-summary__row">
              <dt>Subtotal</dt>
              <dd>{{ formatMoney(invoice.subtotal, invoice.currency) }}</dd>
            </div>
            <div v-if="invoice.discount > 0" class="invoice-summary__row">
              <dt>Discount</dt>
              <dd>−{{ formatMoney(invoice.discount, invoice.currency) }}</dd>
            </div>
            <div v-if="invoice.tax > 0" class="invoice-summary__row">
              <dt>Tax</dt>
              <dd>{{ formatMoney(invoice.tax, invoice.currency) }}</dd>
            </div>
            <div v-if="invoice.rounding !== 0" class="invoice-summary__row">
              <dt>Rounding</dt>
              <dd>{{ formatMoney(invoice.rounding, invoice.currency) }}</dd>
            </div>
            <div class="invoice-summary__row invoice-summary__total">
              <dt>Total</dt>
              <dd>{{ formatMoney(invoice.total, invoice.currency) }}</dd>
            </div>
            <div
              v-for="payment in invoice.payments || []"
              :key="payment.id"
              class="invoice-summary__row"
            >
              <dt>Paid {{ formatDateLong(payment.paidAt) }}</dt>
              <dd>−{{ formatMoney(payment.amount, invoice.currency) }}</dd>
            </div>
            <div
              v-if="!(invoice.payments || []).length && invoice.paidAmount > 0"
              class="invoice-summary__row"
            >
              <dt>Paid</dt>
              <dd>−{{ formatMoney(invoice.paidAmount, invoice.currency) }}</dd>
            </div>
            <div class="invoice-summary__row invoice-summary__due">
              <dt>Amount due</dt>
              <dd>{{ formatMoney(invoice.balanceDue, invoice.currency) }}</dd>
            </div>
            <div
              v-if="installmentDue(invoice) < invoice.balanceDue"
              class="invoice-summary__row"
            >
              <dt>Due now</dt>
              <dd>{{ formatMoney(installmentDue(invoice), invoice.currency) }}</dd>
            </div>
          </dl>
        </article>

        <article
          v-if="formattedPaymentTerms"
          class="invoice-card mt-4"
          :style="cardStyle"
        >
          <h3 class="text-base font-semibold">Payment terms</h3>
          <p
            class="mt-3 whitespace-pre-line text-sm leading-relaxed"
            :style="{ color: 'var(--p-muted)' }"
          >
            {{ formattedPaymentTerms }}
          </p>
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

        <PoweredBySesifoto class="mt-10" />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Download, Loader2, Printer, ReceiptText } from "lucide-vue-next";
import PoweredBySesifoto from "@/components/PoweredBySesifoto.vue";
import PortalThemeIcon from "@/components/portal/PortalThemeIcon.vue";
import { invoiceStatusLabel } from "@/composables/useInvoicePage";
import type { PortalInvoice } from "@/services/portal.service";
import { parseInvoiceLine } from "@/utils/invoice-line";

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
  isDark?: boolean;
}>();

const emit = defineEmits<{
  pay: [];
  download: [];
  print: [];
  receipt: [];
  toggleTheme: [event: MouseEvent];
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

const documentActions = computed(() => [
  {
    key: "print",
    label: "Print",
    ariaLabel: "Print invoice",
    icon: Printer,
    busy: !!props.isPrinting,
    disabled: !!props.isPrinting,
    run: () => emit("print"),
  },
  {
    key: "download",
    label: "Download",
    ariaLabel: "Download invoice",
    icon: Download,
    busy: !!props.isDownloading,
    disabled: !!props.isDownloading,
    run: () => emit("download"),
  },
  {
    key: "receipt",
    label: "Receipt",
    ariaLabel: "View payment receipt",
    icon: ReceiptText,
    busy: false,
    disabled: !hasReceipt.value,
    run: () => emit("receipt"),
  },
]);

const lines = computed(() =>
  (props.invoice?.items || []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    amount: item.amount,
    ...parseInvoiceLine(item.description, item.detail),
  })),
);

function installmentDue(invoice: PortalInvoice) {
  const due =
    invoice.amountDueNow != null && invoice.amountDueNow > 0
      ? invoice.amountDueNow
      : invoice.balanceDue;
  return Math.min(invoice.balanceDue, Math.max(0, due));
}

function payButtonLabel(invoice: PortalInvoice) {
  const due = installmentDue(invoice);
  if (due > 0 && due < invoice.balanceDue) {
    return `Pay ${formatMoney(due, invoice.currency)} now`;
  }
  return "Pay now";
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  before_delivery: "Before delivery",
  after_delivery: "After delivery",
  deposit_50: "50% deposit",
  net_7: "Due in 7 days",
  net_14: "Due in 14 days",
  net_30: "Due in 30 days",
  paid_in_full: "Paid in full",
};

const formattedPaymentTerms = computed(() => {
  const raw = props.invoice?.paymentTerms?.trim();
  if (!raw) return "";
  const mapped = PAYMENT_TERMS_LABELS[raw];
  if (mapped) return mapped;
  if (raw === "Paid in full") return raw;
  return raw
    .replace(/\bRM\s*(\d+(?:\.\d+)?)\b/gi, (_, n) =>
      formatMoney(Number(n), props.invoice?.currency || "MYR"),
    )
    .replace(/\s+/g, " ")
    .trim();
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
  padding: 0 1rem 3rem;
}

.invoice-card {
  border-radius: 0.75rem;
  border-width: 1px;
  border-style: solid;
  padding: 1.25rem;
  box-shadow: 0 12px 40px -28px rgba(0, 0, 0, 0.45);
}

@media (min-width: 640px) {
  .invoice-main {
    padding: 0 1.25rem 3rem;
  }

  .invoice-card {
    padding: 1.5rem;
  }
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
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
}

.invoice-meta > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0;
  border-top: 1px solid color-mix(in srgb, var(--p-border) 28%, transparent);
}

.invoice-meta__label {
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--p-muted);
}

.invoice-meta__value {
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  text-align: right;
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .invoice-meta {
    margin-top: 1.75rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.25rem 1rem;
  }

  .invoice-meta > div {
    display: block;
    padding: 0;
    border-top: 0;
  }

  .invoice-meta__label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .invoice-meta__value {
    margin-top: 0.35rem;
    text-align: left;
  }
}

.invoice-pay {
  margin-top: 1.25rem;
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
  margin-top: 1.25rem;
  display: flex;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.08em;
}

@media (min-width: 640px) {
  .invoice-pay,
  .invoice-paid-note {
    margin-top: 1.75rem;
  }
}

.invoice-actions {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.invoice-action {
  display: inline-flex;
  height: 2.75rem;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
  border-radius: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text);
  transition: background-color 0.15s ease;
}

.invoice-action:active {
  background: color-mix(in srgb, var(--p-border) 30%, transparent);
}

.invoice-action:disabled {
  opacity: 0.45;
}

.invoice-lines__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.65rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--p-muted);
}

.invoice-lines,
.invoice-lines__empty {
  border-top: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
}

.invoice-lines__empty {
  padding: 2rem 0;
  text-align: center;
  font-size: 0.875rem;
}

.invoice-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 1rem;
  padding: 1rem 0;
}

.invoice-line + .invoice-line {
  border-top: 1px solid color-mix(in srgb, var(--p-border) 28%, transparent);
}

.invoice-line__name {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.invoice-line__qty {
  margin-left: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--p-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.invoice-line__amount {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.invoice-line__detail {
  grid-column: 1 / -1;
  margin-top: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--p-muted);
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .invoice-line__detail {
    grid-column: 1;
  }
}

.invoice-line__list,
.invoice-line__sublist {
  display: flex;
  flex-direction: column;
}

.invoice-line__list {
  gap: 0.2rem;
}

.invoice-line__list > li,
.invoice-line__sublist > li {
  position: relative;
  padding-left: 0.9rem;
}

.invoice-line__list > li::before {
  content: "";
  position: absolute;
  left: 0.15rem;
  top: calc(0.775em - 0.125rem);
  height: 0.25rem;
  width: 0.25rem;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0.7;
}

.invoice-line__group {
  font-weight: 500;
  color: color-mix(in srgb, var(--p-text) 82%, var(--p-muted));
}

.invoice-line__group + li {
  margin-top: 0.3rem;
}

.invoice-line__sublist {
  margin-top: 0.1rem;
  font-weight: 400;
  color: var(--p-muted);
}

.invoice-line__sublist > li::before {
  content: "";
  position: absolute;
  left: 0.1rem;
  top: 0.775em;
  height: 1px;
  width: 0.4rem;
  background: currentColor;
  opacity: 0.6;
}

.invoice-summary {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
}

@media (min-width: 640px) {
  .invoice-summary {
    margin-left: auto;
    max-width: 20rem;
  }
}

.invoice-summary__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.invoice-summary__row dt {
  min-width: 0;
  color: var(--p-muted);
}

.invoice-summary__row dd {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.invoice-summary__total {
  font-weight: 600;
}

.invoice-summary__total dt {
  color: var(--p-text);
}

.invoice-summary__due {
  margin-top: 0.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid color-mix(in srgb, var(--p-border) 45%, transparent);
  font-size: 1rem;
  font-weight: 700;
}

.invoice-summary__due dt {
  color: var(--p-text);
}

.invoice-summary__due dd {
  font-size: 1.25rem;
  letter-spacing: -0.01em;
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
