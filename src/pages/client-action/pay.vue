<template>
  <div class="action portal-font" :style="themeVars">
    <PortalLoadingState v-if="isLoading" label="Loading payment" />

    <PortalErrorState
      v-else-if="error"
      title="Payment unavailable"
      :message="error"
      :action-label="termsUrl ? 'Open terms' : ''"
      @action="openTerms"
    />

    <main v-else-if="data" class="action__main portal-reveal">
      <header class="action__header">
        <div class="action__brand">
          <img
            v-if="data.studio.logoUrl"
            :src="data.studio.logoUrl"
            :alt="data.studio.name"
            class="action__logo"
          />
          <div class="min-w-0">
            <p class="action__studio">{{ data.studio.name }}</p>
            <p class="action__job" :style="{ color: 'var(--p-muted)' }">
              {{ data.title }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="portal-icon-btn"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleDark"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>
      </header>

      <section class="pay-grid">
        <div>
          <div
            class="action__rule"
            :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
          >
            <h1 class="action__title">Payment</h1>
          </div>

          <p class="pay-label" :style="{ color: 'var(--p-muted)' }">
            Balance due
          </p>
          <p class="pay-amount">
            {{ formatMoney(data.billing.balanceDue, data.billing.currency) }}
          </p>
          <p
            v-if="data.clientName"
            class="pay-client"
            :style="{ color: 'var(--p-muted)' }"
          >
            Billed to {{ data.clientName }}
          </p>

          <button
            v-if="data.billing.canPay"
            type="button"
            class="action__cta"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
            :disabled="!!activeCheckout"
            @click="payAll"
          >
            <Loader2
              v-if="activeCheckout === 'all'"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ activeCheckout === "all" ? "Opening checkout..." : "Pay all" }}
          </button>
          <p v-else class="pay-empty" :style="{ color: 'var(--p-muted)' }">
            No outstanding balance to pay.
          </p>
        </div>

        <div>
          <div
            class="pay-invoices-head"
            :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
          >
            <h2 class="pay-invoices-title">Invoices</h2>
            <span class="pay-count" :style="{ color: 'var(--p-muted)' }">
              {{ data.invoices.length }} files
            </span>
          </div>

          <p
            v-if="!data.invoices.length"
            class="pay-empty"
            :style="{ color: 'var(--p-muted)' }"
          >
            No invoices available.
          </p>

          <div v-else class="pay-list">
            <div
              v-for="invoice in data.invoices"
              :key="invoice.id"
              class="pay-row"
            >
              <div class="min-w-0">
                <p class="pay-row-title">{{ invoice.title }}</p>
                <p class="pay-row-meta" :style="{ color: 'var(--p-muted)' }">
                  {{ invoice.number }}
                  <span v-if="invoice.dueDate">
                    · Due {{ formatDate(invoice.dueDate) }}
                  </span>
                </p>
              </div>
              <div class="pay-row-right">
                <p class="pay-row-amount tabular-nums">
                  {{ formatMoney(invoice.balanceDue, invoice.currency) }}
                </p>
                <p
                  class="pay-row-status"
                  :style="{ color: 'var(--p-accent)' }"
                >
                  {{ invoice.status }}
                </p>
                <button
                  v-if="invoice.balanceDue > 0"
                  type="button"
                  class="pay-row-btn"
                  :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
                  :disabled="!!activeCheckout"
                  @click="payInvoice(invoice.id)"
                >
                  <Loader2
                    v-if="activeCheckout === invoice.id"
                    class="mr-1.5 h-3.5 w-3.5 animate-spin"
                  />
                  {{
                    activeCheckout === invoice.id ? "Wait..." : "Pay"
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p v-if="checkoutError" class="action__error">{{ checkoutError }}</p>

      <a
        v-if="data.portalUrl"
        :href="data.portalUrl"
        class="action__link"
        :style="{ color: 'var(--p-muted)' }"
      >
        Open client portal
      </a>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Loader2, Moon, Sun } from "lucide-vue-next";
import { usePortalTheme } from "@/composables/usePortalTheme";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import {
  ClientActionApiError,
  clientActionService,
  type ClientActionPayData,
} from "@/services/client-action.service";

const route = useRoute();
const data = ref<ClientActionPayData | null>(null);
const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme({
  accentOverride: () => data.value?.studio.brandColor,
});

const token = computed(() => String(route.query.t || ""));
const isLoading = ref(true);
const error = ref("");
const termsUrl = ref<string | null>(null);
const activeCheckout = ref<string | null>(null);
const checkoutError = ref("");

function formatMoney(value: number, currency: string | null) {
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency || "MYR",
    }).format(value);
  } catch {
    return `RM ${value.toFixed(2)}`;
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function openTerms() {
  if (termsUrl.value) window.location.href = termsUrl.value;
}

async function load() {
  if (!token.value) {
    error.value = "This link is missing or invalid.";
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = "";
  termsUrl.value = null;
  try {
    data.value = await clientActionService.getPay(token.value);
    setAccent(data.value.studio.brandColor);
  } catch (caught: unknown) {
    if (caught instanceof ClientActionApiError) {
      error.value = caught.message;
      termsUrl.value = caught.termsUrl;
    } else {
      error.value = "Unable to load payment.";
    }
  } finally {
    isLoading.value = false;
  }
}

async function startCheckout(
  payload: { scope: "all" } | { scope: "invoice"; invoiceId: string },
  key: string,
) {
  if (!token.value || activeCheckout.value) return;
  activeCheckout.value = key;
  checkoutError.value = "";
  try {
    const intent = await clientActionService.checkout(token.value, payload);
    if (!intent.checkoutUrl) throw new Error("Checkout unavailable.");
    window.location.assign(intent.checkoutUrl);
  } catch (caught: unknown) {
    if (caught instanceof ClientActionApiError && caught.termsUrl) {
      termsUrl.value = caught.termsUrl;
      error.value = caught.message;
      data.value = null;
    } else {
      checkoutError.value =
        caught instanceof Error ? caught.message : "Unable to start checkout.";
    }
  } finally {
    activeCheckout.value = null;
  }
}

function payAll() {
  return startCheckout({ scope: "all" }, "all");
}

function payInvoice(invoiceId: string) {
  return startCheckout({ scope: "invoice", invoiceId }, invoiceId);
}

onMounted(load);
</script>

<style scoped>
.action {
  min-height: 100dvh;
  background: var(--p-shell);
  color: var(--p-text);
  font-family: "DM Sans", system-ui, sans-serif;
}

.action__main {
  margin: 0 auto;
  max-width: 56rem;
  padding: 3.5rem 1.25rem 4rem;
}

.action__state {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  gap: 0.85rem;
  padding: 2rem;
  text-align: center;
}

.action__spinner {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: 2px solid;
  animation: spin 0.8s linear infinite;
}

.action__state-label {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
 
}

.action__state-title {
  margin: 0;
  font-family: "Cormorant Garamond", serif;
  font-size: 2rem;
}

.action__state-copy {
  margin: 0;
  max-width: 22rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.action__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 2.5rem;
}

.action__brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.action__logo {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  object-fit: cover;
}

.action__studio {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.action__job {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
}

.action__rule {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid;
}

.action__title {
  margin: 0;
  font-family: "Cormorant Garamond", serif;
  font-size: clamp(2.4rem, 5vw, 2.8rem);
  font-weight: 500;
  line-height: 1.1;
}

.action__cta {
  display: inline-flex;
  width: 100%;
  height: 3.15rem;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  border: 0;
  border-radius: 2px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
 
  text-decoration: none;
  cursor: pointer;
  transition: opacity 180ms ease, transform 180ms ease;
}

.action__cta--inline {
  width: auto;
  min-width: 10rem;
  margin-top: 0.5rem;
  padding: 0 1.5rem;
}

.action__cta:hover:not(:disabled) {
  opacity: 0.94;
  transform: translateY(-1px);
}

.action__cta:disabled {
  opacity: 0.65;
  cursor: wait;
}

.action__link {
  display: inline-flex;
  width: 100%;
  margin-top: 2rem;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.action__error {
  margin: 1.5rem 0 0;
  font-size: 0.85rem;
  color: #c45c5c;
}

.pay-grid {
  display: grid;
  gap: 3rem;
}

@media (min-width: 900px) {
  .pay-grid {
    grid-template-columns: 1fr 1.4fr;
    gap: 3.5rem;
    align-items: start;
  }
}

.pay-label {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.22em;
 
}

.pay-amount {
  margin: 1rem 0 0;
  font-family: "Cormorant Garamond", serif;
  font-size: clamp(2.8rem, 7vw, 3.5rem);
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pay-client {
  margin: 1rem 0 0;
  font-size: 0.88rem;
}

.pay-empty {
  margin: 1.5rem 0 0;
  font-size: 0.9rem;
}

.pay-invoices-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid;
}

.pay-invoices-title {
  margin: 0;
  font-family: "Cormorant Garamond", serif;
  font-size: 1.8rem;
  font-weight: 500;
}

.pay-count {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
 
}

.pay-list {
  display: grid;
  gap: 1.75rem;
}

.pay-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .pay-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.pay-row-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.pay-row-meta {
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.pay-row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

@media (min-width: 640px) {
  .pay-row-right {
    align-items: flex-end;
  }
}

.pay-row-amount {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.pay-row-status {
  margin: 0;
  font-size: 0.65rem;
  letter-spacing: 0.16em;
 
}

.pay-row-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.15rem;
  margin-top: 0.35rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 2px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
 
  cursor: pointer;
}

.pay-row-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.portal-reveal {
  animation: portal-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes portal-reveal {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .portal-reveal { animation: none; }
  .action__spinner { animation: none; }
}
</style>
