<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Home } from "lucide-vue-next";
import { useTranslation } from "@/composables/useTranslation";
import { useStudioStore } from "@/stores/studio";

const { t } = useTranslation();
const studioStore = useStudioStore();
const router = useRouter();

const studioLogoUrl = computed(() => {
  const url = studioStore.studio?.logo_url?.trim();
  return url || null;
});

const studioName = computed(() => {
  return studioStore.studio?.name?.trim() || "";
});

const goHome = () => {
  router.push("/");
};
</script>

<template>
  <div
    class="page-nf min-h-screen bg-stone-50 text-stone-900 flex flex-col items-center justify-center px-6 py-16 selection:bg-stone-200 selection:text-stone-900"
  >
    <div class="page-nf__inner w-full max-w-md">
      <header
        class="page-nf__brand page-nf__enter page-nf__enter--1 flex flex-col items-center gap-3 mb-10"
      >
        <img
          v-if="studioLogoUrl"
          :src="studioLogoUrl"
          :alt="studioName"
          class="h-14 w-14 rounded-lg object-contain bg-white"
        />
        <span
          v-if="studioName"
          class="text-sm font-semibold tracking-wide text-stone-800"
        >
          {{ studioName }}
        </span>
      </header>

      <div
        class="page-nf__copy page-nf__enter page-nf__enter--2 text-center space-y-3 mb-10"
      >
        <h1
          class="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900"
        >
          {{ t("pageNotFound") }}
        </h1>
        <p class="text-base text-stone-500 leading-relaxed">
          {{ t("pageNotFoundMessage") }}
        </p>
      </div>

      <div
        class="page-nf__actions page-nf__enter page-nf__enter--3 flex justify-center"
      >
        <button
          type="button"
          @click="goHome"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition"
        >
          <Home class="w-4 h-4" aria-hidden="true" />
          <span>{{ t("backToHome") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-nf__enter {
  animation: page-nf-in 0.5s ease-out both;
}

.page-nf__enter--1 {
  animation-delay: 0.05s;
}
.page-nf__enter--2 {
  animation-delay: 0.12s;
}
.page-nf__enter--3 {
  animation-delay: 0.2s;
}

@keyframes page-nf-in {
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
  .page-nf__enter {
    animation: none;
  }
}
</style>
