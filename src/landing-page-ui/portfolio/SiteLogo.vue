<script setup lang="ts">
import { computed } from "vue";
import type { LogoStyle } from "../types";

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    logoStyle?: LogoStyle;
    variant?: "header" | "footer";
  }>(),
  {
    logoStyle: "transparent",
    variant: "header",
  },
);

const isTransparent = computed(() => props.logoStyle === "transparent");
const isCircle = computed(() => props.logoStyle === "circle");

const frameClass = computed(() => {
  if (isTransparent.value) {
    return props.variant === "header"
      ? "h-9 w-auto max-w-[140px] md:h-12 md:max-w-none"
      : "h-10 w-auto max-w-[160px] opacity-90";
  }

  if (props.variant === "header") {
    return isCircle.value
      ? "h-9 w-9 overflow-hidden rounded-full border border-[var(--border-color)] md:h-12 md:w-12"
      : "h-9 w-9 overflow-hidden rounded-xl border border-[var(--border-color)] md:h-12 md:w-12";
  }

  return isCircle.value
    ? "h-10 w-10 overflow-hidden rounded-full border border-[var(--border-color)] opacity-90"
    : "h-10 w-10 overflow-hidden rounded-xl border border-[var(--border-color)] opacity-90";
});

const imageClass = computed(() =>
  isTransparent.value ? "h-full w-full object-contain" : "h-full w-full object-cover",
);

const frameStyle = computed(() =>
  isTransparent.value
    ? undefined
    : {
        backgroundColor: "var(--card-bg)",
        backdropFilter: "var(--card-backdrop)",
        WebkitBackdropFilter: "var(--card-backdrop)",
        boxShadow: "var(--card-shadow)",
      },
);
</script>

<template>
  <img
    v-if="isTransparent"
    :src="src"
    :alt="alt"
    :class="frameClass"
    referrerpolicy="no-referrer"
  />
  <div v-else :class="frameClass" :style="frameStyle">
    <img
      :src="src"
      :alt="alt"
      :class="imageClass"
      referrerpolicy="no-referrer"
    />
  </div>
</template>
