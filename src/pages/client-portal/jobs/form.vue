<template>
  <main v-if="portalData" class="portal-reveal mx-auto max-w-2xl px-5 py-16 sm:px-6 sm:py-20">
    <RouterLink
      :to="{ name: 'client-portal-job-documents', params: { jobId: currentJobId } }"
      class="mb-8 inline-flex items-center gap-2 text-xs tracking-wide transition hover:opacity-80"
      :style="{ color: 'var(--p-muted)' }"
    >
      <ArrowLeft class="h-4 w-4" /> Back to documents
    </RouterLink>

    <p v-if="isLoading" class="py-6 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
      Loading form...
    </p>
    <p v-else-if="error" class="py-6 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
      {{ error }}
    </p>

    <template v-else-if="form">
      <div class="mb-10 border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <h1 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; line-height: 1.1;">
          {{ form.title }}
        </h1>
      </div>
      <PortalFormFill
        :key="form.id"
        :form="form"
        :save-fn="(answers) => portalService.saveForm(currentJobId, form!.id, answers)"
        :submit-fn="(answers) => portalService.submitForm(currentJobId, form!.id, answers)"
        @updated="onUpdated"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import PortalFormFill from "@/components/portal/PortalFormFill.vue";
import { useClientPortalJob } from "@/composables/useClientPortalJob";
import { portalService, type PortalForm } from "@/services/portal.service";

const route = useRoute();
const { portalData, currentJobId } = useClientPortalJob();

const form = ref<PortalForm | null>(null);
const isLoading = ref(true);
const error = ref("");

function onUpdated(updated: PortalForm) {
  form.value = updated;
  const summary = portalData.value?.forms?.find((item) => item.id === updated.id);
  if (summary) {
    summary.status = updated.status;
    summary.submittedAt = updated.submittedAt;
  }
}

async function load(formId: string) {
  if (!formId || !currentJobId.value) return;
  isLoading.value = true;
  error.value = "";
  try {
    form.value = await portalService.getForm(currentJobId.value, formId);
  } catch (caught: unknown) {
    form.value = null;
    error.value = caught instanceof Error ? caught.message : "Unable to load this form.";
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => String(route.params.formId || ""),
  (formId) => void load(formId),
  { immediate: true },
);
</script>

<style scoped>
.portal-reveal {
  animation: portal-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes portal-reveal {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .portal-reveal {
    animation: none;
  }
}
</style>
