<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
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
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const currentIndex = ref(0);
const isLoading = ref(true);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      currentIndex.value = props.initialIndex || 0;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);

watch(
  () => currentIndex.value,
  () => {
    isLoading.value = true;
  }
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
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col"
      @click="close"
    >
      <!-- Header / Close -->
      <div class="absolute top-0 right-0 p-4 z-50">
        <button
          @click.stop="close"
          class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Main Content -->
      <div
        class="flex-1 flex items-center justify-center relative w-full h-full p-4 md:p-10"
        @click.stop
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Prev Button (Desktop) -->
        <button
          v-if="images.length > 1"
          @click.stop="prev"
          class="hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all hover:scale-105 backdrop-blur-sm z-30"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>

        <!-- Image Container -->
        <div
          class="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center"
        >
          <Transition
            mode="out-in"
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <img
              v-if="images[currentIndex]"
              :key="images[currentIndex]"
              :src="images[currentIndex]"
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl user-select-none"
              alt="Theme preview"
              @load="isLoading = false"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-500"
            >
              <ImageIcon class="w-16 h-16 opacity-50" />
              <p class="ml-4 text-white/50">No image available</p>
            </div>
          </Transition>

          <!-- Loader -->
          <div
            v-if="isLoading && images[currentIndex]"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div
              class="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"
            ></div>
          </div>
        </div>

        <!-- Next Button (Desktop) -->
        <button
          v-if="images.length > 1"
          @click.stop="next"
          class="hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all hover:scale-105 backdrop-blur-sm z-30"
        >
          <ChevronRight class="w-6 h-6" />
        </button>
      </div>

      <!-- Footer / Indicators -->
      <div
        v-if="images.length > 1"
        class="h-20 shrink-0 flex items-center justify-center gap-2 pb-6 px-4 z-40 overflow-x-auto"
        @click.stop
      >
        <button
          v-for="(img, index) in images"
          :key="index"
          @click="currentIndex = index"
          class="relative w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden transition-all duration-300 border-2"
          :class="
            currentIndex === index
              ? 'border-white opacity-100 scale-110'
              : 'border-transparent opacity-40 hover:opacity-70'
          "
        >
          <img :src="img" class="w-full h-full object-cover" />
        </button>
      </div>
      <div v-else class="h-10"></div>
    </div>
  </Transition>
</template>
