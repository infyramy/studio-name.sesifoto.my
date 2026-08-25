<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { PORTAL_INSTALL_JOB_ID_STORAGE_KEY } from "@/composables/usePortalInstall";

const router = useRouter();
const route = useRoute();

onMounted(() => {
  try {
    const jobId = localStorage.getItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY);
    if (jobId && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(jobId)) {
      router.replace({
        name: "client-portal-start",
        params: { jobId },
        query: route.query,
      });
      return;
    }
    if (jobId) localStorage.removeItem(PORTAL_INSTALL_JOB_ID_STORAGE_KEY);
  } catch {
    // Storage can be blocked.
  }
  router.replace({ name: "client-portal-access", query: route.query });
});
</script>

<template>
  <div>Loading</div>
</template>
