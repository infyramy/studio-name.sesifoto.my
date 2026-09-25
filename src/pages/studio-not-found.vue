<script setup lang="ts">
import { useTranslation } from "@/composables/useTranslation";
import { useStudioStore } from "@/stores/studio";
import { RefreshCw, ExternalLink } from "lucide-vue-next";
import { ref } from "vue";
import { useRouter } from "vue-router";

const { t } = useTranslation();
const studioStore = useStudioStore();
const router = useRouter();

const isRetrying = ref(false);

const reasons = [
  "studioNotFoundReason1",
  "studioNotFoundReason2",
  "studioNotFoundReason3",
  "studioNotFoundReason4",
] as const;

const retryLoadStudio = async () => {
  isRetrying.value = true;
  try {
    await studioStore.loadStudio();
    router.push("/");
  } catch (error) {
    console.error("Failed to load studio:", error);
  } finally {
    isRetrying.value = false;
  }
};
</script>

<template>
  <div
    class="studio-nf min-h-screen bg-stone-50 text-stone-900 flex flex-col items-center justify-center px-6 py-16 selection:bg-stone-200 selection:text-stone-900"
  >
    <div class="studio-nf__inner w-full max-w-md">
      <header class="studio-nf__brand studio-nf__enter studio-nf__enter--1 flex flex-col items-center gap-3 mb-10">
        <img
          src="/brand/sesifoto.svg"
          alt=""
          class="h-12 w-12 rounded-lg object-contain"
        />
        <span class="text-sm font-semibold tracking-wide text-stone-800">
          Sesifoto
        </span>
      </header>

      <div class="studio-nf__copy studio-nf__enter studio-nf__enter--2 text-center space-y-3 mb-8">
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          {{ t("studioNotFoundTitle") }}
        </h1>
        <p class="text-base text-stone-500 leading-relaxed">
          {{ t("studioNotFoundMessage") }}
        </p>
      </div>

      <div class="studio-nf__reasons studio-nf__enter studio-nf__enter--3 mb-10 text-left">
        <p class="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
          {{ t("possibleReasons") }}
        </p>
        <ul class="space-y-2.5">
          <li
            v-for="key in reasons"
            :key="key"
            class="flex gap-3 text-sm text-stone-600 leading-snug"
          >
            <span
              class="mt-2 h-1 w-1 shrink-0 rounded-full bg-stone-400"
              aria-hidden="true"
            />
            <span>{{ t(key) }}</span>
          </li>
        </ul>
      </div>

      <div
        class="studio-nf__actions studio-nf__enter studio-nf__enter--4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-8"
      >
        <button
          type="button"
          @click="retryLoadStudio"
          :disabled="isRetrying"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <RefreshCw
            :class="['w-4 h-4', isRetrying ? 'animate-spin' : '']"
            aria-hidden="true"
          />
          <span>{{ t("tryAgain") }}</span>
        </button>

        <a
          href="https://sesifoto.my"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-stone-300 bg-white text-stone-800 text-sm font-medium hover:bg-stone-100 active:scale-[0.98] transition"
        >
          <span>{{ t("visitSesifoto") }}</span>
          <ExternalLink class="w-4 h-4 text-stone-400" />
        </a>
      </div>

      <p
        class="studio-nf__note studio-nf__enter studio-nf__enter--5 text-center text-xs text-stone-400 leading-relaxed max-w-sm mx-auto"
      >
        {{ t("contactStudioDirectly") }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.studio-nf__enter {
  animation: studio-nf-in 0.5s ease-out both;
}

.studio-nf__enter--1 {
  animation-delay: 0.05s;
}
.studio-nf__enter--2 {
  animation-delay: 0.12s;
}
.studio-nf__enter--3 {
  animation-delay: 0.2s;
}
.studio-nf__enter--4 {
  animation-delay: 0.28s;
}
.studio-nf__enter--5 {
  animation-delay: 0.36s;
}

@keyframes studio-nf-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .studio-nf__enter {
    animation: none;
  }
}
</style>
