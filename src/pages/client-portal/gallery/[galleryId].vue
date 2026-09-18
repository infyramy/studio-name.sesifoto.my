<template>
  <div
    ref="pageEl"
    class="gallery-page h-dvh overflow-y-auto transition-colors duration-300"
    :style="[{ background: 'var(--p-shell)', color: 'var(--p-text)', fontFamily: '&quot;DM Sans&quot;, system-ui, sans-serif' }, themeVars]"
  >
    <div
      v-if="notice"
      class="fixed bottom-20 left-1/2 z-[60] max-w-sm -translate-x-1/2 rounded-md border px-4 py-2 text-center text-xs shadow-lg"
      :style="{ background: 'var(--p-card)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }"
      role="status"
    >
      {{ notice }}
    </div>

    <div
      v-if="isLoading"
      class="gallery-boot flex min-h-dvh flex-col items-center justify-center px-8"
      role="status"
      aria-live="polite"
      aria-label="Loading gallery"
    >
      <p
        class="mb-8 text-[10px] font-medium tracking-[0.35em]"
        :style="{ color: 'var(--p-muted)' }"
      >
        Loading
      </p>
      <div class="gallery-boot-track w-full max-w-[11rem]">
        <div
          class="gallery-boot-bar"
          :style="{ background: 'var(--p-accent, #10b981)' }"
        />
      </div>
    </div>
    <div v-else-if="loadError" class="flex min-h-dvh items-center justify-center px-6">
      <div class="max-w-sm text-center">
        <p class="font-medium tracking-tight" style="font-family: 'Cormorant Garamond', serif; font-size: 2.4rem;">Gallery unavailable</p>
        <p class="mt-2 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">{{ loadError }}</p>
        <button class="mt-6 text-xs font-semibold uppercase tracking-[0.2em]" :style="{ color: accentColor }" @click="loadGallery">
          Try again
        </button>
        <button
          type="button"
          class="mt-4 block w-full text-[10px] font-semibold uppercase tracking-[0.2em] transition hover:opacity-80"
          :style="{ color: 'var(--p-muted)' }"
          @click="goBackToPortal"
        >
          Back to portal
        </button>
      </div>
    </div>
    <template v-else-if="gallery">
    <!-- Gallery cover -->
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
          <p class="mb-4 text-[10px] font-medium uppercase tracking-[0.4em] text-white/75">
            Client gallery
          </p>
          <h1 class="font-serif text-4xl font-light tracking-tight sm:text-6xl lg:text-7xl">
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

    <nav ref="galleryNav" class="gallery-reveal gallery-reveal-nav relative z-20 border-b backdrop-blur transition-colors duration-300"
         :style="{ background: 'color-mix(in srgb, var(--p-shell) 95%, transparent)', borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
      <div class="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center transition-colors hover:opacity-70"
            :style="{ color: 'var(--p-text)' }"
            aria-label="Back to portal"
            title="Back to portal"
            @click="goBackToPortal"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <p class="truncate text-xs font-semibold tracking-wide sm:text-sm" :style="{ color: 'var(--p-text)' }">
            {{ clientName }}
          </p>
        </div>

        <div class="flex items-center justify-center gap-3 min-w-0">
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
            class="hidden sm:inline truncate text-[10px] font-semibold uppercase tracking-[0.22em]"
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
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70"
            :style="{ color: 'var(--p-text)' }"
            aria-label="Share gallery"
            title="Share gallery"
            @click="shareGallery"
          >
            <Share2 class="h-4 w-4" />
          </button>
          <button
            v-if="gallery.allowDownload"
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center transition-colors hover:opacity-70"
            :style="{ color: 'var(--p-text)' }"
            aria-label="Download gallery"
            title="Download gallery"
            @click="downloadAll"
          >
            <Download class="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>

    <main class="gallery-reveal gallery-reveal-content mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <!-- Collection introduction -->
      <header class="mb-14 flex flex-col gap-7 border-b pb-10 sm:flex-row sm:items-end sm:justify-between" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
        <div>
          <p
            class="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em]"
            :style="{ color: accentColor }"
          >
            The collection
          </p>
          <h2 class="font-medium tracking-tight" style="font-family: 'Cormorant Garamond', serif; font-size: 3rem; line-height: 1.1;" :style="{ color: 'var(--p-text)' }">
            {{ gallery.title }}
          </h2>
          <p class="mt-4 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">
            {{ photoCount }} photographs · {{ videoCount }} videos
          </p>
        </div>

        <div class="relative w-full sm:w-72">
          <Search class="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2" :style="{ color: 'var(--p-muted)' }" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search this collection"
            aria-label="Search photos"
            class="gallery-search h-10 w-full rounded-none border-0 border-b bg-transparent pl-8 pr-0 text-sm shadow-none outline-none transition-colors"
            :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', color: 'var(--p-text)' }"
            @focus="(e) => (e.target as HTMLElement).style.borderColor = accentColor"
            @blur="(e) => (e.target as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--p-border) 40%, transparent)'"
          />
        </div>
      </header>

      <!-- Sections (photos + videos stay in their section) -->
      <section>
        <div class="mb-6 flex items-center border-b pb-3" :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)' }">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center justify-between text-left"
            :aria-expanded="photoOpen"
            @click="photoOpen = !photoOpen"
          >
            <span class="text-[11px] font-semibold uppercase tracking-[0.25em]" :style="{ color: 'var(--p-text)' }">
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
            class="ml-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition hover:opacity-65 disabled:cursor-not-allowed disabled:opacity-35"
            :style="{ color: accentColor }"
            :disabled="!visiblePhotos.length"
            @click="startPresentation"
          >
            <Play class="h-3.5 w-3.5 fill-current" />
            Present
          </button>
        </div>

        <Transition name="section-collapse">
          <div v-if="photoOpen" class="section-collapse-grid">
            <div class="min-h-0 overflow-hidden">
              <div
                v-if="!visibleGallerySections.length"
                class="border border-dashed px-6 py-20 text-center"
                :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 60%, transparent)' }"
              >
                <Search class="mx-auto mb-4 h-5 w-5" :style="{ color: 'var(--p-muted)' }" />
                <p class="font-medium tracking-tight" style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem;" :style="{ color: 'var(--p-text)' }">
                  {{ searchQuery ? "No media found" : "No media shared yet" }}
                </p>
                <p v-if="searchQuery" class="mt-3 text-sm tracking-wide" :style="{ color: 'var(--p-muted)' }">Try another name or asset ID.</p>
              </div>

              <div v-else class="space-y-12">
                <section
                  v-for="(section, sectionIndex) in visibleGallerySections"
                  :key="section.id"
                  class="gallery-section-enter"
                  :style="{ '--section-i': sectionIndex }"
                >
                  <h3
                    v-if="visibleGallerySections.length > 1 || section.name"
                    class="mb-5 font-medium tracking-tight"
                    style="font-family: 'Cormorant Garamond', serif; font-size: 2.2rem;"
                    :style="{ color: 'var(--p-text)' }"
                  >
                    {{ section.name }}
                  </h3>
                  <div class="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4">
                    <article
                      v-for="(item, itemIndex) in section.items"
                      :key="item.id"
                      :data-media-id="item.id"
                      role="button"
                      tabindex="0"
                      :aria-label="item.type === 'video' ? `Play ${item.label}` : `View ${item.label}`"
                      class="group relative mb-2 cursor-pointer break-inside-avoid overflow-hidden outline-none focus-visible:ring-2 sm:mb-3 gallery-media-tile"
                      :class="{ 'is-revealed': isMediaRevealed(item.id) }"
                      :style="{
                        '--tw-ring-color': accentColor,
                        background: 'color-mix(in srgb, var(--p-card) 50%, transparent)',
                        '--tile-i': itemIndex,
                      }"
                      @click="item.type === 'video' ? openVideoViewer(item) : openPhotoViewer(item)"
                      @keydown.enter="item.type === 'video' ? openVideoViewer(item) : openPhotoViewer(item)"
                      @keydown.space.prevent="item.type === 'video' ? openVideoViewer(item) : openPhotoViewer(item)"
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
                            :class="{ 'is-loaded': isMediaLoaded(item.id) }"
                            @load="markMediaLoaded(item.id)"
                          />
                          <video
                            v-else-if="isMediaHydrated(item.id)"
                            :src="item.url"
                            class="gallery-media-asset absolute inset-0 h-full w-full object-cover"
                            :class="{ 'is-loaded': isMediaLoaded(item.id) }"
                            muted
                            preload="metadata"
                            playsinline
                            @loadedmetadata="markMediaLoaded(item.id)"
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
                          :class="[item.aspectClass, { 'is-loaded': isMediaLoaded(item.id) }]"
                          @load="markMediaLoaded(item.id)"
                        />
                        <span
                          class="absolute inset-0 transition"
                          :class="isSelected(item.id) ? 'bg-black/20' : 'bg-black/0 group-hover:bg-black/10'"
                        />
                        <span
                          v-if="isSelected(item.id)"
                          class="pointer-events-none absolute inset-0 border-[3px]"
                          :style="{ borderColor: accentColor }"
                        />
                        <button
                          v-if="gallery.allowSelection"
                          type="button"
                          class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-white shadow-sm backdrop-blur-sm transition"
                          :class="isSelected(item.id) ? 'scale-100 border-transparent' : 'scale-90 border-white/70 bg-black/25 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:opacity-100'"
                          :style="isSelected(item.id) ? { backgroundColor: accentColor } : {}"
                          :aria-label="`${isSelected(item.id) ? 'Deselect' : 'Select'} ${item.label}`"
                          @click.stop="toggleSelect(item.id)"
                        >
                          <Check v-if="isSelected(item.id)" class="h-4 w-4" />
                        </button>
                      </template>
                      <span class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-3 pt-10 opacity-0 transition group-hover:opacity-100">
                        <span class="text-[11px] font-medium tracking-wide text-white">{{ item.label }}</span>
                      </span>
                    </article>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </Transition>
      </section>
    </main>

    <footer class="border-t py-12 transition-colors duration-300"
            :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 40%, transparent)', background: 'var(--p-shell)' }">
      <div class="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em]" :style="{ color: 'var(--p-muted)' }">
        <span>Powered by</span>
        <span class="font-semibold" :style="{ color: 'var(--p-text)' }">Sesifoto</span>
      </div>
    </footer>

    <!-- Full-screen media viewer -->
    <Teleport to="body">
      <Transition name="viewer">
        <div
          v-if="showViewer && currentViewerItem"
          ref="viewerOverlay"
          class="fixed inset-0 z-[250] flex flex-col bg-black text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery media viewer"
        >
          <header class="relative z-10 flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
            <span class="text-xs font-medium tabular-nums text-white/60">
              {{ viewerIndex + 1 }} / {{ viewerItems.length }}
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
                aria-label="Toggle fullscreen"
                title="Toggle fullscreen"
                @click="toggleFullscreen"
              >
                <Maximize2 class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
                aria-label="Close viewer"
                title="Close viewer"
                @click="closeViewer"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </header>

          <div class="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-20 sm:px-20">
            <Transition name="viewer-media" mode="out-in">
              <div
                :key="currentViewerItem.id"
                class="flex h-full w-full items-center justify-center"
              >
                <img v-if="currentViewerItem.type === 'photo'"
                  :src="currentViewerItem.url"
                  :alt="currentViewerItem.label"
                  decoding="async"
                  class="max-h-full max-w-full select-none object-contain"
                />
                <video v-else :src="currentViewerItem.url" class="max-h-full max-w-full" controls autoplay />
              </div>
            </Transition>

            <button
              v-if="viewerItems.length > 1"
              type="button"
              class="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/75 backdrop-blur transition hover:bg-white/20 hover:text-white sm:left-6"
              aria-label="Previous media"
              @click="previousViewerItem"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <button
              v-if="viewerItems.length > 1"
              type="button"
              class="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/75 backdrop-blur transition hover:bg-white/20 hover:text-white sm:right-6"
              aria-label="Next media"
              @click="nextViewerItem"
            >
              <ChevronRight class="h-5 w-5" />
            </button>
          </div>

          <footer class="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-4 bg-gradient-to-t from-black via-black/80 to-transparent px-5 pb-6 pt-12">
            <p class="max-w-[50vw] truncate text-xs tracking-wide text-white/60">
              {{ currentViewerItem.label }}
            </p>
            <button
              v-if="canPlaySlideshow"
              type="button"
              class="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium transition hover:bg-white/20"
              @click="toggleViewerPlayback"
            >
              <Pause v-if="viewerPlaying" class="h-3.5 w-3.5" />
              <Play v-else class="h-3.5 w-3.5 fill-current" />
              {{ viewerPlaying ? "Pause" : "Play" }}
            </button>
          </footer>
        </div>
      </Transition>
    </Teleport>

    <!-- Selection tray -->
    <Transition name="selection-tray">
      <div
        v-if="gallery.allowSelection && selectedIds.length"
        class="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-full bg-zinc-950 px-3 py-3 pl-5 text-white shadow-2xl shadow-black/25"
      >
        <p class="text-sm">
          <span class="font-semibold">{{ selectedIds.length }}</span>
          <span class="ml-1 text-white/60">selected</span>
        </p>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded-full px-3 py-2 text-xs text-white/65 transition hover:bg-white/10 hover:text-white"
            @click="clearSelection"
          >
            Clear
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
            :style="{ backgroundColor: accentColor }"
            @click="downloadAll"
          >
            <Download class="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
    </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Moon,
  Pause,
  Play,
  Search,
  Share2,
  Sun,
  X,
} from "lucide-vue-next";
import {
  galleryService,
  type PublicGallery,
} from "@/services/gallery.service";

