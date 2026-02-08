<script setup lang="ts">
import { useTranslation } from "@/composables/useTranslation";
import { useStudioStore } from "@/stores/studio";
import { RefreshCw, Film } from "lucide-vue-next";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const { t } = useTranslation();
const studioStore = useStudioStore();
const router = useRouter();

// Simple parallax effect for floating elements
const mouseX = ref(0);
const mouseY = ref(0);
const isRetrying = ref(false);

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 20;
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 20;
};

const retryLoadStudio = async () => {
  isRetrying.value = true;
  try {
    await studioStore.loadStudio();
    // If successful, navigate to home page
    router.push("/");
  } catch (error) {
    // Studio still not found, stay on this page
    console.error("Failed to load studio:", error);
  } finally {
    isRetrying.value = false;
  }
};

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
});
</script>

<template>
  <div
    class="min-h-screen bg-[#FFFBF5] relative overflow-hidden font-sans flex flex-col items-center justify-center p-6 selection:bg-amber-200 selection:text-amber-900"
  >
    <!-- Animated Grid Background -->
    <div
      class="absolute inset-0 z-0 opacity-[0.4]"
      style="
        background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
        background-size: 24px 24px;
      "
    ></div>

    <!-- Floating Shapes (Background) -->
    <div
      class="absolute top-20 left-10 w-32 h-32 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow"
      :style="{
        transform: `translate(${mouseX * -0.5}px, ${mouseY * -0.5}px)`,
      }"
    ></div>
    <div
      class="absolute top-40 right-20 w-44 h-44 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-medium"
      :style="{ transform: `translate(${mouseX * 0.8}px, ${mouseY * 0.8}px)` }"
    ></div>
    <div
      class="absolute bottom-20 left-1/3 w-56 h-56 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-fast"
      :style="{ transform: `translate(${mouseX * 0.2}px, ${mouseY * 0.2}px)` }"
    ></div>

    <!-- Main Content Container -->
    <div class="relative z-10 max-w-2xl mx-auto text-center">
      <!-- Big Fun Illustration Area -->
      <div class="mb-8 relative h-64 flex items-center justify-center">
        <!-- 404 Text Background -->
        <h1
          class="text-[180px] font-black text-white/80 select-none absolute inset-0 flex items-center justify-center pointer-events-none drop-shadow-sm"
          style="-webkit-text-stroke: 4px #fee2e2"
        >
          404
        </h1>

        <!-- Animated Camera Character -->
        <div
          class="relative transform hover:scale-105 transition-transform duration-500 cursor-pointer group"
          :style="{
            transform: `translate(${mouseX}px, ${mouseY}px) rotate(${mouseX}deg)`,
          }"
        >
          <!-- Camera Body -->
          <div
            class="w-40 h-32 bg-stone-800 rounded-3xl shadow-2xl relative z-10 flex items-center justify-center border-4 border-stone-900 group-hover:border-rose-400 transition-colors"
          >
            <!-- Lens -->
            <div
              class="w-20 h-20 rounded-full bg-stone-900 border-4 border-stone-700 flex items-center justify-center relative overflow-hidden group-hover:bg-rose-900/20 transition-colors"
            >
              <div
                class="absolute w-12 h-12 bg-black/60 rounded-full border-2 border-white/10"
              ></div>
              <!-- Reflection -->
              <div
                class="absolute top-3 right-4 w-4 h-4 bg-white/20 rounded-full blur-[1px]"
              ></div>

              <!-- Sad Eyes (Animated) -->
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <div
                  class="w-2 h-2 bg-rose-400 rounded-full animate-blink"
                ></div>
                <div
                  class="w-2 h-2 bg-rose-400 rounded-full animate-blink"
                  style="animation-delay: 0.2s"
                ></div>
              </div>
            </div>

            <!-- Flash / Viewfinder -->
            <div
              class="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-stone-700 rounded-t-lg border-t-4 border-x-4 border-stone-900"
            ></div>

            <!-- Shutter Button -->
            <div
              class="absolute -top-3 right-6 w-6 h-4 bg-rose-500 rounded-t-md border-2 border-rose-600 animate-bounce-subtle"
            ></div>
          </div>

          <!-- Flying Photos -->
          <Film
            class="absolute -top-10 -left-12 text-stone-300 w-12 h-12 rotate-[-20deg] animate-float-medium opacity-60"
          />
          <Film
            class="absolute -bottom-4 -right-10 text-stone-300 w-10 h-10 rotate-[15deg] animate-float-slow opacity-60"
          />

          <!-- Shadow -->
          <div
            class="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/10 rounded-[100%] blur-sm group-hover:w-28 transition-all duration-300"
          ></div>
        </div>
      </div>

      <!-- Text Content -->
      <div class="space-y-4 mb-10 px-4">
        <h2 class="text-4xl font-bold text-stone-800 tracking-tight">
          {{ t("studioNotFoundTitle") || "Lost in the shot?" }}
        </h2>
        <p class="text-lg text-stone-500 max-w-md mx-auto leading-relaxed">
          {{
            t("studioNotFoundMessage") ||
            "We couldn't find the studio you're looking for. It might have moved, closed, or is just playing hide and seek."
          }}
        </p>
      </div>

      <!-- Action Button -->
      <div class="flex justify-center mb-12">
        <button
          @click="retryLoadStudio"
          :disabled="isRetrying"
          class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-stone-900 text-stone-50 rounded-full font-medium shadow-xl hover:bg-stone-800 hover:scale-105 active:scale-95 transition-all duration-300 ring-1 ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <RefreshCw
            :class="[
              'w-5 h-5 transition-transform duration-700',
              isRetrying ? 'animate-spin' : 'group-hover:rotate-180',
            ]"
          />
          <span class="text-base tracking-wide">{{
            isRetrying ? "Retrying..." : t("tryAgain") || "Try Again"
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float-slow {
  0%,
  100% {
    transform: translateY(0) rotate(0);
  }
  50% {
    transform: translateY(-15px) rotate(2deg);
  }
}

@keyframes float-medium {
  0%,
  100% {
    transform: translateY(0) rotate(0);
  }
  50% {
    transform: translateY(-10px) rotate(-2deg);
  }
}

@keyframes float-fast {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-5px) scale(1.02);
  }
}

.animate-float-slow {
  animation: float-slow 6s ease-in-out infinite;
}
.animate-float-medium {
  animation: float-medium 4s ease-in-out infinite;
}
.animate-float-fast {
  animation: float-fast 3s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100%,
  96% {
    transform: scaleY(1);
  }
  98% {
    transform: scaleY(0.1);
  }
}

.animate-blink {
  animation: blink 3s infinite;
}

@keyframes bounce-subtle {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
</style>
