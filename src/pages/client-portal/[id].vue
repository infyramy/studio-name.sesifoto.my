<template>
  <div
    class="flex min-h-screen items-center justify-center px-6"
    :style="themeVars"
  >
    <div
      class="space-y-3 text-center"
      :style="{ color: 'var(--p-text)', background: 'transparent' }"
    >
      <div
        class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
        :style="{ borderColor: 'var(--p-accent)', borderTopColor: 'transparent' }"
      />
      <p
        class="text-xs uppercase tracking-[0.2em]"
        :style="{ color: 'var(--p-muted)' }"
      >
        Opening portal
      </p>
      <p v-if="error" class="mt-4 max-w-sm text-sm" :style="{ color: 'var(--p-text)' }">
        {{ error }}
      </p>
      <RouterLink
        v-if="error"
        :to="{ name: 'client-portal-access' }"
        class="mt-4 inline-block text-xs font-semibold uppercase tracking-wider"
        :style="{ color: 'var(--p-accent)' }"
      >
        Go to login
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
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

async function start() {
  controller?.abort();
  const next = new AbortController();
  controller = next;
  const gen = ++generation;
  const jobId = String(route.params.jobId || "");
  error.value = "";

  if (!jobId) {
    error.value = "No job ID provided.";
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
    if (caught instanceof PortalApiError && caught.status === 401) {
      await accessRedirect(jobId);
      return;
    }
    // Token links without session → email + passcode gate
    if (getRouteToken()) {
      await accessRedirect(jobId);
      return;
    }
    error.value =
      caught instanceof PortalApiError
        ? caught.message
        : "Failed to open this portal.";
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
  generation += 1;
  controller?.abort();
});
</script>