interface GalleryItem {
  id: string;
  label: string;
  url: string;
  type: "photo" | "video";
  aspectClass: string;
  thumb?: string;
  hasThumbnail?: boolean;
}

interface ViewerMedia {
  id: string;
  label: string;
  url: string;
  type: "photo" | "video";
}

const route = useRoute();
const router = useRouter();
const galleryId = String(route.params.galleryId || "");
const jobId = String(route.params.jobId || "");
const gallery = ref<PublicGallery | null>(null);
const isLoading = ref(true);
const loadError = ref("");
const notice = ref("");
let noticeTimer = 0;

const accentColor = computed(() => gallery.value?.accentColor || "#10b981");
const clientName = computed(
  () => gallery.value?.job.contact?.name || gallery.value?.title || "Client gallery",
);
const allMedia = computed(
  () => gallery.value?.sections.flatMap((section) => section.media) || [],
);

const gallerySections = computed(() =>
  (gallery.value?.sections || []).map((section) => ({
    id: section.id,
    name: section.name,
    items: section.media.map((media, index) => {
      if (media.type === "video") {
        return {
          id: media.id,
          label: media.label || `Video ${index + 1}`,
          url: media.url,
          type: "video" as const,
          aspectClass: "aspect-video",
          thumb: media.thumbnailUrl || media.url,
          hasThumbnail: Boolean(media.thumbnailUrl),
        } satisfies GalleryItem;
      }
      return {
        id: media.id,
        label: media.label || `Photo ${index + 1}`,
        url: media.url,
        type: "photo" as const,
        aspectClass: "aspect-auto",
      } satisfies GalleryItem;
    }),
  })),
);

