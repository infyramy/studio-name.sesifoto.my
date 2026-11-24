<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { galleryMonoLogoUrl, type PublicGallery } from "@/services/gallery.service";
import {
  DEFAULT_SESIFOTO_IMAGE,
  DEFAULT_SESIFOTO_IMAGE_BG,
  isDefaultSesifotoImage,
  resolveImageUrl,
} from "@/lib/default-image";

const props = withDefaults(
  defineProps<{
    gallery: PublicGallery;
    /** @deprecated Kept for callers; missing logo now uses Sesifoto mark */
    fallback?: boolean;
  }>(),
  { fallback: false },
);

const design = computed(() => props.gallery.designSettings ?? {});
const visible = computed(() => design.value.showLogo ?? true);
const sizeClass = computed(
  () =>
    ({
      small: "h-7 w-7 rounded-full",
      medium: "h-9 w-9 rounded-full",
      large: "h-11 w-11 rounded-full",
    })[design.value.logoSize ?? "medium"],
);

const monoFailed = ref(false);
const usedDefault = ref(false);

watch(
  () => [props.gallery.studio.logoUrl, design.value.logoMode],
  () => {
    monoFailed.value = false;
    usedDefault.value = false;
  },
);

const logoSrc = computed(() => {
  const logoUrl = props.gallery.studio.logoUrl;
  const mode = design.value.logoMode;
  if (!logoUrl) return DEFAULT_SESIFOTO_IMAGE;
  if (!mode || monoFailed.value) return resolveImageUrl(logoUrl);
  return galleryMonoLogoUrl(props.gallery.id, logoUrl, mode);
});

function onLogoError() {
  if (design.value.logoMode && !monoFailed.value) {
    monoFailed.value = true;
    return;
  }
  if (!usedDefault.value) {
    usedDefault.value = true;
  }
}

const displaySrc = computed(() =>
  usedDefault.value ? DEFAULT_SESIFOTO_IMAGE : logoSrc.value,
);

const showingDefault = computed(() =>
  isDefaultSesifotoImage(displaySrc.value),
);

const logoStyle = computed(() => ({
  padding: "14%",
  boxSizing: "border-box" as const,
  ...(showingDefault.value
    ? { backgroundColor: DEFAULT_SESIFOTO_IMAGE_BG }
    : {}),
}));
</script>

<template>
  <template v-if="visible">
    <img
      :src="displaySrc"
      :alt="gallery.studio.name"
      class="shrink-0 object-contain"
      :class="sizeClass"
      :style="logoStyle"
      @error="onLogoError"
    />
  </template>
</template>
