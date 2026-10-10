<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";
import type { GalleryHeroTheme } from "@/services/gallery.service";
import { readablePortalAccentText } from "@/utils/portal-color";

const props = defineProps<{
  theme: GalleryHeroTheme;
  title: string;
  subtitle: string;
  eyebrow: string;
  metaLine: string;
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
const stackImages = computed(() => images.value.slice(0, 5));

const PILE_ANGLES = [-8, 6, -3, 10, -12];
const COLLAGE_SPOTS = [
  { left: "6%", top: "12%", width: "22%", rotate: -6 },
  { left: "72%", top: "8%", width: "20%", rotate: 5 },
  { left: "10%", top: "62%", width: "18%", rotate: 4 },
  { left: "70%", top: "60%", width: "22%", rotate: -4 },
  { left: "38%", top: "4%", width: "14%", rotate: 3 },
  { left: "42%", top: "74%", width: "15%", rotate: -3 },
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
  if (props.theme !== "slideshow" || images.value.length < 2) return;
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
onMounted(startSlides);
onUnmounted(stopSlides);
</script>

<template>
  <section
    ref="heroEl"
    class="gallery-hero relative h-dvh min-h-[480px] overflow-hidden"
    :data-theme="theme"
    :style="rootStyle"
  >
    <!-- 1. Animated cardboard photo pile -->
    <template v-if="theme === 'pile'">
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <div class="absolute inset-0 flex items-center justify-center pb-24">
        <div class="relative h-[52vh] w-[min(78vw,420px)]">
          <img
            v-for="(src, index) in stackImages"
            :key="src"
            :src="src"
            alt=""
            class="pile-photo absolute inset-0 h-full w-full object-cover"
            :style="{ '--angle': `${PILE_ANGLES[index % PILE_ANGLES.length]}deg`, '--i': index }"
          />
        </div>
      </div>
      <div class="hero-copy absolute inset-x-0 bottom-0 px-6 pb-16 text-center" :style="{ color: 'var(--hero-text)' }">
        <p v-if="eyebrow" class="mb-3 text-[11px] font-medium tracking-[0.18em] opacity-70">{{ eyebrow }}</p>
        <h1 class="hero-title text-4xl sm:text-6xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-3 text-base opacity-85">{{ subtitle }}</p>
        <p v-if="metaLine" class="mt-3 text-sm tracking-wide opacity-70">{{ metaLine }}</p>
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
      <div class="hero-copy relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <p v-if="eyebrow" class="mb-4 text-[11px] font-medium tracking-[0.18em] text-white/75">{{ eyebrow }}</p>
        <h1 class="hero-title text-4xl sm:text-6xl lg:text-7xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-4 text-base text-white/85 sm:text-lg">{{ subtitle }}</p>
        <p v-if="metaLine" class="mt-4 text-sm tracking-wide text-white/75">{{ metaLine }}</p>
      </div>
      <div v-if="images.length > 1" class="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-1.5">
        <button
          v-for="(src, index) in images"
          :key="src"
          type="button"
          class="h-1.5 rounded-full bg-white transition-all"
          :class="index === slideIndex ? 'w-5 opacity-100' : 'w-1.5 opacity-45'"
          :aria-label="`Show photo ${index + 1}`"
          @click="slideIndex = index; startSlides()"
        />
      </div>
    </template>

    <!-- 3. Scrolling title over image -->
    <template v-else-if="theme === 'scroll-title'">
      <img v-if="coverUrl" :src="coverUrl" alt="" class="absolute inset-0 h-full w-full object-cover" />
      <div v-else class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <div class="absolute inset-0 bg-black/35" />
      <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden text-white" aria-hidden="true">
        <div class="marquee flex w-max whitespace-nowrap">
          <span v-for="n in 4" :key="n" class="hero-title px-8 text-[18vw] leading-none sm:text-[12vw]">
            {{ title }}
          </span>
        </div>
      </div>
      <div class="hero-copy absolute inset-x-0 bottom-0 px-6 pb-20 text-center text-white">
        <h1 class="sr-only">{{ title }}</h1>
        <p v-if="subtitle" class="text-base text-white/90 sm:text-lg">{{ subtitle }}</p>
        <p v-if="metaLine" class="mt-2 text-sm tracking-wide text-white/75">{{ metaLine }}</p>
      </div>
    </template>

    <!-- 4. Split title and portrait -->
    <template v-else-if="theme === 'split'">
      <div class="grid h-full grid-rows-[auto_1fr] md:grid-cols-2 md:grid-rows-1" :style="{ background: 'var(--hero-bg)', color: 'var(--hero-text)' }">
        <div class="hero-copy flex flex-col justify-center px-8 pb-8 pt-24 md:px-14 md:py-0">
          <p v-if="eyebrow" class="mb-4 text-[11px] font-medium tracking-[0.18em] opacity-70">{{ eyebrow }}</p>
          <h1 class="hero-title text-5xl leading-[0.95] sm:text-7xl">{{ title }}</h1>
          <p v-if="subtitle" class="mt-5 text-lg opacity-85">{{ subtitle }}</p>
          <p v-if="metaLine" class="mt-4 text-sm tracking-wide opacity-70">{{ metaLine }}</p>
        </div>
        <div class="relative min-h-0 overflow-hidden">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="split-photo absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>
    </template>

    <!-- 5. Image overlay portrait -->
    <template v-else-if="theme === 'overlay-portrait'">
      <img v-if="coverUrl" :src="coverUrl" alt="" class="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
      <div class="absolute inset-0" :style="{ background: 'color-mix(in srgb, var(--hero-bg) 60%, transparent)' }" />
      <div class="relative flex h-full flex-col items-center justify-center gap-8 px-6 pb-10 text-center text-white">
        <div class="portrait-card relative aspect-[3/4] h-[50vh] max-h-[520px] overflow-hidden shadow-2xl ring-1 ring-white/30">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="h-full w-full object-cover" />
        </div>
        <div class="hero-copy">
          <p v-if="eyebrow" class="mb-3 text-[11px] font-medium tracking-[0.18em] text-white/75">{{ eyebrow }}</p>
          <h1 class="hero-title text-4xl sm:text-6xl">{{ title }}</h1>
          <p v-if="subtitle" class="mt-3 text-base text-white/85">{{ subtitle }}</p>
          <p v-if="metaLine" class="mt-3 text-sm tracking-wide text-white/75">{{ metaLine }}</p>
        </div>
      </div>
    </template>

    <!-- 6. Collage – floating photos -->
    <template v-else-if="theme === 'collage'">
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <img
        v-for="(photo, index) in collagePhotos"
        :key="photo.src"
        :src="photo.src"
        alt=""
        class="collage-photo absolute aspect-[4/5] object-cover shadow-xl"
        :style="{
          left: photo.left,
          top: photo.top,
          width: photo.width,
          '--angle': `${photo.rotate}deg`,
          '--i': index,
        }"
      />
      <div class="hero-copy relative flex h-full flex-col items-center justify-center px-6 text-center" :style="{ color: 'var(--hero-text)' }">
        <p v-if="eyebrow" class="mb-4 text-[11px] font-medium tracking-[0.18em] opacity-70">{{ eyebrow }}</p>
        <h1 class="hero-title max-w-3xl text-5xl sm:text-7xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-4 text-lg opacity-85">{{ subtitle }}</p>
        <p v-if="metaLine" class="mt-3 text-sm tracking-wide opacity-70">{{ metaLine }}</p>
      </div>
    </template>

    <!-- 7. Organic – slowly shifting portrait -->
    <template v-else>
      <div class="absolute inset-0" :style="{ background: 'var(--hero-bg)' }" />
      <div class="relative flex h-full flex-col items-center justify-center gap-8 px-6 pb-10 md:flex-row md:gap-16" :style="{ color: 'var(--hero-text)' }">
        <div class="organic-blob relative aspect-[4/5] h-[46vh] max-h-[520px] overflow-hidden">
          <img v-if="coverUrl" :src="coverUrl" alt="" class="h-full w-full object-cover" />
        </div>
        <div class="hero-copy max-w-md text-center md:text-left">
          <p v-if="eyebrow" class="mb-4 text-[11px] font-medium tracking-[0.18em] opacity-70">{{ eyebrow }}</p>
          <h1 class="hero-title text-5xl leading-[0.95] sm:text-6xl">{{ title }}</h1>
          <p v-if="subtitle" class="mt-4 text-lg opacity-85">{{ subtitle }}</p>
          <p v-if="metaLine" class="mt-3 text-sm tracking-wide opacity-70">{{ metaLine }}</p>
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
  border: 10px solid #fff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  animation: pile-drop calc(900ms * var(--hero-pace)) cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 260ms * var(--hero-pace));
  transform: rotate(var(--angle));
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

.collage-photo {
  border: 6px solid #fff;
  transform: rotate(var(--angle));
  animation: float calc(7s * var(--hero-pace)) ease-in-out infinite alternate;
  animation-delay: calc(var(--i) * -1.3s);
}

.organic-blob {
  border-radius: 46% 54% 52% 48% / 55% 45% 55% 45%;
  animation: blob calc(14s * var(--hero-pace)) ease-in-out infinite alternate;
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

@keyframes pile-drop {
  from {
    opacity: 0;
    transform: translateY(-60px) rotate(calc(var(--angle) * 2)) scale(1.08);
  }
  to {
    opacity: 1;
    transform: rotate(var(--angle));
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

@keyframes float {
  from {
    transform: rotate(var(--angle)) translateY(0);
  }
  to {
    transform: rotate(calc(var(--angle) * -0.5)) translateY(-18px);
  }
}

@keyframes blob {
  0% {
    border-radius: 46% 54% 52% 48% / 55% 45% 55% 45%;
  }
  50% {
    border-radius: 58% 42% 38% 62% / 42% 58% 42% 58%;
  }
  100% {
    border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .pile-photo,
  .slide-photo,
  .marquee,
  .split-photo,
  .portrait-card,
  .collage-photo,
  .organic-blob {
    animation: none;
  }
}
</style>
