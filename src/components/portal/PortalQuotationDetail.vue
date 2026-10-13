<template>
  <div class="quote-page portal-reveal">
    <section class="quote-hero quote-hero--fallback">
      <div class="quote-hero__veil" />
      <button
        type="button"
        class="portal-hero-theme-toggle print:hidden"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDark ? 'Light mode' : 'Dark mode'"
        @click="emit('toggleTheme', $event)"
      >
        <PortalThemeIcon :is-dark="!!isDark" icon-class="h-[1.125rem] w-[1.125rem]" />
      </button>
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
          <template
            v-else-if="
              quote.status === 'accepted' || quote.status === 'converted'
            "
          >
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
          <template v-else> this quotation is closed. </template>
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
          <button
            v-if="termsHtml"
            type="button"
            class="quote-terms-btn shrink-0"
            :style="{
              color: 'var(--p-muted)',
              borderColor:
                'color-mix(in srgb, var(--p-border) 55%, transparent)',
            }"
            @click="termsOpen = true"
          >
            <FileText class="h-3.5 w-3.5" />
            Terms
          </button>
        </div>

        <div class="quote-meta">
          <div>
            <p class="quote-meta__label">From</p>
            <p class="quote-meta__value">{{ quote.studio.name }}</p>
          </div>
          <div>
            <p class="quote-meta__label">Client</p>
            <p class="quote-meta__value">{{ quote.clientName || "—" }}</p>
          </div>
          <div v-if="quote.eventTitle">
            <p class="quote-meta__label">Event</p>
            <p class="quote-meta__value">{{ quote.eventTitle }}</p>
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
            @click="askConfirm('accept')"
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
            @click="askConfirm('decline')"
          >
            <Loader2
              v-if="acting === 'decline'"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ acting === "decline" ? "Declining..." : "Decline" }}
          </button>
          <p v-if="actionError" class="quote-error">{{ actionError }}</p>
        </template>
        <template
          v-else-if="
            quote.status === 'accepted' ||
            quote.status === 'converted' ||
            quote.postAcceptPayUrl
          "
        >
          <div
            class="quote-done-note"
            :style="{
              background:
                'color-mix(in srgb, var(--p-accent-bg) 80%, transparent)',
              color: 'var(--p-accent)',
            }"
          >
            Quotation accepted — thank you!
          </div>
          <a
            v-if="quote.postAcceptPayUrl"
            :href="quote.postAcceptPayUrl"
            class="quote-cta mt-3 inline-flex items-center justify-center"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
          >
            Continue to payment
          </a>
        </template>
        <div
          v-else
          class="quote-done-note"
          :style="{
            background:
              'color-mix(in srgb, var(--p-accent-bg) 80%, transparent)',
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
        <div v-if="quote.pdfUrl" class="quote-doc-actions">
          <a
            :href="quote.pdfUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="quote-ghost"
            :style="{ color: 'var(--p-muted)' }"
          >
            Download quotation
          </a>
          <button
            type="button"
            class="quote-ghost"
            :style="{ color: 'var(--p-muted)' }"
            :disabled="isPrinting"
            @click="printQuotation"
          >
            {{ isPrinting ? "Opening print..." : "Print quotation" }}
          </button>
        </div>
        <p v-if="printError" class="quote-error">{{ printError }}</p>
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
        v-if="scheduleSteps.length"
        class="quote-card mt-4"
        :style="cardStyle"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 class="text-base font-semibold">Payment schedule</h3>
            <p
              v-if="paymentTimingLabel"
              class="mt-1 text-xs"
              :style="{ color: 'var(--p-muted)' }"
            >
              {{ paymentTimingLabel }}
            </p>
          </div>
          <span
            class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            :style="{
              background:
                'color-mix(in srgb, var(--p-accent, #8b7355) 14%, transparent)',
              color: 'var(--p-accent, #8b7355)',
            }"
          >
            {{ scheduleModeLabel }}
          </span>
        </div>

        <ol class="quote-schedule mt-4">
          <li
            v-for="(step, index) in scheduleSteps"
            :key="index"
            class="quote-schedule__step"
            :class="{ 'quote-schedule__step--due': step.emphasis }"
          >
            <div class="quote-schedule__rail" aria-hidden="true">
              <span
                class="quote-schedule__dot"
                :style="
                  step.emphasis
                    ? {
                        background: 'var(--p-accent, #8b7355)',
                        color: '#fff',
                      }
                    : {
                        background:
                          'color-mix(in srgb, var(--p-border) 55%, transparent)',
                        color: 'var(--p-muted)',
                      }
                "
              >
                {{ index + 1 }}
              </span>
              <span
                v-if="index < scheduleSteps.length - 1"
                class="quote-schedule__line"
              />
            </div>
            <div class="quote-schedule__body">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold leading-snug">
                    {{ step.title }}
                  </p>
                  <p
                    v-if="step.caption"
                    class="mt-0.5 text-xs leading-relaxed"
                    :style="{ color: 'var(--p-muted)' }"
                  >
                    {{ step.caption }}
                  </p>
                </div>
                <p class="shrink-0 text-sm font-semibold tabular-nums">
                  {{ money(step.amount) }}
                </p>
              </div>
              <span
                v-if="step.badge"
                class="quote-schedule__badge"
                :style="{
                  background: step.emphasis
                    ? 'color-mix(in srgb, var(--p-accent, #8b7355) 14%, transparent)'
                    : 'color-mix(in srgb, var(--p-muted) 12%, transparent)',
                  color: step.emphasis
                    ? 'var(--p-accent, #8b7355)'
                    : 'var(--p-muted)',
                }"
              >
                {{ step.badge }}
              </span>
            </div>
          </li>
        </ol>
      </article>

      <article v-if="quote.notes" class="quote-card mt-4" :style="cardStyle">
        <h3 class="text-base font-semibold">Notes</h3>
        <p
          class="mt-3 whitespace-pre-line text-sm leading-relaxed"
          :style="{ color: 'var(--p-muted)' }"
        >
          {{ quote.notes }}
        </p>
      </article>

      <PoweredBySesifoto class="mt-10" />
    </main>

    <Teleport to="body">
      <Transition name="quote-sheet">
        <div
          v-if="termsOpen && termsHtml"
          class="quote-sheet portal-font"
          role="presentation"
          :style="sheetStyle"
        >
          <div
            class="quote-sheet__backdrop"
            aria-hidden="true"
            @click="termsOpen = false"
          />
          <aside
            ref="termsPanel"
            class="quote-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-terms-title"
            tabindex="-1"
          >
            <header class="quote-sheet__header">
              <div class="min-w-0 flex-1">
                <h2 id="quote-terms-title" class="quote-sheet__title">
                  Terms &amp; conditions
                </h2>
              </div>
              <button
                v-if="quote.termsPdfUrl"
                type="button"
                class="quote-sheet__download"
                aria-label="Download terms"
                title="Download terms"
                @click="downloadTerms"
              >
                <Download class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="quote-sheet__close"
                aria-label="Close terms"
                @click="termsOpen = false"
              >
                <X class="h-4 w-4" />
              </button>
            </header>
            <div class="quote-sheet__body quote-terms" v-html="termsHtml" />
          </aside>
        </div>
      </Transition>
    </Teleport>

    <PortalOverlay
      :open="!!confirmAction"
      :accent-color="quote.studio?.brandColor"
      :dismissible="!acting"
      title-id="quote-confirm-title"
      description-id="quote-confirm-description"
      panel-class="max-w-md"
      @update:open="onConfirmOpenChange"
    >
      <header class="px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pr-14 sm:pt-6">
        <h2
          id="quote-confirm-title"
          class="text-lg font-semibold tracking-tight text-white"
        >
          {{
            confirmAction === "decline"
              ? "Decline this quotation?"
              : "Accept this quotation?"
          }}
        </h2>
        <p
          id="quote-confirm-description"
          class="mt-1.5 text-sm leading-5 text-white/50"
        >
          <template v-if="confirmAction === 'decline'">
            This tells {{ quote.studio.name }} you are not proceeding with
            quotation #{{ quote.number }}. You can ask them for a new quote
            later if needed.
          </template>
          <template v-else>
            You are agreeing to quotation #{{ quote.number }} for
            {{ money(quote.total) }}. The studio will be notified right away.
          </template>
        </p>
      </header>

      <footer
        class="flex flex-col-reverse gap-2 px-5 pb-5 pt-2 sm:flex-row sm:justify-end sm:px-6 sm:pb-6"
      >
        <button
          type="button"
          class="portal-focus h-10 rounded-xl px-5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          :disabled="!!acting"
          @click="confirmAction = null"
        >
          Cancel
        </button>
        <button
          type="button"
          class="portal-focus inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold transition hover:brightness-105 disabled:opacity-50"
          :class="
            confirmAction === 'decline'
              ? 'bg-red-500/90 text-white'
              : 'portal-primary'
          "
          :disabled="!!acting"
          data-portal-initial-focus
          @click="proceedConfirm"
        >
          <Loader2
            v-if="acting === confirmAction"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{
            acting === confirmAction
              ? confirmAction === "decline"
                ? "Declining..."
                : "Accepting..."
              : confirmAction === "decline"
                ? "Yes, decline"
                : "Yes, accept"
          }}
        </button>
      </footer>
      <p
        v-if="actionError && confirmAction"
        class="px-5 pb-5 text-sm text-red-300 sm:px-6"
      >
        {{ actionError }}
      </p>
    </PortalOverlay>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Download, FileText, Loader2, X } from "lucide-vue-next";