const allPhotos = computed<GalleryItem[]>(() =>
  gallerySections.value
    .flatMap((section) => section.items)
    .filter((item) => item.type === "photo"),
);

const photoCount = computed(() => allPhotos.value.length);
const videoCount = computed(
  () => allMedia.value.filter((media) => media.type === "video").length,
);

const searchQuery = ref("");
const photoOpen = ref(true);
const selectedIds = ref<string[]>([]);
const galleryNav = ref<HTMLElement | null>(null);
const pageEl = ref<HTMLElement | null>(null);
const viewerOverlay = ref<HTMLElement | null>(null);
const showViewer = ref(false);
const viewerItems = ref<ViewerMedia[]>([]);
const viewerIndex = ref(0);
const viewerPlaying = ref(false);
const hydratedMediaIds = ref<Set<string>>(new Set());
const revealedMediaIds = ref<Set<string>>(new Set());
const loadedMediaIds = ref<Set<string>>(new Set());
let mediaObserver: IntersectionObserver | null = null;
const { isDark, toggleDark, setAccent, themeVars } = usePortalTheme();

const coverUrl = computed(() => {
  if (gallery.value?.coverUrl) return gallery.value.coverUrl;
  const firstPhoto = allPhotos.value[0];
  if (firstPhoto) return firstPhoto.url;
  const firstVideo = gallerySections.value
    .flatMap((s) => s.items)
    .find((i) => i.type === "video");
  return firstVideo?.thumb || firstVideo?.url || "";
});

