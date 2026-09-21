<template>
  <div class="action portal-font" :style="themeVars">
    <PortalLoadingState v-if="isLoading" label="Loading terms" />

    <PortalErrorState
      v-else-if="error"
      title="Unable to open terms"
      :message="error"
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

      <div
        class="action__rule"
        :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
      >
        <h1 class="action__title">{{ data.contract.title }}</h1>
        <p
          v-if="data.clientName"
          class="action__sub"
          :style="{ color: 'var(--p-muted)' }"
        >
          For {{ data.clientName }}
        </p>
      </div>

      <div
        v-if="safeBody"
        class="contract-body"
        v-html="safeBody"
      />
      <p v-else class="action__empty" :style="{ color: 'var(--p-muted)' }">
        No contract content available.
      </p>

      <div
        v-if="data.complete"
        class="action__done"
        :style="{
          borderColor: 'color-mix(in srgb, var(--p-accent) 35%, transparent)',
          background: 'var(--p-accent-bg)',
          color: 'var(--p-text)',
        }"
      >
        Terms already accepted
        <span v-if="data.signerName"> by {{ data.signerName }}</span>.
        <div v-if="data.signatureImage" class="action__signed">
          <p class="action__field-label" :style="{ color: 'var(--p-muted)' }">
            Signature
          </p>
          <img
            :src="data.signatureImage"
            :alt="data.signerName ? `${data.signerName} signature` : 'Signature'"
            class="action__signed-img"
          />
        </div>
      </div>

      <form v-else class="action__form" @submit.prevent="submit">
        <button
          type="button"
          class="action__check"
          :aria-pressed="agreed"
          @click="agreed = !agreed"
        >
          <span
            class="action__check-box"
            :class="{ 'is-on': agreed }"
            :style="
              agreed
                ? { background: 'var(--p-text)', borderColor: 'var(--p-text)', color: 'var(--p-shell)' }
                : { borderColor: 'color-mix(in srgb, var(--p-border) 70%, transparent)' }
            "
          >
            <Check v-if="agreed" class="h-3.5 w-3.5" />
          </span>
          <span class="action__check-label">
            I have read and agree to these terms.
          </span>
        </button>

        <div v-if="data.requireSignature" class="action__sign">
          <p class="action__field-label" :style="{ color: 'var(--p-muted)' }">
            Signature
          </p>
          <SignaturePad @change="onSignatureChange" />

          <label class="action__field">
            <span class="action__field-label" :style="{ color: 'var(--p-muted)' }">
              Full legal name
            </span>
            <input
              v-model="signerName"
              type="text"
              class="action__input"
              :placeholder="data.contract.signerHint || 'Your full name'"
              autocomplete="name"
            />
          </label>
        </div>

        <p v-if="submitError" class="action__error">{{ submitError }}</p>

        <button
          type="submit"
          class="action__cta"
          :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
          :disabled="isSubmitting"
        >
          {{
            isSubmitting
              ? "Saving..."
              : data.requireSignature
                ? "Agree and sign"
                : "Agree and continue"
          }}
        </button>
      </form>

      <a
        v-if="data.complete && data.payUrl"
        :href="data.payUrl"
        class="action__cta"
        :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
      >
        Continue to payment
      </a>

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
import { Check, Moon, Sun } from "lucide-vue-next";
import { useSanitize } from "@/composables/useSanitize";
import { usePortalTheme } from "@/composables/usePortalTheme";
import SignaturePad from "@/components/client-action/SignaturePad.vue";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import {
  ClientActionApiError,
  clientActionService,
  type ClientActionTermsData,
} from "@/services/client-action.service";

const route = useRoute();
const { sanitize } = useSanitize();
const data = ref<ClientActionTermsData | null>(null);
const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme({
  accentOverride: () => data.value?.studio.brandColor,
});

const token = computed(() => String(route.query.t || ""));
const isLoading = ref(true);
const error = ref("");
const agreed = ref(false);
const signerName = ref("");
const signatureImage = ref<string | null>(null);
const signatureEmpty = ref(true);
const isSubmitting = ref(false);
const submitError = ref("");

const safeBody = computed(() =>
  data.value?.contract.bodyHtml
    ? sanitize(data.value.contract.bodyHtml)
    : "",
);

function onSignatureChange(payload: { empty: boolean; dataUrl: string | null }) {
  signatureEmpty.value = payload.empty;
  signatureImage.value = payload.dataUrl;
}

