<script setup lang="ts">
import { computed } from "vue";
import type { GalleryGridStyle, GallerySizeStep } from "@/services/gallery.service";
import GalleryMediaTile from "./GalleryMediaTile.vue";
import type { GalleryLayoutItem } from "./designs";

const props = defineProps<{
  items: GalleryLayoutItem[];
  gridStyle: GalleryGridStyle;
  photoSize: GallerySizeStep;
  photoGap: GallerySizeStep;
  accentColor: string;
  allowSelection: boolean;
  isSelected: (id: string) => boolean;
  isRevealed: (id: string) => boolean;
  isHydrated: (id: string) => boolean;
  isLoaded: (id: string) => boolean;
}>();

const emit = defineEmits<{
  open: [item: GalleryLayoutItem];
  toggleSelect: [id: string];
  load: [id: string];
}>();

const COLUMNS: Record<GallerySizeStep, [number, number, number]> = {
  small: [3, 4, 6],
  medium: [2, 3, 4],
  large: [1, 2, 3],
};
const WIDE_COLUMNS: Record<GallerySizeStep, [number, number, number]> = {
  small: [1, 2, 3],
  medium: [1, 2, 2],
  large: [1, 1, 2],
};
const GAPS: Record<GallerySizeStep, string> = {
  small: "4px",
  medium: "12px",
  large: "24px",
};
const JUSTIFIED_SPANS = [3, 2, 4, 2, 3, 3, 2];

const gridVars = computed(() => {
  const [base, sm, lg] = (props.gridStyle === "wide" ? WIDE_COLUMNS : COLUMNS)[props.photoSize];
  return {
    "--cols": base,
    "--cols-sm": sm,
    "--cols-lg": lg,
    "--gap": GAPS[props.photoGap],
  };
});

const cropClass = computed(
  () =>
    ({
      masonry: "aspect-auto",
      justified: "h-full",
      grid: "aspect-[4/5]",
      square: "aspect-square",
      wide: "aspect-video",
      mosaic: "aspect-square h-full",
    })[props.gridStyle],
);

function tileItem(item: GalleryLayoutItem): GalleryLayoutItem {
  return item.type === "photo" ? { ...item, aspectClass: cropClass.value } : item;
}

function cellStyle(index: number) {
  if (props.gridStyle === "justified") {
    return { flexGrow: JUSTIFIED_SPANS[index % JUSTIFIED_SPANS.length] };
  }
  return undefined;
}

function cellClass(index: number) {
  if (props.gridStyle === "mosaic" && index % 6 === 0) return "gallery-grid__feature";
  return "";
}
</script>

<template>
  <div class="gallery-grid" :data-grid="gridStyle" :style="gridVars">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="gallery-grid__cell"
      :class="cellClass(index)"
      :style="cellStyle(index)"
    >
      <GalleryMediaTile
        class="h-full"
        :item="tileItem(item)"
        :item-index="index"
        :accent-color="accentColor"
        :allow-selection="allowSelection"
        :selected="isSelected(item.id)"
        :revealed="isRevealed(item.id)"
        :hydrated="isHydrated(item.id)"
        :loaded="isLoaded(item.id)"
        @open="emit('open', item)"
        @toggle-select="emit('toggleSelect', item.id)"
        @load="emit('load', item.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.gallery-grid {
  --cols-active: var(--cols);
  display: grid;
  grid-template-columns: repeat(var(--cols-active), minmax(0, 1fr));
  gap: var(--gap);
}

@media (min-width: 640px) {
  .gallery-grid {
    --cols-active: var(--cols-sm);
  }
}

@media (min-width: 1024px) {
  .gallery-grid {
    --cols-active: var(--cols-lg);
  }
}

.gallery-grid[data-grid="masonry"] {
  display: block;
  columns: var(--cols-active);
  column-gap: var(--gap);
}

.gallery-grid[data-grid="masonry"] .gallery-grid__cell {
  break-inside: avoid;
  margin-bottom: var(--gap);
}

.gallery-grid[data-grid="justified"] {
  display: flex;
  flex-wrap: wrap;
}

.gallery-grid[data-grid="justified"] .gallery-grid__cell {
  flex-basis: calc(100% / (var(--cols-active) + 1));
  height: clamp(160px, calc(60vw / var(--cols-active)), 380px);
}

.gallery-grid[data-grid="mosaic"] {
  grid-auto-flow: dense;
}

@media (min-width: 640px) {
  .gallery-grid[data-grid="mosaic"] .gallery-grid__feature {
    grid-column: span 2;
    grid-row: span 2;
  }
}
</style>
