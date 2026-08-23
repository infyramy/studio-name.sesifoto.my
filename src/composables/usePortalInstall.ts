import { computed, onScopeDispose, ref } from "vue";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type PortalInstallResult =
  | "accepted"
  | "dismissed"
  | "installed"
  | "unavailable";

export const PORTAL_INSTALL_JOB_ID_STORAGE_KEY =
  "sesifoto:portal-install-job-id";

export function usePortalInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
  const installedThisSession = ref(false);
  const standaloneQuery =
    typeof window !== "undefined"
      ? window.matchMedia("(display-mode: standalone)")
      : null;
  const isStandalone = ref(false);

  const updateStandalone = () => {
    const navigatorWithStandalone = navigator as Navigator & {
      standalone?: boolean;
    };
    isStandalone.value =
      installedThisSession.value
      || Boolean(standaloneQuery?.matches)
      || navigatorWithStandalone.standalone === true;
  };

  const isIosSafari = computed(() => {
    if (typeof navigator === "undefined") return false;

    const userAgent = navigator.userAgent;
    const isIos =
      /iPad|iPhone|iPod/.test(userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAlternateIosBrowser =
      /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|Snapchat|TikTok|LinkedInApp|Pinterest/i.test(
        userAgent,
      );
    const isFullSafari = /Version\/[\d.]+.*Mobile\/.*Safari\//i.test(userAgent);

    return isIos && isFullSafari && !isAlternateIosBrowser;
  });

  const canPromptInstall = computed(
    () => !isStandalone.value && deferredPrompt.value !== null,
  );

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredPrompt.value = event as BeforeInstallPromptEvent;
  };

  const handleAppInstalled = () => {
    deferredPrompt.value = null;
    installedThisSession.value = true;
    updateStandalone();
  };

  const handleDisplayModeChange = () => {
    updateStandalone();
  };

  if (typeof window !== "undefined") {
    updateStandalone();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneQuery?.addEventListener("change", handleDisplayModeChange);
  }

  async function requestInstall(): Promise<PortalInstallResult> {
    if (isStandalone.value) return "installed";

    const promptEvent = deferredPrompt.value;
    if (!promptEvent) return "unavailable";

    deferredPrompt.value = null;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      return choice.outcome;
    } catch {
      return "unavailable";
    }
  }

  onScopeDispose(() => {
    if (typeof window === "undefined") return;
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.removeEventListener("appinstalled", handleAppInstalled);
    standaloneQuery?.removeEventListener("change", handleDisplayModeChange);
    deferredPrompt.value = null;
  });

  return {
    isIosSafari,
    isStandalone,
    canPromptInstall,
    requestInstall,
  };
}
