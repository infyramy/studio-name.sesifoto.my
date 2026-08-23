<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { Download, FileWarning, Loader2, X } from "lucide-vue-next";
import PortalOverlay from "./PortalOverlay.vue";
import {
  portalService,
  type PortalInvoice,
} from "@/services/portal.service";

const props = defineProps<{
  open: boolean;
  jobId: string;
  invoice: PortalInvoice | null;
  accentColor?: string | null;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const pdfUrl = ref("");
const isLoading = ref(false);
const loadError = ref("");
let requestId = 0;
let requestController: AbortController | null = null;

function revokePdfUrl() {
  if (!pdfUrl.value) return;
  URL.revokeObjectURL(pdfUrl.value);
  pdfUrl.value = "";
}

function clearPdf() {
  requestId += 1;
  requestController?.abort();
  requestController = null;
  isLoading.value = false;
  loadError.value = "";
  revokePdfUrl();
}

async function loadPdf() {
  const invoiceId = props.invoice?.id;
  const jobId = props.jobId;
  if (!props.open || !invoiceId || !jobId) return;

  const currentRequestId = ++requestId;
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  revokePdfUrl();
  isLoading.value = true;
  loadError.value = "";

  try {
    const blob = await portalService.getInvoicePdf(jobId, invoiceId, {
      signal: controller.signal,
    });
    if (
      currentRequestId !== requestId
      || controller.signal.aborted
      || !props.open
      || props.jobId !== jobId
      || props.invoice?.id !== invoiceId
    ) {
      return;
    }
    revokePdfUrl();
    pdfUrl.value = URL.createObjectURL(blob);
  } catch (error: unknown) {
    if (currentRequestId !== requestId || controller.signal.aborted) return;
    loadError.value =
      error instanceof Error ? error.message : "Failed to load invoice PDF.";
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false;
      requestController = null;
    }
  }
}

function handleOpenChange(open: boolean) {
  if (!open) clearPdf();
  emit("update:open", open);
}

function downloadPdf() {
  if (!pdfUrl.value || !props.invoice) return;
  const safeNumber = props.invoice.number.replace(/[^a-z0-9_-]+/gi, "-");
  const link = document.createElement("a");
  link.href = pdfUrl.value;
  link.download = `${safeNumber || "invoice"}.pdf`;
  link.click();
}

watch(
  () => [props.open, props.jobId, props.invoice?.id] as const,
  ([open]) => {
    if (open) void loadPdf();
    else clearPdf();
  },
);

onBeforeUnmount(clearPdf);
</script>

<template>
  <PortalOverlay
    :open="open"
    :accent-color="accentColor"
    :show-close="false"
    title-id="portal-invoice-title"
    description-id="portal-invoice-description"
    container-class="!p-0 sm:!p-4"
    panel-class="h-dvh max-w-none rounded-none border-0 sm:h-[90dvh] sm:max-w-6xl sm:rounded-[18px] sm:border"
    @update:open="handleOpenChange"
  >
    <header class="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
      <div class="min-w-0 flex-1">
        <h2 id="portal-invoice-title" class="truncate text-sm font-semibold text-white sm:text-base">
          {{ invoice?.title || "Invoice" }}
        </h2>
        <p id="portal-invoice-description" class="mt-0.5 truncate text-xs text-white/45">
          {{ invoice?.number || "Invoice PDF" }}
        </p>
      </div>
      <button
        type="button"
        :disabled="!pdfUrl || isLoading"
        class="portal-focus flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-medium text-white/75 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        @click="downloadPdf"
      >
        <Download class="h-4 w-4" />
        <span class="hidden sm:inline">Download</span>
      </button>
      <button
        type="button"
        class="portal-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/65 transition hover:bg-white/5 hover:text-white"
        aria-label="Close invoice"
        @click="handleOpenChange(false)"
      >
        <X class="h-4 w-4" />
      </button>
    </header>

    <div class="min-h-0 flex-1 bg-[#090b0a]">
      <div
        v-if="isLoading"
        class="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-center"
      >
        <Loader2
          class="h-7 w-7 animate-spin"
          :style="{ color: 'var(--portal-overlay-accent)' }"
        />
        <p class="text-sm text-white/50">Loading invoice...</p>
      </div>
      <div
        v-else-if="loadError"
        class="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <span class="flex h-11 w-11 items-center justify-center rounded-xl border border-red-300/15 bg-red-300/10 text-red-300">
          <FileWarning class="h-5 w-5" />
        </span>
        <p class="max-w-md text-sm text-red-200/80">{{ loadError }}</p>
        <button
          type="button"
          class="portal-primary portal-focus h-10 rounded-xl px-4 text-sm font-semibold transition hover:brightness-105"
          @click="loadPdf"
        >
          Try again
        </button>
      </div>
      <iframe
        v-else-if="pdfUrl"
        :src="pdfUrl"
        :title="`${invoice?.number || 'Invoice'} PDF`"
        sandbox="allow-downloads"
        class="h-full min-h-72 w-full border-0 bg-white"
      />
    </div>
  </PortalOverlay>
</template>
