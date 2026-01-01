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
  Star,
  ArrowUpRight,
  Share2,
  X,
  CalendarOff,
  Link,
} from "lucide-vue-next";

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

// Social dropdown state
const showSocials = ref(false);
const hasSocialLinks = computed(() => {
  const studio = studioStore.studio;
  return (
    studio?.instagram || studio?.facebook || studio?.tiktok || studio?.pinterest
  );
});

// Use heroConfig from store (from API)
const heroContent = computed(() => studioStore.heroConfig);

// Style switcher - use selectedStyle from store (from API)
const currentStyle = computed(() => studioStore.selectedStyle);

// Loading state
const isLoading = ref(true);

// Booking Status
const isBookingOpen = computed(() => {
  return studioStore.websiteSettings?.bookingOpen ?? true;
});

// Background Images from hero config or fallback to defaults
const backgroundImages = computed(() => {
  if (
    heroContent.value?.backgroundImages &&
    heroContent.value.backgroundImages.length > 0
  ) {
    return heroContent.value.backgroundImages;
  }
  // Fallback images
  return [
    "https://i.postimg.cc/t4wCcRhG/untitled-10.jpg",
    "https://i.postimg.cc/HsLYs8zy/untitled-19.jpg",
    "https://i.postimg.cc/T1NXWQ0R/untitled-180.jpg",
  ];
});

const currentImageIndex = ref(0);
let intervalId: any;

const imageInterval = computed(() => {
  // Different intervals for different styles
  if (currentStyle.value === "modern") return 4000; // Faster for modern
  if (currentStyle.value === "luxe") return 5000;
  return 5000; // Rustic
});

// Preload images
const preloadImages = (): Promise<void> => {
  return new Promise((resolve) => {
    const images = backgroundImages.value;
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      resolve();
      return;
    }

    images.forEach((src: string) => {
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
      (currentImageIndex.value + 1) % backgroundImages.value.length;
  }, imageInterval.value);

  // Add body class to prevent scroll when rustic style is active on mobile
  if (currentStyle.value === "rustic") {
    document.body.classList.add("rustic-active");
  }
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  // Remove body class when component unmounts
  document.body.classList.remove("rustic-active");
});