const visibleGallerySections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return gallerySections.value
    .map((section) => ({
      ...section,
      items: q
        ? section.items.filter(
            (item) =>
              item.label.toLowerCase().includes(q)
              || item.id.toLowerCase().includes(q),
          )
        : section.items,
    }))
    .filter((section) => section.items.length);
});

const visiblePhotos = computed(() =>
  visibleGallerySections.value
    .flatMap((section) => section.items)
    .filter((item) => item.type === "photo"),
);

const visibleMediaCount = computed(() =>
  visibleGallerySections.value.reduce((sum, section) => sum + section.items.length, 0),
);

const currentViewerItem = computed(() => viewerItems.value[viewerIndex.value] ?? null);
const canPlaySlideshow = computed(
  () =>
    viewerItems.value.length > 1 &&
    viewerItems.value.every((item) => item.type === "photo")
);

let viewerTimer: ReturnType<typeof setInterval> | null = null;

function photoViewerItems(): ViewerMedia[] {
  return visiblePhotos.value.map((photo) => ({
    id: photo.id,
    label: photo.label,
    url: photo.url,
    type: "photo" as const,
  }));
}

function allViewerItems(): ViewerMedia[] {
  return visibleGallerySections.value.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      label: item.label,
      url: item.url,
      type: item.type,
    })),
  );
}

