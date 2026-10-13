<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";
import type { GalleryHeroTheme } from "@/services/gallery.service";
import { readablePortalAccentText } from "@/utils/portal-color";

const props = defineProps<{
  theme: GalleryHeroTheme;
  title: string;
  coverUrl: string;
  photos: string[];
  /** 0 (calm) – 100 (lively) */
  speed: number;
  heroColor: string;
}>();

const heroEl = ref<HTMLElement | null>(null);

/** Multiplier applied to every animation duration: calm = slower. */
const pace = computed(() => 1.6 - (Math.min(100, Math.max(0, props.speed)) / 100) * 1.2);
const heroText = computed(() => readablePortalAccentText(props.heroColor));
const rootStyle = computed(() => ({
  "--hero-pace": pace.value,
  "--hero-bg": props.heroColor,
  "--hero-text": heroText.value,
}));

const images = computed(() => {
  const list = [props.coverUrl, ...props.photos].filter(Boolean);
  return [...new Set(list)];
});
const PILE_SIZE = 5;
/** Max landing offset, as a percentage of the photo size, so photos stay inside the pile box. */
const PILE_SPREAD_X = 28;
const PILE_SPREAD_Y = 30;
const pileStack = ref<{ key: number; src: string; x: string; y: string }[]>([]);
const pileCards = computed(() => [...pileStack.value].reverse());

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
let pileCount = 0;
let pileTimer: ReturnType<typeof setInterval> | null = null;

const prefersReducedMotion = () =>
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function stopPile() {
  if (pileTimer) clearInterval(pileTimer);
  pileTimer = null;
}

function dropPhoto() {
  const size = Math.min(images.value.length, PILE_SIZE);
  const card = {
    key: pileCount,
    src: images.value[pileCount % images.value.length],
    x: `${randomBetween(-PILE_SPREAD_X, PILE_SPREAD_X).toFixed(1)}%`,
    y: `${randomBetween(-PILE_SPREAD_Y, PILE_SPREAD_Y).toFixed(1)}%`,
  };
  pileCount++;
  pileStack.value = [card, ...pileStack.value].slice(0, size);
}

function schedulePile() {
  stopPile();
  if (props.theme !== "pile" || images.value.length < 2 || prefersReducedMotion()) return;
  pileTimer = setInterval(dropPhoto, 1800 * pace.value);
}

function resetPile() {
  stopPile();
  pileStack.value = [];
  pileCount = 0;
  if (props.theme !== "pile" || !images.value.length) return;
  const initial = prefersReducedMotion() ? Math.min(images.value.length, PILE_SIZE) : 1;
  for (let i = 0; i < initial; i++) dropPhoto();
  schedulePile();
}
/** `top` is relative to the full collage height, which spans two screens. */
const COLLAGE_SPOTS = [
  { left: "0%", top: "12.5%", width: "35%", aspect: "6/5" },
  { left: "58%", top: "-3%", width: "27%", aspect: "2/3" },
  { left: "17%", top: "33.5%", width: "21%", aspect: "5/4" },
  { left: "81%", top: "32%", width: "21%", aspect: "3/4" },
  { left: "40%", top: "52%", width: "22%", aspect: "4/5" },
  { left: "4%", top: "60%", width: "26%", aspect: "3/4" },
  { left: "70%", top: "66%", width: "28%", aspect: "6/5" },
  { left: "30%", top: "82%", width: "24%", aspect: "5/4" },
  { left: "78%", top: "90%", width: "18%", aspect: "3/4" },
];
const collagePhotos = computed(() =>
  COLLAGE_SPOTS.slice(0, images.value.length).map((spot, index) => ({
    ...spot,
    src: images.value[index] ?? "",
  })),
);

const slideIndex = ref(0);
let slideTimer: ReturnType<typeof setInterval> | null = null;

function stopSlides() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = null;
}

function startSlides() {
  stopSlides();
  const slides = props.theme === "slideshow" || props.theme === "scroll-title";
  if (!slides || images.value.length < 2) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  slideTimer = setInterval(() => {
    slideIndex.value = (slideIndex.value + 1) % images.value.length;
  }, 6000 * pace.value);
}

function scrollPast() {
  const next = heroEl.value?.nextElementSibling as HTMLElement | null;
  next?.scrollIntoView({ behavior: "smooth", block: "start" });
}

