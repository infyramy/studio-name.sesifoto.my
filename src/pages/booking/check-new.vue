<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudioStore } from '@/stores/studio';
import { getBookingById } from '@/services/api';
import { format } from 'date-fns';
import type { Booking } from '@/types';
import { useTranslation } from '@/composables/useTranslation';
import { 
  ChevronLeft, 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  MessageCircle, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-vue-next';

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

// Background Images Setup (Consistent with Home)
const backgroundImages = [
  "https://i.postimg.cc/t4wCcRhG/untitled-10.jpg",
  "https://i.postimg.cc/HsLYs8zy/untitled-19.jpg",
  "https://i.postimg.cc/T1NXWQ0R/untitled-180.jpg"
];

const currentImageIndex = ref(0);
let intervalId: any;

onMounted(() => {
  intervalId = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % backgroundImages.length;
  }, 5000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Form State
const bookingId = ref('RY2026-0142'); // Default for demo
const phone = ref('0129876543'); // Default for demo
const isLoading = ref(false);
const error = ref('');
const foundBooking = ref<Booking | null>(null);

const validateForm = () => {
  error.value = '';

  if (!bookingId.value.trim()) {
    error.value = t('bookingId') + ' diperlukan';
    return false;
  }

  if (!phone.value.trim()) {
    error.value = t('phoneNumber') + ' diperlukan';
    return false;
  }

  // Validate Malaysian phone format
  const phoneRegex = /^01\d{8,9}$/;
  if (!phoneRegex.test(phone.value.replace(/[\s-]/g, ''))) {
    error.value = 'Sila masukkan nombor telefon yang sah';
    return false;
  }

  return true;
};

const searchBooking = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  error.value = '';
  foundBooking.value = null;

  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Call mock API
    const booking = await getBookingById(bookingId.value);

    // Verify phone number matches (Mock logic)
    const normalizedInputPhone = phone.value.replace(/[\s-]/g, '');
    const normalizedBookingPhone = (booking as any).customerInfo?.whatsapp?.replace(/[\s-]/g, '') || booking.customer_phone?.replace(/[\s-]/g, '');

    if (normalizedInputPhone !== normalizedBookingPhone) {
      error.value = 'Tempahan tidak dijumpai atau nombor telefon tidak padan';
      return;
    }

    foundBooking.value = booking;
  } catch (err) {
    error.value = 'Tempahan tidak dijumpai. Sila semak ID Tempahan dan nombor telefon anda.';
  } finally {
    isLoading.value = false;
  }
};

const formattedDate = computed(() => {
  const dateStr = (foundBooking.value as any)?.selectedDate || foundBooking.value?.booking_date;
  if (!dateStr) return '';
  return format(new Date(dateStr), 'd MMMM yyyy');
});

