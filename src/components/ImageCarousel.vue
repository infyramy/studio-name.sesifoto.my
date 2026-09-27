<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-vue-next";

const props = defineProps<{
  show: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  description?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const currentIndex = ref(0);
const isLoading = ref(true);
const isCaptionExpanded = ref(false);

function markLoaded() {
  isLoading.value = false;
}

function markLoading() {
  isLoading.value = true;
}

function preloadAndMaybeMarkLoaded(src: string | undefined) {
  if (!src) return;

  const img = new Image();
  img.src = src;

  // If the browser already has it (cache), complete is often true immediately.
  // Still hop a tick so we don't fight with transition/mount timing.
  if (img.complete) {
    void nextTick(() => {
      // Only clear loading if we're still on the same image
      if (props.images[currentIndex.value] === src) markLoaded();
    });
    return;
  }

  img.onload = () => {
    if (props.images[currentIndex.value] === src) markLoaded();
  };
  img.onerror = () => {
    if (props.images[currentIndex.value] === src) markLoaded();
  };

  // Some browsers resolve decode() earlier than load events.
  // Don't block on it; just use it as an extra signal.
  if (typeof img.decode === "function") {
    img.decode()
      .then(() => {
        if (props.images[currentIndex.value] === src) markLoaded();
      })
      .catch(() => {
        // ignore decode failures; load/error will handle
      });
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      currentIndex.value = props.initialIndex || 0;
      isCaptionExpanded.value = false;
      document.body.style.overflow = "hidden";
      markLoading();
      preloadAndMaybeMarkLoaded(props.images[currentIndex.value]);
    } else {
      document.body.style.overflow = "";
    }
  },
);

watch(
  () => currentIndex.value,
  () => {
    markLoading();
    preloadAndMaybeMarkLoaded(props.images[currentIndex.value]);
  },
);

watch(
  () => props.images,
  () => {
    // If images list changes while open, re-evaluate loading state.
    if (!props.show) return;
    markLoading();
    preloadAndMaybeMarkLoaded(props.images[currentIndex.value]);
  },
);

const next = () => {
  if (props.images.length === 0) return;
  currentIndex.value = (currentIndex.value + 1) % props.images.length;
};

const prev = () => {
  if (props.images.length === 0) return;
  currentIndex.value =
    (currentIndex.value - 1 + props.images.length) % props.images.length;
};

const close = () => {
  emit("close");
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!props.show) return;
  if (e.key === "Escape") close();
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});

// Touch handling for swipe
const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].screenX;
};

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX;
  handleSwipe();
};

const handleSwipe = () => {
  const threshold = 50;
  if (touchEndX.value < touchStartX.value - threshold) {
    next();
  } else if (touchEndX.value > touchStartX.value + threshold) {
    prev();
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Image preview'"
    >
      <!-- Top bar -->
      <div
        class="flex h-14 shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-6"
      >
        <span class="text-sm tabular-nums text-white/60">
          <template v-if="images.length > 1">
            {{ currentIndex + 1 }} / {{ images.length }}
          </template>
        </span>
        <button
          type="button"
          class="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
          @click="close"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Image stage -->
      <div
        class="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16"
        @click.self="close"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <button
          v-if="images.length > 1"
          type="button"
          class="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:flex"
          aria-label="Previous image"
          @click="prev"
        >
          <ChevronLeft class="h-6 w-6" />
        </button>

        <Transition
          mode="out-in"
          enter-active-class="transition-opacity duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <img
            v-if="images[currentIndex]"
            :key="images[currentIndex]"
            :src="images[currentIndex]"
            :alt="title || 'Image preview'"
            class="max-h-full max-w-full select-none object-contain"
            draggable="false"
            @load="markLoaded"
            @error="markLoaded"
          />
          <div
            v-else
            class="flex flex-col items-center gap-2 text-white/40"
          >
            <ImageIcon class="h-10 w-10" />
            <p class="text-sm">No image available</p>
          </div>
        </Transition>

        <div
          v-if="isLoading && images[currentIndex]"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"
          />
        </div>

        <button
          v-if="images.length > 1"
          type="button"
          class="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:flex"
          aria-label="Next image"
          @click="next"
        >
          <ChevronRight class="h-6 w-6" />
        </button>
      </div>

      <!-- Caption + thumbnails -->
      <div
        class="shrink-0 space-y-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6"
      >
        <div v-if="title || description" class="mx-auto max-w-2xl">
          <p v-if="title" class="text-base font-medium text-white">
            {{ title }}
          </p>
          <p
            v-if="description"
            class="mt-1 whitespace-pre-line text-sm leading-relaxed text-white/60"
            :class="isCaptionExpanded ? 'max-h-[30vh] overflow-y-auto' : 'line-clamp-2'"
          >
            {{ description }}
          </p>
          <button
            v-if="description && description.length > 120"
            type="button"
            class="mt-1 text-sm text-white/80 underline-offset-2 hover:underline"
            @click="isCaptionExpanded = !isCaptionExpanded"
          >
            {{ isCaptionExpanded ? "Show less" : "Show more" }}
          </button>
        </div>

        <div
          v-if="images.length > 1"
          class="mx-auto flex max-w-2xl gap-2 overflow-x-auto"
        >
          <button
            v-for="(img, index) in images"
            :key="index"
            type="button"
            class="h-12 w-12 shrink-0 overflow-hidden rounded-md transition-opacity"
            :class="
              currentIndex === index
                ? 'opacity-100 ring-2 ring-white ring-offset-2 ring-offset-black'
                : 'opacity-40 hover:opacity-70'
            "
            :aria-label="`Image ${index + 1}`"
            :aria-current="currentIndex === index"
            @click="currentIndex = index"
          >
            <img :src="img" alt="" class="h-full w-full object-cover" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