function isSelected(id: string) {
  return selectedIds.value.includes(id);
}

function toggleSelect(id: string) {
  if (isSelected(id)) {
    selectedIds.value = selectedIds.value.filter((s) => s !== id);
  } else {
    selectedIds.value = [...selectedIds.value, id];
  }
}

function isMediaHydrated(id: string) {
  return hydratedMediaIds.value.has(id);
}

function isMediaRevealed(id: string) {
  return revealedMediaIds.value.has(id);
}

function isMediaLoaded(id: string) {
  return loadedMediaIds.value.has(id);
}

function markMediaLoaded(id: string) {
  if (loadedMediaIds.value.has(id)) return;
  const next = new Set(loadedMediaIds.value);
  next.add(id);
  loadedMediaIds.value = next;
}

function destroyMediaObserver() {
  mediaObserver?.disconnect();
  mediaObserver = null;
}

function setupMediaObserver() {
  destroyMediaObserver();
  if (typeof IntersectionObserver === "undefined") {
    // Fallback: hydrate everything
    const all = new Set(
      visibleGallerySections.value.flatMap((s) => s.items.map((i) => i.id)),
    );
    hydratedMediaIds.value = all;
    revealedMediaIds.value = all;
    return;
  }

  mediaObserver = new IntersectionObserver(
    (entries) => {
      let hydratedChanged = false;
      let revealedChanged = false;
      const nextHydrated = new Set(hydratedMediaIds.value);
      const nextRevealed = new Set(revealedMediaIds.value);

      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = (entry.target as HTMLElement).dataset.mediaId;
        if (!id) continue;
        if (!nextHydrated.has(id)) {
          nextHydrated.add(id);
          hydratedChanged = true;
        }
        if (!nextRevealed.has(id)) {
          nextRevealed.add(id);
          revealedChanged = true;
        }
        mediaObserver?.unobserve(entry.target);
      }

      if (hydratedChanged) hydratedMediaIds.value = nextHydrated;
      if (revealedChanged) revealedMediaIds.value = nextRevealed;
    },
    {
      root: pageEl.value,
      rootMargin: "320px 0px 320px 0px",
      threshold: 0,
    },
  );

  pageEl.value
    ?.querySelectorAll<HTMLElement>("[data-media-id]")
    .forEach((el) => mediaObserver?.observe(el));
}

