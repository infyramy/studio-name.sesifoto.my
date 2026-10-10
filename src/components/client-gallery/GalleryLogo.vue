<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { galleryMonoLogoUrl, type PublicGallery } from "@/services/gallery.service";

const props = withDefaults(
  defineProps<{
    gallery: PublicGallery;
    /** Show the studio initial when there is no logo */
    fallback?: boolean;
  }>(),
  { fallback: false },
);

const design = computed(() => props.gallery.designSettings ?? {});
const visible = computed(() => design.value.showLogo ?? true);
const sizeClass = computed(
  () =>
    ({ small: "h-5 max-w-[90px]", medium: "h-7 max-w-[120px]", large: "h-10 max-w-[170px]" })[
      design.value.logoSize ?? "medium"
    ],
);

const monoFailed = ref(false);
watch(
  () => [props.gallery.studio.logoUrl, design.value.logoMode],
  () => (monoFailed.value = false),
);
const logoSrc = computed(() => {
  const logoUrl = props.gallery.studio.logoUrl;
  const mode = design.value.logoMode;
  if (!logoUrl || !mode || monoFailed.value) return logoUrl;
  return galleryMonoLogoUrl(props.gallery.id, logoUrl, mode);
});

function onLogoError() {
  if (design.value.logoMode && !monoFailed.value) monoFailed.value = true;
}
</script>

<template>
  <template v-if="visible">
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :alt="gallery.studio.name"
      class="w-auto shrink-0 object-contain"
      :class="sizeClass"
      @error="onLogoError"
    />
    <span
      v-else-if="fallback"
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[11px] font-semibold"
      :style="{ backgroundColor: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
    >
      {{ gallery.studio.name[0] || "S" }}
    </span>
  </template>
</template>
