<script setup lang="ts">
import { computed, ref, watch, useAttrs } from "vue";
import {
  DEFAULT_SESIFOTO_IMAGE,
  DEFAULT_SESIFOTO_IMAGE_BG,
  isDefaultSesifotoImage,
  resolveImageUrl,
} from "@/lib/default-image";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    /** Optional custom fallback (defaults to Sesifoto logo) */
    fallbackSrc?: string;
  }>(),
  {
    src: null,
    alt: "",
    fallbackSrc: DEFAULT_SESIFOTO_IMAGE,
  },
);

const attrs = useAttrs();
const displaySrc = ref(resolveImageUrl(props.src, props.fallbackSrc));

watch(
  () => [props.src, props.fallbackSrc] as const,
  ([src, fallback]) => {
    displaySrc.value = resolveImageUrl(src, fallback);
  },
);

const showingDefault = computed(() =>
  isDefaultSesifotoImage(displaySrc.value),
);

const imgStyle = computed(() => {
  const base =
    attrs.style && typeof attrs.style === "object" && !Array.isArray(attrs.style)
      ? (attrs.style as Record<string, string>)
      : {};
  if (!showingDefault.value) return base;
  return {
    ...base,
    backgroundColor: DEFAULT_SESIFOTO_IMAGE_BG,
    padding: "14%",
    boxSizing: "border-box",
    objectFit: "contain",
  };
});

function onError() {
  if (displaySrc.value !== props.fallbackSrc) {
    displaySrc.value = props.fallbackSrc;
  }
}
</script>

<template>
  <img
    :src="displaySrc"
    :alt="alt"
    v-bind="attrs"
    :style="imgStyle"
    @error="onError"
  />
</template>
