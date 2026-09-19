<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Download, FileWarning, Loader2, X } from "lucide-vue-next";
import PortalOverlay from "./PortalOverlay.vue";
import {
  portalService,
  type PortalContract,
} from "@/services/portal.service";
import { useSanitize } from "@/composables/useSanitize";

const props = defineProps<{
  open: boolean;
  jobId: string;
  contract: PortalContract | null;
  accentColor?: string | null;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const { sanitize } = useSanitize();
const isDownloading = ref(false);
const downloadError = ref("");

const safeBodyHtml = computed(() => {
  const html = props.contract?.bodyHtml?.trim();
  if (!html) return "";
  return sanitize(html);
});

function handleOpenChange(open: boolean) {
  if (!open) {
    downloadError.value = "";
    isDownloading.value = false;
  }
  emit("update:open", open);
}

async function downloadPdf() {
  if (!props.contract || !props.jobId || isDownloading.value) return;
  isDownloading.value = true;
  downloadError.value = "";
  try {
    const blob = await portalService.getContractPdf(
      props.jobId,
      props.contract.id,
    );
    const safeTitle = props.contract.title.replace(/[^a-z0-9_-]+/gi, "-");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle || "contract"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error: unknown) {
    downloadError.value =
      error instanceof Error ? error.message : "Failed to download contract PDF.";
  } finally {
    isDownloading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) downloadError.value = "";
  },
);

function formatSignedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>

<template>
  <PortalOverlay
    :open="open"
    :accent-color="accentColor"
    :show-close="false"
    title-id="portal-contract-title"
    description-id="portal-contract-description"
    container-class="!p-0 sm:!p-4"
    panel-class="h-dvh max-w-none rounded-none border-0 sm:h-[90dvh] sm:max-w-3xl sm:rounded-[18px] sm:border"
    @update:open="handleOpenChange"
  >
    <header class="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
      <div class="min-w-0 flex-1">
        <h2 id="portal-contract-title" class="truncate text-sm font-semibold text-white sm:text-base">
          {{ contract?.title || "Contract" }}
        </h2>
        <p id="portal-contract-description" class="mt-0.5 truncate text-xs text-white/45">
          <template v-if="contract?.signer">Signer: {{ contract.signer }}</template>
          <template v-else>Agreement document</template>
          <template v-if="contract?.signedAt"> · Signed</template>
        </p>
      </div>
      <button
        type="button"
        :disabled="isDownloading || !contract"
        class="portal-focus flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-medium text-white/75 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        @click="downloadPdf"
      >
        <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
        <Download v-else class="h-4 w-4" />
        <span class="hidden sm:inline">{{ isDownloading ? "Preparing..." : "Download PDF" }}</span>
      </button>
      <button
        type="button"
        class="portal-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/65 transition hover:bg-white/5 hover:text-white"
        aria-label="Close contract"
        @click="handleOpenChange(false)"
      >
        <X class="h-4 w-4" />
      </button>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto bg-[#f8f7f4] text-[#1f2937]">
      <div v-if="downloadError" class="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
        {{ downloadError }}
      </div>
      <article class="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        <h3 class="text-xl font-semibold tracking-tight">
          {{ contract?.title || "Contract" }}
        </h3>
        <p v-if="contract?.signer" class="mt-2 text-sm text-neutral-500">
          Signer: {{ contract.signer }}
        </p>
        <hr class="my-6 border-neutral-200" />
        <div
          v-if="safeBodyHtml"
          class="contract-body text-[15px] leading-7"
          v-html="safeBodyHtml"
        />
        <div
          v-else
          class="flex flex-col items-start gap-4 rounded-xl border border-dashed border-neutral-300 bg-white px-5 py-8"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
            <FileWarning class="h-5 w-5" />
          </span>
          <div>
            <p class="text-sm font-medium text-neutral-800">
              {{ contract?.hasFile ? "File-based contract" : "No contract body yet" }}
            </p>
            <p class="mt-1 text-sm text-neutral-500">
              {{
                contract?.hasFile
                  ? "Download the PDF to read the full agreement."
                  : "This contract has no readable content yet."
              }}
            </p>
          </div>
          <button
            v-if="contract?.hasFile"
            type="button"
            :disabled="isDownloading"
            class="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            @click="downloadPdf"
          >
            <Loader2 v-if="isDownloading" class="h-4 w-4 animate-spin" />
            <Download v-else class="h-4 w-4" />
            Download PDF
          </button>
        </div>

        <section
          v-if="contract?.signatureImage"
          class="mt-10 border-t border-neutral-200 pt-6"
        >
          <p class="text-[11px] font-medium tracking-[0.16em] text-neutral-500">
            Signature
          </p>
          <img
            :src="contract.signatureImage"
            :alt="contract.signer ? `${contract.signer} signature` : 'Signature'"
            class="mt-3 max-h-28 max-w-xs rounded-md border border-neutral-200 bg-white object-contain p-3"
          />
          <p v-if="contract.signer" class="mt-2 text-sm text-neutral-700">
            {{ contract.signer }}
          </p>
          <p v-if="contract.signedAt" class="mt-1 text-xs text-neutral-500">
            Signed {{ formatSignedAt(contract.signedAt) }}
          </p>
        </section>
      </article>
    </div>
  </PortalOverlay>
</template>

<style scoped>
.contract-body :deep(p) {
  margin: 0 0 0.9em;
}
.contract-body :deep(ul),
.contract-body :deep(ol) {
  margin: 0 0 0.9em;
  padding-left: 1.25rem;
}
.contract-body :deep(li) {
  margin-bottom: 0.35em;
}
.contract-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}
.contract-body :deep(h1),
.contract-body :deep(h2),
.contract-body :deep(h3) {
  margin: 1.1em 0 0.45em;
  font-weight: 600;
}
</style>