async function refreshMediaObserver() {
  await nextTick();
  await nextTick();
  setupMediaObserver();
}

function clearSelection() {
  selectedIds.value = [];
}

function toggleTheme() {
  toggleDark();
}

function goBackToPortal() {
  router.push({
    name: "client-portal-job-overview",
    params: { jobId },
    query: route.query,
  });
}

function showNotice(message: string) {
  notice.value = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = "";
  }, 3500);
}

function scrollToGallery() {
  galleryNav.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearViewerTimer() {
  if (!viewerTimer) return;
  clearInterval(viewerTimer);
  viewerTimer = null;
}

function scheduleViewerSlides() {
  clearViewerTimer();
  if (viewerPlaying.value && canPlaySlideshow.value) {
    viewerTimer = setInterval(nextViewerItem, 4000);
  }
}

function openPhotoViewer(photo: GalleryItem) {
  viewerItems.value = photoViewerItems();
  viewerIndex.value = Math.max(
    0,
    viewerItems.value.findIndex((item) => item.id === photo.id)
  );
  viewerPlaying.value = false;
  showViewer.value = true;
  clearViewerTimer();
}

function openVideoViewer(item: GalleryItem) {
  const items = allViewerItems();
  viewerItems.value = items.length ? items : [
    { id: item.id, label: item.label, url: item.url, type: "video" },
  ];
  viewerIndex.value = Math.max(
    0,
    viewerItems.value.findIndex((v) => v.id === item.id),
  );
  viewerPlaying.value = false;
  showViewer.value = true;
  clearViewerTimer();
}

function startPresentation() {
  const items = photoViewerItems();
  if (!items.length) return;
  viewerItems.value = items;
  viewerIndex.value = 0;
  viewerPlaying.value = true;
  showViewer.value = true;
  scheduleViewerSlides();
}

function closeViewer() {
  showViewer.value = false;
  viewerPlaying.value = false;
  clearViewerTimer();
  if (document.fullscreenElement === viewerOverlay.value) {
    document.exitFullscreen().catch(() => {});
  }
}

function nextViewerItem() {
  if (!viewerItems.value.length) return;
  viewerIndex.value = (viewerIndex.value + 1) % viewerItems.value.length;
}

function previousViewerItem() {
  if (!viewerItems.value.length) return;
  viewerIndex.value =
    (viewerIndex.value - 1 + viewerItems.value.length) % viewerItems.value.length;
}

function toggleViewerPlayback() {
  viewerPlaying.value = !viewerPlaying.value;
  scheduleViewerSlides();
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    return;
  }
  viewerOverlay.value?.requestFullscreen().catch(() => {});
}

function handleViewerKeydown(event: KeyboardEvent) {
  if (!showViewer.value) return;
  if (event.key === "Escape") closeViewer();
  if (event.key === "ArrowLeft") previousViewerItem();
  if (event.key === "ArrowRight") nextViewerItem();
  if (event.key === " " && canPlaySlideshow.value) {
    event.preventDefault();
    toggleViewerPlayback();
  }
}

function downloadAll() {
  if (!gallery.value?.allowDownload) return;
  showNotice("Preparing download…");
}

function shareGallery() {
  navigator.clipboard.writeText(window.location.href).catch(() => {});
  showNotice("Gallery link copied");
}

async function loadGallery() {
  isLoading.value = true;
  loadError.value = "";
  destroyMediaObserver();
  hydratedMediaIds.value = new Set();
  revealedMediaIds.value = new Set();
  loadedMediaIds.value = new Set();
  try {
    gallery.value = await galleryService.getPublic(String(route.params.galleryId || galleryId));
    setAccent(gallery.value?.accentColor);
  } catch (error: unknown) {
    loadError.value =
      error instanceof Error && error.message
        ? error.message
        : "This gallery is missing or not published.";
  } finally {
    isLoading.value = false;
    await refreshMediaObserver();
  }
}