const formattedTime = computed(() => {
  const slot = (foundBooking.value as any)?.selectedSlot;
  if (!slot) return (foundBooking.value as any)?.time_slot || '';
  return slot.time || `${slot.start} - ${slot.end}`;
});

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'confirmed':
      return { text: t('confirmed'), class: 'bg-green-100 text-green-800 border-green-200' };
    case 'pending_payment':
      return { text: t('paymentPending'), class: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    case 'cancelled':
      return { text: t('cancelled'), class: 'bg-red-100 text-red-800 border-red-200' };
    case 'completed':
      return { text: t('completed'), class: 'bg-blue-100 text-blue-800 border-blue-200' };
    default:
      return { text: t('pending'), class: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
};

const reset = () => {
  bookingId.value = '';
  phone.value = '';
  foundBooking.value = null;
  error.value = '';
};

const brandColor = computed(() => studioStore.studio?.brand_color || '#000000');
</script>

<template>
  <div class="min-h-screen w-full relative overflow-hidden flex flex-col font-sans" style="font-family: 'Bricolage Grotesque', sans-serif;">
    
    <!-- Background Slideshow -->
    <div class="fixed inset-0 z-0 bg-black">
      <div 
        v-for="(img, index) in backgroundImages" 
        :key="index"
        class="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out will-change-opacity"
        :class="index === currentImageIndex ? 'opacity-100' : 'opacity-0'"
      >
        <img
          :src="img"
          alt="Background"
          class="w-full h-full object-cover scale-105 animate-ken-burns"
        />
      </div>
      <!-- Frosted Overlay -->
      <div class="absolute inset-0 bg-[#Fcf9f6]/90 backdrop-blur-sm z-10"></div>
    </div>

    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between transition-all duration-300">
      <button 
        @click="router.back()" 
        class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
      >
        <ChevronLeft class="w-6 h-6" />
      </button>
      <h1 class="text-lg font-bold font-serif tracking-wide text-gray-900">
        {{ t("checkBooking") }}
      </h1>
      <div class="w-8"></div>
    </header>

    <!-- Main Content -->
    <main class="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 w-full">
      
      <div class="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8 animate-slide-up">
        
        <!-- Search Form State -->
        <div v-if="!foundBooking" class="space-y-8">
          <div class="text-center space-y-2">
            <div class="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-gray-100 mb-4">
              <Search class="w-8 h-8 text-gray-400" />
            </div>
            <h2 class="text-2xl font-bold font-serif">Semak Status</h2>
            <p class="text-sm text-gray-500">Masukkan butiran tempahan anda untuk menyemak status terkini.</p>
          </div>

          <form @submit.prevent="searchBooking" class="space-y-5">
            <div class="space-y-1">
              <label class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">ID Tempahan</label>
              <input 
                v-model="bookingId"
                type="text" 
                class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all font-medium placeholder-gray-300"
                :placeholder="t('enterBookingId')"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">No. Telefon</label>
              <input 
                v-model="phone"
                type="tel" 
                class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all font-medium placeholder-gray-300"
                :placeholder="t('enterPhone')"
              />
            </div>

            <div v-if="error" class="bg-red-50 text-red-600 text-xs font-medium p-3 rounded-xl flex items-start gap-2">
              <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{{ error }}</span>
            </div>

            <button 
              type="submit"
              :disabled="isLoading"
              class="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :style="{ backgroundColor: brandColor }"
            >
              <span v-if="!isLoading">Semak Sekarang</span>
              <span v-else>Sedang Menyemak...</span>
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <ArrowRight v-else class="w-4 h-4" />
            </button>
          </form>
        </div>

        <!-- Result State -->
        <div v-else class="space-y-6 animate-fade-in">
          <!-- Success Header -->
          <div class="text-center border-b border-dashed border-gray-200 pb-6">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border" :class="getStatusBadge(foundBooking.status).class">
              {{ getStatusBadge(foundBooking.status).text }}
            </div>
            <h2 class="text-3xl font-bold font-serif mb-1">{{ foundBooking.booking_number }}</h2>
            <p class="text-sm text-gray-500">ID Tempahan</p>
          </div>

          <!-- Details -->
          <div class="space-y-4">
            <!-- Theme -->
            <div class="flex gap-4 items-start bg-white p-4 rounded-2xl border border-gray-100">
              <img 
                v-if="foundBooking.theme?.images?.[0]" 
                :src="foundBooking.theme.images[0]" 
                class="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 class="font-bold font-serif text-lg leading-tight">{{ foundBooking.theme?.name }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ studioStore.studio?.name }}</p>
              </div>
            </div>

            <!-- Date & Time -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1">
                <Calendar class="w-5 h-5 text-gray-400" />
                <span class="text-sm font-bold text-gray-900">{{ formattedDate }}</span>
                <span class="text-[10px] text-gray-400 uppercase">Tarikh</span>
              </div>
              <div class="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1">
                <Clock class="w-5 h-5 text-gray-400" />
                <span class="text-sm font-bold text-gray-900">{{ formattedTime }}</span>
                <span class="text-[10px] text-gray-400 uppercase">Masa</span>
              </div>
            </div>

            <!-- Pax -->
            <div class="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Users class="w-5 h-5 text-gray-400" />
                <span class="text-sm font-medium text-gray-600">Bilangan Tetamu</span>
              </div>
              <span class="font-bold text-gray-900">{{ foundBooking.pax_count || (foundBooking as any).pax }} Orang</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-4 space-y-3">
            <a 
              v-if="studioStore.studio?.whatsapp"
              :href="`https://wa.me/${studioStore.studio.whatsapp}`"
              target="_blank"
              class="w-full bg-green-50 text-green-700 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-green-100 transition-all flex items-center justify-center gap-2 border border-green-100"
            >
              <MessageCircle class="w-4 h-4" />
              Hubungi Studio
            </a>
            
            <button 
              @click="reset"
              class="w-full bg-white border border-gray-200 text-gray-500 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              Semak Lain
            </button>
          </div>

        </div>

      </div>
    </main>

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

@keyframes ken-burns {
  0% { transform: scale(1.05); }
  100% { transform: scale(1.15); }
}

.animate-ken-burns {
  animation: ken-burns 20s linear infinite alternate;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}
</style>

