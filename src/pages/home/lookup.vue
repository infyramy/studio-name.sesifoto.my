<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStudioStore } from '@/stores/studio';
import { getBookingById } from '@/services/api';
import { format } from 'date-fns';
import type { Booking } from '@/types';
import { mockHeroContent } from '@/services/mockData';
import { useTranslation } from '@/composables/useTranslation';

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

const bookingId = ref('RY2026-0142');
const phone = ref('0129876543');
const isLoading = ref(false);
const error = ref('');
const foundBooking = ref<Booking | null>(null);

// Get color theme based on studio
const colorTheme = computed(() => {
  const studioId = studioStore.studio?.id || 'studio-001';
  const heroContent = mockHeroContent[studioId] || mockHeroContent['studio-001'];
  return heroContent?.colors || {
    primary: '#A8DADC',
    secondary: '#457B9D',
    accent: '#F1FAEE',
    gradientFrom: '#A8DADC',
    gradientTo: '#457B9D'
  };
});

const validateForm = () => {
  error.value = '';

  if (!bookingId.value.trim()) {
    error.value = 'Booking ID is required';
    return false;
  }

  if (!phone.value.trim()) {
    error.value = 'Phone number is required';
    return false;
  }

  // Validate Malaysian phone format
  const phoneRegex = /^01\d{8,9}$/;
  if (!phoneRegex.test(phone.value.replace(/[\s-]/g, ''))) {
    error.value = 'Please enter a valid Malaysian phone number';
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
    // Simulate API delay (1-1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

    // Call mock API
    const booking = await getBookingById(bookingId.value);

    // Verify phone number matches
    const normalizedInputPhone = phone.value.replace(/[\s-]/g, '');
    const normalizedBookingPhone = (booking as any).customerInfo?.whatsapp?.replace(/[\s-]/g, '') || booking.customer_phone?.replace(/[\s-]/g, '');

    if (normalizedInputPhone !== normalizedBookingPhone) {
      error.value = 'Booking not found or phone number does not match';
      return;
    }

    foundBooking.value = booking;
  } catch (err) {
    error.value = 'Booking not found. Please check your Booking ID and phone number.';
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

// Helper to access mock data fields
const bookingData = computed(() => foundBooking.value as any);

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'confirmed':
      return { text: t('confirmed'), class: 'bg-green-100 text-green-800' };
    case 'pending_payment':
      return { text: t('paymentPending'), class: 'bg-yellow-100 text-yellow-800' };
    case 'cancelled':
      return { text: t('cancelled'), class: 'bg-red-100 text-red-800' };
    case 'completed':
      return { text: t('completed'), class: 'bg-blue-100 text-blue-800' };
    default:
      return { text: t('pending'), class: 'bg-yellow-100 text-yellow-800' };
  }
};

