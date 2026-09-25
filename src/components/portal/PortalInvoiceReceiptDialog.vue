<template>
  <PortalOverlay
    :open="open"
    :accent-color="accentColor"
    :show-close="false"
    title-id="portal-receipt-title"
    description-id="portal-receipt-description"
    container-class="!p-4"
    panel-class="max-h-[90dvh] w-full max-w-md overflow-hidden rounded-xl border"
    @update:open="emit('update:open', $event)"
  >
    <header class="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
      <div class="min-w-0 flex-1">
        <h2
          id="portal-receipt-title"
          class="truncate text-sm font-semibold text-white"
        >
          Payment receipt
        </h2>
        <p
          id="portal-receipt-description"
          class="mt-0.5 truncate text-xs text-white/45"
        >
          {{ invoice?.number || "Invoice" }}
        </p>
      </div>
      <button
        type="button"
        class="portal-focus flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-medium text-white/75 transition hover:bg-white/5 hover:text-white"
        @click="printReceipt"
      >
        <Printer class="h-4 w-4" />
        Print
      </button>
      <button
        type="button"
        class="portal-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/65 transition hover:bg-white/5 hover:text-white"
        aria-label="Close receipt"
        @click="emit('update:open', false)"
      >
        <X class="h-4 w-4" />
      </button>
    </header>

    <div class="portal-scroll min-h-0 flex-1 overflow-y-auto bg-white p-5 text-[#111827]">
      <div ref="receiptRoot" class="receipt-sheet">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] font-semibold tracking-wide text-[#9CA3AF]">
              Receipt
            </p>
            <h3 class="mt-1 text-lg font-semibold tracking-tight">
              {{ studioName }}
            </h3>
            <p class="mt-1 text-sm text-[#6B7280]">
              Invoice #{{ invoice?.number || "—" }}
            </p>
          </div>
          <img
            v-if="studioLogoUrl"
            :src="studioLogoUrl"
            :alt="studioName"
            class="h-10 w-auto max-w-[7rem] object-contain"
          />
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-[11px] font-semibold tracking-wide text-[#9CA3AF]">
              Billed to
            </p>
            <p class="mt-1 font-medium">
              {{ invoice?.clientName || clientName || "—" }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-[11px] font-semibold tracking-wide text-[#9CA3AF]">
              Status
            </p>
            <p class="mt-1 font-medium">{{ receiptStatus }}</p>
          </div>
        </div>

        <div class="mt-6 border-t border-[#E5E7EB] pt-4">
          <p class="text-[11px] font-semibold tracking-wide text-[#9CA3AF]">
            Payments
          </p>
          <div
            v-if="!(invoice?.payments || []).length"
            class="py-6 text-center text-sm text-[#6B7280]"
          >
            No payments recorded yet.
          </div>
          <div
            v-for="payment in invoice?.payments || []"
            :key="payment.id"
            class="mt-3 flex items-baseline justify-between gap-3 border-b border-[#F3F4F6] pb-3 text-sm"
          >
            <div class="min-w-0">
              <p class="font-medium">{{ formatDateLong(payment.paidAt) }}</p>
              <p class="mt-0.5 text-xs capitalize text-[#6B7280]">
                {{ formatMethod(payment.method) }}
              </p>
            </div>
            <p class="shrink-0 tabular-nums font-semibold">
              {{ formatMoney(payment.amount, invoice?.currency) }}
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-[#6B7280]">Invoice total</span>
            <span class="tabular-nums">
              {{ formatMoney(invoice?.total || 0, invoice?.currency) }}
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-[#6B7280]">Paid</span>
            <span class="tabular-nums text-[#059669]">
              {{ formatMoney(invoice?.paidAmount || 0, invoice?.currency) }}
            </span>
          </div>
          <div
            class="flex justify-between gap-3 border-t border-[#E5E7EB] pt-3 text-base font-semibold"
          >
            <span>Balance due</span>
            <span class="tabular-nums">
              {{ formatMoney(invoice?.balanceDue || 0, invoice?.currency) }}
            </span>
          </div>
        </div>

        <p class="mt-8 text-center text-[11px] tracking-wide text-[#9CA3AF]">
          Computer-generated receipt · Keep for your records
        </p>
      </div>
    </div>
  </PortalOverlay>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Printer, X } from "lucide-vue-next";
import PortalOverlay from "./PortalOverlay.vue";
import type { PortalInvoice } from "@/services/portal.service";

const props = defineProps<{
  open: boolean;
  invoice: PortalInvoice | null;
  studioName: string;
  studioLogoUrl?: string | null;
  clientName?: string | null;
  accentColor?: string | null;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const receiptRoot = ref<HTMLElement | null>(null);

const receiptStatus = computed(() => {
  const inv = props.invoice;
  if (!inv) return "—";
  if (inv.balanceDue <= 0 || inv.status === "paid") return "Paid in full";
  if (inv.paidAmount > 0) return "Partially paid";
  return "Unpaid";
});

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

function formatMethod(method: string) {
  return (method || "payment").replace(/_/g, " ");
}

function formatMoney(value: number, currency: string | null | undefined) {
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency || "MYR",
    }).format(value);
  } catch {
    return `RM ${value.toFixed(2)}`;
  }
}

function printReceipt() {
  const node = receiptRoot.value;
  if (!node) return;
  const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!win) return;
  win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt · ${props.invoice?.number || "Invoice"}</title>
    <style>
      body { margin: 0; padding: 32px; font-family: "DM Sans", system-ui, sans-serif; color: #111827; }
      .receipt-sheet { max-width: 28rem; margin: 0 auto; }
    </style>
  </head>
  <body>${node.outerHTML}</body>
</html>`);
  win.document.close();
  win.focus();
  window.setTimeout(() => {
    win.print();
  }, 200);
}
</script>
