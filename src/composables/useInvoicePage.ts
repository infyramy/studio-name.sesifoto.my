import { computed, onBeforeUnmount, ref, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { clientActionService } from "@/services/client-action.service";
import {
  portalService,
  type PortalInvoice,
  type PortalPaymentIntentStatus,
} from "@/services/portal.service";

const PAYMENT_POLL_INTERVAL_MS = 1500;
const PAYMENT_POLL_TIMEOUT_MS = 45_000;

export function useInvoicePageChrome() {
  const notice = ref("");
  const activeCheckout = ref<string | null>(null);
  const isDownloading = ref(false);
  const isPrinting = ref(false);
  const isReceiptOpen = ref(false);
  let noticeTimer = 0;

  function showNotice(message: string) {
    notice.value = message;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
      notice.value = "";
    }, 3600);
  }

  onBeforeUnmount(() => {
    window.clearTimeout(noticeTimer);
  });

  return {
    notice,
    activeCheckout,
    isDownloading,
    isPrinting,
    isReceiptOpen,
    showNotice,
  };
}

export function invoiceStatusLabel(invoice: PortalInvoice | null | undefined) {
  if (!invoice) return "";
  if (invoice.balanceDue <= 0 || invoice.status === "paid") return "Paid";
  if (invoice.paidAmount > 0) return "Partially paid";
  if (invoice.status === "overdue") return "Overdue";
  if (invoice.dueDate) {
    const due = new Date(invoice.dueDate);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
      return "Overdue";
    }
  }
  return "Unpaid";
}

function useInvoicePaymentReturn(options: {
  enabled: Ref<boolean>;
  contextKey: Ref<string>;
  fetchStatus: (
    intentId: string,
    signal: AbortSignal,
  ) => Promise<PortalPaymentIntentStatus>;
  onRefresh: () => Promise<void>;
  showNotice: (message: string) => void;
}) {
  const route = useRoute();
  const router = useRouter();
  let handledKey: string | null = null;
  let requestId = 0;
  let controller: AbortController | null = null;

  function getIntentId() {
    const value = route.query.intentId;
    const intentId = Array.isArray(value) ? value[0] : value;
    return typeof intentId === "string" && intentId.trim()
      ? intentId.trim()
      : "";
  }

  async function cleanIntentQuery(intentId: string, currentRequestId: number) {
    if (getIntentId() !== intentId || currentRequestId !== requestId) {
      return false;
    }
    const query = { ...route.query };
    delete query.intentId;
    await router.replace({ path: route.path, query, hash: route.hash });
    return getIntentId() === "" && currentRequestId === requestId;
  }

  function wait(delayMs: number, signal: AbortSignal) {
    if (signal.aborted) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      let timer = 0;
      const onAbort = () => {
        window.clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
        resolve(false);
      };
      timer = window.setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve(true);
      }, delayMs);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  async function handleReturn() {
    if (!options.enabled.value) return;
    const intentId = getIntentId();
    const contextKey = options.contextKey.value;
    if (!intentId || !contextKey) return;

    const key = `${contextKey}:${intentId}`;
    if (handledKey === key) return;
    handledKey = key;

    const currentRequestId = ++requestId;
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;

    void cleanIntentQuery(intentId, currentRequestId).catch(() => undefined);

    try {
      const deadline = Date.now() + PAYMENT_POLL_TIMEOUT_MS;
      let status: PortalPaymentIntentStatus | null = null;
      do {
        status = await options.fetchStatus(intentId, signal);
        if (currentRequestId !== requestId || signal.aborted) return;
        if (status !== "pending" || Date.now() >= deadline) break;
        const ok = await wait(
          Math.min(PAYMENT_POLL_INTERVAL_MS, deadline - Date.now()),
          signal,
        );
        if (!ok) return;
      } while (Date.now() < deadline);

      if (currentRequestId !== requestId || signal.aborted) return;

      if (status === "succeeded") {
        options.showNotice("Payment received. Thank you.");
        await options.onRefresh();
      } else if (status === "pending") {
        options.showNotice("Payment is still processing.");
      } else if (status === "cancelled") {
        options.showNotice("Payment was cancelled.");
      } else if (status === "expired") {
        options.showNotice("This checkout has expired.");
      } else if (status) {
        options.showNotice("Payment was not completed.");
      }
    } catch {
      if (currentRequestId === requestId && !signal.aborted) {
        options.showNotice("Unable to confirm payment status.");
      }
    }
  }

  onBeforeUnmount(() => {
    requestId += 1;
    controller?.abort();
    controller = null;
  });

  return { handleReturn, getIntentId };
}

export function usePortalInvoicePaymentReturn(options: {
  jobId: Ref<string>;
  enabled: Ref<boolean>;
  onRefresh: () => Promise<void>;
  showNotice: (message: string) => void;
}) {
  return useInvoicePaymentReturn({
    enabled: options.enabled,
    contextKey: options.jobId,
    fetchStatus: async (intentId, signal) => {
      const intent = await portalService.getPaymentIntent(
        options.jobId.value,
        intentId,
        { signal },
      );
      return intent.status;
    },
    onRefresh: options.onRefresh,
    showNotice: options.showNotice,
  });
}

export function useClientActionInvoicePaymentReturn(options: {
  token: Ref<string>;
  enabled: Ref<boolean>;
  onRefresh: () => Promise<void>;
  showNotice: (message: string) => void;
}) {
  return useInvoicePaymentReturn({
    enabled: computed(() => options.enabled.value && !!options.token.value),
    contextKey: options.token,
    fetchStatus: async (intentId, signal) => {
      const intent = await clientActionService.getPaymentIntent(
        options.token.value,
        intentId,
        { signal },
      );
      return intent.status;
    },
    onRefresh: options.onRefresh,
    showNotice: options.showNotice,
  });
}

export async function downloadInvoiceBlob(blob: Blob, number: string) {
  const safeNumber = number.replace(/[^a-z0-9_-]+/gi, "-");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeNumber || "invoice"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Print the same PDF clients download (not the web layout). */
export function printInvoiceBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    let settled = false;
    const cleanup = () => {
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        iframe.remove();
      }, 60_000);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        error instanceof Error ? error : new Error("Unable to print invoice."),
      );
    };

    const tryPrint = () => {
      try {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) {
          const win = window.open(url, "_blank", "noopener,noreferrer");
          if (!win) {
            fail(new Error("Popup blocked. Allow popups to print."));
            return;
          }
          finish();
          return;
        }
        frameWindow.focus();
        frameWindow.print();
        finish();
      } catch {
        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (!win) {
          fail(new Error("Unable to open print preview."));
          return;
        }
        finish();
      }
    };

    iframe.onload = () => {
      window.setTimeout(tryPrint, 300);
    };
    iframe.onerror = () => fail(new Error("Unable to load invoice for print."));
    document.body.appendChild(iframe);
    iframe.src = url;
  });
}