import { marked } from "marked";
import type { PublicQuotation } from "@/services/public-quotation.service";
import { useSanitize } from "@/composables/useSanitize";
import { usePortalTheme } from "@/composables/usePortalTheme";
import { printInvoiceBlob } from "@/composables/useInvoicePage";
import PoweredBySesifoto from "@/components/PoweredBySesifoto.vue";
import PortalThemeIcon from "@/components/portal/PortalThemeIcon.vue";
import PortalOverlay from "./PortalOverlay.vue";

const props = defineProps<{
  quote: PublicQuotation;
  acting?: "accept" | "decline" | null;
  actionError?: string;
  isDark?: boolean;
}>();

const emit = defineEmits<{
  accept: [];
  decline: [];
  toggleTheme: [event: MouseEvent];
}>();

const { sanitize } = useSanitize();
const { themeVars } = usePortalTheme({
  accentOverride: () => props.quote.studio?.brandColor,
});
const termsOpen = ref(false);
const termsPanel = ref<HTMLElement | null>(null);
const confirmAction = ref<"accept" | "decline" | null>(null);
let bodyOverflowBeforeSheet = "";

const sheetStyle = computed(() => ({
  ...themeVars.value,
  color: "var(--p-text)",
}));

function askConfirm(action: "accept" | "decline") {
  if (props.acting) return;
  confirmAction.value = action;
}

