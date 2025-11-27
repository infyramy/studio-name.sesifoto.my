<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { 
  Camera, 
  Instagram, 
  ArrowRight, 
  MapPin, 
  MessageCircle,
  Star,
  Palette
} from 'lucide-vue-next';
import { mockHeroContent } from "@/services/mockData";

const router = useRouter();
const studioStore = useStudioStore();
const heroContent = ref(mockHeroContent[studioStore.studio?.id || ""]);
const { t } = useTranslation();
const showSwitcher = ref(false);

// Festive/Warm Images
const backgroundImages = [
  "https://i.postimg.cc/t4wCcRhG/untitled-10.jpg",
  "https://i.postimg.cc/HsLYs8zy/untitled-19.jpg",
  "https://i.postimg.cc/T1NXWQ0R/untitled-180.jpg"
];

const currentImageIndex = ref(0);
let intervalId: any;

onMounted(() => {
  intervalId = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % backgroundImages.length;
  }, 5000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <div class="min-h-screen w-full flex flex-col md:flex-row font-serif bg-emerald-950 overflow-hidden">
    
    <!-- Left: Visual Area (Image) -->
    <!-- On Desktop: Takes 60% width. On Mobile: Takes 55% height -->
    <div class="relative w-full md:w-[60%] lg:w-[65%] h-[55vh] md:h-screen overflow-hidden">
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
      <div class="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-emerald-950/90 via-transparent to-transparent opacity-80"></div>

      <!-- Floating Badge (Top Left) -->
      <div class="absolute top-6 left-6 z-20">
        <div class="flex items-center gap-3 bg-emerald-900/80 backdrop-blur-sm py-2 px-4 rounded-full border border-amber-500/30 shadow-xl">
          <!-- <img
            v-if="studioStore.studio?.logo_url"
            :src="studioStore.studio.logo_url"
            class="w-6 h-6 rounded-full object-cover border border-amber-200/50"
          /> -->
          <!-- <Camera v-else class="w-4 h-4 text-amber-200" /> -->
          <img src="../../assets/studio-logo-2.webp" alt="" class="w-auto h-4 invert">
          <span class="text-amber-100 text-xs tracking-widest uppercase font-medium">
            LS {{ studioStore.studio?.name || "Lensa Studio" }}
          </span>
        </div>
      </div>
    </div>

    <!-- Right: Content Panel (Solid Color) -->
    <!-- On Desktop: Takes 40% width. On Mobile: Takes 45% height -->
    <div class="relative w-full md:w-[40%] lg:w-[35%] h-[45vh] md:h-screen bg-emerald-950 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-10 md:py-0 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-10 border-t md:border-t-0 md:border-l border-amber-500/20">
      
      <!-- Decorative Pattern Background -->
      <div class="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/binding-dark.png')]"></div>

      <!-- Decorative Corner Elements -->
      <div class="absolute top-6 right-6 w-20 h-20 border-t border-r border-amber-500/20 rounded-tr-3xl"></div>
      <div class="absolute bottom-6 left-6 w-20 h-20 border-b border-l border-amber-500/20 rounded-bl-3xl"></div>

      <!-- Content Content -->
      <div class="relative z-10 flex flex-col items-start space-y-8">
        
        <!-- Decorative Header Line -->
        <div class="flex items-center gap-4 w-full">
          <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent to-amber-500/50"></div>
          <span class="text-amber-400 text-[10px] uppercase tracking-[0.4em] font-sans">Edisi 2025</span>
          <div class="h-[1px] flex-1 bg-gradient-to-l from-transparent to-amber-500/50"></div>
        </div>

        <!-- Main Title -->
        <div class="space-y-2">
          <h1 class="text-4xl md:text-5xl lg:text-6xl text-amber-50 leading-[1.1] tracking-tight font-serif">
            {{ heroContent?.heading }} <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-400 italic pr-2">
              {{ heroContent?.highlightText }}
            </span>
          </h1>
          <p class="text-emerald-200/60 text-sm font-sans font-light leading-relaxed max-w-xs">
            {{ heroContent?.testimonial }}
          </p>
        </div>

        <!-- Buttons -->
        <div class="w-full space-y-4 pt-4">
          <button 
            @click="router.push('/booking-new')"
            class="group w-full bg-amber-100 hover:bg-white text-emerald-950 py-4 px-6 rounded-3xl font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center justify-between hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
            :style="{ backgroundColor: studioStore.studio?.brand_color ? studioStore.studio.brand_color : undefined, color: studioStore.studio?.brand_color ? '#fff' : undefined }"
          >
            <span>{{ t("startBooking") }}</span>
            <ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button 
            @click="router.push('/check-booking')"
            class="group w-full bg-transparent border border-amber-500/30 text-amber-200 py-4 px-6 rounded-3xl font-sans text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:border-amber-400 hover:text-amber-100 flex items-center justify-between"
          >
            <span>{{ t("checkBooking") }}</span>
            <Star class="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        <!-- Footer Info -->
        <div class="w-full pt-8 border-t border-amber-500/10 flex flex-col gap-4">
           <a
             v-if="studioStore.studio?.maps_link"
             :href="studioStore.studio.maps_link"
             target="_blank"
             rel="noopener noreferrer"
             class="flex items-center gap-3 text-emerald-200/50 hover:text-emerald-200/80 text-[10px] uppercase tracking-widest cursor-pointer group transition-colors"
           >
             <MapPin class="w-3 h-3 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
             <span class="group-hover:underline decoration-amber-500/30 underline-offset-4">{{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}</span>
           </a>
           <div v-else class="flex items-center gap-3 text-emerald-200/50 text-[10px] uppercase tracking-widest">
             <MapPin class="w-3 h-3 text-amber-500/50" />
             {{ studioStore.studio?.address || "Bangi Gateway, Seksyen 15" }}
           </div>

           <div class="flex justify-between items-center text-[10px] uppercase tracking-widest text-emerald-200/30">
             <span>© {{ new Date().getFullYear() }} {{ studioStore.studio?.name || 'Lensa' }}</span>
             <a 
                v-if="studioStore.studio?.whatsapp"
                :href="`https://wa.me/${studioStore.studio.whatsapp}`"
                class="hover:text-amber-200 transition-colors flex items-center gap-1"
             >
               <MessageCircle class="w-3 h-3" /> {{ t("contactUs") }}
             </a>
           </div>
        </div>

      </div>
    </div>

    <!-- Design Switcher Helper -->
    <div class="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <div v-if="showSwitcher" class="bg-white rounded-lg shadow-xl p-2 flex flex-col gap-1 mb-2 text-xs font-sans border border-gray-200 text-black">
        <button @click="router.push('/home-new')" class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium">Rustic (New)</button>
        <button @click="router.push('/home-luxe')" class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium">Luxe</button>
        <button @click="router.push('/home-modern')" class="px-3 py-2 hover:bg-gray-100 rounded text-left font-medium">Modern</button>
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
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Cinzel:wght@400;500;600;700&display=swap');

.font-serif {
  font-family: 'Playfair Display', serif;
}

.font-sans {
  font-family: 'Cinzel', serif;
}

@keyframes slow-zoom {
  0% { transform: scale(1.0); }
  100% { transform: scale(1.1); }
}

.animate-slow-zoom {
  animation: slow-zoom 20s linear infinite alternate;
}
</style>
