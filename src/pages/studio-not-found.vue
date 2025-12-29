<script setup lang="ts">
import { useTranslation } from "@/composables/useTranslation";
import { Camera, ArrowRight, RefreshCw } from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();

const { t } = useTranslation();

const goToMainSite = () => {
  window.location.href = "https://sesifoto.my";
};

const refreshPage = () => {
  console.log("refreshPage");
  window.location.href = `https://${window.location.hostname}.sesifoto.my`;
};
</script>

<template>
  <div
    class="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6 relative overflow-hidden font-sans"
  >
    <!-- Subtle Grain Texture -->
    <div
      class="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply"
      style="
        background-image: url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E');
      "
    ></div>

    <!-- Ambient Glows -->
    <div
      class="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-50/60 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"
    ></div>
    <div
      class="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-50/60 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"
      style="animation-delay: 2s"
    ></div>

    <div class="relative w-full max-w-lg mx-auto text-center z-10 fade-in">
      <!-- Minimalist Icon -->
      <div class="mb-10 relative inline-flex justify-center items-center group">
        <div
          class="w-28 h-28 rounded-full bg-white border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center relative z-10 transition-transform duration-700 hover:scale-105"
        >
          <Camera class="w-10 h-10 text-stone-400 stroke-[1.5]" />
          <div class="absolute inset-0 flex items-center justify-center">
            <div
              class="w-14 h-[1.5px] bg-rose-300/80 rotate-45 rounded-full"
            ></div>
          </div>
        </div>

        <!-- Subtle Rings -->
        <div
          class="absolute inset-0 rounded-full border border-stone-100/50 scale-125 transition-transform duration-1000 group-hover:scale-110"
        ></div>
        <div
          class="absolute inset-0 rounded-full border border-stone-100/30 scale-150 transition-transform duration-1000 group-hover:scale-125"
        ></div>
      </div>

      <!-- Main Content -->
      <div class="space-y-6 mb-10">
        <div class="inline-block">
          <span
            class="px-3 py-1 rounded-full border border-stone-200 bg-white/50 text-[10px] font-bold tracking-widest text-stone-400 uppercase backdrop-blur-sm"
          >
            Error 404
          </span>
        </div>

        <h1
          class="text-3xl sm:text-4xl font-light text-stone-800 tracking-tight leading-tight"
        >
          {{ t("studioNotFoundTitle") }}
        </h1>

        <p
          class="text-stone-500 text-base font-light leading-relaxed max-w-sm mx-auto"
        >
          {{ t("studioNotFoundMessage") }}
        </p>
      </div>

      <!-- Check List -->
      <div
        class="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-6 mb-10 shadow-sm mx-4 sm:mx-0"
      >
        <p
          class="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4 text-center"
        >
          {{ t("possibleReasons") }}
        </p>
        <ul class="space-y-3 text-left max-w-xs mx-auto">
          <li
            class="flex items-start gap-3 text-sm text-stone-600 font-light group"
          >
            <span
              class="mt-2 w-1 h-1 rounded-full bg-stone-300 group-hover:bg-amber-400 transition-colors"
            ></span>
            {{ t("studioNotFoundReason1") }}
          </li>
          <li
            class="flex items-start gap-3 text-sm text-stone-600 font-light group"
          >
            <span
              class="mt-2 w-1 h-1 rounded-full bg-stone-300 group-hover:bg-amber-400 transition-colors"
            ></span>
            {{ t("studioNotFoundReason2") }}
          </li>
          <li
            class="flex items-start gap-3 text-sm text-stone-600 font-light group"
          >
            <span
              class="mt-2 w-1 h-1 rounded-full bg-stone-300 group-hover:bg-amber-400 transition-colors"
            ></span>
            {{ t("studioNotFoundReason3") }}
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div
        class="flex flex-col sm:flex-row gap-3 justify-center items-center px-6"
      >
        <button
          @click="refreshPage"
          class="w-full sm:w-auto px-6 py-3 rounded-lg border border-stone-200 bg-white/50 text-stone-600 text-sm font-medium hover:bg-white hover:border-stone-300 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-4 h-4" />
          {{ t("tryAgain") || "Try Again" }}
        </button>

        <button
          @click="goToMainSite"
          class="w-full sm:w-auto px-6 py-3 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-95 flex items-center justify-center gap-2 group"
        >
          <span>{{ t("visitSesifoto") || "Visit Sesifoto" }}</span>
          <ArrowRight
            class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>

      <p class="mt-8 text-xs text-stone-400 font-light">
        {{ t("contactStudioDirectly") }}
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.05);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 5s ease-in-out infinite;
}
</style>