watch(() => [props.theme, pace.value, images.value.length], startSlides);
watch(() => [props.theme, images.value.length], resetPile);
watch(pace, schedulePile);
onMounted(() => {
  startSlides();
  resetPile();
});
onUnmounted(() => {
  stopSlides();
  stopPile();
});
</script>

<template>
  <section
    ref="heroEl"
    class="gallery-hero relative"
    :class="theme === 'collage' ? 'h-[200dvh] min-h-[960px] overflow-clip' : 'h-dvh min-h-[480px] overflow-hidden'"
    :data-theme="theme"
    :style="rootStyle"
  >
    <!-- 1. Animated centered photo pile -->
    <template v-if="theme === 'pile'">
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="relative aspect-[3/2] w-[min(60vw,560px)]">
          <img
            v-for="photo in pileCards"
            :key="photo.key"
            :src="photo.src"
            alt=""
            class="pile-photo absolute inset-0 h-full w-full object-cover"
            :style="{ '--tx': photo.x, '--ty': photo.y }"
          />
        </div>
      </div>
      <div class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center" :style="{ color: 'var(--hero-text)' }">
        <h1 class="hero-title pile-title max-w-[92vw] text-5xl leading-none sm:text-7xl lg:text-8xl">{{ title }}</h1>
      </div>
    </template>

    <!-- 2. Full-screen image slideshow -->
    <template v-else-if="theme === 'slideshow'">
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <TransitionGroup name="hero-fade">
        <img
          v-for="(src, index) in images"
          v-show="index === slideIndex"
          :key="src"
          :src="src"
          alt=""
          class="slide-photo absolute inset-0 h-full w-full object-cover"
        />
      </TransitionGroup>
      <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
      <div class="hero-copy relative flex h-full items-center justify-center px-6 text-center text-white">
        <h1 class="hero-title text-4xl sm:text-6xl lg:text-7xl">{{ title }}</h1>
      </div>
    </template>

    <!-- 3. Scrolling title over image -->
    <template v-else-if="theme === 'scroll-title'">
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <TransitionGroup name="hero-fade">
        <img
          v-for="(src, index) in images"
          v-show="index === slideIndex"
          :key="src"
          :src="src"
          alt=""
          class="slide-photo absolute inset-0 h-full w-full object-cover"
        />
      </TransitionGroup>
      <div class="absolute inset-0 bg-black/35" />
      <div class="absolute inset-x-0 top-[64%] -translate-y-1/2 overflow-hidden text-white" aria-hidden="true">
        <div class="marquee flex w-max whitespace-nowrap">
          <span v-for="n in 4" :key="n" class="hero-title px-8 text-[18vw] leading-none sm:text-[12vw]">
            {{ title }}
          </span>
        </div>
      </div>
      <h1 class="sr-only">{{ title }}</h1>
    </template>

    <!-- 4. Split title and portrait -->
    <template v-else-if="theme === 'split'">
      <div class="grid h-full grid-rows-[1fr_auto] md:grid-cols-2 md:grid-rows-1" :style="{ background: 'var(--hero-bg)', color: 'var(--hero-text)' }">
        <div class="hero-copy order-2 flex flex-col justify-end px-8 pb-20 pt-8 md:order-1 md:px-10 md:pb-16 md:pt-0">
          <h1 class="hero-title max-w-md text-4xl leading-tight sm:text-5xl">{{ title }}</h1>
        </div>
        <div class="relative order-1 min-h-0 overflow-hidden md:order-2">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="split-photo absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>
    </template>

    <!-- 5. Image overlay portrait -->
    <template v-else-if="theme === 'overlay-portrait'">
      <img v-if="coverUrl" :src="coverUrl" alt="" class="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
      <div class="absolute inset-0" :style="{ background: 'color-mix(in srgb, var(--hero-bg) 60%, transparent)' }" />
      <div class="relative flex h-full flex-col items-center justify-center gap-8 px-6 pb-10 text-center text-white">
        <div class="portrait-card relative aspect-[3/4] h-[50vh] max-h-[520px] overflow-hidden border-[10px] shadow-2xl" :style="{ borderColor: 'var(--hero-bg)' }">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="h-full w-full object-cover" />
        </div>
        <div class="hero-copy">
          <h1 class="hero-title text-4xl sm:text-6xl">{{ title }}</h1>
        </div>
      </div>
    </template>

    <!-- 6. Collage · Floating photos -->
    <template v-else-if="theme === 'collage'">
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <img
        v-for="photo in collagePhotos"
        :key="photo.src"
        :src="photo.src"
        alt=""
        class="absolute object-cover opacity-70"
        :style="{ left: photo.left, top: photo.top, width: photo.width, aspectRatio: photo.aspect }"
      />
      <div class="hero-copy sticky top-0 z-10 flex h-dvh min-h-[480px] items-center justify-center px-6 text-center" :style="{ color: 'var(--hero-text)' }">
        <h1 class="hero-title text-4xl uppercase leading-none sm:text-6xl lg:text-7xl">{{ title }}</h1>
      </div>
    </template>

    <!-- 7. Organic · Slowly shifting portrait -->
    <template v-else>
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <div class="relative flex h-full flex-col items-center justify-center gap-8 px-6 pb-16" :style="{ color: 'var(--hero-text)' }">
        <div class="organic-blob relative aspect-[20/21] h-[62vh] max-h-[600px] max-w-[88vw] overflow-hidden">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="organic-photo absolute -inset-[8%] h-[116%] w-[116%] max-w-none object-cover" />
        </div>
        <div class="hero-copy max-w-xl text-center">
          <h1 class="hero-title text-5xl leading-[0.95] sm:text-6xl">{{ title }}</h1>
        </div>
      </div>
    </template>

    <button
      type="button"
      class="gallery-scroll-indicator absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 opacity-75 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      :style="{ color: theme === 'pile' || theme === 'collage' || theme === 'organic' || theme === 'split' ? 'var(--hero-text)' : '#fff' }"
      aria-label="Scroll to gallery content"
      @click="scrollPast"
    >
      <ChevronDown class="h-5 w-5" />
    </button>
  </section>
