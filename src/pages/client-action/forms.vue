<template>
  <div class="action portal-font" :style="themeVars">
    <PortalLoadingState v-if="isLoading" label="Loading forms" />

    <PortalErrorState
      v-else-if="error"
      title="Unable to open forms"
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
          <PortalThemeIcon :is-dark="isDark" />
        </button>
      </header>

      <template v-if="activeForm">
        <button
          v-if="data.forms.length > 1"
          type="button"
          class="action__back"
          :style="{ color: 'var(--p-muted)' }"
          @click="activeFormId = null"
        >
          <ArrowLeft class="h-4 w-4" /> All forms
        </button>
        <div
          class="action__rule"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
        >
          <h1 class="action__title">{{ activeForm.title }}</h1>
          <p
            v-if="data.clientName"
            class="action__sub"
            :style="{ color: 'var(--p-muted)' }"
          >
            For {{ data.clientName }}
          </p>
        </div>
        <PortalFormFill
          :key="activeForm.id"
          :form="activeForm"
          :save-fn="(answers) => clientActionService.saveForm(token, activeForm!.id, answers)"
          :submit-fn="(answers) => clientActionService.submitForm(token, activeForm!.id, answers)"
          @updated="onUpdated"
        />
      </template>

      <template v-else>
        <div
          class="action__rule"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
        >
          <h1 class="action__title">Forms</h1>
          <p class="action__sub" :style="{ color: 'var(--p-muted)' }">
            {{ data.clientName ? `For ${data.clientName}. ` : "" }}Please fill in the forms below.
          </p>
        </div>
        <p v-if="!data.forms.length" class="action__empty" :style="{ color: 'var(--p-muted)' }">
          There are no forms to fill in right now.
        </p>
        <div v-else class="action__list">
          <button
            v-for="form in data.forms"
            :key="form.id"
            type="button"
            class="action__item"
            :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 45%, transparent)' }"
            @click="activeFormId = form.id"
          >
            <span class="min-w-0">
              <span class="action__item-title">{{ form.title }}</span>
              <span class="action__item-status" :style="{ color: 'var(--p-muted)' }">
                {{ form.status === "submitted" ? "Submitted" : "To fill in" }}
              </span>
            </span>
            <ChevronRight class="h-4 w-4 shrink-0" />
          </button>
        </div>
      </template>

      <a
        v-if="data.portalUrl"
        :href="data.portalUrl"
        class="action__link"
        :style="{ color: 'var(--p-muted)' }"
      >
        Open client portal
      </a>

      <PoweredBySesifoto class="mt-12" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ArrowLeft, ChevronRight } from "lucide-vue-next";
import PortalThemeIcon from "@/components/portal/PortalThemeIcon.vue";
import PortalFormFill from "@/components/portal/PortalFormFill.vue";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import PoweredBySesifoto from "@/components/PoweredBySesifoto.vue";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  ClientActionApiError,
  clientActionService,
  type ClientActionFormsData,
} from "@/services/client-action.service";
import type { PortalForm } from "@/services/portal.service";

const route = useRoute();
const data = ref<ClientActionFormsData | null>(null);
const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme({
  accentOverride: () => data.value?.studio.brandColor,
});

const token = computed(() => String(route.query.t || ""));
const isLoading = ref(true);
const error = ref("");
const activeFormId = ref<string | null>(null);

const activeForm = computed(
  () => data.value?.forms.find((form) => form.id === activeFormId.value) ?? null,
);

function onUpdated(updated: PortalForm) {
  if (!data.value) return;
  data.value.forms = data.value.forms.map((form) =>
    form.id === updated.id ? updated : form,
  );
}

async function load() {
  if (!token.value) {
    error.value = "This link is missing or invalid.";
    isLoading.value = false;
    return;
  }
  try {
    data.value = await clientActionService.getForms(token.value);
    setAccent(data.value.studio.brandColor);
    if (data.value.forms.length === 1) activeFormId.value = data.value.forms[0]!.id;
  } catch (caught: unknown) {
    error.value =
      caught instanceof ClientActionApiError
        ? caught.message
        : "Unable to load forms.";
  } finally {
    isLoading.value = false;
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

.action__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  cursor: pointer;
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

.action__list {
  display: grid;
  gap: 0.75rem;
}

.action__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  border: 1px solid;
  border-radius: 2px;
  background: transparent;
  padding: 1rem 1.1rem;
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 180ms ease;
}

.action__item:hover {
  transform: translateY(-1px);
}

.action__item-title {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
}

.action__item-status {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.8rem;
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
