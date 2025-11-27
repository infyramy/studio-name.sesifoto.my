<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md text-center">
      <div class="text-6xl mb-4">😕</div>
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Halaman Tidak Dijumpai</h1>
      <p class="text-gray-600 mb-8">
        Maaf, halaman yang anda cari tidak wujud.
      </p>

      <button
        @click="router.push('/')"
        class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
      >
        Kembali ke Laman Utama
      </button>
    </div>
  </div>
</template>
