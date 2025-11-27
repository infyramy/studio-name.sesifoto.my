<script setup lang="ts">
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { ref, computed, onMounted } from "vue";
import { mockHeroContent } from "@/services/mockData";
import { useTranslation } from "@/composables/useTranslation";

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

const isLoading = ref(true);

// Get hero content from mockData based on studio ID
const heroContent = computed(() => {
  const studioId = studioStore.studio?.id || "studio-001";
  return mockHeroContent[studioId] || mockHeroContent["studio-001"];
});

// Simulate API loading delay
onMounted(async () => {
  // Simulate fetching hero content
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
  isLoading.value = false;
});
</script>

<template>
  <div class="h-screen w-screen overflow-hidden">
    <!-- Minimalist Professional Loading State -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-700"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        :style="{
          background: `linear-gradient(135deg, ${heroContent?.colors.accent || '#F1FAEE'} 0%, ${heroContent?.colors.primary || '#A8DADC'}20 100%)`
        }"
      >
        <div class="relative flex flex-col items-center space-y-8 px-6">
          <!-- Studio Name with elegant animation -->
          <div class="text-center space-y-6">
            <h2
              class="text-4xl md:text-5xl font-light tracking-[0.25em] uppercase"
              :style="{ color: heroContent?.colors.secondary || '#457B9D' }"
              style="animation: textFadeSlide 0.8s ease-out forwards"
            >
              {{ studioStore.studio?.name || 'Loading' }}
            </h2>

            <!-- Minimalist Line Progress -->
            <div class="relative w-48 h-0.5 mx-auto overflow-hidden">
              <!-- Background line -->
              <div
                class="absolute inset-0 opacity-20"
                :style="{ backgroundColor: heroContent?.colors.secondary || '#457B9D' }"
              ></div>
              <!-- Animated line -->
              <div
                class="absolute h-full w-1/3"
                :style="{ backgroundColor: heroContent?.colors.secondary || '#457B9D' }"
                style="animation: lineSlide 1.5s ease-in-out infinite"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Full Screen Hero with Background Image -->
    <Transition
      enter-active-class="transition-opacity duration-500"
      enter-from-class="opacity-0"
    >
      <section v-if="!isLoading" class="relative h-full w-full flex flex-col">
        <!-- Background Image -->
        <div class="absolute inset-0">
          <img
            :src="
              heroContent?.backgroundImage ||
              'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1600'
            "
            alt="Hero Background"
            class="w-full h-full object-cover"
          />
          <!-- Balanced overlay - dark left, lighter right -->
          <div
            class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 via-50% to-black/20"
          ></div>
          <!-- Subtle bottom vignette -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
          ></div>
        </div>

      <!-- Header -->
      <header
        class="relative z-20 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-5 md:py-6 flex items-center justify-between"
      >
        <div class="flex items-center gap-2 sm:gap-3">
          <img
            v-if="studioStore.studio?.logo_url"
            :src="studioStore.studio.logo_url"
            :alt="studioStore.studio.name"
            class="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-lg bg-white/90 backdrop-blur-sm p-1"
          />
          <span
            class="font-medium text-sm sm:text-base md:text-xl text-white drop-shadow-lg"
          >
            {{ studioStore.studio?.name || "Studio" }}
          </span>
        </div>
        <button
          @click="router.push('/lookup')"
          class="text-xs font-medium uppercase tracking-wider text-white hover:text-gray-200 transition-colors bg-white/20 backdrop-blur-sm px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 whitespace-nowrap"
        >
          {{ t('checkYourBooking') }}
        </button>
      </header>

      <!-- Main Content - Left Focused with Breathing Room -->
      <div
        class="relative z-10 flex-1 flex items-center px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-20 overflow-hidden"
      >
        <div class="w-full max-w-7xl">
          <!-- Content with balanced width -->
          <div class="max-w-5xl space-y-6 sm:space-y-8 md:space-y-10">
            <!-- Minimalist Badge -->
            <!-- <div
              class="inline-flex items-center gap-3 text-xs sm:text-sm font-light tracking-[0.3em] uppercase animate-fade-in"
              :style="{
                color: heroContent?.colors.primary || '#A8DADC'
              }"
            >
              <div
                class="h-px w-12 sm:w-16"
                :style="{
                  backgroundColor: heroContent?.colors.primary || '#A8DADC'
                }"
              ></div>
              <span class="hidden xs:inline">Raya 2026 Now Open</span>
              <span class="xs:hidden">Now Open</span>
            </div> -->

            <!-- Main Heading - Minimalist Typography with Animation -->
            <div class="space-y-3 sm:space-y-4">
              <h1
                class="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-extralight text-white leading-[1.05] tracking-[-0.02em] animate-slide-in-left"
              >
                {{ heroContent?.heading || "Book Your Raya Photoshoot in"
                }}
              </h1>
              <div
                class="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black italic bg-clip-text text-transparent leading-[1.05] tracking-[-0.02em] animate-slide-in-right"
                :style="{
                  backgroundImage: `linear-gradient(120deg, ${
                    heroContent?.colors.gradientFrom || '#A8DADC'
                  } 0%, ${heroContent?.colors.gradientTo || '#457B9D'} 100%)`,
                }"
              >
                {{ heroContent?.highlightText || "30 Seconds" }}
              </div>
            </div>

            <!-- Caption - Clean and Minimal with Animation -->
            <div class="space-y-4 sm:space-y-5 pt-4 sm:pt-6 max-w-2xl">
              <p
                class="text-base xs:text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed font-light tracking-tight animate-fade-in-up-1"
              >
                {{
                  heroContent?.testimonial ||
                  "Capture your precious Raya moments with professional photography that lasts a lifetime."
                }}
              </p>
              <div class="flex items-center gap-3 animate-fade-in-up-2">
                <div
                  class="h-px w-8"
                  :style="{
                    backgroundColor: heroContent?.colors.primary || '#A8DADC'
                  }"
                ></div>
                <p
                  class="text-sm sm:text-base text-white/70 font-light tracking-wide"
                >
                  {{
                    heroContent?.author || studioStore.studio?.name || "Our Studio"
                  }}
                </p>
              </div>
            </div>

            <!-- CTA Buttons & Trust Indicators Row with Animation -->
            <div
              class="flex flex-col lg:flex-row gap-6 lg:gap-12 items-stretch lg:items-center pt-2 sm:pt-4 animate-fade-in-up-3"
            >
              <!-- CTA Buttons -->
              <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button
                  @click="router.push('/booking')"
                  class="group px-8 py-4 bg-white hover:bg-white/95 text-black font-medium text-sm uppercase tracking-wider transition-all duration-300 w-full sm:w-auto hover:shadow-lg"
                >
                  <span class="flex items-center justify-center gap-3">
                    {{ t('bookNow') }}
                    <svg
                      class="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </span>
                </button>

                <a
                  v-if="studioStore.studio"
                  :href="`https://wa.me/${studioStore.studio.whatsapp}`"
                  target="_blank"
                  class="group px-8 py-4 border-2 border-white/40 hover:border-white text-white font-medium text-sm uppercase tracking-wider transition-all duration-300 inline-flex items-center justify-center gap-3 w-full sm:w-auto hover:shadow-lg"
                >
                  <span class="hidden xs:inline">WhatsApp</span>
                  <span class="xs:hidden">WA</span>
                  <svg
                    class="w-5 h-5 transition-transform group-hover:scale-110"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg>
                </a>
              </div>

              <!-- Trust Indicators - On the right side -->
              <div
                class="flex flex-wrap items-center gap-6 sm:gap-8 text-white text-xs sm:text-sm font-light"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-1 h-1 rounded-full"
                    :style="{ backgroundColor: heroContent?.colors.accent || '#F1FAEE' }"
                  ></div>
                  <span>{{ t('rating') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="w-1 h-1 rounded-full"
                    :style="{ backgroundColor: heroContent?.colors.accent || '#F1FAEE' }"
                  ></div>
                  <span>{{ t('securePayment') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="w-1 h-1 rounded-full"
                    :style="{ backgroundColor: heroContent?.colors.accent || '#F1FAEE' }"
                  ></div>
                  <span>{{ t('instantConfirm') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Info -->
      <div
        class="relative z-10 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-5 md:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-white/60 text-[10px] xs:text-xs border-t border-white/10 backdrop-blur-sm bg-black/20"
      >
        <div
          v-if="studioStore.studio"
          class="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 sm:gap-x-3 gap-y-1 text-center sm:text-left"
        >
          <a
            :href="`https://wa.me/${studioStore.studio.whatsapp}`"
            target="_blank"
            class="hover:text-white transition-colors inline-flex items-center gap-1 sm:gap-1.5 group"
          >
            <svg
              class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 group-hover:text-green-300 transition-colors flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              />
            </svg>
            <span class="truncate">{{ studioStore.studio.whatsapp }}</span>
          </a>
          <span class="hidden sm:inline text-white/30">•</span>
          <a
            v-if="studioStore.studio.maps_link"
            :href="studioStore.studio.maps_link"
            target="_blank"
            class="hover:text-white transition-colors inline-flex items-center gap-1 sm:gap-1.5 max-w-[200px] sm:max-w-none group"
          >
            <svg
              class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 group-hover:text-blue-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span class="truncate">{{ studioStore.studio.address }}</span>
          </a>
          <span
            v-else
            class="inline-flex items-center gap-1 sm:gap-1.5 max-w-[200px] sm:max-w-none"
          >
            <svg
              class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span class="truncate">{{ studioStore.studio.address }}</span>
          </span>
        </div>
        <div
          class="text-center sm:text-right text-[10px] xs:text-xs whitespace-nowrap"
        >
          © {{ new Date().getFullYear() }}
          <span class="hidden xs:inline"
            >{{ studioStore.studio?.name || "Studio" }}.</span
          >
          <span class="hidden sm:inline">{{ t('allRightsReserved') }}</span>
        </div>
      </div>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== Loading State Animations ===== */

/* Text Fade Slide */
@keyframes textFadeSlide {
  0% {
    opacity: 0;
    transform: translateY(15px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Line Slide - Smooth back and forth motion */
@keyframes lineSlide {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(300%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* ===== Hero Text Animations ===== */

/* Slide In from Left */
@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Slide In from Right */
@keyframes slideInRight {
  0% {
    opacity: 0;
    transform: translateX(30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Fade In with Upward Motion */
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation Classes with proper opacity handling */
.animate-slide-in-left {
  animation: slideInLeft 0.8s ease-out both;
}

.animate-slide-in-right {
  animation: slideInRight 0.9s ease-out 0.2s both;
}

.animate-fade-in-up-1 {
  animation: fadeInUp 0.9s ease-out 0.4s both;
}

.animate-fade-in-up-2 {
  animation: fadeInUp 1s ease-out 0.6s both;
}

.animate-fade-in-up-3 {
  animation: fadeInUp 1s ease-out 0.8s both;
}
</style>
