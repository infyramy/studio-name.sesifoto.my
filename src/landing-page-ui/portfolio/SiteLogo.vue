<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { LogoStyle } from "../types";
import {
  DEFAULT_SESIFOTO_IMAGE,
  DEFAULT_SESIFOTO_IMAGE_BG,
  isDefaultSesifotoImage,
  resolveImageUrl,
} from "@/lib/default-image";

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

const resolvedSrc = computed(() => resolveImageUrl(props.src));
const displaySrc = ref(resolvedSrc.value);
watch(resolvedSrc, (value) => {
  displaySrc.value = value;
});

const showingDefault = computed(() =>
  isDefaultSesifotoImage(displaySrc.value),
);

function onError() {
  if (displaySrc.value !== DEFAULT_SESIFOTO_IMAGE) {
    displaySrc.value = DEFAULT_SESIFOTO_IMAGE;
  }
}

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

const imageClass = computed(() => {
  if (isTransparent.value) return "h-full w-full object-contain";
  return showingDefault.value
    ? "h-full w-full object-contain p-[14%] box-border"
    : "h-full w-full object-cover";
});

const frameStyle = computed(() => {
  if (showingDefault.value) {
    return { backgroundColor: DEFAULT_SESIFOTO_IMAGE_BG };
  }
  if (isTransparent.value) return undefined;
  return {
    backgroundColor: "var(--card-bg)",
    backdropFilter: "var(--card-backdrop)",
    WebkitBackdropFilter: "var(--card-backdrop)",
    boxShadow: "var(--card-shadow)",
  };
});

const transparentImgStyle = computed(() =>
  showingDefault.value
    ? {
        backgroundColor: DEFAULT_SESIFOTO_IMAGE_BG,
        padding: "0.35rem 0.6rem",
        borderRadius: "0.375rem",
        boxSizing: "border-box",
      }
    : undefined,
);
</script>

<template>
  <img
    v-if="isTransparent"
    :src="displaySrc"
    :alt="alt"
    :class="frameClass"
    :style="transparentImgStyle"
    referrerpolicy="no-referrer"
    @error="onError"
  />
  <div v-else :class="frameClass" :style="frameStyle">
    <img
      :src="displaySrc"
      :alt="alt"
      :class="imageClass"
      referrerpolicy="no-referrer"
      @error="onError"
    />
  </div>
</template>
