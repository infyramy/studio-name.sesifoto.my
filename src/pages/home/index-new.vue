<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import {
  Camera,
  Instagram,
  ArrowRight,
  Search,
  MapPin,
  MessageCircle,
  Palette,
} from "lucide-vue-next";
import { mockHeroContent } from "@/services/mockData";

const router = useRouter();
const studioStore = useStudioStore();
const heroContent = ref(mockHeroContent[studioStore.studio?.id || ""]);
const { t } = useTranslation();
const showSwitcher = ref(false);

// Background Images Setup
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
  }, 5000); // Change every 5 seconds
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <div
    class="min-h-screen w-full relative overflow-hidden flex flex-col font-sans"
    style="font-family: 'Bricolage Grotesque', sans-serif"
  >
    <!-- Rustic Background Images with Crossfade -->
    <div class="fixed inset-0 z-0 bg-black">
      <div
        v-for="(img, index) in backgroundImages"
        :key="index"
        class="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out will-change-opacity"
        :class="index === currentImageIndex ? 'opacity-100' : 'opacity-0'"
      >
        <img
          :src="img"
          alt="Rustic Interior Background"
          class="w-full h-full object-cover scale-105 animate-ken-burns"
        />
      </div>
      <!-- Gradient overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40 z-10"
      ></div>
    </div>

    <!-- Top Bar -->
    <header
      class="relative z-30 w-full px-5 sm:px-8 md:px-10 py-6 flex items-center justify-between animate-fade-in"
    >
      <!-- Top Left: LS Lensa Studio Branding -->
      <div
        class="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white/10 hover:bg-black/50 transition-all duration-300"
      >
        <!-- <img
          v-if="studioStore.studio?.logo_url"
          :src="studioStore.studio.logo_url"
          :alt="studioStore.studio?.name"
          class="w-6 h-6 rounded-full object-cover"
        /> -->
        <Camera class="w-5 h-5 text-white" />

        <span class="text-white font-semibold text-sm tracking-wide uppercase">
          LS {{ studioStore.studio?.name || "Lensa Studio" }}
        </span>
      </div>

      <!-- Top Right: Instagram Icon -->
      <a
        :href="studioStore.studio?.instagram || 'https://instagram.com'"
        target="_blank"
        class="bg-white/10 backdrop-blur-md p-3 rounded-full shadow-lg border border-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
      >
        <Instagram
          class="w-5 h-5 text-white transition-transform group-hover:scale-110"
        />
      </a>
    </header>

    <!-- Main Content Area - Flex Col for Vertical Centering -->
    <main
      class="relative z-20 flex-1 flex flex-col items-center justify-end sm:justify-center px-0 sm:px-6 w-full pt-8 pb-0 sm:py-8"
    >
      <!-- Centered Card -->
      <div
        class="w-full max-w-xl bg-black/30 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-x sm:border border-white/20 overflow-hidden animate-slide-up min-h-[50vh] sm:min-h-0 border-b-0 sm:border-b"
      >
        <!-- Card Content -->
        <div
          class="p-8 sm:p-10 md:p-12 flex flex-col items-start text-left space-y-8"
        >
          <!-- Header Section -->
          <div class="space-y-4 w-full">
            <div class="inline-block">
              <!-- <span
                class="py-1 px-3 rounded-full bg-white/20 text-white text-[10px] xs:text-xs font-bold uppercase tracking-[0.2em] border border-white/10 shadow-sm"
              >
                Tempahan Raya 2025
              </span> -->
              <img
                src="../../assets/studio-logo-2.webp"
                class="w-auto h-6 invert"
                alt=""
              />
            </div>
            <h1
              class="text-3xl xs:text-4xl sm:text-5xl md:text-4.5xl font-black text-white leading-[1.1] tracking-tight drop-shadow-lg break-words font-serif"
            >
              <!-- Tempah slot studio raya -->
              {{ heroContent?.heading }}
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70"
              >
                <!-- anda sekarang. -->
                {{ heroContent?.highlightText }}
              </span>
            </h1>
            <p
              class="text-white/90 text-sm xs:text-base sm:text-lg font-light leading-relaxed max-w-md drop-shadow-md"
            >
              {{ heroContent?.testimonial }}
            </p>
          </div>

          <!-- Action Buttons (Flex Col) -->
          <div class="w-full space-y-4">
            <!-- Primary Button -->
            <button
              @click="router.push('/booking-new')"
              class="group relative w-full bg-white text-black hover:bg-gray-100 active:bg-gray-200 font-bold text-xs xs:text-sm sm:text-base uppercase tracking-widest py-4 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-3 overflow-hidden"
              :style="{
                backgroundColor: studioStore.studio?.brand_color
                  ? studioStore.studio.brand_color
                  : undefined,
                color: studioStore.studio?.brand_color ? '#fff' : undefined,
              }"
            >
              <span class="relative z-10 whitespace-nowrap">{{
                t("startBooking")
              }}</span>
              <ArrowRight
                class="relative z-10 w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>

            <!-- Secondary Button -->
            <button
              @click="router.push('/check-booking')"
              class="group relative w-full bg-black/40 hover:bg-black/60 active:bg-black/70 text-white border border-white/30 font-bold text-xs xs:text-sm sm:text-base uppercase tracking-widest py-4 rounded-xl transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-3"
            >
              <Search
                class="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300 group-hover:scale-110"
              />
              <span class="whitespace-nowrap">{{ t("checkBooking") }}</span>
            </button>
          </div>

          <!-- Divider -->
          <div
            class="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          ></div>

          <!-- Footer Info -->
          <div class="flex flex-col gap-6 w-full">
            <!-- Location - Centered -->
            <a
              v-if="studioStore.studio?.maps_link"
              :href="studioStore.studio.maps_link"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-white/80 hover:text-white transition-colors w-full text-left group cursor-pointer"
            >
              <MapPin class="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span class="text-[10px] xs:text-xs font-medium tracking-wider uppercase border-b border-transparent group-hover:border-white/50 transition-all">
                {{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}
              </span>
            </a>
            <div
              v-else
              class="flex items-center gap-2 text-white/80 hover:text-white transition-colors w-full text-left"
            >
              <MapPin class="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
              <span
                class="text-[10px] xs:text-xs font-medium tracking-wider uppercase"
              >
                {{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}
              </span>
            </div>

            <!-- Row 2: Copyright & Contact -->
            <div class="flex items-center justify-between w-full px-1">
              <!-- Copyright -->
              <div
                class="text-white/40 text-[10px] xs:text-[12px] uppercase tracking-widest"
              >
                © {{ new Date().getFullYear() }}
                {{ studioStore.studio?.name || "Lensa" }}
              </div>

              <!-- Contact Link -->
              <a
                v-if="studioStore.studio?.whatsapp"
                :href="`https://wa.me/${studioStore.studio.whatsapp}`"
                target="_blank"
                class="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[10px] xs:text-xs font-medium uppercase tracking-widest group"
              >
                <span>{{ t("contactUs") }}</span>
                <MessageCircle
                  class="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Spacer to balance visual center (optional) -->
    <div class="hidden sm:block h-6 sm:h-8"></div>

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
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap");

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.font-serif {
  font-family: "Playfair Display", serif;
  font-weight: 600;
  font-style: italic;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.8s ease-out 0.2s backwards;
}

@keyframes ken-burns {
  0% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1.15);
  }
}

.animate-ken-burns {
  animation: ken-burns 20s linear infinite alternate;
}
</style>
