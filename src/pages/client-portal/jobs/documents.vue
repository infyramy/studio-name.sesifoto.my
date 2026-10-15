<template>
  <main v-if="portalData" class="portal-reveal mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
    <div class="mb-14 border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
      <h1 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; line-height: 1.1;">
        Documents
      </h1>
      <p class="mt-4 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
        Your quotation, agreement and forms for this booking.
      </p>
    </div>

    <section v-if="quotations.length" class="mb-16">
      <h2 class="mb-6 font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2rem;">Quotation</h2>
      <div class="grid gap-3">
        <a
          v-for="quote in quotations"
          :key="quote.id"
          :href="quote.url"
          class="flex items-center justify-between gap-4 border px-5 py-4 transition hover:opacity-80"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 45%, transparent)' }"
        >
          <span class="flex min-w-0 items-center gap-4">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
            >
              <ReceiptText class="h-4 w-4" />
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold tracking-wide">
                {{ quote.title || quote.number }}
              </span>
              <span class="mt-1 block text-xs tracking-wide" :style="{ color: 'var(--p-muted)' }">
                {{ quote.number }} · {{ formatMoney(quote.total, quote.currency) }} · {{ QUOTE_STATUS_LABELS[quote.status] }}
              </span>
            </span>
          </span>
          <ArrowRight class="h-4 w-4 shrink-0" />
        </a>
      </div>
    </section>

    <section class="mb-16">
      <h2 class="mb-6 font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2rem;">Agreement</h2>

      <div
        v-if="portalData.agreement.requireTerms"
        class="mb-6 flex flex-col gap-4 border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 45%, transparent)' }"
      >
        <span class="flex min-w-0 items-center gap-4">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
          >
            <Check v-if="portalData.agreement.complete" class="h-4 w-4" />
            <PenLine v-else class="h-4 w-4" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold tracking-wide">Terms</span>
            <span class="mt-1 block text-xs tracking-wide" :style="{ color: 'var(--p-muted)' }">
              {{ termsNote }}
            </span>
          </span>
        </span>
        <a
          v-if="!portalData.agreement.complete && portalData.agreement.termsUrl"
          :href="portalData.agreement.termsUrl"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] font-semibold tracking-wide transition hover:opacity-80"
          :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
        >
          {{ portalData.agreement.requireSignature ? "Review and sign" : "Review and accept" }}
          <ArrowRight class="h-3.5 w-3.5" />
        </a>
      </div>

      <p
        v-if="!portalData.contracts.length && !portalData.agreement.requireTerms"
        class="py-2 text-sm tracking-wide"
        :style="{ color: 'var(--p-muted)' }"
      >
        No agreement shared yet.
      </p>
      <div v-else-if="portalData.contracts.length" class="grid gap-6">
        <article
          v-for="doc in portalData.contracts"
          :key="doc.id"
          class="flex flex-col gap-4 py-2 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="flex min-w-0 items-start gap-4">
            <span
              class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
              :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
            >
              <FileText class="h-4 w-4" />
            </span>
            <div class="min-w-0">
              <p class="truncate text-base font-semibold tracking-wide">{{ doc.title }}</p>
              <p class="mt-1.5 text-xs tracking-wide" :style="{ color: 'var(--p-muted)' }">
                Updated {{ formatDate(doc.updatedAt) }}
                <span v-if="doc.signer" class="opacity-50 mx-1">|</span>
                <span v-if="doc.signer">{{ doc.signer }}</span>
                <span v-if="doc.signatureImage" class="opacity-50 mx-1">|</span>
                <span v-if="doc.signatureImage">Signed</span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 sm:mt-1">
            <p class="text-[10px] font-semibold tracking-wide" :style="{ color: 'var(--p-text)' }">
              {{ doc.status }}
            </p>
            <button
              type="button"
              class="inline-flex h-9 items-center justify-center border-b px-2 text-xs font-semibold tracking-wider transition hover:opacity-70"
              :style="{
                borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)',
                color: 'var(--p-text)',
              }"
              @click="openContract(doc)"
            >
              View
            </button>
            <button
              type="button"
              class="inline-flex h-9 items-center justify-center px-4 text-xs font-semibold tracking-[0.1em] transition hover:opacity-80"
              :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
              @click="downloadContractPdf(doc)"
            >
              Download PDF
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="forms.length">
      <div class="mb-6 flex items-end justify-between">
        <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2rem;">Forms</h2>
        <span class="text-[11px] font-medium tracking-wide" :style="{ color: 'var(--p-accent)' }">
          {{ forms.filter((form) => form.status === "submitted").length }} / {{ forms.length }} submitted
        </span>
      </div>
      <div class="grid gap-3">
        <RouterLink
          v-for="form in forms"
          :key="form.id"
          :to="{ name: 'client-portal-job-form', params: { jobId: currentJobId, formId: form.id } }"
          class="flex items-center justify-between gap-4 border px-5 py-4 transition hover:opacity-80"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 45%, transparent)' }"
        >
          <span class="flex min-w-0 items-center gap-4">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
            >
              <Check v-if="form.status === 'submitted'" class="h-4 w-4" />
              <ClipboardList v-else class="h-4 w-4" />
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold tracking-wide">{{ form.title }}</span>
              <span class="mt-1 block text-xs tracking-wide" :style="{ color: 'var(--p-muted)' }">
                {{ form.submittedAt ? `Submitted ${formatDate(form.submittedAt)}` : "Please fill in" }}
              </span>
            </span>
          </span>
          <ArrowRight class="h-4 w-4 shrink-0" />
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  PenLine,
  ReceiptText,
} from "lucide-vue-next";
import { useClientPortalJob } from "@/composables/useClientPortalJob";
import type { PortalQuotationStatus } from "@/services/portal.service";

const QUOTE_STATUS_LABELS: Record<PortalQuotationStatus, string> = {
  draft: "Draft",
  sent: "Awaiting your reply",
  accepted: "Accepted",
  declined: "Declined",
  approved: "Approved",
  converted: "Confirmed",
  superseded: "Replaced",
};

const {
  portalData,
  currentJobId,
  formatDate,
  formatMoney,
  openContract,
  downloadContractPdf,
} = useClientPortalJob();

const quotations = computed(() => portalData.value?.quotations ?? []);
const forms = computed(() => portalData.value?.forms ?? []);

const termsNote = computed(() => {
  const agreement = portalData.value?.agreement;
  if (!agreement) return "";
  if (agreement.complete) {
    const at = agreement.signedAt || agreement.termsAcceptedAt;
    const verb = agreement.requireSignature ? "Signed" : "Accepted";
    return at ? `${verb} on ${formatDate(at)}` : verb;
  }
  return agreement.requireSignature
    ? "Please review and sign the terms for your booking."
    : "Please review and accept the terms for your booking.";
});
</script>

<style scoped>
.portal-reveal {
  animation: portal-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes portal-reveal {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .portal-reveal { animation: none; }
}
</style>
