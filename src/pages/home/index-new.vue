<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
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
  Star,
  ArrowUpRight,
} from "lucide-vue-next";
import { mockHeroContent } from "@/services/mockData";

const router = useRouter();
const studioStore = useStudioStore();
const heroContent = ref(mockHeroContent[studioStore.studio?.id || ""]);
const { t } = useTranslation();
const showSwitcher = ref(false);

// Style switcher - 'rustic' | 'luxe' | 'modern'
const currentStyle = ref<'rustic' | 'luxe' | 'modern'>('rustic');

// Loading state
const isLoading = ref(true);

// Background Images Setup
const backgroundImages = [
  "https://i.postimg.cc/t4wCcRhG/untitled-10.jpg",
  "https://i.postimg.cc/HsLYs8zy/untitled-19.jpg",
  "https://i.postimg.cc/T1NXWQ0R/untitled-180.jpg",
];

const currentImageIndex = ref(0);
let intervalId: any;

const imageInterval = computed(() => {
  // Different intervals for different styles
  if (currentStyle.value === 'modern') return 4000; // Faster for modern
  if (currentStyle.value === 'luxe') return 5000;
  return 5000; // Rustic
});

// Preload images
const preloadImages = (): Promise<void> => {
  return new Promise((resolve) => {
    let loadedCount = 0;
    const totalImages = backgroundImages.length;
    
    if (totalImages === 0) {
      resolve();
      return;
    }

    backgroundImages.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };
      img.src = src;
    });
  });
};

onMounted(async () => {
  try {
    // Wait for images to preload and ensure studio data is ready
    await Promise.all([
      preloadImages(),
      new Promise((resolve) => {
        // Wait a bit for studio data to be available
        if (studioStore.studio) {
          resolve(true);
        } else {
          // If studio not loaded, wait a short time
          setTimeout(resolve, 500);
        }
      }),
    ]);
  } finally {
    // Small delay for smooth transition
    setTimeout(() => {
      isLoading.value = false;
    }, 300);
  }

  // Start image slideshow
  intervalId = setInterval(() => {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % backgroundImages.length;
  }, imageInterval.value);

  // Add body class to prevent scroll when rustic style is active on mobile
  if (currentStyle.value === 'rustic') {
    document.body.classList.add('rustic-active');
  }
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  // Remove body class when component unmounts
  document.body.classList.remove('rustic-active');
});

// Update interval when style changes
const updateInterval = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % backgroundImages.length;
  }, imageInterval.value);
};

const setStyle = (style: 'rustic' | 'luxe' | 'modern') => {
  // Remove rustic-active class if switching away from rustic
  if (currentStyle.value === 'rustic' && style !== 'rustic') {
    document.body.classList.remove('rustic-active');
  }
  // Add rustic-active class if switching to rustic
  if (style === 'rustic') {
    document.body.classList.add('rustic-active');
  }
  currentStyle.value = style;
  updateInterval();
  showSwitcher.value = false;
};
</script>

