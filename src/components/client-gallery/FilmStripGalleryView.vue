<script setup lang="ts">
import {
  Download,
  Moon,
  Play,
  Search,
  Share2,
  Sun,
} from "lucide-vue-next";
import type { PublicGallery } from "@/services/gallery.service";
import GalleryMediaTile from "./GalleryMediaTile.vue";
import type { GalleryLayoutItem, GalleryLayoutSection } from "./designs";

defineProps<{
  gallery: PublicGallery;
  coverUrl: string;
  clientName: string;
  accentColor: string;
  isDark: boolean;
  photoCount: number;
  videoCount: number;
  visibleMediaCount: number;
  visiblePhotosCount: number;
  searchQuery: string;
  sections: GalleryLayoutSection[];
  isSelected: (id: string) => boolean;
  isRevealed: (id: string) => boolean;
  isHydrated: (id: string) => boolean;
  isLoaded: (id: string) => boolean;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  toggleTheme: [];
  share: [];
  download: [];
  present: [];
  openItem: [item: GalleryLayoutItem];
  toggleSelect: [id: string];
  mediaLoad: [id: string];
}>();

function openItem(item: GalleryLayoutItem) {
  emit("openItem", item);
}

function frameLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}
</script>

<template>
  <header
    class="gallery-reveal gallery-reveal-nav sticky top-0 z-30 border-b backdrop-blur transition-colors duration-300"
    :style="{ background: 'color-mix(in srgb, var(--p-shell) 96%, transparent)', borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
  >
    <div class="mx-auto flex h-14 max-w-[100vw] items-center gap-3 px-4 sm:px-6 lg:px-8">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <img
          v-if="gallery.studio.logoUrl"
          :src="gallery.studio.logoUrl"
          :alt="gallery.studio.name"
          class="h-7 w-7 shrink-0 rounded-sm object-contain bg-white/5"
        />
        <div class="min-w-0">
          <p class="truncate text-xs font-semibold tracking-wide" :style="{ color: 'var(--p-text)' }">
            {{ gallery.title }}
          </p>
          <p class="truncate text-[10px] tracking-wide" :style="{ color: 'var(--p-muted)' }">
            {{ clientName }} · {{ photoCount }} photos · {{ videoCount }} videos
          </p>
        </div>
      </div>

      <div class="relative hidden w-44 sm:block md:w-56">
        <Search class="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2" :style="{ color: 'var(--p-muted)' }" />
        <input
          :value="searchQuery"
          type="search"
          placeholder="Search frames"
          aria-label="Search photos"
          class="gallery-search h-8 w-full rounded-none border-0 border-b bg-transparent pl-6 pr-0 text-xs shadow-none outline-none"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', color: 'var(--p-text)' }"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70"
          :style="{ color: 'var(--p-text)' }"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="emit('toggleTheme')"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70"
          :style="{ color: 'var(--p-text)' }"
          aria-label="Share gallery"
          @click="emit('share')"
        >
          <Share2 class="h-4 w-4" />
        </button>
        <button
          v-if="gallery.allowDownload"
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70"
          :style="{ color: 'var(--p-text)' }"
          aria-label="Download gallery"
          @click="emit('download')"
        >
          <Download class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="ml-1 inline-flex items-center gap-1.5 px-2 text-[11px] font-medium tracking-wide transition hover:opacity-65 disabled:cursor-not-allowed disabled:opacity-35"
          :style="{ color: accentColor }"
          :disabled="!visiblePhotosCount"
          @click="emit('present')"
        >
          <Play class="h-3.5 w-3.5 fill-current" />
          <span class="hidden sm:inline">Present</span>
        </button>
      </div>
    </div>
  </header>

  <main class="gallery-reveal gallery-reveal-content pb-16 pt-6">
    <div
      v-if="coverUrl"
      class="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div class="relative aspect-[21/9] overflow-hidden sm:aspect-[2.6/1]">
        <img
          :src="coverUrl"
          :alt="`${clientName} gallery cover`"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          class="gallery-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
        <div class="absolute inset-y-0 left-0 flex max-w-lg flex-col justify-end p-6 text-white sm:p-8">
          <p class="mb-2 text-[10px] font-medium tracking-[0.18em] text-white/70">
            Film strip
          </p>
          <h1
            class="portal-display font-medium tracking-tight"
            style="font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.05;"
          >
            {{ gallery.title }}
          </h1>
        </div>
      </div>
    </div>

    <div class="relative mb-6 px-4 sm:hidden">
      <Search class="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2" :style="{ color: 'var(--p-muted)' }" />
      <input
        :value="searchQuery"
        type="search"
        placeholder="Search frames"
        aria-label="Search photos"
        class="gallery-search h-10 w-full rounded-none border-0 border-b bg-transparent pl-8 pr-0 text-sm shadow-none outline-none"
        :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', color: 'var(--p-text)' }"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div
      v-if="!sections.length"
      class="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6"
    >
      <p
        class="font-medium tracking-tight"
        style="font-family: 'Cormorant Garamond', serif; font-size: 2rem;"
        :style="{ color: 'var(--p-text)' }"
      >
        {{ searchQuery ? "No frames found" : "No media shared yet" }}
      </p>
      <p class="mt-3 text-sm" :style="{ color: 'var(--p-muted)' }">
        {{ visibleMediaCount }} frames in view
      </p>
    </div>

    <div v-else class="space-y-14">
      <section
        v-for="(section, sectionIndex) in sections"
        :key="section.id"
        class="gallery-section-enter"
        :style="{ '--section-i': sectionIndex }"
      >
        <div class="mx-auto mb-4 flex max-w-7xl items-baseline justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <h2
            class="font-medium tracking-tight"
            style="font-family: 'Cormorant Garamond', serif; font-size: 1.85rem;"
            :style="{ color: 'var(--p-text)' }"
          >
            {{ section.name || `Reel ${sectionIndex + 1}` }}
          </h2>
          <span class="text-[11px] tabular-nums tracking-wide" :style="{ color: 'var(--p-muted)' }">
            {{ section.items.length }} frames
          </span>
        </div>

        <div
          class="film-rail flex gap-3 overflow-x-auto px-4 pb-4 sm:gap-4 sm:px-6 lg:px-8"
          style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;"
        >
          <div
            v-for="(item, itemIndex) in section.items"
            :key="item.id"
            class="film-frame w-[68vw] shrink-0 sm:w-[42vw] md:w-[28vw] lg:w-[22vw]"
            style="scroll-snap-align: start;"
          >
            <div
              class="mb-2 text-[10px] tabular-nums tracking-wide"
              :style="{ color: 'var(--p-muted)' }"
            >
              <span>{{ frameLabel(itemIndex) }}</span>
            </div>
            <div
              class="overflow-hidden border"
              :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 55%, transparent)' }"
            >
              <GalleryMediaTile
                :item="item"
                :item-index="itemIndex"
                :accent-color="accentColor"
                :allow-selection="gallery.allowSelection"
                :selected="isSelected(item.id)"
                :revealed="isRevealed(item.id)"
                :hydrated="isHydrated(item.id)"
                :loaded="isLoaded(item.id)"
                @open="openItem(item)"
                @toggle-select="emit('toggleSelect', item.id)"
                @load="emit('mediaLoad', item.id)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <footer
    class="border-t py-10 transition-colors duration-300"
    :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', background: 'var(--p-shell)' }"
  >
    <div class="flex items-center justify-center gap-2 text-[10px] tracking-wide" :style="{ color: 'var(--p-muted)' }">
      <span>Powered by</span>
      <span class="font-semibold" :style="{ color: 'var(--p-text)' }">Sesifoto</span>
    </div>
  </footer>
</template>
