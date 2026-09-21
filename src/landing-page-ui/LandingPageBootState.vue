<script setup lang="ts">
import { computed } from "vue";
import type { LandingPageTheme } from "./types";
import { createDefaultTheme } from "./presets";
import { useLandingPageStyles } from "./useLandingPageStyles";

const props = withDefaults(
  defineProps<{
    label?: string;
    error?: string | null;
    retryLabel?: string;
    theme?: LandingPageTheme | null;
    fullscreen?: boolean;
  }>(),
  {
    label: "Loading",
    error: null,
    retryLabel: "Try again",
    theme: null,
    fullscreen: true,
  },
);

const emit = defineEmits<{
  retry: [];
}>();

const styleTheme = computed(() => props.theme ?? createDefaultTheme());
const { themeStyle } = useLandingPageStyles(styleTheme);

const bootStyle = computed(() => {
  const t = styleTheme.value;
  const isDark = (t.mode || "dark") !== "light";
  const bg = t.secondaryColor || (isDark ? "#050505" : "#f7f7f5");
  const fg = t.secondaryTextColor || (isDark ? "#ffffff" : "#111111");
  const accent = t.primaryColor || fg;
  return {
    backgroundColor: bg,
    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
    ["--lp-boot-fg" as string]: fg,
    ["--lp-boot-track" as string]: isDark
      ? "rgba(255,255,255,0.14)"
      : "rgba(0,0,0,0.12)",
    ["--lp-boot-bar" as string]: accent,
  };
});

const showLogo = computed(() => !!props.theme?.logoUrl?.trim());
const showName = computed(() => !!props.theme?.studioName?.trim());
</script>

<template>
  <div
    class="lp-boot landing-surface"
    :class="{ 'lp-boot--full': fullscreen }"
    :style="bootStyle"
    role="status"
    aria-live="polite"
    :aria-label="error || label"
  >
    <component :is="'style'" v-html="themeStyle" />

    <template v-if="error">
      <p class="lp-boot__error">{{ error }}</p>
      <button type="button" class="lp-boot__retry" @click="emit('retry')">
        {{ retryLabel }}
      </button>
    </template>
    <template v-else>
      <div v-if="showLogo || showName" class="lp-boot__brand">
        <img
          v-if="showLogo"
          :src="theme!.logoUrl"
          :alt="theme?.studioName || ''"
          class="lp-boot__logo"
          referrerpolicy="no-referrer"
        />
        <p v-if="showName" class="lp-boot__name font-title">
          {{ theme!.studioName }}
        </p>
      </div>
      <div v-else class="lp-boot__mark" aria-hidden="true">
        <span class="lp-boot__dot" />
      </div>
      <div class="lp-boot__track" aria-hidden="true">
        <div class="lp-boot__bar" />
      </div>
      <p class="lp-boot__label">{{ label }}</p>
    </template>
  </div>
</template>