function onConfirmOpenChange(open: boolean) {
  if (!open && !props.acting) confirmAction.value = null;
}

function proceedConfirm() {
  if (!confirmAction.value || props.acting) return;
  const action = confirmAction.value;
  emit(action);
}

const isPrinting = ref(false);
const printError = ref("");

async function printQuotation() {
  if (!props.quote.pdfUrl || isPrinting.value) return;
  isPrinting.value = true;
  printError.value = "";
  try {
    const response = await fetch(props.quote.pdfUrl);
    if (!response.ok) throw new Error("Unable to load the quotation PDF.");
    await printInvoiceBlob(await response.blob());
  } catch (caught: unknown) {
    printError.value =
      caught instanceof Error ? caught.message : "Unable to print quotation.";
  } finally {
    isPrinting.value = false;
  }
}

watch(
  () => props.quote.canRespond,
  (canRespond) => {
    if (!canRespond) confirmAction.value = null;
  },
);

type ScheduleStep = {
  title: string;
  caption?: string;
  amount: number;
  badge?: string;
  emphasis?: boolean;
};

const termsHtml = computed(() => {
  const raw = props.quote.terms?.trim();
  if (!raw) return "";
  return sanitize(marked.parse(raw, { async: false, gfm: true, breaks: true }));
});

function downloadTerms() {
  const url = props.quote.termsPdfUrl?.trim();
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function onTermsKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    termsOpen.value = false;
  }
}

