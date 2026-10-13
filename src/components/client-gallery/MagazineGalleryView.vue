<script setup lang="ts">
import { ref } from "vue";
import {
  ChevronDown,
  Download,
  Play,
  Search,
  Share2,
} from "lucide-vue-next";
import PortalThemeIcon from "@/components/portal/PortalThemeIcon.vue";
import type { PublicGallery } from "@/services/gallery.service";
import PoweredBySesifoto from "@/components/PoweredBySesifoto.vue";
import GalleryMediaTile from "./GalleryMediaTile.vue";
import GalleryLogo from "./GalleryLogo.vue";
import GalleryPhotoGrid from "./GalleryPhotoGrid.vue";
import type {
  GalleryLayoutItem,
  GalleryLayoutSection,
  GalleryViewOptions,
} from "./designs";

defineProps<{
  gallery: PublicGallery;
  coverUrl: string;
  clientName: string;
  metaLine: string;
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
  options: GalleryViewOptions;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  toggleTheme: [event: MouseEvent];
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

function featuredItem(section: GalleryLayoutSection) {
  return section.items[0] ?? null;
}

function restItems(section: GalleryLayoutSection) {
  return section.items.slice(1);
}
</script>

<template>
  <section
    v-if="!options.hideHero"
    class="relative h-dvh min-h-[480px] overflow-hidden"
    :style="{ background: 'var(--g-hero, transparent)' }"
  >
    <img
      v-if="coverUrl"
      :src="coverUrl"
      :alt="`${clientName} gallery cover`"
      loading="eager"
      decoding="async"
      fetchpriority="high"
      class="gallery-hero-image absolute inset-0 h-full w-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
    <div class="relative flex h-full flex-col justify-end px-6 pb-20 pt-24 text-white sm:px-10 lg:px-16">
      <div class="gallery-hero-copy max-w-4xl translate-y-5">
        <p class="mb-5 text-[11px] font-medium tracking-[0.18em] text-white/70">
          {{ gallery.studio.name }}
        </p>
        <h1
          class="portal-display font-medium leading-[0.92] tracking-tight"
          style="font-family: var(--g-display, 'Cormorant Garamond'), serif; font-size: clamp(3.4rem, 10vw, 7.5rem);"
        >
          {{ options.heroTitle || gallery.title }}
        </h1>
        <p v-if="options.heroSubtitle" class="mt-5 text-lg tracking-wide text-white/85 sm:text-xl">
          {{ options.heroSubtitle }}
        </p>
        <p class="mt-6 max-w-xl text-sm tracking-wide text-white/75 sm:text-base">
          {{ clientName }} · {{ photoCount }} photographs · {{ videoCount }} videos
        </p>
        <p v-if="metaLine" class="mt-2 text-sm tracking-wide text-white/70">
          {{ metaLine }}
        </p>
        <p
          v-if="gallery.description"
          class="mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-white/75 line-clamp-4"
        >
          {{ gallery.description }}
        </p>
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
    class="gallery-reveal gallery-reveal-nav sticky top-0 z-20 border-b backdrop-blur transition-colors duration-300"
    :style="{ background: 'color-mix(in srgb, var(--p-shell) 94%, transparent)', borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
  >
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <GalleryLogo :gallery="gallery" />
        <p class="min-w-0 truncate text-xs font-semibold tracking-wide" :style="{ color: 'var(--p-text)' }">
          {{ clientName }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="options.canToggleTheme"
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70"
          :style="{ color: 'var(--p-text)' }"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="emit('toggleTheme', $event)"
        >
          <PortalThemeIcon :is-dark="isDark" />
        </button>
        <button
          v-if="options.canShare"
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
          class="ml-2 hidden items-center gap-2 text-[11px] font-medium tracking-wide transition hover:opacity-65 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex"
          :style="{ color: accentColor }"
          :disabled="!visiblePhotosCount"
          @click="emit('present')"
        >
          <Play class="h-3.5 w-3.5 fill-current" />
          Present
        </button>
      </div>
    </div>
  </nav>

  <main class="gallery-reveal gallery-reveal-content mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
    <header class="mb-12 flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between"
      :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }"
    >
      <div>
        <p class="mb-3 text-[11px] font-medium tracking-[0.16em]" :style="{ color: accentColor }">
          Editorial
        </p>
        <h2
          class="font-medium tracking-tight"
          style="font-family: var(--g-display, 'Cormorant Garamond'), serif; font-size: 2.6rem; line-height: 1.1;"
          :style="{ color: 'var(--p-text)' }"
        >
          Spreads
        </h2>
        <p class="mt-3 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
          {{ visibleMediaCount }} plates in view
        </p>
      </div>
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2" :style="{ color: 'var(--p-muted)' }" />
        <input
          :value="searchQuery"
          type="search"
          placeholder="Search plates"
          aria-label="Search photos"
          class="gallery-search h-10 w-full rounded-none border-0 border-b bg-transparent pl-8 pr-0 text-sm shadow-none outline-none"
          :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', color: 'var(--p-text)' }"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </header>

    <div
      v-if="!sections.length"
      class="border border-dashed px-6 py-24 text-center"
      :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 60%, transparent)' }"
    >
      <p
        class="font-medium tracking-tight"
        style="font-family: var(--g-display, 'Cormorant Garamond'), serif; font-size: 2rem;"
        :style="{ color: 'var(--p-text)' }"
      >
        {{ searchQuery ? "No plates found" : "No media shared yet" }}
      </p>
    </div>

    <div v-else class="space-y-24">
      <section
        v-for="(section, sectionIndex) in sections"
        :key="section.id"
        class="gallery-section-enter"
        :style="{ '--section-i': sectionIndex }"
      >
        <div class="mb-8 flex items-baseline justify-between gap-4">
          <h3
            class="font-medium tracking-tight"
            style="font-family: var(--g-display, 'Cormorant Garamond'), serif; font-size: 2.4rem;"
            :style="{ color: 'var(--p-text)' }"
          >
            {{ section.name || `Chapter ${sectionIndex + 1}` }}
          </h3>
          <span class="text-[11px] tabular-nums tracking-wide" :style="{ color: 'var(--p-muted)' }">
            {{ String(sectionIndex + 1).padStart(2, "0") }}
          </span>
        </div>

        <GalleryPhotoGrid
          v-if="options.photoGrid"
          :items="section.items"
          v-bind="options.photoGrid"
          :accent-color="accentColor"
          :allow-selection="gallery.allowSelection"
          :is-selected="isSelected"
          :is-revealed="isRevealed"
          :is-hydrated="isHydrated"
          :is-loaded="isLoaded"
          @open="openItem"
          @toggle-select="emit('toggleSelect', $event)"
          @load="emit('mediaLoad', $event)"
        />
        <template v-else>
        <article v-if="featuredItem(section)" class="mb-8">
          <GalleryMediaTile
            :item="featuredItem(section)!"
            :item-index="0"
            :accent-color="accentColor"
            :allow-selection="gallery.allowSelection"
            :selected="isSelected(featuredItem(section)!.id)"
            :revealed="isRevealed(featuredItem(section)!.id)"
            :hydrated="isHydrated(featuredItem(section)!.id)"
            :loaded="isLoaded(featuredItem(section)!.id)"
            class="w-full"
            @open="openItem(featuredItem(section)!)"
            @toggle-select="emit('toggleSelect', featuredItem(section)!.id)"
            @load="emit('mediaLoad', featuredItem(section)!.id)"
          />
        </article>

        <div
          v-if="restItems(section).length"
          class="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-12 lg:gap-x-5"
        >
          <div
            v-for="(item, itemIndex) in restItems(section)"
            :key="item.id"
            class="min-w-0"
            :class="itemIndex % 5 === 0
              ? 'col-span-2 sm:col-span-2 lg:col-span-7'
              : itemIndex % 5 === 1
                ? 'col-span-1 sm:col-span-1 lg:col-span-5'
                : itemIndex % 5 === 2
                  ? 'col-span-1 sm:col-span-1 lg:col-span-4'
                  : itemIndex % 5 === 3
                    ? 'col-span-1 sm:col-span-1 lg:col-span-4'
                    : 'col-span-2 sm:col-span-1 lg:col-span-4'"
          >
            <GalleryMediaTile
              :item="item"
              :item-index="itemIndex + 1"
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
        </template>
      </section>
    </div>
  </main>

  <footer
    class="border-t py-12 transition-colors duration-300"
    :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', background: 'var(--p-shell)' }"
  >
    <PoweredBySesifoto />
  </footer>
</template>