</template>

<style scoped>
.hero-title {
  font-family: var(--g-display, "Cormorant Garamond"), serif;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.hero-copy {
  animation: hero-copy-in calc(900ms * var(--hero-pace)) 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.pile-photo {
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
  transform: translate(var(--tx), var(--ty));
}

.pile-title {
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.35),
    0 4px 32px color-mix(in srgb, var(--hero-bg) 75%, transparent);
}

.slide-photo {
  animation: ken-burns calc(14s * var(--hero-pace)) ease-out both;
}

.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity calc(1.4s * var(--hero-pace)) ease;
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.marquee {
  animation: marquee calc(36s * var(--hero-pace)) linear infinite;
}

.split-photo {
  animation: ken-burns calc(18s * var(--hero-pace)) ease-out both;
}

.portrait-card {
  animation: portrait-rise calc(1.1s * var(--hero-pace)) cubic-bezier(0.22, 1, 0.36, 1) both;
}

.organic-blob {
  border-radius: 30% 70% 62% 38% / 34% 38% 62% 66%;
  animation:
    blob calc(18s * var(--hero-pace)) ease-in-out infinite,
    blob-turn calc(26s * var(--hero-pace)) ease-in-out infinite alternate;
}

.organic-photo {
  animation: blob-counter calc(26s * var(--hero-pace)) ease-in-out infinite alternate;
}

@keyframes hero-copy-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes ken-burns {
  from {
    transform: scale(1.08);
  }
  to {
    transform: scale(1);
  }
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes portrait-rise {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes blob {
  0%,
  100% {
    border-radius: 30% 70% 62% 38% / 34% 38% 62% 66%;
  }
  25% {
    border-radius: 52% 48% 70% 30% / 44% 58% 42% 56%;
  }
  50% {
    border-radius: 38% 62% 44% 56% / 60% 36% 64% 40%;
  }
  75% {
    border-radius: 64% 36% 54% 46% / 38% 52% 48% 62%;
  }
}

@keyframes blob-turn {
  from {
    transform: rotate(-6deg);
  }
  to {
    transform: rotate(6deg);
  }
}

@keyframes blob-counter {
  from {
    transform: rotate(6deg) scale(1.02);
  }
  to {
    transform: rotate(-6deg) scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .slide-photo,
  .marquee,
  .split-photo,
  .portrait-card,
  .organic-blob,
  .organic-photo {
    animation: none;
  }
}
</style>
