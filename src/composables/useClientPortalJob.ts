import { computed, inject, onBeforeUnmount, provide, ref, watch, type ComputedRef, type InjectionKey, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  PORTAL_INSTALL_JOB_ID_STORAGE_KEY,
  usePortalInstall,
} from "@/composables/usePortalInstall";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  PortalApiError,
  portalService,
  type CreatePortalCheckoutRequest,
  type PortalData,
  type PortalInvoice,
} from "@/services/portal.service";

export type PortalPasscodeSubmit =
  | { mode: "unlock"; passcode: string }
  | { mode: "change"; currentPasscode: string; newPasscode: string };

export interface ClientPortalJobContext {
  isDark: Ref<boolean>;
  toggleDark: () => void;
  isLoading: Ref<boolean>;
  accessExpired: Ref<boolean>;
  error: Ref<string | null>;
  notice: Ref<string>;
  portalData: Ref<PortalData | null>;
  portalShareUrl: Ref<string>;
  isChangePasscodeOpen: Ref<boolean>;
  isChangingPasscode: Ref<boolean>;
  selectedInvoice: Ref<PortalInvoice | null>;
  isInvoicePdfOpen: Ref<boolean>;
  isInstallHelpOpen: Ref<boolean>;
  hasDifferentSavedPortal: Ref<boolean>;
  activeCheckout: Ref<string | null>;
  actionsOpen: Ref<boolean>;
  actionsMenuEl: Ref<HTMLElement | null>;
  isStandalone: ComputedRef<boolean>;
  isIosSafari: ComputedRef<boolean>;
  paidPercent: ComputedRef<number>;
  primarySession: ComputedRef<PortalData["sessions"][number] | null>;
  currentJobId: ComputedRef<string>;
  portalHeroImage: ComputedRef<string>;
  jobSteps: ComputedRef<Array<{ label: string; note: string; done: boolean }>>;
  studioWhatsApp: ComputedRef<string | null>;
  themeVars: ComputedRef<Record<string, string>>;
  formatDate: (dateStr: string) => string;
  formatMoney: (value: number, currency: string | null) => string;
  galleryRoute: (galleryId: string) => {
    name: string;
    params: { jobId: string; galleryId: string };
    query: import("vue-router").LocationQuery;
  };
  showNotice: (message: string) => void;
  runPortalAction: (action: () => void | Promise<void>) => void;
  openInvoicePdf: (invoice: PortalInvoice) => void;
  handleInvoicePdfOpen: (open: boolean) => void;
  copyPortalLink: () => Promise<void>;
  sharePortal: () => Promise<void>;
  savePortalToHomeScreen: () => Promise<void>;
  startCheckout: (payload: CreatePortalCheckoutRequest) => Promise<void>;
  handlePasscodeSubmit: (payload: PortalPasscodeSubmit) => void;
  reloadPortal: () => void;
  goToJobs: () => void;
  logout: () => Promise<void>;
}

export const CLIENT_PORTAL_JOB_KEY: InjectionKey<ClientPortalJobContext> =
  Symbol("client-portal-job");