watch(
  () => [photoOpen.value, visibleGallerySections.value.map((s) => s.id).join("|")],
  () => {
    if (!gallery.value || isLoading.value) return;
    refreshMediaObserver();
  },
);

watch(
  isDark,
  (dark) => {
    document.documentElement.classList.toggle("dark", dark);
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("keydown", handleViewerKeydown);
  loadGallery();
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleViewerKeydown);
  clearViewerTimer();
  window.clearTimeout(noticeTimer);
  destroyMediaObserver();
});
</script>

<style scoped>
.gallery-search:focus-visible {
  outline: none;
  box-shadow: none;
}

.gallery-page {
  animation: gallery-fade-in 500ms ease-out both;
}

.gallery-boot {
  animation: gallery-fade-in 400ms ease-out both;
}

.gallery-boot-track {
  height: 1px;
  overflow: hidden;
  background: color-mix(in srgb, var(--p-muted) 35%, transparent);
}

.gallery-boot-bar {
  height: 100%;
  width: 40%;
  animation: gallery-boot-slide 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.gallery-hero-image {
  animation: gallery-cover-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.gallery-hero-copy {
  animation: gallery-copy-in 800ms 160ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.gallery-reveal {
  animation: gallery-content-in 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.gallery-reveal-nav {
  animation-delay: 180ms;
}

.gallery-reveal-content {
  animation-delay: 260ms;
}

.gallery-scroll-indicator {
  animation: gallery-scroll-hint 1.8s ease-in-out infinite;
}

.gallery-section-enter {
  animation: gallery-content-in 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--section-i, 0) * 70ms);
}

.gallery-media-tile {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 480ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--tile-i, 0) * 40ms);
  will-change: opacity, transform;
}

.gallery-media-tile.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

.gallery-media-asset {
  opacity: 1;
}

.gallery-media-asset.is-loaded {
  opacity: 1;
}

.section-collapse-grid {
  display: grid;
  grid-template-rows: 1fr;
  transform-origin: top;
}

.section-collapse-enter-active,
.section-collapse-leave-active {
  transition:
    grid-template-rows 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 240ms ease,
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.section-collapse-enter-from,
.section-collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-8px);
}

.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 220ms ease;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}

.viewer-media-enter-active,
.viewer-media-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.viewer-media-enter-from {
  opacity: 0;
  transform: translateX(18px) scale(0.99);
}

.viewer-media-leave-to {
  opacity: 0;
  transform: translateX(-18px) scale(0.99);
}

.selection-tray-enter-active,
.selection-tray-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.selection-tray-enter-from,
.selection-tray-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes gallery-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes gallery-boot-slide {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(320%);
  }
}

@keyframes gallery-cover-in {
  from {
    opacity: 0;
    transform: scale(1.045);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes gallery-copy-in {
  from {
    opacity: 0;
    transform: translateY(34px);
  }
  to {
    opacity: 1;
    transform: translateY(20px);
  }
}

@keyframes gallery-content-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gallery-scroll-hint {
  0%,
  100% {
    transform: translate(-50%, 0);
  }
  50% {
    transform: translate(-50%, 8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gallery-page,
  .gallery-hero-image,
  .gallery-hero-copy,
  .gallery-reveal,
  .gallery-scroll-indicator,
  .gallery-section-enter,
  .gallery-boot {
    animation: none;
  }

  .gallery-boot-bar {
    animation: none;
    width: 100%;
    opacity: 0.5;
  }

  .gallery-media-tile,
  .gallery-media-asset {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .section-collapse-enter-active,
  .section-collapse-leave-active,
  .viewer-enter-active,
  .viewer-leave-active,
  .viewer-media-enter-active,
  .viewer-media-leave-active {
    transition-duration: 1ms;
  }
}
</style>