watch(termsOpen, (open) => {
  if (typeof document === "undefined") return;
  if (open) {
    bodyOverflowBeforeSheet = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onTermsKeydown);
    void nextTick(() => termsPanel.value?.focus({ preventScroll: true }));
  } else {
    document.removeEventListener("keydown", onTermsKeydown);
    document.body.style.overflow = bodyOverflowBeforeSheet;
    bodyOverflowBeforeSheet = "";
  }
});

onBeforeUnmount(() => {
  if (typeof document === "undefined") return;
  document.removeEventListener("keydown", onTermsKeydown);
  if (termsOpen.value) {
    document.body.style.overflow = bodyOverflowBeforeSheet;
  }
});

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
    props.quote.rounding !== 0 ||
    props.quote.subtotal > 0,
);

const paymentTermsLabels: Record<string, string> = {
  before_delivery: "Pay before delivery / final handover",
  after_delivery: "Pay after delivery / final handover",
  net_7: "Due within 7 days",
  net_14: "Due within 14 days",
  net_30: "Due within 30 days",
};

const paymentTimingLabel = computed(() => {
  const key = props.quote.paymentTerms || "";
  return paymentTermsLabels[key] || "";
});

const scheduleModeLabel = computed(() => {
  switch (props.quote.paymentSchedule) {
    case "deposit":
      return "Deposit + balance";
    case "custom":
      return "Instalments";
    case "full":
      return "Pay in full";
    default:
      return props.quote.paymentTerms ? "Payment terms" : "";
  }
});

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function depositDueNow() {
  const total = Number(props.quote.total) || 0;
  const raw = Number(props.quote.depositValue);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  if (props.quote.depositType === "fixed") {
    return roundMoney(Math.min(raw, total));
  }
  return roundMoney((total * Math.min(raw, 100)) / 100);
}

const scheduleSteps = computed((): ScheduleStep[] => {
  const q = props.quote;
  const total = roundMoney(Number(q.total) || 0);
  const schedule = q.paymentSchedule || (q.paymentTerms ? "full" : "");

  if (schedule === "deposit" && q.depositValue != null) {
    const due = depositDueNow();
    const balance = roundMoney(Math.max(0, total - due));
    const depositCaption =
      q.depositType === "percent"
        ? `${q.depositValue}% of total — pay this first to confirm`
        : "Pay this first to confirm the booking";
    return [
      {
        title: "Deposit due now",
        caption: depositCaption,
        amount: due,
        badge: "Pay first",
        emphasis: true,
      },
      {
        title: "Balance later",
        caption: "Remaining amount after the deposit",
        amount: balance,
        badge: "Later",
      },
    ].filter((step) => step.amount > 0 || total === 0);
  }

  if (schedule === "custom" && q.paymentMilestones?.length) {
    return q.paymentMilestones.map((row, index) => ({
      title: row.label?.trim() || `Payment ${index + 1}`,
      caption:
        index === 0
          ? "First instalment"
          : index === (q.paymentMilestones?.length || 0) - 1
            ? "Final instalment"
            : `Instalment ${index + 1}`,
      amount: Number(row.amount) || 0,
      badge: index === 0 ? "Next" : undefined,
      emphasis: index === 0,
    }));
  }

  if (schedule === "full" || (q.paymentTerms && !q.paymentSchedule)) {
    return [
      {
        title: "Full payment",
        caption: "One payment for the full quotation total",
        amount: total,
        badge: "Single payment",
        emphasis: true,
      },
    ];
  }

  return [];
});

