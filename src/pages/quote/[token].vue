<template>
  <div
    class="portal-scroll h-dvh overflow-y-auto portal-font transition-colors duration-300"
    :style="[{ background: 'var(--p-shell)', color: 'var(--p-text)' }, themeVars]"
  >
    <PortalLoadingState v-if="loading" label="Loading quotation" />

    <PortalErrorState
      v-else-if="error"
      title="Quotation unavailable"
      :message="error"
    />

    <template v-else-if="quote">
      <div class="absolute right-4 top-4 z-20">
        <button
          type="button"
          class="portal-icon-btn"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleDark"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>
      </div>

      <PortalQuotationDetail
        :quote="quote"
        :acting="acting"
        :action-error="actionError"
        @accept="accept"
        @decline="decline"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Moon, Sun } from "lucide-vue-next";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import PortalQuotationDetail from "@/components/portal/PortalQuotationDetail.vue";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  acceptPublicQuotation,
  declinePublicQuotation,
  fetchPublicQuotation,
  type PublicQuotation,
} from "@/services/public-quotation.service";

const route = useRoute();
const loading = ref(true);
const error = ref("");
const actionError = ref("");
const quote = ref<PublicQuotation | null>(null);
const acting = ref<"accept" | "decline" | null>(null);

const { isDark, themeVars, setAccent, toggleDark } = usePortalTheme({
  accentOverride: () => quote.value?.studio.brandColor,
});

watch(
  () => quote.value?.studio.brandColor,
  (color) => {
    if (color) setAccent(color);
  },
);

const load = async () => {
  const token = String(route.params.token || "");
  if (!token) {
    error.value = "This quotation link is missing or invalid.";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    quote.value = await fetchPublicQuotation(token);
    setAccent(quote.value.studio.brandColor);
  } catch (e: any) {
    error.value =
      e?.data?.message || e?.message || "Unable to load this quotation.";
  } finally {
    loading.value = false;
  }
};

const accept = async () => {
  const token = String(route.params.token || "");
  if (!token || acting.value) return;
  acting.value = "accept";
  actionError.value = "";
  try {
    quote.value = await acceptPublicQuotation(token);
  } catch (e: any) {
    actionError.value = e?.data?.message || e?.message || "Could not accept.";
  } finally {
    acting.value = null;
  }
};

const decline = async () => {
  const token = String(route.params.token || "");
  if (!token || acting.value) return;
  acting.value = "decline";
  actionError.value = "";
  try {
    quote.value = await declinePublicQuotation(token);
  } catch (e: any) {
    actionError.value = e?.data?.message || e?.message || "Could not decline.";
  } finally {
    acting.value = null;
  }
};

onMounted(load);
</script>