<template>
  <!-- Loading State -->
  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isLoading"
      class="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <div class="flex flex-col items-center space-y-6">
        <!-- Logo/Icon -->
        <div class="relative">
          <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <Camera class="w-6 h-6 text-white" />
          </div>
        </div>
        
        <!-- Loading Text -->
        <div class="text-center space-y-2">
          <p class="text-white text-sm font-medium tracking-wide uppercase">
            {{ t("loading") }}
          </p>
          <div class="flex items-center gap-2 text-white/60 text-xs">
            <span>{{ studioStore.studio?.name || "Lensa Studio" }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- RUSTIC STYLE -->
  <div
    v-if="currentStyle === 'rustic' && !isLoading"
    class="min-h-screen w-full relative overflow-hidden flex flex-col font-sans rustic-container"
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
      class="fixed sm:relative top-0 left-0 right-0 z-30 w-full px-5 sm:px-8 md:px-10 py-6 flex items-center justify-between animate-fade-in"
    >
      <!-- Top Left: LS Lensa Studio Branding -->
      <div
        class="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white/10 hover:bg-black/50 transition-all duration-300"
      >
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
      class="relative z-20 flex-1 flex flex-col items-center justify-end sm:justify-center px-0 sm:px-6 w-full pt-20 sm:pt-8 pb-0 sm:py-8"
    >
      <!-- Centered Card -->
      <div
        class="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto w-full max-w-xl bg-black/30 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-x sm:border border-white/20 overflow-hidden animate-slide-up min-h-[50vh] sm:min-h-0 border-b-0 sm:border-b"
      >
        <!-- Card Content -->
        <div
          class="p-8 sm:p-10 md:p-12 flex flex-col items-start text-left space-y-8"
        >
          <!-- Header Section -->
          <div class="space-y-4 w-full">
            <div class="inline-block">
              <img
                src="../../assets/studio-logo-2.webp"
                class="w-auto h-6 invert"
                alt=""
              />
            </div>
            <h1
              class="text-3xl xs:text-4xl sm:text-5xl md:text-4.5xl font-black text-white leading-[1.1] tracking-tight drop-shadow-lg break-words font-serif"
            >
              {{ heroContent?.heading }}
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70"
              >
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
          <div class="flex flex-col gap-3 sm:gap-4 w-full">
            <!-- Location -->
            <a
              v-if="studioStore.studio?.maps_link"
              :href="studioStore.studio.maps_link"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-start sm:items-center gap-2 text-white/80 hover:text-white transition-colors w-full text-left group cursor-pointer"
            >
              <MapPin class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0 group-hover:scale-110 transition-transform" />
              <span class="text-[11px] sm:text-xs font-medium tracking-wide sm:tracking-wider uppercase leading-relaxed break-words border-b border-transparent group-hover:border-white/50 transition-all">
                {{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}
              </span>
            </a>
            <div
              v-else
              class="flex items-start sm:items-center gap-2 text-white/80 w-full text-left"
            >
              <MapPin class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span
                class="text-[11px] sm:text-xs font-medium tracking-wide sm:tracking-wider uppercase leading-relaxed break-words"
              >
                {{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}
              </span>
            </div>

            <!-- Row 2: Copyright & Contact -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 w-full">
              <!-- Copyright -->
              <div
                class="text-white/50 sm:text-white/40 text-[11px] sm:text-[12px] uppercase tracking-wide sm:tracking-widest"
              >
                © {{ new Date().getFullYear() }}
                {{ studioStore.studio?.name || "Lensa" }}
              </div>

              <!-- Contact Link -->
              <a
                v-if="studioStore.studio?.whatsapp"
                :href="`https://wa.me/${studioStore.studio.whatsapp}`"
                target="_blank"
                class="flex items-center gap-1.5 sm:gap-2 text-white/70 sm:text-white/60 hover:text-white transition-colors text-[11px] sm:text-xs font-medium uppercase tracking-wide sm:tracking-widest group"
              >
                <span>{{ t("contactUs") }}</span>
                <MessageCircle
                  class="w-3.5 h-3.5 sm:w-3 sm:h-3 transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Spacer to balance visual center (optional) -->
    <div class="hidden sm:block h-6 sm:h-8"></div>
  </div>

  <!-- LUXE STYLE -->
  <div
    v-else-if="currentStyle === 'luxe' && !isLoading"
    class="min-h-screen w-full flex flex-col md:flex-row font-serif bg-emerald-950 overflow-hidden relative animate-fade-in"
  >
    <!-- Background Image Area (Full screen on mobile, split on desktop) -->
    <div class="fixed md:relative inset-0 md:w-[60%] lg:w-[65%] h-screen md:h-screen overflow-hidden z-0">
      <!-- Slideshow -->
      <div 
        v-for="(img, index) in backgroundImages" 
        :key="index"
        class="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out will-change-opacity"
        :class="index === currentImageIndex ? 'opacity-100' : 'opacity-0'"
      >
        <img
          :src="img"
          alt="Background"
          class="w-full h-full object-cover animate-slow-zoom"
        />
      </div>
      
      <!-- Gradient Overlay (Vignette) -->
      <div class="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-emerald-950/95 md:from-emerald-950/90 via-emerald-950/80 md:via-transparent to-transparent opacity-90 md:opacity-80"></div>

      <!-- Floating Badge (Top Left) -->
      <div class="absolute top-6 left-6 z-20">
        <div class="flex items-center gap-3 bg-emerald-900/80 backdrop-blur-sm py-2 px-4 rounded-full border border-amber-500/30 shadow-xl">
          <img src="../../assets/studio-logo-2.webp" alt="" class="w-auto h-4 invert">
          <span class="text-amber-100 text-xs tracking-widest uppercase font-medium">
            LS {{ studioStore.studio?.name || "Lensa Studio" }}
          </span>
        </div>
      </div>
    </div>

    <!-- Right: Content Panel (Overlay on mobile, side panel on desktop) -->
    <div class="fixed md:relative bottom-0 left-0 right-0 md:w-[40%] lg:w-[35%] md:h-screen bg-emerald-950/95 md:bg-emerald-950 backdrop-blur-md md:backdrop-blur-none flex flex-col justify-center px-6 md:px-12 lg:px-16 py-6 md:py-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-10 border-t md:border-t-0 md:border-l border-amber-500/20 rounded-t-3xl md:rounded-none max-h-[65vh] md:max-h-none overflow-y-auto md:overflow-y-visible animate-slide-up">
      
      <!-- Decorative Pattern Background -->
      <div class="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/binding-dark.png')]"></div>

      <!-- Decorative Corner Elements -->
      <div class="absolute top-6 right-6 w-20 h-20 border-t border-r border-amber-500/20 rounded-tr-3xl"></div>
      <div class="absolute bottom-6 left-6 w-20 h-20 border-b border-l border-amber-500/20 rounded-bl-3xl"></div>

      <!-- Content Content -->
      <div class="relative z-10 flex flex-col items-start space-y-4 md:space-y-8 w-full justify-center">
        
        <!-- Decorative Header Line -->
        <div class="flex items-center gap-4 w-full flex-shrink-0">
          <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent to-amber-500/50"></div>
          <span class="text-amber-400 text-[10px] uppercase tracking-[0.4em] font-sans">Edisi 2025</span>
          <div class="h-[1px] flex-1 bg-gradient-to-l from-transparent to-amber-500/50"></div>
        </div>

        <!-- Main Title -->
        <div class="space-y-2 flex-shrink-0">
          <h1 class="text-3xl md:text-5xl lg:text-6xl text-amber-50 leading-[1.1] tracking-tight font-serif">
            {{ heroContent?.heading }} <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-400 italic pr-2">
              {{ heroContent?.highlightText }}
            </span>
          </h1>
          <p class="text-emerald-200/60 text-xs md:text-sm font-sans font-light leading-relaxed max-w-xs">
            {{ heroContent?.testimonial }}
          </p>
        </div>

        <!-- Buttons -->
        <div class="w-full space-y-3 md:space-y-4 pt-2 md:pt-4 flex-shrink-0">
          <button 
            @click="router.push('/booking-new')"
            class="group w-full bg-amber-100 hover:bg-white text-emerald-950 py-3 md:py-4 px-6 rounded-3xl font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center justify-between hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
            :style="{ backgroundColor: studioStore.studio?.brand_color ? studioStore.studio.brand_color : undefined, color: studioStore.studio?.brand_color ? '#fff' : undefined }"
          >
            <span>{{ t("startBooking") }}</span>
            <ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button 
            @click="router.push('/check-booking')"
            class="group w-full bg-transparent border border-amber-500/30 text-amber-200 py-3 md:py-4 px-6 rounded-3xl font-sans text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:border-amber-400 hover:text-amber-100 flex items-center justify-between"
          >
            <span>{{ t("checkBooking") }}</span>
            <Star class="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        <!-- Footer Info -->
        <div class="w-full pt-4 md:pt-6 border-t border-amber-500/10 flex flex-col gap-3 md:gap-4 flex-shrink-0">
           <!-- Location -->
           <a
             v-if="studioStore.studio?.maps_link"
             :href="studioStore.studio.maps_link"
             target="_blank"
             rel="noopener noreferrer"
             class="flex items-start md:items-center gap-2.5 md:gap-3 text-emerald-200/60 md:text-emerald-200/50 hover:text-emerald-200/90 md:hover:text-emerald-200/80 text-[11px] md:text-[10px] uppercase tracking-wide md:tracking-widest cursor-pointer group transition-colors"
           >
             <MapPin class="w-3.5 h-3.5 md:w-3 md:h-3 text-amber-500/60 md:text-amber-500/50 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-0.5 md:mt-0" />
             <span class="group-hover:underline decoration-amber-500/30 underline-offset-4 leading-relaxed break-words">{{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}</span>
           </a>
           <div v-else class="flex items-start md:items-center gap-2.5 md:gap-3 text-emerald-200/60 md:text-emerald-200/50 text-[11px] md:text-[10px] uppercase tracking-wide md:tracking-widest">
             <MapPin class="w-3.5 h-3.5 md:w-3 md:h-3 text-amber-500/60 md:text-amber-500/50 flex-shrink-0 mt-0.5 md:mt-0" />
             <span class="leading-relaxed break-words">{{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}</span>
           </div>

           <!-- Copyright & Contact -->
           <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 text-[11px] md:text-[10px] uppercase tracking-wide md:tracking-widest text-emerald-200/50 md:text-emerald-200/30">
             <span>© {{ new Date().getFullYear() }} {{ studioStore.studio?.name || 'Lensa' }}</span>
             <a 
                v-if="studioStore.studio?.whatsapp"
                :href="`https://wa.me/${studioStore.studio.whatsapp}`"
                target="_blank"
                class="hover:text-amber-200 md:hover:text-amber-200 transition-colors flex items-center gap-1.5 md:gap-1"
             >
               <MessageCircle class="w-3.5 h-3.5 md:w-3 md:h-3" /> 
               <span>{{ t("contactUs") }}</span>
             </a>
           </div>
        </div>

      </div>
    </div>
  </div>

  <!-- MODERN STYLE -->
  <div
    v-else-if="currentStyle === 'modern' && !isLoading"
    class="min-h-screen w-full bg-white text-black font-sans flex flex-col md:flex-row overflow-hidden relative animate-fade-in"
    style="font-family: 'Bricolage Grotesque', sans-serif"
  >
    <!-- Background Image (Full screen on mobile, split on desktop) -->
    <div
      class="fixed md:relative inset-0 md:w-1/2 lg:w-[55%] h-screen md:h-screen overflow-hidden bg-gray-100 z-0"
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

      <!-- Gradient Overlay for mobile -->
      <div class="absolute inset-0 bg-gradient-to-t from-white/95 md:from-transparent via-white/80 md:via-transparent to-transparent md:hidden"></div>

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

    <!-- Content Card (Overlay on mobile, side panel on desktop) -->
    <div
      class="fixed md:relative bottom-0 left-0 right-0 md:w-1/2 lg:w-[45%] md:h-screen flex flex-col justify-between p-6 md:p-16 lg:p-20 bg-white/95 md:bg-white backdrop-blur-md md:backdrop-blur-none z-10 rounded-t-3xl md:rounded-none max-h-[70vh] md:max-h-none overflow-y-auto md:overflow-y-visible animate-slide-up"
    >
      <!-- Header -->
      <header class="flex justify-between items-start flex-shrink-0 mb-4 md:mb-0">
        <!-- <div class="text-lg md:text-xl font-black tracking-tighter uppercase leading-none">
          LS<br />Studio.
        </div> -->
        <button class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <img
            src="../../assets/studio-logo-2.webp"
            alt=""
            class="w-auto h-5 md:h-6"
          />
        </button>
      </header>

      <!-- Main Text -->
      <div class="flex flex-col gap-4 md:gap-6 items-start flex-shrink-0 my-2 md:my-4">
        <h1
          class="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] -ml-1"
        >
          {{ heroContent?.heading }} <br />
          <span
            class="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-500"
            >{{ heroContent?.highlightText }}</span
          >
        </h1>
        <p class="text-xs md:text-sm font-medium text-gray-500 max-w-xs leading-relaxed">
          {{ heroContent?.testimonial }}
        </p>
      </div>

      <!-- Footer / Actions -->
      <div class="space-y-4 md:space-y-6 flex-shrink-0 mt-auto pt-4 md:pt-0">
        <div class="flex flex-col gap-2 md:gap-3">
          <button
            @click="router.push('/booking-new')"
            class="group w-full bg-black text-white py-4 md:py-5 px-6 rounded-3xl flex justify-between items-center hover:bg-gray-900 transition-all active:scale-[0.99]"
            :style="{
              backgroundColor: studioStore.studio?.brand_color
                ? studioStore.studio.brand_color
                : undefined,
            }"
          >
            <span class="font-bold text-xs md:text-sm uppercase tracking-widest">{{
              t("startBooking")
            }}</span>
            <ArrowRight
              class="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-rotate-45"
            />
          </button>

          <button
            @click="router.push('/check-booking')"
            class="group w-full border border-gray-200 py-4 md:py-5 px-6 rounded-3xl flex justify-between items-center hover:border-black transition-colors"
          >
            <span
              class="font-bold text-xs md:text-sm uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors"
              >{{ t("checkBooking") }}</span
            >
            <ArrowUpRight
              class="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-black transition-colors"
            />
          </button>
        </div>

        <div
           class="flex flex-col gap-3 md:flex-row md:justify-between md:items-end pt-4 md:pt-8 border-t border-gray-100"
         >
           <!-- Location -->
           <a
             v-if="studioStore.studio?.maps_link"
             :href="studioStore.studio.maps_link"
             target="_blank"
             rel="noopener noreferrer"
             class="flex items-start md:items-end gap-2 text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest text-gray-500 md:text-gray-400 hover:text-black transition-colors cursor-pointer border-b border-transparent hover:border-black/20 pb-0.5 leading-relaxed break-words"
           >
             <MapPin class="w-3.5 h-3.5 md:w-3 md:h-3 flex-shrink-0 mt-0.5 md:mt-0" />
             <span>{{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}</span>
           </a>
           <div
             v-else
             class="flex items-start md:items-end gap-2 text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest text-gray-500 md:text-gray-400"
           >
             <MapPin class="w-3.5 h-3.5 md:w-3 md:h-3 flex-shrink-0 mt-0.5 md:mt-0" />
             <span class="leading-relaxed break-words">{{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}</span>
           </div>
           
           <!-- Copyright & Contact -->
           <div class="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4">
             <div
               class="text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest text-gray-500 md:text-gray-400"
             >
              © {{ new Date().getFullYear() }}
              {{ studioStore.studio?.name || "Lensa" }}
            </div>
            <a
              v-if="studioStore.studio?.whatsapp"
              :href="`https://wa.me/${studioStore.studio.whatsapp}`"
              target="_blank"
              class="flex items-center gap-1.5 text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest text-gray-500 md:text-gray-400 hover:text-black transition-colors"
            >
              <MessageCircle class="w-3.5 h-3.5 md:w-3 md:h-3" />
              <span>{{ t("contactUs") }}</span>
            </a>
           </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Style Switcher (Common for all styles) -->
  <div class="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
    <div
      v-if="showSwitcher"
      class="bg-white rounded-lg shadow-xl p-2 flex flex-col gap-1 mb-2 text-xs font-sans border border-gray-200 text-black"
    >
      <button
        @click="setStyle('rustic')"
        class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium transition-colors"
        :class="{ 'bg-gray-100 font-bold': currentStyle === 'rustic' }"
      >
        Rustic (New)
      </button>
      <button
        @click="setStyle('luxe')"
        class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium transition-colors"
        :class="{ 'bg-gray-100 font-bold': currentStyle === 'luxe' }"
      >
        Luxe
      </button>
      <button
        @click="setStyle('modern')"
        class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium transition-colors"
        :class="{ 'bg-gray-100 font-bold': currentStyle === 'modern' }"
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
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap");
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Cinzel:wght@400;500;600;700&display=swap');

/* Rustic Style Fonts */
.font-serif {
  font-family: "Playfair Display", serif;
  font-weight: 600;
  font-style: italic;
}

/* Luxe Style Fonts */
.font-sans {
  font-family: "Bricolage Grotesque", sans-serif;
}

/* Luxe specific font */
.font-serif-luxe {
  font-family: 'Playfair Display', serif;
}

.font-sans-luxe {
  font-family: 'Cinzel', serif;
}

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

@keyframes slow-zoom {
  0% { transform: scale(1.0); }
  100% { transform: scale(1.1); }
}

.animate-slow-zoom {
  animation: slow-zoom 20s linear infinite alternate;
}

/* Prevent bounce/overscroll on mobile for Rustic style */
.rustic-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none;
  touch-action: pan-y;
}
</style>

<style>
/* Prevent body scroll when rustic style is active - global style */
body.rustic-active {
  overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
  height: 100% !important;
}
</style>
