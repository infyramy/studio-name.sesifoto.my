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
    />
    <template v-else-if="portalData">
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
        :studio-name="portalData.studio.name"
        :studio-logo-url="portalData.studio.logoUrl"
        :client-name="portalData.client.name"
        :hero-url="heroUrl"
        :terms-gate="termsGate"
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
        :studio-name="portalData.studio.name"
        :studio-logo-url="portalData.studio.logoUrl"
        :client-name="portalData.client.name"
        :accent-color="portalData.accentColor || portalData.studio.brandColor"
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
  useInvoicePageChrome,
  usePortalInvoicePaymentReturn,
} from "@/composables/useInvoicePage";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  PortalApiError,
  portalService,
  type PortalData,
  type PortalInvoice,
} from "@/services/portal.service";

const route = useRoute();
const jobId = computed(() => String(route.params.jobId || ""));
const invoiceId = computed(() => String(route.params.invoiceId || ""));

const portalData = ref<PortalData | null>(null);
const isLoading = ref(true);
const error = ref("");

const {
  notice,
  activeCheckout,
  isDownloading,
  isPrinting,
  isReceiptOpen,
  showNotice,
} = useInvoicePageChrome();

const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme({
  accentOverride: () =>
    portalData.value?.accentColor || portalData.value?.studio.brandColor,
});

const invoice = computed<PortalInvoice | null>(
  () =>
    portalData.value?.invoices.find((inv) => inv.id === invoiceId.value)
    ?? null,
);

const heroUrl = computed(
  () =>
    portalData.value?.portalHeroUrl
    || portalData.value?.galleries?.[0]?.coverUrl
    || portalData.value?.galleries?.[0]?.preview?.[0]?.url
    || portalData.value?.inspirationImages?.[0]?.imageUrl
    || "",
);

const checkoutKey = computed(() =>
  invoice.value ? `invoice:${invoice.value.id}` : "",
);

const termsGate = computed(() => {
  const agreement = portalData.value?.agreement;
  if (!agreement?.requireTerms || agreement.complete) return null;
  return {
    active: true,
    requireSignature: agreement.requireSignature,
    termsUrl: agreement.termsUrl,
  };
});

const pageReady = computed(
  () => !isLoading.value && !error.value && !!portalData.value,
);

async function load(options: { quiet?: boolean } = {}) {
  if (!jobId.value || !invoiceId.value) {
    error.value = "This invoice link is missing or invalid.";
    isLoading.value = false;
    return;
  }
  if (!options.quiet) {
    isLoading.value = true;
    error.value = "";
  }
  try {
    const data = await portalService.getPortalData(jobId.value);
    portalData.value = data;
    setAccent(data.accentColor || data.studio.brandColor);
    if (!data.invoices.some((inv) => inv.id === invoiceId.value)) {
      error.value = "Invoice not found for this booking.";
    } else if (!options.quiet) {
      error.value = "";
    }
  } catch (caught: unknown) {
    if (caught instanceof PortalApiError && caught.status === 401) {
      error.value = "Sign in to the client portal again to view this invoice.";
    } else {
      error.value =
        caught instanceof Error
          ? caught.message
          : "Unable to load this invoice.";
    }
  } finally {
    if (!options.quiet) isLoading.value = false;
  }
}

const { handleReturn } = usePortalInvoicePaymentReturn({
  jobId,
  enabled: pageReady,
  onRefresh: () => load({ quiet: true }),
  showNotice,
});

async function onPay() {
  if (!invoice.value || activeCheckout.value || termsGate.value?.active) return;
  if (termsGate.value?.termsUrl) {
    window.location.assign(termsGate.value.termsUrl);
    return;
  }
  activeCheckout.value = checkoutKey.value;
  try {
    const intent = await portalService.createCheckout(jobId.value, {
      scope: "invoice",
      invoiceId: invoice.value.id,
      returnTo: "portal_invoice",
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
  if (!invoice.value) return null;
  return portalService.getInvoicePdf(jobId.value, invoice.value.id);
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
  () => [jobId.value, invoiceId.value, route.query.intentId] as const,
  async ([nextJobId, nextInvoiceId], previous) => {
    if (!previous) return;
    const [prevJobId, prevInvoiceId] = previous;
    if (nextJobId !== prevJobId || nextInvoiceId !== prevInvoiceId) {
      await load();
    }
    if (pageReady.value && route.query.intentId) {
      await handleReturn();
    }
  },
);
</script>