const contactStudio = () => {
  const whatsapp = studioStore.studio?.whatsapp || '';
  const message = `Hi, I would like to ask about my booking.\nBooking No: ${foundBooking.value?.booking_number}\nTheme: ${foundBooking.value?.theme?.name}\nDate: ${formattedDate.value}`;
  const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

const reset = () => {
  bookingId.value = '';
  phone.value = '';
  foundBooking.value = null;
  error.value = '';
};
</script>

<template>
  <div class="min-h-screen bg-white py-8 sm:py-12 md:py-16 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Minimalist Header -->
      <div class="mb-12 sm:mb-16">
        <button
          @click="router.back()"
          class="group flex items-center gap-2 mb-8 sm:mb-12 transition-all hover:gap-3 text-gray-400 hover:text-gray-900"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span class="text-sm font-medium">{{ t('back') }}</span>
        </button>

        <div class="flex items-center gap-4 mb-3">
          <div class="h-px flex-1" :style="{ backgroundColor: `${colorTheme.primary}40` }"></div>
          <h1 class="text-4xl sm:text-5xl font-extralight tracking-tight text-gray-900">
            {{ t('checkYourBooking') }}
          </h1>
          <div class="h-px flex-1" :style="{ backgroundColor: `${colorTheme.primary}40` }"></div>
        </div>
        <p class="text-center text-sm text-gray-500 font-light">
          {{ t('checkBookingSubtitle') }}
        </p>
      </div>

      <!-- Search Form -->
      <div v-if="!foundBooking" class="max-w-md mx-auto">
        <form @submit.prevent="searchBooking" class="space-y-6">
          <!-- Booking ID -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
              {{ t('bookingId') }}
            </label>
            <input
              v-model="bookingId"
              type="text"
              :placeholder="t('enterBookingId')"
              class="w-full px-0 py-3 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors bg-transparent text-lg font-light"
              :style="{ borderBottomColor: bookingId ? colorTheme.primary : undefined }"
              :disabled="isLoading"
            />
          </div>

          <!-- Phone Number -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
              {{ t('phoneNumber') }}
            </label>
            <input
              v-model="phone"
              type="tel"
              :placeholder="t('enterPhone')"
              class="w-full px-0 py-3 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors bg-transparent text-lg font-light"
              :style="{ borderBottomColor: phone ? colorTheme.primary : undefined }"
              :disabled="isLoading"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="text-sm text-red-600 font-light">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-4 text-white font-medium text-sm uppercase tracking-wider transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 group hover:shadow-lg"
            :style="{
              backgroundColor: isLoading ? '#9CA3AF' : colorTheme.secondary,
            }"
          >
            <span>{{ isLoading ? t('searching') : t('checkBookingButton') }}</span>
            <svg v-if="!isLoading" class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <svg v-else class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </form>

        <!-- Help Text -->
        <div class="mt-12 text-center">
          <p class="text-xs text-gray-400 font-light">
            {{ t('bookingIdSentToWhatsApp') }}
          </p>
        </div>
      </div>

      <!-- Booking Details -->
      <div v-else class="space-y-8 fade-in">
        <!-- Booking Number & Status -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b" :style="{ borderColor: `${colorTheme.primary}20` }">
          <div>
            <p class="text-xs uppercase tracking-wider text-gray-500 mb-2">{{ t('bookingNumber') }}</p>
            <p class="text-3xl font-light tracking-tight text-gray-900 font-mono">{{ foundBooking.booking_number }}</p>
          </div>
          <span :class="['px-4 py-2 text-xs font-medium uppercase tracking-wide', getStatusBadge((foundBooking as any).status).class]">
            {{ getStatusBadge((foundBooking as any).status).text }}
          </span>
        </div>

        <!-- Theme Info -->
        <div class="flex items-start gap-6">
          <img
            v-if="foundBooking.theme?.images?.[0]"
            :src="foundBooking.theme.images[0]"
            :alt="foundBooking.theme.name"
            class="w-32 h-32 object-cover"
          />
          <div class="flex-1">
            <h2 class="text-2xl font-light text-gray-900 mb-2">{{ foundBooking.theme?.name }}</h2>
            <p class="text-sm text-gray-500 font-light">{{ studioStore.studio?.name }}</p>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid sm:grid-cols-2 gap-x-12 gap-y-8 py-8 border-y" :style="{ borderColor: `${colorTheme.primary}20` }">
          <div>
            <p class="text-xs uppercase tracking-wider text-gray-500 mb-2">{{ t('date') }}</p>
            <p class="text-lg font-light text-gray-900">{{ formattedDate }}</p>
          </div>

          <div>
            <p class="text-xs uppercase tracking-wider text-gray-500 mb-2">{{ t('time') }}</p>
            <p class="text-lg font-light text-gray-900">{{ formattedTime }}</p>
          </div>

          <div>
            <p class="text-xs uppercase tracking-wider text-gray-500 mb-2">{{ t('people') }}</p>
            <p class="text-lg font-light text-gray-900">{{ bookingData.pax || foundBooking.num_of_people }} {{ t('people') }}</p>
          </div>

          <div v-if="bookingData.selectedAddons && bookingData.selectedAddons.length > 0">
            <p class="text-xs uppercase tracking-wider text-gray-500 mb-2">{{ t('addOns') }}</p>
            <div class="space-y-1">
              <p
                v-for="addon in bookingData.selectedAddons"
                :key="addon.id"
                class="text-sm font-light text-gray-900"
              >
                {{ addon.name }}
              </p>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-wider text-gray-500">{{ t('customerInformation') }}</p>
          <div class="space-y-2 text-sm font-light">
            <div class="flex justify-between">
              <span class="text-gray-500">{{ t('name') }}</span>
              <span class="text-gray-900">{{ bookingData.customerInfo?.name || foundBooking.customer_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ t('whatsapp') }}</span>
              <span class="text-gray-900">{{ bookingData.customerInfo?.whatsapp || foundBooking.customer_phone }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ t('email') }}</span>
              <span class="text-gray-900">{{ bookingData.customerInfo?.email || foundBooking.customer_email }}</span>
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div class="p-6" :style="{ backgroundColor: `${colorTheme.primary}08` }">
          <div class="space-y-3 text-sm font-light">
            <div class="flex justify-between">
              <span class="text-gray-600">{{ t('total') }}</span>
              <span class="text-gray-900">RM {{ (bookingData.totalPrice || foundBooking.total_amount)?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">{{ t('depositPaid') }}</span>
              <span class="font-medium text-lg" :style="{ color: colorTheme.secondary }">RM {{ (bookingData.depositAmount || foundBooking.deposit_amount)?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-xs pt-2 border-t" :style="{ borderColor: `${colorTheme.primary}20` }">
              <span class="text-gray-500">{{ t('remainingBalance') }}</span>
              <span class="text-gray-500">RM {{ (bookingData.balanceAmount || foundBooking.balance_amount)?.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            @click="contactStudio"
            class="flex-1 flex items-center justify-center gap-3 text-white py-4 font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg group"
            :style="{ backgroundColor: colorTheme.secondary }"
          >
            <span>{{ t('contactStudio') }}</span>
            <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>

          <button
            @click="reset"
            class="flex-1 flex items-center justify-center gap-3 bg-white py-4 font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg border group"
            :style="{
              borderColor: colorTheme.primary,
              color: colorTheme.secondary
            }"
          >
            <span>{{ t('newSearch') }}</span>
            <svg class="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