export function useClientPortalJobProvide(): ClientPortalJobContext {
  const route = useRoute();
  const router = useRouter();
  const {
    isIosSafari,
    isStandalone,
    canPromptInstall,
    requestInstall,
  } = usePortalInstall();

  const portalData = ref<PortalData | null>(null);
  const {
    isDark,
    themeVars,
    setAccent,
    toggleDark,
  } = usePortalTheme({
    accentOverride: () => portalData.value?.accentColor,
  });

  const isLoading = ref(true);
  const accessExpired = ref(false);
  const error = ref<string | null>(null);
  const notice = ref("");
  const portalShareUrl = ref("");
  const isChangePasscodeOpen = ref(false);
  const isChangingPasscode = ref(false);
  const selectedInvoice = ref<PortalInvoice | null>(null);
  const isInvoicePdfOpen = ref(false);
  const isInstallHelpOpen = ref(false);
  const hasDifferentSavedPortal = ref(false);
  const activeCheckout = ref<string | null>(null);
  const actionsOpen = ref(false);
  const actionsMenuEl = ref<HTMLElement | null>(null);
  let noticeTimer = 0;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatMoney = (value: number, currency: string | null) => {
    if (!currency) {
      return value.toLocaleString("en-MY", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
    try {
      return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${currency} ${value.toLocaleString("en-MY", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  const paidPercent = computed(() => {
    if (!portalData.value) return 0;
    const { totalInvoiced, totalPaid } = portalData.value.billing;
    return totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
  });

  const primarySession = computed(() => portalData.value?.sessions[0] ?? null);
  const currentJobId = computed(() => String(route.params.jobId || ""));
  const galleryRoute = (galleryId: string) => ({
    name: "client-portal-gallery",
    params: { jobId: currentJobId.value, galleryId },
    query: route.query,
  });
  const portalHeroImage = computed(
    () =>
      portalData.value?.portalHeroUrl
      ?? portalData.value?.gallery?.coverUrl
      ?? portalData.value?.gallery?.preview?.[0]?.url
      ?? portalData.value?.inspirationImages?.[0]?.imageUrl
      ?? "",
  );

  const jobSteps = computed(() => {
    const status = portalData.value?.status ?? "";
    const statusOrder = [
      "inquiry",
      "awaiting_booking",
      "booked",
      "planning",
      "confirmed",
      "scheduled",
      "in_production",
      "ready_for_delivery",
      "delivered",
      "completed",
    ];
    const idx = statusOrder.indexOf(status);
    return [
      { label: "Confirmed", note: "Booking secured", done: idx >= 2 },
      { label: "Shoot Completed", note: "Session wrapped", done: idx >= 6 },
      { label: "Editing", note: "Post-production done", done: idx >= 7 },
      { label: "Delivery Ready", note: "Pending final payment", done: idx >= 8 },
    ];
  });

  const studioWhatsApp = computed(() => {
    const phone = portalData.value?.studio.whatsapp;
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/${cleaned}`;
  });

  interface PortalLoadContext {
    generation: number;
    jobId: string;
    controller: AbortController;
  }

  let loadGeneration = 0;
  let loadController: AbortController | null = null;
  let checkoutRequestId = 0;
  let checkoutController: AbortController | null = null;
  let paymentReturnRequestId = 0;
  let paymentReturnController: AbortController | null = null;
  let handledPaymentReturnKey = "";
  const PAYMENT_POLL_INTERVAL_MS = 2_000;
  const PAYMENT_POLL_TIMEOUT_MS = 60_000;

  function showNotice(message: string) {
    notice.value = message;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
      notice.value = "";
    }, 3500);
  }

  function onDocumentPointerDown(event: PointerEvent) {
    if (!actionsOpen.value) return;
    const el = actionsMenuEl.value;
    if (el && event.target instanceof Node && el.contains(event.target)) return;
    actionsOpen.value = false;
  }

  function runPortalAction(action: () => void | Promise<void>) {
    actionsOpen.value = false;
    void action();
  }

  function getPaymentIntentId(): string {
    const value = route.query.intentId;
    const intentId = Array.isArray(value)
      ? String(value[0] || "")
      : String(value || "");
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      intentId,
    )
      ? intentId
      : "";
  }

  function isCurrentLoad(context: PortalLoadContext): boolean {
    return (
      context.generation === loadGeneration
      && !context.controller.signal.aborted
    );
  }

  function getSafeErrorMessage(value: unknown, fallback: string): string {
    if (
      value instanceof PortalApiError
      && !value.code
      && value.status > 0
      && value.message
    ) {
      return value.message;
    }
    return fallback;
  }

  function resetPortalState() {
    checkoutRequestId += 1;
    checkoutController?.abort();
    checkoutController = null;
    paymentReturnRequestId += 1;
    paymentReturnController?.abort();
    paymentReturnController = null;
    handledPaymentReturnKey = "";
    portalData.value = null;
    portalShareUrl.value = "";
    isChangePasscodeOpen.value = false;
    isChangingPasscode.value = false;
    selectedInvoice.value = null;
    isInvoicePdfOpen.value = false;
    isInstallHelpOpen.value = false;
    activeCheckout.value = null;
    actionsOpen.value = false;
    accessExpired.value = false;
    error.value = null;
    isLoading.value = true;
  }

  function markAccessExpired(context: PortalLoadContext) {
    if (!isCurrentLoad(context)) return;
    accessExpired.value = true;
    error.value = null;
    portalData.value = null;
    isLoading.value = false;
    void router.replace({ name: "client-portal-access" });
  }

  function markLoadError(
    context: PortalLoadContext,
    caught: unknown,
    fallback: string,
  ) {
    if (!isCurrentLoad(context)) return;
    error.value = getSafeErrorMessage(caught, fallback);
    accessExpired.value = false;
    portalData.value = null;
    isLoading.value = false;
  }

  function applyPortalData(context: PortalLoadContext, data: PortalData) {
    if (!isCurrentLoad(context)) return;
    if (!portalShareUrl.value) portalShareUrl.value = data.shareUrl;
    data.shareUrl = portalShareUrl.value;
    portalData.value = data;
    setAccent(data.accentColor || data.studio.brandColor);
    accessExpired.value = false;
    error.value = null;
    isLoading.value = false;
    void handlePaymentReturn(context);
  }

  async function fetchPortalData(context: PortalLoadContext) {
    try {
      const data = await portalService.getPortalData(context.jobId, {
        signal: context.controller.signal,
      });
      applyPortalData(context, data);
    } catch (caught: unknown) {
      if (!isCurrentLoad(context)) return;
      if (caught instanceof PortalApiError && caught.status === 401) {
        markAccessExpired(context);
        return;
      }
      markLoadError(context, caught, "Failed to load portal data.");
    }
  }

  function startPortalLoad(jobId: string) {
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    const context: PortalLoadContext = {
      generation: ++loadGeneration,
      jobId,
      controller,
    };
    resetPortalState();

    if (!jobId) {
      error.value = "No job ID provided.";
      isLoading.value = false;
      return;
    }

    void fetchPortalData(context);
  }

  function openInvoicePdf(invoice: PortalInvoice) {
    selectedInvoice.value = invoice;
    isInvoicePdfOpen.value = true;
  }

  function handleInvoicePdfOpen(open: boolean) {
    isInvoicePdfOpen.value = open;
    if (!open) selectedInvoice.value = null;
  }

  async function writePortalLinkToClipboard(): Promise<void> {
    const shareUrl = portalShareUrl.value;
    if (!shareUrl) throw new Error("Portal link is unavailable.");

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return;
      } catch {
        // Fall through
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = shareUrl;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      textArea.remove();
    }
    if (!copied) throw new Error("Portal link could not be copied.");
  }

  async function copyPortalLink() {
    try {
      await writePortalLinkToClipboard();
      showNotice("Portal link copied.");
    } catch {
      showNotice("Unable to copy the portal link.");
    }
  }

  async function sharePortal() {
    const shareUrl = portalShareUrl.value;
    if (!shareUrl) {
      showNotice("Portal link is unavailable.");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: portalData.value?.title ?? "Client portal",
          text: portalData.value
            ? `Open your ${portalData.value.studio.name} client portal.`
            : "Open your client portal.",
          url: shareUrl,
        });
        return;
      } catch (caught: unknown) {
        if (isShareCancellation(caught)) return;
      }
    }

    try {
      await writePortalLinkToClipboard();
      showNotice("Sharing unavailable. Portal link copied.");
    } catch {
      showNotice("Unable to share the portal link.");
    }
  }

  function isShareCancellation(caught: unknown): boolean {
    if (!caught || typeof caught !== "object") return false;
    const err = caught as { name?: unknown; code?: unknown };
    return (
      err.name === "AbortError"
      || err.code === 20
      || err.code === "ABORT_ERR"
    );
  }

  async function savePortalToHomeScreen() {
    const jobId = portalData.value?.jobId;
    if (!jobId) {
      showNotice("Unable to prepare this portal for installation.");
      return;
    }

    if (isStandalone.value) return;

    if (!canPromptInstall.value) {
      if (showDifferentSavedPortalHelp(jobId)) return;
      if (isIosSafari.value && !rememberPortalInstallJob(jobId)) return;
      hasDifferentSavedPortal.value = false;
      isInstallHelpOpen.value = true;
      return;
    }

    if (!rememberPortalInstallJob(jobId)) {
      if (hasDifferentSavedPortal.value) isInstallHelpOpen.value = true;
      return;
    }

    const result = await requestInstall();
    if (result === "accepted") {
      showNotice("Portal added to your device.");
    } else if (result === "dismissed" || result === "unavailable") {
      forgetPortalInstallJob(jobId);
      if (result === "unavailable") isInstallHelpOpen.value = true;
    }
  }

  function rememberPortalInstallJob(jobId: string): boolean {
    try {
      const savedJobId = localStorage.getItem(
        PORTAL_INSTALL_JOB_ID_STORAGE_KEY,
      );
      if (savedJobId && savedJobId !== jobId) {
        hasDifferentSavedPortal.value = true;
        return false;
      }
      localStorage.setItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY, jobId);
      hasDifferentSavedPortal.value = false;
      return true;
    } catch {
      showNotice("Browser storage is blocked. This portal cannot be installed.");
      return false;
    }
  }

  function showDifferentSavedPortalHelp(jobId: string): boolean {
    try {
      const savedJobId = localStorage.getItem(
        PORTAL_INSTALL_JOB_ID_STORAGE_KEY,
      );
      hasDifferentSavedPortal.value = Boolean(
        savedJobId && savedJobId !== jobId,
      );
      if (hasDifferentSavedPortal.value) {
        isInstallHelpOpen.value = true;
      }
      return hasDifferentSavedPortal.value;
    } catch {
      return false;
    }
  }

  function forgetPortalInstallJob(jobId: string) {
    try {
      if (localStorage.getItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY) === jobId) {
        localStorage.removeItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY);
      }
    } catch {
      // best-effort
    }
  }

  async function startCheckout(payload: CreatePortalCheckoutRequest) {
    if (activeCheckout.value || !portalData.value) return;
    if (payload.scope === "all" && !portalData.value.billing.canPayAll) return;
    const jobId = currentJobId.value;
    const generation = loadGeneration;
    const actionKey =
      payload.scope === "all" ? "all" : `invoice:${payload.invoiceId}`;
    const requestId = ++checkoutRequestId;
    checkoutController?.abort();
    const controller = new AbortController();
    checkoutController = controller;
    activeCheckout.value = actionKey;

    try {
      const intent = await portalService.createCheckout(jobId, payload, {
        signal: controller.signal,
      });
      if (
        requestId !== checkoutRequestId
        || controller.signal.aborted
        || generation !== loadGeneration
        || currentJobId.value !== jobId
      ) {
        return;
      }
      if (!intent.checkoutUrl) {
        throw new Error("Checkout is unavailable. Please try again.");
      }
      const checkoutUrl = new URL(intent.checkoutUrl, window.location.origin);
      if (!["http:", "https:"].includes(checkoutUrl.protocol)) {
        throw new Error("Checkout returned an invalid URL.");
      }
      window.location.assign(checkoutUrl.href);
    } catch (caught: unknown) {
      if (
        requestId === checkoutRequestId
        && !controller.signal.aborted
        && generation === loadGeneration
        && currentJobId.value === jobId
      ) {
        showNotice(getSafeErrorMessage(caught, "Unable to start checkout."));
      }
    } finally {
      if (requestId === checkoutRequestId) {
        checkoutController = null;
        activeCheckout.value = null;
      }
    }
  }

  async function cleanPaymentIntentQuery(
    context: PortalLoadContext,
    intentId: string,
    requestId: number,
  ): Promise<boolean> {
    if (
      !isCurrentLoad(context)
      || requestId !== paymentReturnRequestId
      || currentJobId.value !== context.jobId
      || getPaymentIntentId() !== intentId
    ) {
      return false;
    }

    const query = { ...route.query };
    delete query.intentId;
    const failure = await router.replace({
      path: route.path,
      query,
      hash: route.hash,
    });
    if (failure) throw failure;

    return (
      isCurrentLoad(context)
      && requestId === paymentReturnRequestId
      && currentJobId.value === context.jobId
    );
  }

  function waitForPaymentPoll(
    delayMs: number,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (signal.aborted) return Promise.resolve(false);
    return new Promise((resolve) => {
      let timer = 0;
      const handleAbort = () => {
        window.clearTimeout(timer);
        signal.removeEventListener("abort", handleAbort);
        resolve(false);
      };
      timer = window.setTimeout(() => {
        signal.removeEventListener("abort", handleAbort);
        resolve(true);
      }, delayMs);
      signal.addEventListener("abort", handleAbort, { once: true });
    });
  }

  async function handlePaymentReturn(context: PortalLoadContext) {
    const intentId = getPaymentIntentId();
    if (!intentId || !isCurrentLoad(context)) return;
    const returnKey = `${context.jobId}:${intentId}`;
    if (handledPaymentReturnKey === returnKey) return;

    const requestId = ++paymentReturnRequestId;
    paymentReturnController?.abort();
    const controller = new AbortController();
    paymentReturnController = controller;
    handledPaymentReturnKey = returnKey;
    let timedOut = false;
    const timeoutTimer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, PAYMENT_POLL_TIMEOUT_MS);
    const cleanupResult = cleanPaymentIntentQuery(
      context,
      intentId,
      requestId,
    )
      .then((cleaned) => ({ cleaned, failed: false }))
      .catch(() => ({ cleaned: false, failed: true }));
    let intentStatus: Awaited<
      ReturnType<typeof portalService.getPaymentIntent>
    > | null = null;

    try {
      const deadline = Date.now() + PAYMENT_POLL_TIMEOUT_MS;
      do {
        intentStatus = await portalService.getPaymentIntent(
          context.jobId,
          intentId,
          { signal: controller.signal },
        );
        if (
          requestId !== paymentReturnRequestId
          || controller.signal.aborted
          || !isCurrentLoad(context)
        ) {
          return;
        }
        if (intentStatus.status !== "pending" || Date.now() >= deadline) break;
        const shouldContinue = await waitForPaymentPoll(
          Math.min(PAYMENT_POLL_INTERVAL_MS, deadline - Date.now()),
          controller.signal,
        );
        if (!shouldContinue) return;
      } while (Date.now() < deadline);

      if (intentStatus.status === "succeeded") {
        showNotice("Payment received. Thank you.");
        await fetchPortalData(context);
      } else if (intentStatus.status === "pending") {
        showNotice("Payment is still processing.");
      } else if (intentStatus.status === "cancelled") {
        showNotice("Payment was cancelled.");
      } else if (intentStatus.status === "expired") {
        showNotice("This checkout has expired.");
      } else {
        showNotice("Payment was not completed.");
      }
    } catch (caught: unknown) {
      if (
        timedOut
        && requestId === paymentReturnRequestId
        && isCurrentLoad(context)
      ) {
        showNotice("Payment is still processing.");
        return;
      }
      if (
        requestId !== paymentReturnRequestId
        || controller.signal.aborted
        || !isCurrentLoad(context)
      ) {
        return;
      }
      showNotice(
        getSafeErrorMessage(caught, "Unable to confirm payment status."),
      );
    } finally {
      window.clearTimeout(timeoutTimer);
      const cleanup = await cleanupResult;
      if (
        cleanup.failed
        && requestId === paymentReturnRequestId
        && !controller.signal.aborted
        && isCurrentLoad(context)
        && getPaymentIntentId() === intentId
      ) {
        showNotice("Payment checked, but the return URL could not be cleaned.");
      }
      if (requestId === paymentReturnRequestId) {
        paymentReturnController = null;
      }
    }
  }

  async function submitChangedPasscode(
    currentPasscode: string,
    newPasscode: string,
  ) {
    if (isChangingPasscode.value || !loadController) return;
    const context: PortalLoadContext = {
      generation: loadGeneration,
      jobId: currentJobId.value,
      controller: loadController,
    };
    isChangingPasscode.value = true;
    try {
      const response = await portalService.changePasscode(
        context.jobId,
        { currentPasscode, newPasscode },
        { signal: context.controller.signal },
      );
      if (!isCurrentLoad(context)) return;
      portalShareUrl.value = response.shareUrl;
      if (portalData.value) portalData.value.shareUrl = response.shareUrl;
      isChangePasscodeOpen.value = false;
      showNotice("Portal passcode changed.");
    } catch (caught: unknown) {
      if (!isCurrentLoad(context)) return;
      if (
        caught instanceof PortalApiError
        && caught.code === "PORTAL_CURRENT_PASSCODE_INCORRECT"
      ) {
        showNotice("Current passcode is incorrect.");
        return;
      }
      showNotice(
        getSafeErrorMessage(caught, "Failed to change portal passcode."),
      );
    } finally {
      if (isCurrentLoad(context)) isChangingPasscode.value = false;
    }
  }

  function handlePasscodeSubmit(payload: PortalPasscodeSubmit) {
    if (payload.mode === "unlock") return;
    void submitChangedPasscode(payload.currentPasscode, payload.newPasscode);
  }

  function reloadPortal() {
    startPortalLoad(currentJobId.value);
  }

  function goToJobs() {
    void router.push({ name: "client-portal-jobs" });
  }

  async function logout() {
    try {
      await portalService.logout();
    } catch {
      // still leave
    }
    void router.replace({ name: "client-portal-access" });
  }

  watch(actionsOpen, (open) => {
    if (typeof document === "undefined") return;
    if (open) {
      document.addEventListener("pointerdown", onDocumentPointerDown, true);
    } else {
      document.removeEventListener("pointerdown", onDocumentPointerDown, true);
    }
  });

  watch(
    () => String(route.params.jobId || ""),
    (jobId) => {
      startPortalLoad(jobId);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    loadGeneration += 1;
    loadController?.abort();
    loadController = null;
    window.clearTimeout(noticeTimer);
    document.removeEventListener("pointerdown", onDocumentPointerDown, true);
    resetPortalState();
  });

  const ctx: ClientPortalJobContext = {
    isDark,
    toggleDark,
    isLoading,
    accessExpired,
    error,
    notice,
    portalData,
    portalShareUrl,
    isChangePasscodeOpen,
    isChangingPasscode,
    selectedInvoice,
    isInvoicePdfOpen,
    isInstallHelpOpen,
    hasDifferentSavedPortal,
    activeCheckout,
    actionsOpen,
    actionsMenuEl,
    isStandalone,
    isIosSafari,
    paidPercent,
    primarySession,
    currentJobId,
    portalHeroImage,
    jobSteps,
    studioWhatsApp,
    themeVars,
    formatDate,
    formatMoney,
    galleryRoute,
    showNotice,
    runPortalAction,
    openInvoicePdf,
    handleInvoicePdfOpen,
    copyPortalLink,
    sharePortal,
    savePortalToHomeScreen,
    startCheckout,
    handlePasscodeSubmit,
    reloadPortal,
    goToJobs,
    logout,
  };

  provide(CLIENT_PORTAL_JOB_KEY, ctx);
  return ctx;
}

export function useClientPortalJob(): ClientPortalJobContext {
  const ctx = inject(CLIENT_PORTAL_JOB_KEY);
  if (!ctx) {
    throw new Error("useClientPortalJob must be used within job layout");
  }
  return ctx;
}
