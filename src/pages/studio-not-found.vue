<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useTranslation } from '@/composables/useTranslation';

const router = useRouter();
const { t } = useTranslation();

const goToHome = () => {
  window.location.href = 'https://youtube.com';
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full text-center space-y-8 fade-in">
      <!-- Animated Icon -->
      <div class="relative inline-block">
        <!-- Main camera icon with broken lens effect -->
        <div class="relative">
          <svg class="w-32 h-32 sm:w-40 sm:h-40 mx-auto text-gray-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>

          <!-- Crack/broken effect -->
          <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 text-red-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <!-- Floating question marks -->
        <div class="absolute -top-4 -left-4 animate-bounce" style="animation-delay: 0s">
          <span class="text-4xl text-gray-300">?</span>
        </div>
        <div class="absolute -top-2 -right-6 animate-bounce" style="animation-delay: 0.3s">
          <span class="text-3xl text-gray-300">?</span>
        </div>
        <div class="absolute -bottom-4 left-8 animate-bounce" style="animation-delay: 0.6s">
          <span class="text-2xl text-gray-300">?</span>
        </div>
      </div>

      <!-- Error Code -->
      <div class="space-y-2">
        <div class="inline-block px-4 py-2 bg-gray-100 border border-gray-200">
          <span class="text-xs font-mono font-medium text-gray-500 uppercase tracking-widest">Error 404</span>
        </div>
      </div>

      <!-- Main Message -->
      <div class="space-y-4">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-extralight text-gray-900 tracking-tight">
          {{ t('studioNotFoundTitle') }}
        </h1>
        <p class="text-base sm:text-lg text-gray-600 font-light max-w-md mx-auto leading-relaxed">
          {{ t('studioNotFoundMessage') }}
        </p>
      </div>

      <!-- Decorative elements -->
      <div class="flex justify-center gap-2 opacity-40">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-ping" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-ping" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-ping" style="animation-delay: 0.4s"></div>
      </div>

      <!-- Possible reasons -->
      <div class="bg-white border border-gray-200 shadow-sm p-6 sm:p-8 text-left max-w-lg mx-auto">
        <h3 class="text-sm uppercase tracking-wider text-gray-500 mb-4 font-medium">{{ t('possibleReasons') }}</h3>
        <ul class="space-y-3 text-sm text-gray-700 font-light">
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t('studioNotFoundReason1') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t('studioNotFoundReason2') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t('studioNotFoundReason3') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t('studioNotFoundReason4') }}</span>
          </li>
        </ul>
      </div>

      <!-- Action Button -->
      <div class="pt-4">
        <button
          @click="goToHome"
          class="group inline-flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm uppercase tracking-wider transition-all hover:shadow-xl active:scale-95 touch-manipulation"
        >
          <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>{{ t('homePage') }}</span>
        </button>
      </div>

      <!-- Footer hint -->
      <p class="text-xs text-gray-400 font-light">
        {{ t('contactStudioDirectly') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in 0.6s ease-out;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