const adjustOpacity = (color: string | undefined, opacity: number) => {
  if (!color) return undefined;
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
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
      class="fixed inset-0 z-[100] bg-black font-sans flex flex-col items-center justify-center overflow-hidden"
    >
      <!-- Background Layer -->
      <div class="absolute inset-0 z-0">
        <img
          src="https://i.postimg.cc/t4wCcRhG/untitled-10.jpg"
          class="w-full h-full object-cover blur-2xl opacity-20 scale-110"
        />
        <div
          class="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black"
        ></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center gap-8">
        <!-- Animated Logo Container -->
        <div class="relative">
          <!-- Abstract Glow -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"
          ></div>

          <!-- Logo/Icon -->
          <div
            class="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
          >
            <img
              v-if="studioStore.studio?.logo_url"
              :src="studioStore.studio.logo_url"
              class="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            />
            <Camera v-else class="w-12 h-12 text-white/50" />
          </div>
        </div>

        <!-- Text -->
        <div class="text-center space-y-4">
          <div class="flex flex-col items-center gap-3">
            <!-- Loading Indicator Line -->
            <div class="w-12 h-0.5 bg-white/10 overflow-hidden rounded-full">
              <div
                class="h-full w-full bg-white/50 origin-left animate-[loading-bar_1.5s_ease-in-out_infinite]"
              ></div>
            </div>
            <p
              class="text-white/80 text-xs md:text-sm font-bold tracking-[0.3em] uppercase indent-[0.3em]"
            >
              {{ t("loading") }}
            </p>
          </div>
          <p
            class="text-white/30 text-[10px] tracking-widest uppercase font-medium"
          >
            {{ studioStore.studio?.name || "Sesifoto" }}
          </p>
        </div>
      </div>
    </div>
  </Transition>

  <!-- UNAVAILABLE STATE (Global Override) -->
  <!-- UNAVAILABLE STATE (Global Override) -->
  <div
    v-if="!isBookingOpen && !isLoading"
    class="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center bg-black font-sans"
  >
    <!-- Background Slideshow -->
    <div class="fixed inset-0 z-0">
      <div class="absolute inset-0">
        <img
          src="https://i.postimg.cc/t4wCcRhG/untitled-10.jpg"
          alt="Background"
          class="w-full h-full object-cover scale-105 animate-slow-zoom blur-sm brightness-[0.7]"
        />
      </div>
      <!-- Dramatic Overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30 z-10"
      ></div>
    </div>

    <!-- Centered Unavailable Card -->
    <div class="relative z-20 px-6 w-full max-w-lg animate-slide-up">
      <div
        class="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-14 flex flex-col items-center text-center gap-8 shadow-2xl relative overflow-hidden"
      >
        <!-- Glow Effect -->
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/5 rounded-full blur-[50px] pointer-events-none"
        ></div>

        <!-- Logo -->
        <div class="relative z-10 animate-fade-in">
          <img
            v-if="studioStore.studio?.logo_url"
            :src="studioStore.studio.logo_url"
            alt="Studio Logo"
            class="h-12 md:h-14 w-auto"
          />
          <Camera v-else class="w-10 h-10 text-white/90" />
        </div>

        <div class="space-y-4 relative z-10">
          <h1
            class="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1] uppercase drop-shadow-lg"
            style="font-family: 'Bricolage Grotesque', sans-serif"
          >
            {{ t("bookingUnavailable") }}
          </h1>
          <div class="w-12 h-1 bg-white/20 mx-auto rounded-full my-4"></div>
          <p
            class="text-white/60 text-sm md:text-base leading-relaxed font-medium max-w-xs mx-auto"
          >
            {{ t("bookingUnavailableDesc") }}
          </p>
        </div>

        <div
          class="py-2.5 px-6 bg-white/[0.05] rounded-full border border-white/10 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-white/70 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm"
        >
          {{ t("checkBackLater") }}
        </div>

        <!-- Social Links Footer -->
        <div class="pt-8 w-full border-t border-white/5 flex flex-col gap-4">
          <p class="text-[10px] uppercase tracking-widest text-white/30">
            {{ t("followUs") }}
          </p>
          <div class="flex justify-center gap-4">
            <a
              v-if="studioStore.studio?.instagram"
              :href="studioStore.studio.instagram"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <Instagram class="w-4 h-4" />
            </a>
            <a
              v-if="studioStore.studio?.tiktok"
              :href="studioStore.studio.tiktok"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>
            <a
              v-if="studioStore.studio?.whatsapp"
              :href="`https://wa.me/${studioStore.studio.whatsapp}`"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <MessageCircle class="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- RUSTIC STYLE -->
  <div
    v-if="currentStyle === 'rustic' && !isLoading && isBookingOpen"
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
        class="flex items-center gap-3 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white/10 hover:bg-black/50 transition-all duration-300"
      >
        <Camera class="w-5 h-5 text-white" />
        <span class="text-white font-semibold text-sm tracking-wide uppercase">
          {{ studioStore.studio?.name || "Sesifoto" }}
        </span>
      </div>

      <!-- Top Right: Social Links -->
      <div class="relative flex items-center gap-3">
        <!-- Social Icons (Slide out to left) -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-x-4 scale-90"
          enter-to-class="opacity-100 translate-x-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-x-0 scale-100"
          leave-to-class="opacity-0 translate-x-4 scale-90"
        >
          <div
            v-if="showSocials"
            class="hidden sm:flex items-center gap-3 mr-2"
          >
            <!-- Pinterest -->
            <a
              v-if="studioStore.studio?.pinterest"
              :href="studioStore.studio.pinterest"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 text-white shadow-lg"
              title="Pinterest"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                />
              </svg>
            </a>

            <!-- TikTok -->
            <a
              v-if="studioStore.studio?.tiktok"
              :href="studioStore.studio.tiktok"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 text-white shadow-lg"
              title="TikTok"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>

            <!-- Facebook -->
            <a
              v-if="studioStore.studio?.facebook"
              :href="studioStore.studio.facebook"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 text-white shadow-lg"
              title="Facebook"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>

            <!-- Instagram -->
            <a
              v-if="studioStore.studio?.instagram"
              :href="studioStore.studio.instagram"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 text-white shadow-lg"
              title="Instagram"
            >
              <Instagram class="w-4 h-4" />
            </a>
          </div>
        </Transition>

        <!-- Toggle Button (Share/Close) -->
        <button
          v-if="hasSocialLinks"
          @click="showSocials = !showSocials"
          class="relative bg-white/10 backdrop-blur-md p-3 rounded-full shadow-lg border border-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer group z-20"
        >
          <div class="relative w-5 h-5">
            <Link
              class="absolute inset-0 w-5 h-5 text-white transition-all duration-300"
              :class="
                showSocials
                  ? 'opacity-0 scale-50 rotate-90'
                  : 'opacity-100 scale-100 rotate-0'
              "
            />
            <X
              class="absolute inset-0 w-5 h-5 text-white transition-all duration-300"
              :class="
                showSocials
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-50 -rotate-90'
              "
            />
          </div>
        </button>

        <!-- Mobile: Social Dropdown (Vertical list for small screens) -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div
            v-if="showSocials"
            class="sm:hidden absolute right-0 top-14 backdrop-blur-md rounded-full shadow-2xl border border-white/10 p-2 z-50 flex flex-col gap-3"
          >
            <!-- Pinterest -->
            <a
              v-if="studioStore.studio?.pinterest"
              :href="studioStore.studio.pinterest"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                />
              </svg>
            </a>

            <!-- TikTok -->
            <a
              v-if="studioStore.studio?.tiktok"
              :href="studioStore.studio.tiktok"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>

            <!-- Facebook -->
            <a
              v-if="studioStore.studio?.facebook"
              :href="studioStore.studio.facebook"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>

            <!-- Instagram -->
            <a
              v-if="studioStore.studio?.instagram"
              :href="studioStore.studio.instagram"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <Instagram class="w-4 h-4" />
            </a>
          </div>
        </Transition>
      </div>
    </header>

    <!-- Main Content Area - Flex Col for Vertical Centering -->
    <main
      class="relative z-20 flex-1 flex flex-col items-center justify-end sm:justify-center px-0 sm:px-6 w-full pt-20 sm:pt-8 pb-0 sm:py-8"
    >
      <!-- Centered Card -->
      <div
        :style="{
          backgroundColor: `rgba(0, 0, 0, ${heroContent?.cardOpacity || 0.3})`,
        }"
        class="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto w-full max-w-xl backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t border-x sm:border border-white/20 overflow-hidden animate-slide-up min-h-[50vh] sm:min-h-0 border-b-0 sm:border-b"
      >
        <!-- Card Content -->
        <div
          class="p-6 sm:p-10 md:p-12 flex flex-col items-start text-left space-y-8"
        >
          <!-- Header Section -->
          <div class="space-y-4 w-full">
            <div class="inline-block">
              <img
                :src="studioStore.studio?.logo_url"
                class="w-auto h-10"
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

          <!-- Actions -->
          <div v-if="isBookingOpen" class="w-full flex flex-col gap-3 sm:gap-4">
            <!-- Primary Button -->
            <button
              @click="router.push('/booking')"
              :style="{
                backgroundColor:
                  heroContent?.buttonBgColor || studioStore.brandColor,
                color: heroContent?.buttonTextColor || '#000000',
              }"
              class="group relative w-full font-bold text-sm sm:text-base uppercase tracking-widest py-4 rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
            >
              <div
                class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              ></div>
              <span class="relative z-10">{{ t("bookNow") }}</span>
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

          <!-- Unavailable Section -->
          <div
            v-else
            class="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-6 flex flex-col items-center text-center gap-3 animate-fade-in"
          >
            <CalendarOff class="w-8 h-8 text-white/60 mb-1" />
            <div class="space-y-1">
              <h3 class="text-white font-serif text-xl italic font-semibold">
                {{ t("bookingUnavailable") }}
              </h3>
              <p class="text-white/80 text-sm">
                {{ t("bookingUnavailableDesc") }}
              </p>
            </div>
            <div
              class="mt-2 py-1 px-3 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/60"
            >
              {{ t("checkBackLater") }}
            </div>
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
              <MapPin
                class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0 group-hover:scale-110 transition-transform"
              />
              <span
                class="text-[11px] sm:text-xs font-medium tracking-wide sm:tracking-wider uppercase leading-relaxed break-words border-b border-transparent group-hover:border-white/50 transition-all"
              >
                {{ t("visitUs") }}
              </span>
            </a>
            <div
              v-else
              class="flex items-start sm:items-center gap-2 text-white/80 w-full text-left"
            >
              <MapPin
                class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0"
              />
              <span
                class="text-[11px] sm:text-xs font-medium tracking-wide sm:tracking-wider uppercase leading-relaxed break-words"
              >
                {{ t("visitUs") }}
              </span>
            </div>

            <!-- Row 2: Copyright & Contact -->
            <div
              class="flex flex-row flex-wrap items-center justify-between gap-y-2 w-full"
            >
              <!-- Copyright -->
              <div
                class="text-white/50 sm:text-white/40 text-[10px] sm:text-[12px] uppercase tracking-wide sm:tracking-widest"
              >
                © {{ new Date().getFullYear() }}
                {{ studioStore.studio?.name || "Lensa" }}
              </div>

              <!-- Contact Link -->
              <a
                v-if="studioStore.studio?.whatsapp"
                :href="`https://wa.me/${studioStore.studio.whatsapp}`"
                target="_blank"
                class="flex items-center gap-1.5 sm:gap-2 text-white/70 sm:text-white/60 hover:text-white transition-colors text-[10px] sm:text-xs font-medium uppercase tracking-wide sm:tracking-widest group"
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
    v-else-if="currentStyle === 'luxe' && !isLoading && isBookingOpen"
    :style="{ backgroundColor: heroContent?.backgroundColor }"
    class="min-h-screen w-full flex flex-col md:flex-row font-serif overflow-hidden relative animate-fade-in"
  >
    <!-- Background Image Area (Full screen on mobile, split on desktop) -->
    <div
      class="fixed md:relative inset-0 md:w-[60%] lg:w-[65%] h-screen md:h-screen overflow-hidden z-0"
    >
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
      <!-- Gradient Overlay (Vignette) -->
      <!-- Mobile: Bottom to Top -->
      <div
        class="absolute inset-0 md:hidden opacity-90"
        :style="{
          background: `linear-gradient(to top, ${
            adjustOpacity(heroContent?.backgroundColor, 0.95) ||
            'rgba(2, 44, 34, 0.95)'
          }, ${
            adjustOpacity(heroContent?.backgroundColor, 0.8) ||
            'rgba(2, 44, 34, 0.8)'
          }, transparent)`,
        }"
      ></div>

      <!-- Desktop: Left to Right -->
      <div
        class="absolute inset-0 hidden md:block opacity-80"
        :style="{
          background: `linear-gradient(to right, ${
            adjustOpacity(heroContent?.backgroundColor, 0.9) ||
            'rgba(2, 44, 34, 0.9)'
          }, transparent)`,
        }"
      ></div>

      <!-- Floating Badge (Top Left) -->
      <div class="absolute top-6 left-6 z-20">
        <div
          :style="{
            backgroundColor: heroContent?.backgroundColor,
            borderColor: heroContent?.primaryTextColor,
          }"
          class="flex items-center gap-3 backdrop-blur-sm py-2 px-4 rounded-full border border-amber-500/30 shadow-xl"
        >
          <img :src="studioStore.studio?.logo_url" alt="" class="w-auto h-4" />
          <span
            :style="{ color: heroContent?.primaryTextColor }"
            class="text-xs tracking-widest uppercase font-medium"
          >
            {{ studioStore.studio?.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Right: Content Panel (Overlay on mobile, side panel on desktop) -->
    <div
      :style="{
        backgroundColor: heroContent?.backgroundColor,
        borderColor: adjustOpacity(heroContent?.primaryTextColor, 0.3),
      }"
      class="fixed md:relative bottom-0 left-0 right-0 md:w-[40%] lg:w-[35%] md:h-screen backdrop-blur-md md:backdrop-blur-none flex flex-col justify-center px-6 md:px-12 lg:px-16 py-6 md:py-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-10 border-t md:border-t-0 md:border-l border-amber-500/20 rounded-t-3xl md:rounded-none min-h-[50vh] max-h-[60vh] md:max-h-none overflow-y-auto md:overflow-y-visible animate-slide-up"
    >
      <!-- Decorative Pattern Background -->
      <div
        :style="{ backgroundColor: heroContent?.backgroundColor }"
        class="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/binding-dark.png')]"
      ></div>

      <!-- Content Content -->
      <div
        class="relative z-10 flex flex-col items-start space-y-4 md:space-y-8 w-full justify-center"
      >
        <!-- Decorative Header Line -->
        <div class="flex items-center gap-4 w-full flex-shrink-0">
          <div
            class="h-[1px] flex-1"
            :style="{
              backgroundImage: `linear-gradient(to right, transparent, ${adjustOpacity(
                heroContent?.primaryTextColor,
                0.5
              )})`,
            }"
          ></div>
          <span
            class="text-[10px] uppercase tracking-[0.4em] font-sans"
            :style="{
              color: heroContent?.primaryTextColor,
            }"
            >{{ t("edition") }} {{ new Date().getFullYear() }}</span
          >
          <div
            class="h-[1px] flex-1"
            :style="{
              backgroundImage: `linear-gradient(to left, transparent, ${adjustOpacity(
                heroContent?.primaryTextColor,
                0.5
              )})`,
            }"
          ></div>
        </div>

        <!-- Main Title -->
        <div class="space-y-2 flex-shrink-0">
          <h1
            :style="{
              color: heroContent?.headingColor,
            }"
            class="text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight font-serif"
          >
            {{ heroContent?.heading }} <br />
            <span
              :style="{
                color: heroContent?.highlightColor,
              }"
              class="text-transparent bg-clip-text italic pr-2"
            >
              {{ heroContent?.highlightText }}
            </span>
          </h1>
          <p
            :style="{ color: heroContent?.supportingColor }"
            class="text-xs md:text-sm font-sans font-light leading-relaxed max-w-xs"
          >
            {{ heroContent?.testimonial }}
          </p>
        </div>

        <!-- Buttons -->
        <div class="w-full pt-2 md:pt-4 flex-shrink-0">
          <div v-if="isBookingOpen" class="space-y-3 md:space-y-4">
            <button
              @click="router.push('/booking')"
              class="group w-full hover:bg-white py-3 md:py-4 px-6 rounded-3xl font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center justify-between hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
              :style="{
                backgroundColor: heroContent?.buttonBgColor
                  ? heroContent.buttonBgColor
                  : undefined,
                color: heroContent?.buttonTextColor
                  ? heroContent.buttonTextColor
                  : undefined,
              }"
            >
              <span>{{ t("startBooking") }}</span>
              <ArrowRight
                class="w-4 h-4 transition-transform group-hover:translate-x-1"
              />
            </button>

            <button
              @click="router.push('/check-booking')"
              :style="{
                '--text-default': adjustOpacity(
                  heroContent?.primaryTextColor,
                  0.6
                ),
                '--text-hover': heroContent?.primaryTextColor,
                '--border-default': adjustOpacity(
                  heroContent?.primaryTextColor,
                  0.3
                ),
                '--border-hover': heroContent?.primaryTextColor,
              }"
              class="group w-full bg-transparent border-[1px] border-[var(--border-default)] text-[var(--text-default)] py-3 md:py-4 px-6 rounded-3xl font-sans text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:border-[var(--border-hover)] hover:text-[var(--text-hover)] flex items-center justify-between"
            >
              <span>{{ t("checkBooking") }}</span>
              <Star
                class="w-4 h-4 group-hover:opacity-100 transition-opacity"
              />
            </button>
          </div>
          <!-- Unavailable Section -->
          <div
            v-else
            class="w-full border border-amber-500/30 bg-amber-900/10 rounded-3xl p-6 flex flex-col items-center text-center gap-3 animate-fade-in"
            :style="{
              borderColor: adjustOpacity(heroContent?.primaryTextColor, 0.2),
            }"
          >
            <CalendarOff
              class="w-8 h-8 opacity-80"
              :style="{ color: heroContent?.primaryTextColor }"
            />
            <div class="space-y-1">
              <h3
                class="font-serif-luxe text-xl italic"
                :style="{ color: heroContent?.primaryTextColor }"
              >
                {{ t("bookingUnavailable") }}
              </h3>
              <p
                class="text-xs font-sans tracking-wide uppercase opacity-70"
                :style="{ color: heroContent?.primaryTextColor }"
              >
                {{ t("bookingUnavailableDesc") }}
              </p>
            </div>
            <div
              class="mt-2 text-[10px] font-sans tracking-[0.2em] uppercase opacity-50 border-t pt-2 w-full"
              :style="{
                color: heroContent?.primaryTextColor,
                borderColor: adjustOpacity(heroContent?.primaryTextColor, 0.2),
              }"
            >
              {{ t("checkBackLater") }}
            </div>
          </div>
        </div>

        <!-- Footer Info -->
        <div
          :style="{
            borderColor: adjustOpacity(heroContent?.primaryTextColor, 0.3),
          }"
          class="w-full pt-4 md:pt-6 border-t flex flex-col gap-3 md:gap-4 flex-shrink-0"
        >
          <!-- Location -->
          <a
            v-if="studioStore.studio?.maps_link"
            :href="studioStore.studio.maps_link"
            :style="{
              '--text-default': adjustOpacity(
                heroContent?.primaryTextColor,
                0.6
              ),
              '--text-hover': heroContent?.primaryTextColor,
            }"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-start md:items-center gap-2.5 md:gap-3 text-[var(--text-default)] hover:text-[var(--text-hover)] transition-colors text-[11px] md:text-[10px] uppercase tracking-wide md:tracking-widest cursor-pointer group"
          >
            <MapPin
              class="w-3.5 h-3.5 md:w-3 md:h-3 transition-colors flex-shrink-0 mt-0.5 md:mt-0"
            />
            <span class="leading-relaxed break-words">{{ t("visitUs") }}</span>
          </a>
          <div
            v-else
            class="flex items-start md:items-center gap-2.5 md:gap-3 text-[11px] md:text-[10px] uppercase tracking-wide md:tracking-widest"
          >
            <MapPin
              class="w-3.5 h-3.5 md:w-3 md:h-3 flex-shrink-0 mt-0.5 md:mt-0"
            />
            <span class="leading-relaxed break-words">{{ t("visitUs") }}</span>
          </div>

          <!-- Copyright & Contact -->
          <div
            :style="{
              '--text-default': adjustOpacity(
                heroContent?.primaryTextColor,
                0.6
              ),
              '--text-hover': heroContent?.primaryTextColor,
            }"
            class="flex flex-row flex-wrap items-center justify-between gap-y-2 text-[10px] sm:text-[10px] uppercase tracking-wide md:tracking-widest text-[var(--text-default)] w-full"
          >
            <span class="hover:text-[var(--text-hover)] transition-colors"
              >© {{ new Date().getFullYear() }}
              {{ studioStore.studio?.name || "Lensa" }}</span
            >
            <a
              v-if="studioStore.studio?.whatsapp"
              :href="`https://wa.me/${studioStore.studio.whatsapp}`"
              target="_blank"
              class="hover:text-[var(--text-hover)] transition-colors flex items-center gap-2 md:gap-1"
            >
              <MessageCircle class="w-3.5 h-3.5 md:w-3 md:h-3 mr-1.5" />
              <span>{{ t("contactUs") }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
    <!-- Social Icons (Top Right) -->
    <div class="absolute top-6 right-6 z-30 md:z-20">
      <div class="relative flex items-center gap-3">
        <!-- Social Icons (Slide out to left) -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-x-4 scale-90"
          enter-to-class="opacity-100 translate-x-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-x-0 scale-100"
          leave-to-class="opacity-0 translate-x-4 scale-90"
        >
          <div
            v-if="showSocials"
            class="hidden sm:flex items-center gap-3 mr-2"
          >
            <!-- Pinterest -->
            <a
              v-if="studioStore.studio?.pinterest"
              :href="studioStore.studio.pinterest"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              title="Pinterest"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                />
              </svg>
            </a>

            <!-- TikTok -->
            <a
              v-if="studioStore.studio?.tiktok"
              :href="studioStore.studio.tiktok"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              title="TikTok"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>

            <!-- Facebook -->
            <a
              v-if="studioStore.studio?.facebook"
              :href="studioStore.studio.facebook"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              title="Facebook"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>

            <!-- Instagram -->
            <a
              v-if="studioStore.studio?.instagram"
              :href="studioStore.studio.instagram"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              title="Instagram"
            >
              <Instagram class="w-4 h-4" />
            </a>
          </div>
        </Transition>

        <!-- Toggle Button (Share/Close) -->
        <button
          v-if="hasSocialLinks"
          @click="showSocials = !showSocials"
          :style="{
            backgroundColor: heroContent?.backgroundColor
              ? heroContent.backgroundColor
              : undefined,
            color: heroContent?.primaryTextColor
              ? heroContent.primaryTextColor
              : undefined,
            borderColor: heroContent?.primaryTextColor
              ? adjustOpacity(heroContent.primaryTextColor, 0.3)
              : undefined,
          }"
          class="relative backdrop-blur-md p-3 rounded-full shadow-xl border transition-all duration-300 cursor-pointer group z-20"
        >
          <div class="relative w-5 h-5">
            <Share2
              class="absolute inset-0 w-5 h-5 transition-all duration-300"
              :class="
                showSocials
                  ? 'opacity-0 scale-50 rotate-90'
                  : 'opacity-100 scale-100 rotate-0'
              "
            />
            <X
              class="absolute inset-0 w-5 h-5 transition-all duration-300"
              :class="
                showSocials
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-50 -rotate-90'
              "
            />
          </div>
        </button>

        <!-- Mobile: Social Dropdown (Vertical list for small screens) -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div
            v-if="showSocials"
            :style="{
              backgroundColor: heroContent?.backgroundColor
                ? heroContent.backgroundColor
                : undefined,
            }"
            class="sm:hidden absolute right-0 top-14 backdrop-blur-md rounded-full shadow-2xl border border-amber-500/20 p-2 z-50 flex flex-col gap-3"
          >
            <!-- Pinterest -->
            <a
              v-if="studioStore.studio?.pinterest"
              :href="studioStore.studio.pinterest"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                />
              </svg>
            </a>

            <!-- TikTok -->
            <a
              v-if="studioStore.studio?.tiktok"
              :href="studioStore.studio.tiktok"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>

            <!-- Facebook -->
            <a
              v-if="studioStore.studio?.facebook"
              :href="studioStore.studio.facebook"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>

            <!-- Instagram -->
            <a
              v-if="studioStore.studio?.instagram"
              :href="studioStore.studio.instagram"
              :style="{
                backgroundColor: heroContent?.backgroundColor
                  ? heroContent.backgroundColor
                  : undefined,
                color: heroContent?.primaryTextColor
                  ? heroContent.primaryTextColor
                  : undefined,
                borderColor: heroContent?.primaryTextColor
                  ? adjustOpacity(heroContent.primaryTextColor, 0.3)
                  : undefined,
              }"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            >
              <Instagram class="w-4 h-4" />
            </a>
          </div>
        </Transition>
      </div>
    </div>
  </div>

  <!-- MODERN STYLE -->
  <div
    v-else-if="currentStyle === 'modern' && !isLoading && isBookingOpen"
    class="min-h-screen w-full font-sans flex flex-col md:flex-row overflow-hidden relative animate-fade-in"
    :class="
      heroContent?.invertTheme ? 'bg-black text-white' : 'bg-white text-black'
    "
    style="font-family: 'Bricolage Grotesque', sans-serif"
  >
    <!-- Social Icons (Top Right) -->
    <div class="absolute top-6 right-6 z-30 md:z-20">
      <div class="relative flex items-center gap-3">
        <!-- Social Icons (Slide out to left) -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-x-4 scale-90"
          enter-to-class="opacity-100 translate-x-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-x-0 scale-100"
          leave-to-class="opacity-0 translate-x-4 scale-90"
        >
          <div
            v-if="showSocials"
            class="hidden sm:flex items-center gap-3 mr-2"
          >
            <!-- Pinterest -->
            <a
              v-if="studioStore.studio?.pinterest"
              :href="studioStore.studio.pinterest"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              :class="
                heroContent?.invertTheme
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/5 border-black/10 text-black'
              "
              title="Pinterest"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                />
              </svg>
            </a>

            <!-- TikTok -->
            <a
              v-if="studioStore.studio?.tiktok"
              :href="studioStore.studio.tiktok"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              :class="
                heroContent?.invertTheme
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/5 border-black/10 text-black'
              "
              title="TikTok"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>

            <!-- Facebook -->
            <a
              v-if="studioStore.studio?.facebook"
              :href="studioStore.studio.facebook"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              :class="
                heroContent?.invertTheme
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/5 border-black/10 text-black'
              "
              title="Facebook"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>

            <!-- Instagram -->
            <a
              v-if="studioStore.studio?.instagram"
              :href="studioStore.studio.instagram"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full border transition-all duration-300 hover:scale-110 shadow-xl"
              :class="
                heroContent?.invertTheme
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/5 border-black/10 text-black'
              "
              title="Instagram"
            >
              <Instagram class="w-4 h-4" />
            </a>
          </div>
        </Transition>

        <!-- Toggle Button (Share/Close) -->
        <button
          v-if="hasSocialLinks"
          @click="showSocials = !showSocials"
          class="relative backdrop-blur-md p-3 rounded-full shadow-xl border transition-all duration-300 cursor-pointer group z-20"
          :class="
            heroContent?.invertTheme
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
          "
        >
          <div class="relative w-5 h-5">
            <Share2
              class="absolute inset-0 w-5 h-5 transition-all duration-300"
              :class="
                showSocials
                  ? 'opacity-0 scale-50 rotate-90'
                  : 'opacity-100 scale-100 rotate-0'
              "
            />
            <X
              class="absolute inset-0 w-5 h-5 transition-all duration-300"
              :class="
                showSocials
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-50 -rotate-90'
              "
            />
          </div>
        </button>

        <!-- Mobile: Social Dropdown (Vertical list for small screens) -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div
            v-if="showSocials"
            class="sm:hidden absolute right-0 top-14 backdrop-blur-md rounded-full shadow-2xl border p-2 z-50 flex flex-col gap-3"
            :class="
              heroContent?.invertTheme
                ? 'bg-black/90 border-white/10'
                : 'bg-white/90 border-black/10'
            "
          >
            <!-- Pinterest -->
            <a
              v-if="studioStore.studio?.pinterest"
              :href="studioStore.studio.pinterest"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              :class="
                heroContent?.invertTheme
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/5 text-black'
              "
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                />
              </svg>
            </a>

            <!-- TikTok -->
            <a
              v-if="studioStore.studio?.tiktok"
              :href="studioStore.studio.tiktok"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              :class="
                heroContent?.invertTheme
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/5 text-black'
              "
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>

            <!-- Facebook -->
            <a
              v-if="studioStore.studio?.facebook"
              :href="studioStore.studio.facebook"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              :class="
                heroContent?.invertTheme
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/5 text-black'
              "
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>

            <!-- Instagram -->
            <a
              v-if="studioStore.studio?.instagram"
              :href="studioStore.studio.instagram"
              target="_blank"
              class="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              :class="
                heroContent?.invertTheme
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/5 text-black'
              "
            >
              <Instagram class="w-4 h-4" />
            </a>
          </div>
        </Transition>
      </div>
    </div>

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
      <div
        class="absolute inset-0 bg-gradient-to-t md:hidden"
        :class="
          heroContent?.invertTheme
            ? 'from-black/95 via-black/80 to-transparent'
            : 'from-white/95 via-white/80 to-transparent'
        "
      ></div>

      <!-- Floating Badge -->
      <div
        class="absolute top-6 left-6 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl z-20"
        :class="
          heroContent?.invertTheme
            ? 'bg-black text-white'
            : 'bg-white text-black'
        "
      >
        <div
          class="w-2 h-2 rounded-full animate-pulse"
          :class="heroContent?.invertTheme ? 'bg-white' : 'bg-black'"
        ></div>
        <span class="text-xs font-bold tracking-widest uppercase"
          >Raya Collection {{ new Date().getFullYear() }}</span
        >
      </div>
    </div>

    <!-- Content Card (Overlay on mobile, side panel on desktop) -->
    <div
      class="fixed md:relative bottom-0 left-0 right-0 md:w-1/2 lg:w-[45%] md:h-screen flex flex-col justify-center gap-8 p-6 md:p-12 lg:p-10 backdrop-blur-md md:backdrop-blur-none z-10 rounded-t-3xl md:rounded-none overflow-y-auto animate-slide-up"
      :class="
        heroContent?.invertTheme
          ? 'bg-black/95 md:bg-black'
          : 'bg-white/95 md:bg-white'
      "
    >
      <!-- Header -->
      <header
        class="flex justify-between items-start flex-shrink-0 mb-4 md:mb-0"
      >
        <button
          class="p-2 rounded-full transition-colors"
          :class="
            heroContent?.invertTheme ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          "
        >
          <img
            :src="
              studioStore.studio?.logo_url || '../../assets/studio-logo-2.webp'
            "
            alt=""
            class="w-auto h-5 md:h-6"
          />
        </button>
      </header>

      <!-- Main Text -->
      <div
        class="flex flex-col gap-4 md:gap-6 items-start flex-shrink-0 my-2 md:my-4"
      >
        <h1
          class="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9] -ml-1"
          :style="{ color: heroContent?.headingColor }"
        >
          {{ heroContent?.heading }} <br />

          <span
            class="text-transparent bg-clip-text bg-gradient-to-r"
            :style="{
              backgroundImage: `linear-gradient(to right, ${
                heroContent?.highlightColor || '#9ca3af'
              } 0%, ${adjustOpacity(
                heroContent?.highlightColor || '#9ca3af',
                0.7
              )} 100%)`,
            }"
            >{{ heroContent?.highlightText }}</span
          >
        </h1>
        <p
          class="text-xs md:text-sm font-medium max-w-xs leading-relaxed"
          :style="{ color: heroContent?.supportingColor }"
        >
          {{ heroContent?.testimonial }}
        </p>
      </div>

      <!-- Footer / Actions -->
      <div class="space-y-4 md:space-y-6 flex-shrink-0 pt-4 md:pt-0">
        <!-- Action Section -->
        <div class="flex-shrink-0 pt-4 md:pt-0">
          <div v-if="isBookingOpen" class="flex flex-col gap-2 md:gap-3">
            <button
              @click="router.push('/booking')"
              class="group w-full bg-black text-white py-4 md:py-5 px-6 rounded-3xl flex justify-between items-center transition-all active:scale-[0.99]"
              :style="{
                backgroundColor:
                  heroContent?.buttonBgColor || studioStore.studio?.brand_color,
                color: heroContent?.buttonTextColor,
              }"
            >
              <span
                class="font-bold text-xs md:text-sm uppercase tracking-widest"
                >{{ t("startBooking") }}</span
              >
              <ArrowRight
                class="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-rotate-45"
              />
            </button>

            <button
              @click="router.push('/check-booking')"
              class="group w-full border-[1px] py-4 md:py-5 px-6 rounded-3xl flex justify-between items-center transition-colors border-[var(--btn-border-default)] hover:border-[var(--btn-border-hover)] text-[var(--btn-text-default)] hover:text-[var(--btn-text-hover)]"
              :style="{
                '--btn-border-default': adjustOpacity(
                  heroContent?.supportingColor,
                  0.3
                ),
                '--btn-border-hover': heroContent?.invertTheme
                  ? '#ffffff'
                  : heroContent?.headingColor || '#000000',
                '--btn-text-default': heroContent?.supportingColor,
                '--btn-text-hover': heroContent?.invertTheme
                  ? '#ffffff'
                  : heroContent?.headingColor || '#000000',
              }"
            >
              <span
                class="font-bold text-xs md:text-sm uppercase tracking-widest transition-colors"
                >{{ t("checkBooking") }}</span
              >
              <ArrowUpRight class="w-4 h-4 md:w-5 md:h-5 transition-colors" />
            </button>
          </div>

          <!-- Unavailable Section -->
          <div
            v-else
            class="w-full border rounded-3xl p-6 py-8 flex flex-col items-center text-center gap-3 animate-fade-in"
            :style="{
              borderColor: adjustOpacity(heroContent?.supportingColor, 0.2),
              backgroundColor: heroContent?.invertTheme
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
            }"
          >
            <CalendarOff
              class="w-8 h-8 opacity-50 mb-1"
              :style="{ color: heroContent?.supportingColor }"
            />
            <div class="space-y-1">
              <h3
                class="font-black text-xl tracking-tight uppercase"
                :style="{ color: heroContent?.headingColor }"
              >
                {{ t("bookingUnavailable") }}
              </h3>
              <p
                class="text-xs font-medium uppercase tracking-widest opacity-60"
                :style="{ color: heroContent?.supportingColor }"
              >
                {{ t("bookingUnavailableDesc") }}
              </p>
            </div>
            <div
              class="mt-2 text-[10px] font-bold tracking-widest border-b pb-0.5 opacity-40 uppercase"
              :style="{
                color: heroContent?.headingColor,
                borderColor: heroContent?.headingColor,
              }"
            >
              {{ t("checkBackLater") }}
            </div>
          </div>
        </div>

        <div
          class="flex flex-col gap-4 pt-4 md:pt-8 border-t"
          :style="{
            borderColor: adjustOpacity(heroContent?.supportingColor, 0.2),
          }"
        >
          <!-- Left: Location -->
          <div class="flex flex-col gap-3">
            <a
              v-if="studioStore.studio?.maps_link"
              :href="studioStore.studio.maps_link"
              target="_blank"
              rel="noopener noreferrer"
              :style="{
                '--text-default': heroContent?.supportingColor,
                '--text-hover': heroContent?.invertTheme
                  ? '#ffffff'
                  : heroContent?.headingColor || '#000000',
                '--border-hover': adjustOpacity(
                  heroContent?.invertTheme
                    ? '#ffffff'
                    : heroContent?.headingColor || '#000000',
                  0.3
                ),
              }"
              class="flex items-center gap-2 text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest text-[var(--text-default)] hover:text-[var(--text-hover)] transition-colors cursor-pointer border-b border-transparent hover:border-[var(--border-hover)] w-fit pb-0.5"
            >
              <MapPin class="w-3.5 h-3.5 md:w-3 md:h-3" />
              <span class="leading-relaxed">{{ t("visitUs") }}</span>
            </a>
            <div
              v-else
              :style="{
                color: heroContent?.supportingColor,
              }"
              class="flex items-center gap-2 text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest opacity-60"
            >
              <MapPin class="w-3.5 h-3.5 md:w-3 md:h-3" />
              <span class="leading-relaxed">{{ t("visitUs") }}</span>
            </div>
          </div>

          <!-- Right: Copyright & Contact -->
          <div
            class="flex flex-row items-center justify-between gap-x-6 gap-y-2 w-full md:w-auto"
          >
            <!-- Copyright -->
            <div
              class="text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest whitespace-nowrap"
              :style="{ color: heroContent?.supportingColor }"
            >
              © {{ new Date().getFullYear() }}
              {{ studioStore.studio?.name || "Sesifoto" }}
            </div>

            <!-- Contact Link -->
            <a
              v-if="studioStore.studio?.whatsapp"
              :href="`https://wa.me/${studioStore.studio.whatsapp}`"
              target="_blank"
              :style="{
                '--text-default': heroContent?.supportingColor,
                '--text-hover': heroContent?.invertTheme
                  ? '#ffffff'
                  : heroContent?.headingColor || '#000000',
              }"
              class="flex items-center gap-1.5 text-[11px] md:text-[10px] font-bold uppercase tracking-wide md:tracking-widest text-[var(--text-default)] hover:text-[var(--text-hover)] transition-colors group"
            >
              <MessageCircle
                class="w-3.5 h-3.5 md:w-3 md:h-3 transition-transform group-hover:scale-110"
              />
              <span>{{ t("contactUs") }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Cinzel:wght@400;500;600;700&display=swap");

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
  font-family: "Playfair Display", serif;
}

.font-sans-luxe {
  font-family: "Cinzel", serif;
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
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}

.animate-slow-zoom {
  animation: slow-zoom 20s linear infinite alternate;
}

@keyframes loading-bar {
  0% {
    transform: scaleX(0);
    transform-origin: left;
  }
  50% {
    transform: scaleX(1);
    transform-origin: left;
  }
  51% {
    transform: scaleX(1);
    transform-origin: right;
  }
  100% {
    transform: scaleX(0);
    transform-origin: right;
  }
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
