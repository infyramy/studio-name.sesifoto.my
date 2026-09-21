<script setup lang="ts">
import { Check, Play } from "lucide-vue-next";
import type { GalleryLayoutItem } from "./designs";

defineProps<{
  item: GalleryLayoutItem;
  itemIndex: number;
  accentColor: string;
  allowSelection: boolean;
  selected: boolean;
  revealed: boolean;
  hydrated: boolean;
  loaded: boolean;
}>();

const emit = defineEmits<{
  open: [];
  toggleSelect: [];
  load: [];
}>();
</script>

<template>
  <article
    :data-media-id="item.id"
    role="button"
    tabindex="0"
    :aria-label="item.type === 'video' ? `Play ${item.label}` : `View ${item.label}`"
    class="group relative cursor-pointer overflow-hidden outline-none focus-visible:ring-2 gallery-media-tile"
    :class="{ 'is-revealed': revealed }"
    :style="{
      '--tw-ring-color': accentColor,
      background: 'color-mix(in srgb, var(--p-card) 50%, transparent)',
      '--tile-i': itemIndex,
    }"
    @click="emit('open')"
    @keydown.enter="emit('open')"
    @keydown.space.prevent="emit('open')"
  >
    <template v-if="item.type === 'video'">
      <div class="relative aspect-video w-full overflow-hidden bg-zinc-900/80">
        <img
          v-if="item.hasThumbnail"
          :src="item.thumb"
          :alt="item.label"
          loading="lazy"
          decoding="async"
          class="gallery-media-asset absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
          :class="{ 'is-loaded': loaded }"
          @load="emit('load')"
        />
        <video
          v-else-if="hydrated"
          :src="item.url"
          class="gallery-media-asset absolute inset-0 h-full w-full object-cover"
          :class="{ 'is-loaded': loaded }"
          muted
          preload="metadata"
          playsinline
          @loadedmetadata="emit('load')"
        />
        <span class="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />
        <span class="absolute inset-0 flex items-center justify-center">
          <span class="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-black/30 text-white backdrop-blur-sm transition group-hover:scale-105">
            <Play class="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </span>
      </div>
    </template>
    <template v-else>
      <img
        :src="item.url"
        :alt="item.label"
        loading="lazy"
        decoding="async"
        class="gallery-media-asset block w-full object-cover transition duration-500 group-hover:scale-[1.015]"
        :class="[item.aspectClass, { 'is-loaded': loaded }]"
        @load="emit('load')"
      />
      <span
        class="absolute inset-0 transition"
        :class="selected ? 'bg-black/20' : 'bg-black/0 group-hover:bg-black/10'"
      />
      <span
        v-if="selected"
        class="pointer-events-none absolute inset-0 border-[3px]"
        :style="{ borderColor: accentColor }"
      />
      <button
        v-if="allowSelection"
        type="button"
        class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-white shadow-sm backdrop-blur-sm transition"
        :class="selected ? 'scale-100 border-transparent' : 'scale-90 border-white/70 bg-black/25 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:opacity-100'"
        :style="selected ? { backgroundColor: accentColor } : {}"
        :aria-label="`${selected ? 'Deselect' : 'Select'} ${item.label}`"
        @click.stop="emit('toggleSelect')"
      >
        <Check v-if="selected" class="h-4 w-4" />
      </button>
    </template>
  </article>
</template>
