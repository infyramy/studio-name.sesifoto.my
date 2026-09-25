<template>
  <main v-if="portalData" class="portal-reveal mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
    <section>
      <div class="mb-12 border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; line-height: 1.1;">
          Payment
        </h2>
      </div>

      <div
        v-if="termsGateActive"
        class="mb-10 rounded-sm border px-5 py-5"
        :style="{
          borderColor: 'color-mix(in srgb, var(--p-border) 55%, transparent)',
          background: 'color-mix(in srgb, var(--p-accent-bg) 70%, transparent)',
        }"
      >
        <p class="text-sm font-medium tracking-wide">
          {{
            portalData.agreement.requireSignature
              ? "Accept and sign the terms before paying."
              : "Accept the terms before paying."
          }}
        </p>
        <a
          v-if="portalData.agreement.termsUrl"
          :href="portalData.agreement.termsUrl"
          class="mt-4 inline-flex h-11 items-center justify-center px-5 text-xs font-semibold tracking-wide transition hover:opacity-80"
          :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
        >
          Open terms
        </a>
      </div>

      <div class="grid gap-12 lg:grid-cols-[1fr_2fr] items-start">
        <div class="relative pt-2">
          <p class="text-[10px] font-semibold tracking-wide" :style="{ color: 'var(--p-muted)' }">
            Balance due
          </p>
          <p class="mt-4 font-medium tabular-nums" style="font-family: 'Cormorant Garamond', serif; font-size: 3.5rem; line-height: 1;">
            {{
              portalData.billing.hasMixedCurrencies
                ? "Multiple"
                : formatMoney(portalData.billing.balanceDue, portalData.billing.currency)
            }}
          </p>
          <template v-if="!portalData.billing.hasMixedCurrencies">
            <div class="mt-8 h-[2px] w-full bg-transparent overflow-hidden" :style="{ background: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
              <div
                class="h-full transition-all duration-1000 ease-out"
                :style="{ width: `${paidPercent}%`, background: 'var(--p-accent)' }"
              />
            </div>
            <div class="mt-3 flex justify-between text-[11px] tracking-wide" :style="{ color: 'var(--p-muted)' }">
              <span>{{ paidPercent }}% paid</span>
              <span>
                {{ formatMoney(portalData.billing.totalInvoiced, portalData.billing.currency) }} total
              </span>
            </div>
          </template>
          <p v-else class="mt-6 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
            Pay each invoice in its listed currency.
          </p>
          <button
            v-if="portalData.billing.canPayAll"
            type="button"
            class="mt-10 inline-flex h-12 w-full items-center justify-center px-6 text-xs font-semibold tracking-wide transition hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
            :disabled="activeCheckout !== null || termsGateActive"
            @click="startCheckout({ scope: 'all' })"
          >
            <Loader2 v-if="activeCheckout === 'all'" class="mr-2 h-4 w-4 animate-spin" />
            <CreditCard v-else class="mr-2 h-4 w-4" />
            {{ activeCheckout === "all" ? "Opening checkout..." : "Pay all" }}
          </button>
        </div>

        <div>
          <div class="mb-6 flex items-end justify-between border-b pb-3" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
            <h3 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem;">Invoices</h3>
            <span class="text-[10px] tracking-wide" :style="{ color: 'var(--p-muted)' }">
              {{ portalData.invoices.length }} files
            </span>
          </div>
          <p v-if="!portalData.invoices.length" class="py-4 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
            No invoices available.
          </p>
          <div v-else class="grid gap-8">
            <RouterLink
              v-for="invoice in portalData.invoices"
              :key="invoice.id"
              :to="invoiceRoute(invoice.id)"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex w-full flex-col gap-4 py-2 text-left transition hover:opacity-80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-4">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                  :style="{ background: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
                >
                  <FileText class="h-4 w-4" />
                </span>
                <div>
                  <p class="text-base font-semibold tracking-wide">{{ invoice.title }}</p>
                  <p class="mt-1.5 text-xs tracking-wide" :style="{ color: 'var(--p-muted)' }">
                    {{ invoice.number }}
                    <span v-if="invoice.dueDate" class="opacity-50 mx-1">|</span>
                    <span v-if="invoice.dueDate">Due {{ formatDate(invoice.dueDate) }}</span>
                  </p>
                </div>
              </div>
              <div class="flex flex-row items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-2">
                <div class="text-left sm:text-right">
                  <p class="text-sm font-semibold tabular-nums tracking-wide">
                    {{ formatMoney(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total, invoice.currency) }}
                  </p>
                  <p class="mt-1 text-[10px] tracking-wide capitalize" :style="{ color: 'var(--p-accent)' }">
                    {{ invoiceStatusLabel(invoice) }}
                  </p>
                </div>
                <span
                  class="inline-flex h-9 items-center justify-center gap-1.5 px-4 text-xs font-semibold tracking-wide"
                  :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
                >
                  {{ invoice.balanceDue > 0 ? "View & pay" : "View" }}
                  <ExternalLink class="h-3.5 w-3.5" />
                </span>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CreditCard, ExternalLink, FileText, Loader2 } from "lucide-vue-next";
import { useClientPortalJob } from "@/composables/useClientPortalJob";
import type { PortalInvoice } from "@/services/portal.service";

const {
  portalData,
  paidPercent,
  activeCheckout,
  formatDate,
  formatMoney,
  startCheckout,
  invoiceRoute,
} = useClientPortalJob();

const termsGateActive = computed(() => {
  const agreement = portalData.value?.agreement;
  return !!agreement?.requireTerms && !agreement.complete;
});

function invoiceStatusLabel(invoice: PortalInvoice) {
  if (invoice.balanceDue <= 0 || invoice.status === "paid") return "Paid";
  if (invoice.paidAmount > 0) return "Partially paid";
  if (invoice.status === "overdue") return "Overdue";
  return "Unpaid";
}
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
