<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { getBookingById } from "@/services/api";
import { format } from "date-fns";
import type { Booking } from "@/types";
import { 
  CheckCircle2, 
  Calendar, 
  Clock,
  Users,
  Home,
  MessageCircle,
  ArrowRight
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const studioStore = useStudioStore();
const { t } = useTranslation();

const bookingId = route.params.bookingId as string;
const booking = ref<Booking | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch booking data
onMounted(async () => {
  try {
    const bookingData = await getBookingById(bookingId);
    booking.value = bookingData;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('bookingNotFound');
  } finally {
    isLoading.value = false;
  }
});

const formattedDate = computed(() => {
  if (!booking.value) return '';
  const dateStr = booking.value.booking_date;
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'd MMMM yyyy');
  } catch {
    return dateStr;
  }
});

const formattedTime = computed(() => {
  if (!booking.value) return '';
  return `${booking.value.start_time} - ${booking.value.end_time}`;
});

const goHome = () => router.push('/');

const getWhatsAppUrl = computed(() => {
  if (!studioStore.studio?.whatsapp || !booking.value) return '';
  const phone = studioStore.studio.whatsapp.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    `Hi, saya ingin mendapatkan butiran tempahan saya.\n\n` +
    `ID Tempahan: ${booking.value.booking_number}\n` +
    `Nama: ${booking.value.customer_name}\n` +
    `Telefon: ${booking.value.customer_phone}`
  );
  return `https://wa.me/${phone}?text=${message}`;
});
</script>

<template>
  <div class="min-h-screen bg-[#Fcf9f6] font-serif flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden" style="font-family: 'Playfair Display', serif;">
    <!-- Background Pattern (Optional) -->
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
      style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 24px 24px;">
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="relative z-10 max-w-md w-full bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 text-center space-y-6 sm:space-y-8">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-14 h-14 sm:w-16 sm:h-16 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
        <p class="text-sm sm:text-base text-gray-500 font-sans">{{ t('loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="relative z-10 max-w-md w-full bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 text-center space-y-6 sm:space-y-8">
      <div class="space-y-4">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('error') }}</h1>
        <p class="text-sm sm:text-base text-gray-500 font-sans">{{ error }}</p>
        <button 
          @click="goHome"
          class="w-full bg-gray-900 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl hover:bg-black transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Home class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{{ t('backToHome') }}</span>
        </button>
      </div>
    </div>

    <!-- Success Content -->
    <div v-else-if="booking" class="relative z-10 max-w-md w-full bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-6 sm:space-y-8 animate-scale-in">
      
      <!-- Success Icon -->
      <div class="text-center">
        <div class="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-full flex items-center justify-center mb-2">
          <div class="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
            <CheckCircle2 class="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </div>
      </div>

      <!-- Text Content -->
      <div class="text-center space-y-2 sm:space-y-3">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-sans">{{ t('bookingSuccessful') }}</h1>
        <p class="text-sm sm:text-base text-gray-500 font-sans leading-relaxed px-2">
          {{ t('thankYouMessage') }}
        </p>
      </div>

      <!-- Booking ID -->
      <div class="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
        <span class="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-1.5 font-sans">{{ t('bookingId') }}</span>
        <span class="font-mono text-lg sm:text-xl font-bold text-gray-900 tracking-wider break-all">{{ booking.booking_number }}</span>
      </div>

      <!-- Booking Details -->
      <div class="space-y-3 sm:space-y-4">
        <!-- Theme -->
        <div v-if="booking.theme" class="flex gap-3 sm:gap-4 items-start bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100">
          <img 
            v-if="booking.theme.images?.[0]" 
            :src="booking.theme.images[0]" 
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <h3 class="font-bold font-sans text-base sm:text-lg leading-tight">{{ booking.theme.name }}</h3>
            <p class="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{{ studioStore.studio?.name }}</p>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3 font-sans">
          <div class="bg-gray-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1">
            <Calendar class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span class="text-xs sm:text-sm font-bold text-gray-900 break-words">{{ formattedDate }}</span>
            <span class="text-[9px] sm:text-[10px] text-gray-400 uppercase">{{ t('date') }}</span>
          </div>
          <div class="bg-gray-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1">
            <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span class="text-xs sm:text-sm font-bold text-gray-900 break-words">{{ formattedTime }}</span>
            <span class="text-[9px] sm:text-[10px] text-gray-400 uppercase">{{ t('time') }}</span>
          </div>
        </div>

        <!-- Pax -->
        <div class="bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 flex items-center justify-between font-sans">
          <div class="flex items-center gap-2 sm:gap-3">
            <Users class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span class="text-xs sm:text-sm font-medium text-gray-600">{{ t('numberOfGuests') }}</span>
          </div>
          <span class="font-bold text-sm sm:text-base text-gray-900">{{ booking.pax_count }} {{ t('people') }}</span>
        </div>

        <!-- Payment Info -->
        <div v-if="booking.total_amount" class="bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 space-y-2 font-sans">
          <div class="flex justify-between items-center">
            <span class="text-xs sm:text-sm font-medium text-gray-600">{{ t('total') }}</span>
            <span class="font-bold text-base sm:text-lg text-gray-900">RM{{ booking.total_amount }}</span>
          </div>
          <div v-if="booking.deposit_amount" class="flex justify-between items-center text-[10px] sm:text-xs text-gray-500 pt-2 border-t border-gray-200">
            <span>{{ t('deposit') }} {{ booking.deposit_amount && booking.total_amount ? `(${Math.round((booking.deposit_amount / booking.total_amount) * 100)}%)` : '' }}</span>
            <span>RM{{ booking.deposit_amount }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-2.5 sm:space-y-3 pt-2">
        <!-- WhatsApp Button -->
        <a
          v-if="getWhatsAppUrl"
          :href="getWhatsAppUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
        >
          <MessageCircle class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{{ t('getDetailsInWhatsApp') }}</span>
          <ArrowRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
        </a>

        <!-- Back to Home Button -->
        <button 
          @click="goHome"
          class="w-full bg-gray-900 text-white font-sans font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl hover:bg-black hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span>{{ t('backToHome') }}</span>
          <Home class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-y-0.5" />
        </button>

        <!-- Info Text -->
        <p class="text-[10px] sm:text-xs text-gray-400 font-sans mt-3 sm:mt-4 text-center px-2">
          {{ t('checkWhatsAppForConfirmation') }}
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');

.font-serif {
  font-family: 'Playfair Display', serif;
}

.font-sans {
  font-family: 'Bricolage Grotesque', sans-serif;
}

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