const statusBadgeStyle = computed(() => {
  const status = props.quote.status;
  if (
    status === "accepted" ||
    status === "approved" ||
    status === "converted"
  ) {
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

.quote-doc-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
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

.quote-terms-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  border-width: 1px;
  border-style: solid;
  background: transparent;
  padding: 0.4rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.quote-terms-btn:hover {
  opacity: 0.8;
}

.quote-schedule {
  list-style: none;
  margin: 0;
  padding: 0;
}

.quote-schedule__step {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr);
  gap: 0.75rem;
}

.quote-schedule__step + .quote-schedule__step {
  margin-top: 0.15rem;
}

.quote-schedule__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quote-schedule__dot {
  display: flex;
  height: 1.5rem;
  width: 1.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
}

.quote-schedule__line {
  width: 1px;
  flex: 1;
  min-height: 1.25rem;
  margin: 0.25rem 0;
  background: color-mix(in srgb, var(--p-border) 55%, transparent);
}

.quote-schedule__body {
  min-width: 0;
  padding-bottom: 1.1rem;
}

.quote-schedule__step:last-child .quote-schedule__body {
  padding-bottom: 0;
}

.quote-schedule__badge {
  margin-top: 0.45rem;
  display: inline-flex;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  font-size: 0.65rem;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.quote-sheet {
  position: fixed;
  inset: 0;
  z-index: 320;
  color: var(--p-text, #f2f5f3);
}

.quote-sheet__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.quote-sheet__panel {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  height: 100%;
  width: min(100%, 26rem);
  flex-direction: column;
  background: var(--p-card, #0e1110);
  color: var(--p-text, #f2f5f3);
  border-left: 1px solid var(--p-border, rgba(255, 255, 255, 0.08));
  box-shadow: -18px 0 48px -28px rgba(0, 0, 0, 0.55);
}

.quote-sheet__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--p-border, rgba(255, 255, 255, 0.08));
  padding: 1.25rem 1.25rem 1rem;
  background: var(--p-card, #0e1110);
}

.quote-sheet__eyebrow {
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--p-muted, rgba(255, 255, 255, 0.5));
}

.quote-sheet__title {
  margin-top: 0.25rem;
  font-size: 1.125rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--p-text, #f2f5f3);
}

.quote-sheet__download {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: var(--p-hover, rgba(255, 255, 255, 0.06));
  color: var(--p-muted, rgba(255, 255, 255, 0.5));
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    color 0.15s ease;
}

.quote-sheet__download:hover {
  opacity: 0.85;
  color: var(--p-text, #f2f5f3);
}

.quote-sheet__close {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: var(--p-hover, rgba(255, 255, 255, 0.06));
  color: var(--p-muted, rgba(255, 255, 255, 0.5));
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    color 0.15s ease;
}

.quote-sheet__close:hover {
  opacity: 0.9;
  color: var(--p-text, #f2f5f3);
}

.quote-sheet__body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1.25rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--p-text, #f2f5f3);
  background: var(--p-card, #0e1110);
}

.quote-sheet-enter-active,
.quote-sheet-leave-active {
  transition: opacity 180ms ease;
}

.quote-sheet-enter-active .quote-sheet__panel,
.quote-sheet-leave-active .quote-sheet__panel {
  transition: transform 220ms ease;
}

.quote-sheet-enter-from,
.quote-sheet-leave-to {
  opacity: 0;
}

.quote-sheet-enter-from .quote-sheet__panel,
.quote-sheet-leave-to .quote-sheet__panel {
  transform: translateX(100%);
}

.quote-terms :deep(h1),
.quote-terms :deep(h2),
.quote-terms :deep(h3),
.quote-terms :deep(h4) {
  margin: 1.1rem 0 0.6rem;
  color: var(--p-text, #f2f5f3);
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.35;
}

.quote-terms > :deep(:first-child) {
  margin-top: 0;
}

.quote-terms :deep(h1) {
  font-size: 1.125rem;
}

.quote-terms :deep(p) {
  margin: 0 0 0.85rem;
  color: var(--p-text, #f2f5f3);
}

.quote-terms :deep(ul),
.quote-terms :deep(ol) {
  margin: 0 0 0.85rem;
  padding-left: 1.25rem;
  color: var(--p-text, #f2f5f3);
}

.quote-terms :deep(ul) {
  list-style: disc;
}

.quote-terms :deep(ol) {
  list-style: decimal;
}

.quote-terms :deep(li) {
  margin: 0.3rem 0;
}

.quote-terms :deep(hr) {
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--p-border, #2a2f2c) 70%, transparent);
}

.quote-terms :deep(strong) {
  color: var(--p-text, #f2f5f3);
  font-weight: 650;
}

.quote-terms :deep(a) {
  color: var(--p-accent, #8b7355);
  text-decoration: underline;
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

  .quote-sheet-enter-active,
  .quote-sheet-leave-active,
  .quote-sheet-enter-active .quote-sheet__panel,
  .quote-sheet-leave-active .quote-sheet__panel {
    transition-duration: 1ms;
  }
}
</style>
