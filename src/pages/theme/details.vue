<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useCurrency } from "@/composables/useCurrency";
import type { Theme } from "@/types";

const { formatPriceWhole } = useCurrency();

const route = useRoute();
const router = useRouter();
const studioStore = useStudioStore();

const themeId = route.params.themeId as string;
const theme = ref<Theme | undefined>();
const currentImageIndex = ref(0);
const loading = ref(true);

// Fetch theme data
onMounted(async () => {
  // Simulate API call to fetch theme details
  await new Promise((resolve) =>
    setTimeout(resolve, 600 + Math.random() * 400)
  );

  theme.value = studioStore.getThemeById(themeId);
  loading.value = false;

  if (!theme.value) {
    router.push("/");
  }
});

const currentImage = computed(() => {
  if (!theme.value || !theme.value.images.length) return "";
  return theme.value.images[currentImageIndex.value];
});

const nextImage = () => {
  if (!theme.value) return;
  currentImageIndex.value =
    (currentImageIndex.value + 1) % theme.value.images.length;
};

const prevImage = () => {
  if (!theme.value) return;
  currentImageIndex.value =
    currentImageIndex.value === 0
      ? theme.value.images.length - 1
      : currentImageIndex.value - 1;
};

const goToBooking = () => {
  router.push({ path: "/booking", query: { theme: themeId } });
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200"
    >
      <div
        class="container mx-auto px-4 py-4 flex items-center justify-between"
      >
        <button
          @click="router.push('/')"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span class="font-medium">Kembali</span>
        </button>

        <div class="flex items-center gap-3">
          <img
            v-if="studioStore.studio?.logo_url"
            :src="studioStore.studio.logo_url"
            :alt="studioStore.studio.name"
            class="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-md"
          />
          <span class="text-sm font-semibold text-gray-900">{{
            studioStore.studio?.name
          }}</span>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Image Skeleton -->
        <div class="animate-pulse">
          <div class="aspect-[4/3] rounded-2xl bg-gray-300"></div>
          <div class="flex gap-2 mt-4">
            <div class="w-20 h-20 rounded-lg bg-gray-300"></div>
            <div class="w-20 h-20 rounded-lg bg-gray-300"></div>
            <div class="w-20 h-20 rounded-lg bg-gray-300"></div>
          </div>
        </div>

        <!-- Content Skeleton -->
        <div class="animate-pulse space-y-6">
          <div>
            <div class="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-300 rounded"></div>
              <div class="h-4 bg-gray-300 rounded"></div>
              <div class="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-6 space-y-4">
            <div class="h-5 bg-gray-300 rounded w-1/2"></div>
            <div class="grid grid-cols-2 gap-4">
              <div class="h-20 bg-gray-300 rounded"></div>
              <div class="h-20 bg-gray-300 rounded"></div>
            </div>
          </div>

          <div class="h-12 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Theme Details -->
    <div v-else-if="theme" class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Image Carousel -->
        <div class="fade-in">
          <div
            class="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 shadow-xl"
          >
            <img
              :src="currentImage"
              :alt="theme.name"
              class="w-full h-full object-cover"
            />

            <!-- Navigation Arrows -->
            <div
              v-if="theme.images.length > 1"
              class="absolute inset-0 flex items-center justify-between p-4"
            >
              <button
                @click="prevImage"
                class="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                @click="nextImage"
                class="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <!-- Image Indicators -->
            <div
              v-if="theme.images.length > 1"
              class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
            >
              <button
                v-for="(img, index) in theme.images"
                :key="index"
                @click="currentImageIndex = index"
                :class="[
                  'w-2 h-2 rounded-full transition-all',
                  index === currentImageIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/80',
                ]"
              ></button>
            </div>
          </div>
        </div>

        <!-- Theme Info -->
        <div class="slide-up space-y-6">
          <!-- Title -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h1 class="text-4xl font-bold text-gray-900">{{ theme.name }}</h1>
              <span
                v-if="theme.is_deposit"
                class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-yellow-500 text-white rounded"
              >
                Deposit
              </span>
            </div>
            <p class="text-gray-600 text-lg">{{ theme.description_short }}</p>
          </div>

          <!-- Full Description -->
          <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p class="text-gray-700 leading-relaxed">
              {{ theme.description_long }}
            </p>
          </div>

          <!-- Package Details -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-white rounded-xl shadow-soft">
              <div class="flex items-center gap-2 text-gray-500 mb-1">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-sm">Bilangan Pax</span>
              </div>
              <p class="text-2xl font-bold text-gray-900">
                {{ theme.base_pax }} orang
              </p>
              <p class="text-xs text-gray-500 mt-1">
                +RM{{ formatPriceWhole(theme.extra_pax_price) }}/orang tambahan
              </p>
            </div>

            <div class="p-4 bg-white rounded-xl shadow-soft">
              <div class="flex items-center gap-2 text-gray-500 mb-1">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-sm">Tempoh Sesi</span>
              </div>
              <p class="text-2xl font-bold text-gray-900">
                {{ theme.duration_minutes }} minit
              </p>
              <p class="text-xs text-gray-500 mt-1">Sesi fotografi</p>
            </div>
          </div>

          <!-- Pricing -->
          <div
            class="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border border-primary-200"
          >
            <div class="flex items-baseline justify-between mb-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">Harga bermula dari</p>
                <p class="text-4xl font-bold text-primary-700">
                  RM{{ formatPriceWhole(theme.base_price) }}
                </p>
                <p v-if="theme.is_deposit" class="text-sm text-gray-600 mt-1">
                  This amount is a deposit
                </p>
              </div>
            </div>

            <div class="text-xs text-gray-600 space-y-1">
              <p>• Harga mungkin berbeza untuk tarikh istimewa</p>
              <p>• Baki 50% dibayar di studio</p>
            </div>
          </div>

          <!-- CTA Button -->
          <button
            @click="goToBooking"
            :style="{ backgroundColor: studioStore.brandColor }"
            class="w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Pilih Tarikh & Masa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