async function load() {
  if (!token.value) {
    error.value = "This link is missing or invalid.";
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = "";
  try {
    data.value = await clientActionService.getTerms(token.value);
    setAccent(data.value.studio.brandColor);
    if (data.value.signerName) signerName.value = data.value.signerName;
  } catch (caught: unknown) {
    error.value =
      caught instanceof ClientActionApiError
        ? caught.message
        : "Unable to load terms.";
  } finally {
    isLoading.value = false;
  }
}

async function submit() {
  if (!token.value || !data.value) return;
  submitError.value = "";
  if (!agreed.value) {
    submitError.value = "Please confirm you agree to the terms.";
    return;
  }
  if (data.value.requireSignature) {
    if (signatureEmpty.value || !signatureImage.value) {
      submitError.value = "Please draw your signature.";
      return;
    }
    if (!signerName.value.trim()) {
      submitError.value = "Please enter your full legal name.";
      return;
    }
  }
  isSubmitting.value = true;
  try {
    const result = await clientActionService.acceptTerms(token.value, {
      agreed: true,
      signerName: signerName.value.trim() || undefined,
      signatureImage: signatureImage.value || undefined,
    });
    if (result.payUrl) {
      window.location.assign(result.payUrl);
      return;
    }
    await load();
  } catch (caught: unknown) {
    submitError.value =
      caught instanceof ClientActionApiError
        ? caught.message
        : "Unable to save your agreement.";
  } finally {
    isSubmitting.value = false;
  }
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
  max-width: 42rem;
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
  letter-spacing: 0.02em;
}

.action__job {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}

.action__rule {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid;
}

.action__title {
  margin: 0;
  font-family: "Cormorant Garamond", serif;
  font-size: clamp(2.2rem, 5vw, 2.8rem);
  font-weight: 500;
  line-height: 1.1;
}

.action__sub {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
  letter-spacing: 0.03em;
}

.action__empty {
  margin: 0;
  font-size: 0.9rem;
}

.contract-body {
  font-size: 0.95rem;
  line-height: 1.75;
}

.contract-body :deep(p) {
  margin: 0 0 0.95em;
}

.contract-body :deep(ul),
.contract-body :deep(ol) {
  margin: 0 0 0.95em;
  padding-left: 1.25rem;
}

.contract-body :deep(a) {
  color: var(--p-accent);
  text-decoration: underline;
}

.action__done {
  margin-top: 2rem;
  border: 1px solid;
  padding: 1rem 1.1rem;
  font-size: 0.9rem;
}

.action__signed {
  display: grid;
  gap: 0.55rem;
  margin-top: 1.1rem;
}

.action__signed-img {
  display: block;
  max-width: 16rem;
  max-height: 6rem;
  width: auto;
  height: auto;
  object-fit: contain;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--p-border) 50%, transparent);
  padding: 0.5rem;
}

.action__form {
  display: grid;
  gap: 1.5rem;
  margin-top: 2.5rem;
}

.action__check {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.action__check-box {
  display: grid;
  place-items: center;
  width: 1.15rem;
  height: 1.15rem;
  margin-top: 0.15rem;
  border: 1px solid;
  border-radius: 2px;
  flex-shrink: 0;
  transition: background 160ms ease, border-color 160ms ease;
}

.action__check-label {
  font-size: 0.92rem;
  line-height: 1.45;
}

.action__sign {
  display: grid;
  gap: 1.25rem;
}

.action__field {
  display: grid;
  gap: 0.55rem;
}

.action__field-label {
  font-size: 0.7rem;
  letter-spacing: 0.16em;
 
}

.action__input {
  width: 100%;
  height: 3rem;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 60%, transparent);
  border-radius: 0;
  background: transparent;
  padding: 0;
  font-size: 0.95rem;
  color: var(--p-text);
  outline: none;
  transition: border-color 250ms ease;
}

.action__input:focus {
  border-bottom-color: var(--p-accent);
}

.action__error {
  margin: 0;
  font-size: 0.85rem;
  color: #c45c5c;
}

.action__cta {
  display: inline-flex;
  width: 100%;
  height: 3.15rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 2px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
 
  text-decoration: none;
  cursor: pointer;
  transition: opacity 180ms ease, transform 180ms ease;
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
  margin-top: 1rem;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-decoration: underline;
  text-underline-offset: 0.2em;
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
