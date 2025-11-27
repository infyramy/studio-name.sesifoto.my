<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { ArrowRight, ArrowUpRight, Menu, Palette } from "lucide-vue-next";
import { mockHeroContent } from "@/services/mockData";

const router = useRouter();
const studioStore = useStudioStore();
const heroContent = ref(mockHeroContent[studioStore.studio?.id || ""]);
const { t } = useTranslation();
const showSwitcher = ref(false);

// Modern/Editorial B&W Images
const backgroundImages = [
  "https://i.postimg.cc/t4wCcRhG/untitled-10.jpg",
  "https://i.postimg.cc/HsLYs8zy/untitled-19.jpg",
  "https://i.postimg.cc/T1NXWQ0R/untitled-180.jpg",
];

const currentImageIndex = ref(0);
let intervalId: any;

onMounted(() => {
  intervalId = setInterval(() => {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % backgroundImages.length;
  }, 4000); // Faster cuts for modern feel
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <div
    class="min-h-screen w-full bg-white text-black font-sans flex flex-col md:flex-row overflow-hidden"
    style="font-family: 'Bricolage Grotesque', sans-serif"
  >
    <!-- Left: Visual (Hero Image) -->
    <div
      class="relative h-[60vh] md:h-screen w-full md:w-1/2 lg:w-[55%] overflow-hidden bg-gray-100"
    >
      <div
        v-for="(img, index) in backgroundImages"
        :key="index"
        class="absolute inset-0 transition-opacity duration-700 ease-out"
        :class="index === currentImageIndex ? 'opacity-100' : 'opacity-0'"
      >
        <img
          :src="img"
          class="w-full h-full object-cover grayscale contrast-125 hover:scale-105 transition-transform duration-[5000ms] ease-linear"
        />
      </div>

      <!-- Floating Badge -->
      <div
        class="absolute top-6 left-6 bg-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl z-20"
      >
        <div class="w-2 h-2 bg-black rounded-full animate-pulse"></div>
        <span class="text-xs font-bold tracking-widest uppercase"
          >Raya Collection '25</span
        >
      </div>
    </div>

    <!-- Right: Content -->
    <div
      class="relative h-[40vh] md:h-screen w-full md:w-1/2 lg:w-[45%] flex flex-col justify-between p-8 md:p-16 lg:p-20 bg-white z-10"
    >
      <!-- Header -->
      <header class="flex justify-between items-start">
        <div class="text-xl font-black tracking-tighter uppercase leading-none">
          LS<br />Studio.
        </div>
        <button class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <img
            src="../../assets/studio-logo-2.webp"
            alt=""
            class="w-auto h-6"
          />
        </button>
      </header>

      <!-- Main Text -->
      <div class="flex flex-col gap-6 items-start">
        <h1
          class="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] -ml-1"
        >
          {{ heroContent?.heading }} <br />
          <span
            class="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-500"
            >{{ heroContent?.highlightText }}</span
          >
        </h1>
        <p class="text-sm font-medium text-gray-500 max-w-xs leading-relaxed">
          {{ heroContent?.testimonial }}
        </p>
      </div>

      <!-- Footer / Actions -->
      <div class="space-y-6">
        <div class="flex flex-col gap-3">
          <button
            @click="router.push('/booking-new')"
            class="group w-full bg-black text-white py-5 px-6 rounded-3xl flex justify-between items-center hover:bg-gray-900 transition-all active:scale-[0.99]"
            :style="{
              backgroundColor: studioStore.studio?.brand_color
                ? studioStore.studio.brand_color
                : undefined,
            }"
          >
            <span class="font-bold text-sm uppercase tracking-widest">{{
              t("startBooking")
            }}</span>
            <ArrowRight
              class="w-5 h-5 transition-transform group-hover:-rotate-45"
            />
          </button>

          <button
            @click="router.push('/check-booking')"
            class="group w-full border border-gray-200 py-5 px-6 rounded-3xl flex justify-between items-center hover:border-black transition-colors"
          >
            <span
              class="font-bold text-sm uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors"
              >{{ t("checkBooking") }}</span
            >
            <ArrowUpRight
              class="w-5 h-5 text-gray-300 group-hover:text-black transition-colors"
            />
          </button>
        </div>

        <div
           class="flex justify-between items-end pt-8 border-t border-gray-100"
         >
           <a
             v-if="studioStore.studio?.maps_link"
             :href="studioStore.studio.maps_link"
             target="_blank"
             rel="noopener noreferrer"
             class="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors cursor-pointer border-b border-transparent hover:border-black/20 pb-0.5"
           >
             {{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}
           </a>
           <div
             v-else
             class="text-[10px] font-bold uppercase tracking-widest text-gray-400"
           >
             {{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}
           </div>
           <div
             class="text-[10px] font-bold uppercase tracking-widest text-gray-400"
           >
            © {{ new Date().getFullYear() }}
            {{ studioStore.studio?.name || "Lensa" }}
          </div>
        </div>
      </div>
    </div>

    <!-- Design Switcher Helper -->
    <div class="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <div
        v-if="showSwitcher"
        class="bg-white rounded-lg shadow-xl p-2 flex flex-col gap-1 mb-2 text-xs font-sans border border-gray-200 text-black"
      >
        <button
          @click="router.push('/home-new')"
          class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium"
        >
          Rustic (New)
        </button>
        <button
          @click="router.push('/home-luxe')"
          class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium"
        >
          Luxe
        </button>
        <button
          @click="router.push('/home-modern')"
          class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium"
        >
          Modern
        </button>
      </div>
      <button
        @click="showSwitcher = !showSwitcher"
        class="bg-white/90 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform backdrop-blur-sm"
      >
        <Palette class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap");

.font-sans {
  font-family: "Bricolage Grotesque", sans-serif;
}
</style>
