<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { CheckCircle2, Calendar, ArrowRight, Home } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const bookingId = route.params.bookingId;

const goHome = () => router.push('/');
</script>

<template>
  <div class="min-h-screen bg-[#Fcf9f6] font-serif flex flex-col items-center justify-center p-6 relative overflow-hidden" style="font-family: 'Playfair Display', serif;">
    <!-- Background Pattern (Optional) -->
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
      style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 24px 24px;">
    </div>

    <div class="relative z-10 max-w-md w-full bg-white p-8 sm:p-12 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 text-center space-y-8 animate-scale-in">
      
      <!-- Success Icon -->
      <div class="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-2">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
          <CheckCircle2 class="w-8 h-8 text-green-600" />
        </div>
      </div>

      <!-- Text Content -->
      <div class="space-y-3">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Tempahan Berjaya!</h1>
        <p class="text-gray-500 font-sans text-base leading-relaxed">
          Terima kasih kerana memilih Lensa Studio. <br/>Butiran tempahan anda telah dihantar.
        </p>
      </div>

      <!-- Booking ID -->
      <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 inline-block w-full">
        <span class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 font-sans">ID Tempahan</span>
        <span class="font-mono text-xl font-bold text-gray-900 tracking-wider">{{ bookingId }}</span>
      </div>

      <!-- Actions -->
      <div class="space-y-3 pt-2">
        <button 
          @click="goHome"
          class="w-full bg-gray-900 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-black hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span>Kembali ke Utama</span>
          <Home class="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
        </button>
        <p class="text-xs text-gray-400 font-sans mt-4">
          Sila semak WhatsApp anda untuk pengesahan.
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(5%); }
}

.animate-scale-in {
  animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-bounce-slow {
  animation: bounce-slow 2s infinite ease-in-out;
}
</style>
