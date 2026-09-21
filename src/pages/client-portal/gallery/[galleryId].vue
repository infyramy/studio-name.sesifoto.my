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

    <PortalLoadingState v-if="isLoading" label="Loading gallery" />
    <PortalErrorState
      v-else-if="loadError"
      title="Gallery unavailable"
      :message="loadError"
      action-label="Try again"
      @action="loadGallery"
    />
    <template v-else-if="gallery">
    <ClassicGalleryView
      v-if="activeDesignId === 'classic'"
      :gallery="gallery"
      :cover-url="coverUrl"
      :client-name="clientName"
      :accent-color="accentColor"
      :is-dark="isDark"
      :photo-count="photoCount"
      :video-count="videoCount"
      :visible-media-count="visibleMediaCount"
      :visible-photos-count="visiblePhotos.length"
      :search-query="searchQuery"
      :photo-open="photoOpen"
      :sections="visibleGallerySections"
      :is-selected="isSelected"
      :is-revealed="isMediaRevealed"
      :is-hydrated="isMediaHydrated"
      :is-loaded="isMediaLoaded"
      @update:search-query="searchQuery = $event"
      @update:photo-open="photoOpen = $event"
      @toggle-theme="toggleTheme"
      @share="shareGallery"
      @download="downloadAll"
      @present="startPresentation"
      @open-item="openLayoutItem"
      @toggle-select="toggleSelect"
      @media-load="markMediaLoaded"
    />
    <MagazineGalleryView
      v-else-if="activeDesignId === 'magazine'"
      :gallery="gallery"
      :cover-url="coverUrl"
      :client-name="clientName"
      :accent-color="accentColor"
      :is-dark="isDark"
      :photo-count="photoCount"
      :video-count="videoCount"
      :visible-media-count="visibleMediaCount"
      :visible-photos-count="visiblePhotos.length"
      :search-query="searchQuery"
      :sections="visibleGallerySections"
      :is-selected="isSelected"
      :is-revealed="isMediaRevealed"
      :is-hydrated="isMediaHydrated"
      :is-loaded="isMediaLoaded"
      @update:search-query="searchQuery = $event"
      @toggle-theme="toggleTheme"
      @share="shareGallery"
      @download="downloadAll"
      @present="startPresentation"
      @open-item="openLayoutItem"
      @toggle-select="toggleSelect"
      @media-load="markMediaLoaded"
    />
    <FilmStripGalleryView
      v-else
      :gallery="gallery"
      :cover-url="coverUrl"
      :client-name="clientName"
      :accent-color="accentColor"
      :is-dark="isDark"
      :photo-count="photoCount"
      :video-count="videoCount"
      :visible-media-count="visibleMediaCount"
      :visible-photos-count="visiblePhotos.length"
      :search-query="searchQuery"
      :sections="visibleGallerySections"
      :is-selected="isSelected"
      :is-revealed="isMediaRevealed"
      :is-hydrated="isMediaHydrated"
      :is-loaded="isMediaLoaded"
      @update:search-query="searchQuery = $event"
      @toggle-theme="toggleTheme"
      @share="shareGallery"
      @download="downloadAll"
      @present="startPresentation"
      @open-item="openLayoutItem"
      @toggle-select="toggleSelect"
      @media-load="markMediaLoaded"
    />

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
import { useRoute } from "vue-router";
import { usePortalTheme } from "@/composables/usePortalTheme";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Pause,
  Play,
  X,
} from "lucide-vue-next";
import {
  galleryService,
  type PublicGallery,
} from "@/services/gallery.service";
import PortalErrorState from "@/components/portal/PortalErrorState.vue";
import PortalLoadingState from "@/components/portal/PortalLoadingState.vue";
import ClassicGalleryView from "@/components/client-gallery/ClassicGalleryView.vue";
import MagazineGalleryView from "@/components/client-gallery/MagazineGalleryView.vue";
import FilmStripGalleryView from "@/components/client-gallery/FilmStripGalleryView.vue";
import {
  normalizeGalleryDesignId,
  type GalleryLayoutItem,
} from "@/components/client-gallery/designs";
import "@/components/client-gallery/gallery-layout.css";

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
const galleryId = String(route.params.galleryId || "");
const gallery = ref<PublicGallery | null>(null);
const isLoading = ref(true);
const loadError = ref("");
const notice = ref("");
let noticeTimer = 0;

const accentColor = computed(
  () => gallery.value?.accentColor || resolvedAccent.value,
);
const activeDesignId = computed(() =>
  normalizeGalleryDesignId(gallery.value?.designId),
);
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
const { isDark, toggleDark, setAccent, themeVars, resolvedAccent } = usePortalTheme();

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

function showNotice(message: string) {
  notice.value = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = "";
  }, 3500);
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

function openLayoutItem(item: GalleryLayoutItem) {
  if (item.type === "video") {
    openVideoViewer(item);
    return;
  }
  openPhotoViewer(item);
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
  () => [
    photoOpen.value,
    activeDesignId.value,
    visibleGallerySections.value.map((s) => s.id).join("|"),
  ],
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

@media (prefers-reduced-motion: reduce) {
  .gallery-page {
    animation: none;
  }

  .viewer-enter-active,
  .viewer-leave-active,
  .viewer-media-enter-active,
  .viewer-media-leave-active {
    transition-duration: 1ms;
  }
}
</style>
