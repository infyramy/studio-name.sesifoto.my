<template>
  <main v-if="portalData" class="portal-reveal mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
    <section>
      <div class="mb-12 border-b pb-4" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <h2 class="font-medium" style="font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; line-height: 1.1;">
          Payment
        </h2>
      </div>

      <div class="grid gap-12 lg:grid-cols-[1fr_2fr] items-start">
        <div class="relative pt-2">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em]" :style="{ color: 'var(--p-muted)' }">
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
            <div class="mt-3 flex justify-between text-[11px] tracking-wide uppercase" :style="{ color: 'var(--p-muted)' }">
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
            class="mt-10 inline-flex h-12 w-full items-center justify-center px-6 text-xs font-semibold uppercase tracking-[0.1em] transition hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
            :disabled="activeCheckout !== null"
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
            <span class="text-[10px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-muted)' }">
              {{ portalData.invoices.length }} files
            </span>
          </div>
          <p v-if="!portalData.invoices.length" class="py-4 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
            No invoices available.
          </p>
          <div v-else class="grid gap-8">
            <div
              v-for="invoice in portalData.invoices"
              :key="invoice.id"
              class="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between"
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
                  <p class="mt-1.5 text-xs tracking-wider uppercase" :style="{ color: 'var(--p-muted)' }">
                    {{ invoice.number }}
                    <span v-if="invoice.dueDate" class="opacity-50 mx-1">|</span>
                    <span v-if="invoice.dueDate">Due {{ formatDate(invoice.dueDate) }}</span>
                  </p>
                </div>
              </div>
              <div class="flex flex-row items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-2">
                <div class="text-left sm:text-right">
                  <p class="text-sm font-semibold tabular-nums tracking-wide">
                    {{ formatMoney(invoice.total, invoice.currency) }}
                  </p>
                  <p class="mt-1 text-[10px] uppercase tracking-[0.2em]" :style="{ color: 'var(--p-accent)' }">
                    {{ invoice.status }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="inline-flex h-9 items-center justify-center border-b px-2 text-xs font-semibold tracking-wider uppercase transition hover:opacity-70"
                    :style="{
                      borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)',
                      color: 'var(--p-text)',
                    }"
                    @click="openInvoicePdf(invoice)"
                  >
                    View PDF
                  </button>
                  <button
                    v-if="invoice.balanceDue > 0"
                    type="button"
                    class="inline-flex h-9 items-center justify-center px-4 text-xs font-semibold uppercase tracking-[0.1em] transition hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                    :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
                    :disabled="activeCheckout !== null"
                    @click="startCheckout({ scope: 'invoice', invoiceId: invoice.id })"
                  >
                    <Loader2
                      v-if="activeCheckout === `invoice:${invoice.id}`"
                      class="mr-2 h-3.5 w-3.5 animate-spin"
                    />
                    {{
                      activeCheckout === `invoice:${invoice.id}` ? "Wait..." : "Pay"
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { CreditCard, FileSearch, FileText, Loader2 } from "lucide-vue-next";
import { useClientPortalJob } from "@/composables/useClientPortalJob";

const {
  portalData,
  paidPercent,
  activeCheckout,
  formatDate,
  formatMoney,
  openInvoicePdf,
  startCheckout,
} = useClientPortalJob();
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
