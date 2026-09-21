<template>
  <div class="portal-font" :style="[{ background: 'var(--p-shell)', color: 'var(--p-text)' }, themeVars]">
    <PortalErrorState
      v-if="error"
      :title="'Unable to open portal'"
      :message="error"
      action-label="Go to login"
      @action="goLogin"
    />
    <PortalLoadingState v-else label="Opening portal" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import { PortalApiError, portalService } from "@/services/portal.service";
import { usePortalTheme } from "@/composables/usePortalTheme";

const route = useRoute();
const router = useRouter();
const { themeVars } = usePortalTheme();

const error = ref("");
let controller: AbortController | null = null;
let generation = 0;

function getRouteToken(): string {
  const tokenQuery = route.query.token;
  return Array.isArray(tokenQuery)
    ? String(tokenQuery[0] || "")
    : String(tokenQuery || "");
}

function accessRedirect(jobId: string) {
  const query: Record<string, string> = { nextJob: jobId };
  const intent = route.query.intentId;
  if (typeof intent === "string" && intent) query.intentId = intent;
  const token = getRouteToken();
  if (token) {
    try {
      sessionStorage.setItem(`portal_pending_token_${jobId}`, token);
    } catch {
      // ignore
    }
  }
  return router.replace({ name: "client-portal-access", query });
}

function jobOverviewLocation(jobId: string) {
  const query = { ...route.query };
  delete query.token;
  return {
    name: "client-portal-job-overview" as const,
    params: { jobId },
    query,
  };
}

function goLogin() {
  void router.replace({ name: "client-portal-access" });
}

async function start() {
  controller?.abort();
  const next = new AbortController();
  controller = next;
  const gen = ++generation;
  const jobId = String(route.params.jobId || "");
  error.value = "";

  if (!jobId) {
    error.value = "No booking ID provided.";
    return;
  }

  // Prefer existing session (client or job cookie). Never show old passcode modal.
  try {
    await portalService.getPortalData(jobId, { signal: next.signal });
    if (gen !== generation || next.signal.aborted) return;
    await router.replace(jobOverviewLocation(jobId));
    return;
  } catch (caught: unknown) {
    if (gen !== generation || next.signal.aborted) return;
    if (caught instanceof PortalApiError && (caught.status === 401 || caught.status === 403)) {
      await accessRedirect(jobId);
      return;
    }
    if (caught instanceof PortalApiError && caught.status === 404) {
      await accessRedirect(jobId);
      return;
    }
    error.value =
      caught instanceof PortalApiError
        ? caught.message
        : "Unable to open this portal.";
  }
}

watch(
  [() => String(route.params.jobId || ""), getRouteToken],
  () => {
    void start();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  controller?.abort();
});
</script>
