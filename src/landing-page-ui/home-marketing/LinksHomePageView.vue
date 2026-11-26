<script setup lang="ts">
import LinkMicrositePageView from "../link-page/LinkMicrositePageView.vue";
import type {
  LandingPageTheme,
  ProductEntitlements,
  StudioLanguage,
} from "../types";

withDefaults(
  defineProps<{
    config: LandingPageTheme;
    language?: StudioLanguage;
    mode?: "live" | "preview";
    productEntitlements?: ProductEntitlements;
    loading?: boolean;
    loadError?: string | null;
    surfaceClass?: string;
    editable?: boolean;
    activeSection?: string | null;
  }>(),
  {
    language: "en",
    mode: "preview",
    productEntitlements: () => ({ studio: true, crm: true }),
    loading: false,
    loadError: null,
    surfaceClass: "landing-surface",
    editable: false,
    activeSection: null,
  },
);

const emit = defineEmits<{
  navigate: [url: string];
  languageChange: [lang: StudioLanguage];
  retryLoad: [];
  selectSection: [id: string];
}>();
</script>

<template>
  <LinkMicrositePageView
    :config="config"
    :language="language"
    :mode="mode"
    :product-entitlements="productEntitlements"
    :loading="loading"
    :load-error="loadError"
    :surface-class="surfaceClass"
    :editable="editable"
    :active-section="activeSection"
    @navigate="emit('navigate', $event)"
    @language-change="emit('languageChange', $event)"
    @retry-load="emit('retryLoad')"
    @select-section="emit('selectSection', $event)"
  />
</template>
