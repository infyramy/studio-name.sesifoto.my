<template>
  <div
    class="portal-scroll h-dvh overflow-y-auto portal-font transition-colors duration-300"
    :style="[{ background: 'var(--p-shell)', color: 'var(--p-text)' }, themeVars]"
  >
    <div
      v-if="notice"
      class="fixed bottom-6 left-1/2 z-[60] max-w-sm -translate-x-1/2 rounded-md border px-4 py-2 text-center text-xs shadow-lg"
      :style="{
        background: 'var(--p-card, #111)',
        borderColor: 'var(--p-border, rgba(255,255,255,0.12))',
        color: 'var(--p-text, #f2f5f3)',
      }"
      role="status"
    >
      {{ notice }}
    </div>

    <PortalLoadingState v-if="isLoading" label="Loading invoice" />
    <PortalErrorState
      v-else-if="error"
      title="Invoice unavailable"
      :message="error"
      :action-label="termsUrl ? 'Open terms' : ''"
      @action="openTerms"
    />
    <template v-else-if="data">
      <div class="absolute right-4 top-4 z-20 print:hidden">
        <button
          type="button"
          class="portal-icon-btn"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleDark"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>
      </div>
      <PortalInvoiceDetail
        :invoice="invoice"
        :studio-name="data.studio.name"
        :studio-logo-url="data.studio.logoUrl"
        :client-name="data.clientName"
        :hero-url="data.portalHeroUrl"
        :active-checkout="activeCheckout"
        :checkout-key="checkoutKey"
        :is-downloading="isDownloading"
        :is-printing="isPrinting"
        @pay="onPay"
        @download="onDownload"
        @print="onPrint"
        @receipt="onReceipt"
      />
      <PortalInvoiceReceiptDialog
        v-model:open="isReceiptOpen"
        :invoice="invoice"
        :studio-name="data.studio.name"
        :studio-logo-url="data.studio.logoUrl"
        :client-name="data.clientName"
        :accent-color="data.studio.brandColor"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Moon, Sun } from "lucide-vue-next";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalInvoiceDetail from "@/components/portal/PortalInvoiceDetail.vue";
import PortalInvoiceReceiptDialog from "@/components/portal/PortalInvoiceReceiptDialog.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import {
  downloadInvoiceBlob,
  printInvoiceBlob,
  useClientActionInvoicePaymentReturn,
  useInvoicePageChrome,
} from "@/composables/useInvoicePage";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  ClientActionApiError,
  clientActionService,
  type ClientActionPayData,
} from "@/services/client-action.service";
import type { PortalInvoice } from "@/services/portal.service";

const route = useRoute();
const token = computed(() => String(route.query.t || ""));
const invoiceId = computed(() => String(route.query.invoiceId || ""));

const data = ref<ClientActionPayData | null>(null);
const isLoading = ref(true);
const error = ref("");
const termsUrl = ref<string | null>(null);

const {
  notice,
  activeCheckout,
  isDownloading,
  isPrinting,
  isReceiptOpen,
  showNotice,
} = useInvoicePageChrome();

const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme({
  accentOverride: () => data.value?.studio.brandColor,
});

const invoice = computed<PortalInvoice | null>(() => {
  const found = data.value?.invoices.find((inv) => inv.id === invoiceId.value);
  return (found as PortalInvoice | undefined) ?? null;
});

const checkoutKey = computed(() =>
  invoice.value ? `invoice:${invoice.value.id}` : "",
);

const pageReady = computed(
  () => !isLoading.value && !error.value && !!data.value,
);

function openTerms() {
  if (termsUrl.value) window.location.href = termsUrl.value;
}

async function load(options: { quiet?: boolean } = {}) {
  if (!token.value || !invoiceId.value) {
    error.value = "This invoice link is missing or invalid.";
    isLoading.value = false;
    return;
  }
  if (!options.quiet) {
    isLoading.value = true;
    error.value = "";
    termsUrl.value = null;
  }
  try {
    const payload = await clientActionService.getPay(token.value);
    data.value = payload;
    setAccent(payload.studio.brandColor);
    if (!payload.invoices.some((inv) => inv.id === invoiceId.value)) {
      error.value = "Invoice not found for this payment link.";
    } else if (!options.quiet) {
      error.value = "";
    }
  } catch (caught: unknown) {
    if (caught instanceof ClientActionApiError) {
      error.value = caught.message;
      termsUrl.value = caught.termsUrl;
    } else {
      error.value = "Unable to load this invoice.";
    }
  } finally {
    if (!options.quiet) isLoading.value = false;
  }
}

const { handleReturn } = useClientActionInvoicePaymentReturn({
  token,
  enabled: pageReady,
  onRefresh: () => load({ quiet: true }),
  showNotice,
});

async function onPay() {
  if (!invoice.value || !token.value || activeCheckout.value) return;
  activeCheckout.value = checkoutKey.value;
  try {
    const intent = await clientActionService.checkout(token.value, {
      scope: "invoice",
      invoiceId: invoice.value.id,
    });
    if (!intent.checkoutUrl) throw new Error("Checkout unavailable.");
    window.location.assign(intent.checkoutUrl);
  } catch (caught: unknown) {
    showNotice(
      caught instanceof Error ? caught.message : "Unable to start checkout.",
    );
    activeCheckout.value = null;
  }
}

async function fetchPdfBlob() {
  if (!invoice.value || !token.value) return null;
  return clientActionService.getInvoicePdf(token.value, invoice.value.id);
}

async function onDownload() {
  if (!invoice.value || isDownloading.value) return;
  isDownloading.value = true;
  try {
    const blob = await fetchPdfBlob();
    if (!blob) return;
    await downloadInvoiceBlob(blob, invoice.value.number);
    showNotice("Invoice downloaded.");
  } catch (caught: unknown) {
    showNotice(
      caught instanceof Error ? caught.message : "Failed to download invoice.",
    );
  } finally {
    isDownloading.value = false;
  }
}

async function onPrint() {
  if (!invoice.value || isPrinting.value) return;
  isPrinting.value = true;
  try {
    const blob = await fetchPdfBlob();
    if (!blob) return;
    await printInvoiceBlob(blob);
  } catch (caught: unknown) {
    showNotice(
      caught instanceof Error ? caught.message : "Failed to open print preview.",
    );
  } finally {
    isPrinting.value = false;
  }
}

function onReceipt() {
  if (!invoice.value) return;
  const hasPayments =
    invoice.value.paidAmount > 0 || (invoice.value.payments || []).length > 0;
  if (!hasPayments) {
    showNotice("No payment receipt yet.");
    return;
  }
  isReceiptOpen.value = true;
}

onMounted(async () => {
  await load();
  if (pageReady.value) await handleReturn();
});

watch(
  () => [token.value, invoiceId.value, route.query.intentId] as const,
  async ([nextToken, nextInvoiceId], previous) => {
    if (!previous) return;
    const [prevToken, prevInvoiceId] = previous;
    if (nextToken !== prevToken || nextInvoiceId !== prevInvoiceId) {
      await load();
    }
    if (pageReady.value && route.query.intentId) {
      await handleReturn();
    }
  },
);
</script>
