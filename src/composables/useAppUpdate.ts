import { computed, onScopeDispose, readonly, ref } from "vue";

type AppVersionPayload = {
  buildId: string;
  builtAt?: string;
};

const DISMISS_KEY = "sesifoto:dismissed-build-id";
const POLL_MS = 60_000;
const SERVICE_WORKER_WAIT_MS = 4_000;

const localBuildId = String(import.meta.env.VITE_APP_BUILD_ID || "local");
const serverBuildId = ref<string | null>(null);
const dismissedBuildId = ref<string | null>(readDismissedBuildId());
const isReloading = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let started = false;
let watchers = 0;

const isUpdateAvailable = computed(() => {
  const remote = serverBuildId.value;
  if (!remote || !localBuildId) return false;
  return remote !== localBuildId;
});

const showBanner = computed(
  () =>
    isUpdateAvailable.value && dismissedBuildId.value !== serverBuildId.value,
);

function readDismissedBuildId(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

/** The offline cache serves index.html, so the new worker must take over before reloading. */
async function activateLatestServiceWorker() {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return;
  try {
    await registration.update();
  } catch {
    return;
  }
  const worker = registration.installing ?? registration.waiting;
  if (!worker) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, SERVICE_WORKER_WAIT_MS);
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated" || worker.state === "redundant") {
        clearTimeout(timer);
        resolve();
      }
    });
  });
}

async function checkForUpdate() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as AppVersionPayload;
    if (!data?.buildId) return;
    serverBuildId.value = String(data.buildId);
    if (isUpdateAvailable.value) {
      void getServiceWorkerRegistration().then((registration) =>
        registration?.update().catch(() => undefined),
      );
    }
  } catch {
    // ignore network errors; retry on next poll
  }
}

function dismiss() {
  if (!serverBuildId.value) return;
  dismissedBuildId.value = serverBuildId.value;
  try {
    localStorage.setItem(DISMISS_KEY, serverBuildId.value);
  } catch {
    // private mode: dismissal lasts for this tab only
  }
}

async function reload() {
  if (isReloading.value) return;
  isReloading.value = true;
  await activateLatestServiceWorker();
  const url = new URL(window.location.href);
  const bust = serverBuildId.value
    ? `${serverBuildId.value}-${Date.now()}`
    : String(Date.now());
  url.searchParams.set("_v", bust);
  window.location.replace(url.toString());
}

function onVisibility() {
  if (document.visibilityState === "visible") void checkForUpdate();
}

function startWatching() {
  watchers += 1;
  if (started) return;
  started = true;
  void checkForUpdate();
  pollTimer = setInterval(() => void checkForUpdate(), POLL_MS);
  document.addEventListener("visibilitychange", onVisibility);
}

function stopWatching() {
  watchers = Math.max(0, watchers - 1);
  if (watchers > 0) return;
  started = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  document.removeEventListener("visibilitychange", onVisibility);
}

export function useAppUpdate() {
  startWatching();
  onScopeDispose(() => stopWatching());

  return {
    localBuildId,
    serverBuildId: readonly(serverBuildId),
    isUpdateAvailable,
    isReloading: readonly(isReloading),
    showBanner,
    checkForUpdate,
    dismiss,
    reload,
  };
}
