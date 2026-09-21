<script setup lang="ts">
import { ref } from "vue";
import {
  ChevronDown,
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
  photoOpen: boolean;
  sections: GalleryLayoutSection[];
  isSelected: (id: string) => boolean;
  isRevealed: (id: string) => boolean;
  isHydrated: (id: string) => boolean;
  isLoaded: (id: string) => boolean;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:photoOpen": [value: boolean];
  toggleTheme: [];
  share: [];
  download: [];
  present: [];
  openItem: [item: GalleryLayoutItem];
  toggleSelect: [id: string];
  mediaLoad: [id: string];
}>();

const galleryNav = ref<HTMLElement | null>(null);

function scrollToGallery() {
  galleryNav.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openItem(item: GalleryLayoutItem) {
  emit("openItem", item);
}
</script>

<template>
  <section class="relative h-dvh min-h-[420px] overflow-hidden">
    <img
      v-if="coverUrl"
      :src="coverUrl"
      :alt="`${clientName} gallery cover`"
      loading="eager"
      decoding="async"
      fetchpriority="high"
      class="gallery-hero-image absolute inset-0 h-full w-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/60" />
    <div class="relative flex h-full items-center justify-center px-6 text-center text-white">
      <div class="gallery-hero-copy translate-y-5">
        <p class="mb-4 text-[11px] font-medium tracking-wide text-white/75">
          Client gallery
        </p>
        <h1 class="portal-display text-4xl font-medium tracking-tight sm:text-6xl lg:text-7xl">
          {{ clientName }}
        </h1>
        <div class="mx-auto mt-6 h-px w-10 bg-white/70" />
      </div>
    </div>
    <button
      type="button"
      class="gallery-scroll-indicator absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label="Scroll to gallery content"
      @click="scrollToGallery"
    >
      <ChevronDown class="h-5 w-5" />
    </button>
  </section>

  <nav
    ref="galleryNav"
    class="gallery-reveal gallery-reveal-nav relative z-20 border-b backdrop-blur transition-colors duration-300"
    :style="{ background: 'color-mix(in srgb, var(--p-shell) 95%, transparent)', borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
  >
    <div class="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-4 sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center">
        <p class="truncate text-xs font-semibold tracking-wide sm:text-sm" :style="{ color: 'var(--p-text)' }">
          {{ clientName }}
        </p>
      </div>

      <div class="flex min-w-0 items-center justify-center gap-3">
        <img
          v-if="gallery.studio.logoUrl"
          :src="gallery.studio.logoUrl"
          :alt="gallery.studio.name"
          class="h-7 w-7 rounded-sm object-contain bg-white/5"
        />
        <span
          v-else
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[11px] font-semibold"
          :style="{ backgroundColor: 'var(--p-accent-bg)', color: 'var(--p-accent)' }"
        >
          {{ gallery.studio.name[0] || "S" }}
        </span>
        <span
          class="hidden truncate text-[11px] font-medium tracking-wide sm:inline"
          :style="{ color: 'var(--p-text)' }"
        >
          {{ gallery.studio.name }}
        </span>
      </div>

      <div class="flex items-center justify-end gap-1">
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
      </div>
    </div>
  </nav>

  <main class="gallery-reveal gallery-reveal-content mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
    <header
      class="mb-14 flex flex-col gap-7 border-b pb-10 sm:flex-row sm:items-end sm:justify-between"
      :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
    >
      <div>
        <p class="mb-4 text-[11px] font-medium tracking-wide" :style="{ color: accentColor }">
          The collection
        </p>
        <h2
          class="font-medium tracking-tight"
          style="font-family: 'Cormorant Garamond', serif; font-size: 3rem; line-height: 1.1;"
          :style="{ color: 'var(--p-text)' }"
        >
          {{ gallery.title }}
        </h2>
        <p class="mt-4 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
          {{ photoCount }} photographs · {{ videoCount }} videos
        </p>
      </div>

      <div class="relative w-full sm:w-72">
        <Search class="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2" :style="{ color: 'var(--p-muted)' }" />
        <input
          :value="searchQuery"
          type="search"
          placeholder="Search this collection"
          aria-label="Search photos"
          class="gallery-search h-10 w-full rounded-none border-0 border-b bg-transparent pl-8 pr-0 text-sm shadow-none outline-none transition-colors"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', color: 'var(--p-text)' }"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          @focus="(e) => ((e.target as HTMLElement).style.borderColor = accentColor)"
          @blur="(e) => ((e.target as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--p-border) 40%, transparent)')"
        />
      </div>
    </header>

    <section>
      <div
        class="mb-6 flex items-center border-b pb-3"
        :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center justify-between text-left"
          :aria-expanded="photoOpen"
          @click="emit('update:photoOpen', !photoOpen)"
        >
          <span class="text-[11px] font-medium tracking-wide" :style="{ color: 'var(--p-text)' }">
            Collection · {{ visibleMediaCount }}
          </span>
          <ChevronDown
            class="h-4 w-4 transition-transform duration-300"
            :style="{ color: 'var(--p-muted)' }"
            :class="{ '-rotate-90': !photoOpen }"
          />
        </button>
        <button
          type="button"
          class="ml-5 flex items-center gap-2 text-[11px] font-medium tracking-wide transition hover:opacity-65 disabled:cursor-not-allowed disabled:opacity-35"
          :style="{ color: accentColor }"
          :disabled="!visiblePhotosCount"
          @click="emit('present')"
        >
          <Play class="h-3.5 w-3.5 fill-current" />
          Present
        </button>
      </div>

      <Transition name="section-collapse">
        <div v-if="photoOpen" class="section-collapse-grid">
          <div class="min-h-0 overflow-hidden">
            <div
              v-if="!sections.length"
              class="border border-dashed px-6 py-20 text-center"
              :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 60%, transparent)' }"
            >
              <Search class="mx-auto mb-4 h-5 w-5" :style="{ color: 'var(--p-muted)' }" />
              <p
                class="font-medium tracking-tight"
                style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem;"
                :style="{ color: 'var(--p-text)' }"
              >
                {{ searchQuery ? "No media found" : "No media shared yet" }}
              </p>
              <p
                v-if="searchQuery"
                class="mt-3 text-sm tracking-wide"
                :style="{ color: 'var(--p-muted)' }"
              >
                Try another name or asset ID.
              </p>
            </div>

            <div v-else class="space-y-12">
              <section
                v-for="(section, sectionIndex) in sections"
                :key="section.id"
                class="gallery-section-enter"
                :style="{ '--section-i': sectionIndex }"
              >
                <h3
                  v-if="sections.length > 1 || section.name"
                  class="mb-5 font-medium tracking-tight"
                  style="font-family: 'Cormorant Garamond', serif; font-size: 2.2rem;"
                  :style="{ color: 'var(--p-text)' }"
                >
                  {{ section.name }}
                </h3>
                <div class="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4">
                  <GalleryMediaTile
                    v-for="(item, itemIndex) in section.items"
                    :key="item.id"
                    class="mb-2 break-inside-avoid sm:mb-3"
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
              </section>
            </div>
          </div>
        </div>
      </Transition>
    </section>
  </main>

  <footer
    class="border-t py-12 transition-colors duration-300"
    :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', background: 'var(--p-shell)' }"
  >
    <div class="flex items-center justify-center gap-2 text-[10px] tracking-wide" :style="{ color: 'var(--p-muted)' }">
      <span>Powered by</span>
      <span class="font-semibold" :style="{ color: 'var(--p-text)' }">Sesifoto</span>
    </div>
  </footer>
</template>
