<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { createBooking, api } from "@/services/api";
import { mockBlackoutDates, mockPricingRules, mockWorkingHours } from "@/services/mockData";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Minus, 
  Check,
  CreditCard,
  Info,
  Loader2,
  ArrowRight,
  X,
  AlertCircle
} from 'lucide-vue-next';
import type { Theme, Addon, PricingRule } from "@/types";

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

// Steps
const currentStep = ref<number>(1);

// Terms acceptance tracking
const termsAccepted = ref(false);

// Background Images Setup
const backgroundImages = [
  "https://plus.unsplash.com/premium_photo-1661963643348-e95c6387ee8a?q=80&w=2340&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1506112573664-1a1b66d93ff3?q=80&w=2254&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
];

const currentImageIndex = ref(0);
let intervalId: any;

onMounted(async () => {
  intervalId = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % backgroundImages.length;
  }, 5000); // Change every 5 seconds
  
  // Simulate API call to fetch themes
  loadingThemes.value = true;
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  loadingThemes.value = false;
  
  // Simulate API call to fetch dates/availability
  loadingDates.value = true;
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
  loadingDates.value = false;
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Auto scroll to top on step change
watch(currentStep, (newStep) => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Reset terms acceptance when leaving terms step
  if (newStep !== 5) {
    termsAccepted.value = false;
  }
});

const steps = computed(() => [
  { id: 1, title: t('stepSelectTheme') },
  { id: 2, title: t('stepDateAndTime') },
  { id: 3, title: t('stepPaxAndAddons') },
  { id: 4, title: t('stepCustomerInformation') },
  { id: 5, title: t('termsAndConditions') || 'Terms & Conditions' },
  { id: 6, title: t('stepSummary') }
]);

// Data Selections
const selectedTheme = ref<Theme | null>(null);
const selectedDate = ref<string | null>(null);
const selectedSlot = ref<any | null>(null);
const paxCount = ref(1);
const selectedAddons = ref<Record<string, number>>({});
const customerInfo = ref({
  name: '',
  phone: '',
  email: '',
  notes: ''
});

const isProcessingPayment = ref(false);
const activeImageIndices = ref<Record<string, number>>({});
const loadingThemes = ref(true);
const loadingDates = ref(true);

const setActiveImage = (themeId: string, index: number) => {
  activeImageIndices.value[themeId] = index;
};

// Get blackout dates and pricing rules
const blackoutDates = computed(() => {
  const studioId = studioStore.studio?.id || 'studio-001';
  return mockBlackoutDates[studioId] || [];
});

const pricingRules = computed(() => {
  const studioId = studioStore.studio?.id || 'studio-001';
  return mockPricingRules[studioId] || [];
});

// Generate dates with blackout and special pricing info using mockData
const dates = computed(() => {
  const list: { 
    date: string; 
    day: number; 
    month: string; 
    weekday: string; 
    isBlackout: boolean;
    blackoutReason?: string;
    isSpecial: boolean;
    priceModifier: number;
    specialLabel?: string;
    specialType?: 'percentage_increase' | 'fixed_price';
  }[] = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const studioId = studioStore.studio?.id || 'studio-001';
  const studio = studioStore.studio;
  const workingHours = mockWorkingHours[studioId] || [];
  
  // Get booking window from studio settings
  const bookingWindowStart = studio?.settings?.booking_window_start;
  const bookingWindowEnd = studio?.settings?.booking_window_end;
  
  // Determine start date: use booking window start if set, otherwise use today
  let startDate = new Date(today);
  if (bookingWindowStart) {
    const windowStart = new Date(bookingWindowStart);
    windowStart.setHours(0, 0, 0, 0);
    // Use the later of today or booking window start (can't book in the past)
    startDate = windowStart > today ? windowStart : today;
  }
  
  // Determine end date: use booking window end if set, otherwise limit to 14 days from start
  let endDate = new Date(startDate);
  if (bookingWindowEnd) {
    const windowEnd = new Date(bookingWindowEnd);
    windowEnd.setHours(0, 0, 0, 0);
    // Don't show dates beyond booking window end
    endDate = windowEnd;
    
    // If today is after booking window end, no dates available
    if (today > windowEnd) {
      return list;
    }
  } else {
    // If no booking window end, limit to 14 days from start
    endDate.setDate(startDate.getDate() + 13); // 14 days total (0-13 = 14 days)
  }
  
  // If booking window end is before start date, no dates available
  if (endDate < startDate) {
    return list;
  }
  
  // Generate dates within the booking window (limit to max 60 days for performance)
  const dateList: Date[] = [];
  const currentDate = new Date(startDate);
  const maxDays = 60; // Maximum days to show
  let dayCount = 0;
  
  while (currentDate <= endDate && dayCount < maxDays) {
    dateList.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
    dayCount++;
  }
  
  for (const d of dateList) {
    const dateString = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    
    // Check if date is before booking window start (shouldn't happen, but double-check)
    const isBeforeBookingWindow = bookingWindowStart && dateString < bookingWindowStart;
    
    // Check if date is after booking window end (shouldn't happen, but double-check)
    const isAfterBookingWindow = bookingWindowEnd && dateString > bookingWindowEnd;
    
    // Check if studio is open on this day (using working hours from mockData)
    const dayHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    const isStudioClosed = !dayHours || !dayHours.active;
    
    // Check if blackout - handle both single date and date range
    const isBlackout = blackoutDates.value.some(blackout => {
      if (!blackout.end_date) {
        return dateString === blackout.start_date;
      }
      return dateString >= blackout.start_date && dateString <= blackout.end_date;
    }) || isStudioClosed || isBeforeBookingWindow || isAfterBookingWindow;
    const blackoutInfo = blackoutDates.value.find(b => {
      if (!b.end_date) {
        return b.start_date === dateString;
      }
      return dateString >= b.start_date && dateString <= b.end_date;
    });
    
    // Determine blackout reason
    let blackoutReason = 'Tidak tersedia';
    if (isBeforeBookingWindow) {
      blackoutReason = 'Tempahan belum dibuka';
    } else if (isAfterBookingWindow) {
      blackoutReason = 'Tempahan sudah ditutup';
    } else if (isStudioClosed) {
      blackoutReason = 'Studio tutup pada hari ini';
    } else if (blackoutInfo) {
      blackoutReason = blackoutInfo.reason;
    }
    
    if (isBlackout) {
      list.push({
        date: dateString,
        day: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        weekday: d.toLocaleString('default', { weekday: 'short' }),
        isBlackout: true,
        blackoutReason: blackoutReason,
        isSpecial: false,
        priceModifier: 1
      });
      continue;
    }
    
    // Check for special pricing from mockData
    let specialPricing: PricingRule | undefined;
    for (const rule of pricingRules.value) {
      if (rule.status === 'active' && 
          dateString >= rule.date_range_start && 
          dateString <= rule.date_range_end) {
        // Check if applies to current theme or all themes
        if (rule.applies_to_themes === 'all' || 
            (selectedTheme.value && Array.isArray(rule.applies_to_themes) && 
             rule.applies_to_themes.includes(selectedTheme.value.id))) {
          specialPricing = rule;
          break;
        }
      }
    }
    
    const isSpecial = !!specialPricing;
    let priceModifier = 1;
    
    if (specialPricing) {
      if (specialPricing.rule_type === 'percentage_increase') {
        priceModifier = 1 + (specialPricing.value / 100); // e.g., 1.5 for +50%
      } else {
        // For fixed_price, we'd need base price to calculate modifier
        // For now, we'll show it differently
        priceModifier = 1; // Will be handled separately
      }
    }
    
    list.push({
      date: dateString,
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
      weekday: d.toLocaleString('default', { weekday: 'short' }),
      isBlackout: false,
      isSpecial,
      priceModifier,
      specialLabel: specialPricing?.name,
      specialType: specialPricing?.rule_type
    });
  }
  
  return list;
});

// Time slots - will be loaded from API when date is selected
const timeSlots = ref<any[]>([]);
const loadingSlots = ref(false);

// Helpers
const selectTheme = (theme: Theme) => {
  selectedTheme.value = theme;
  paxCount.value = theme.base_pax; // Reset/Set to base pax
  // Don't auto-navigate - user must click next button
};

const selectDate = async (dateStr: string) => {
  selectedDate.value = dateStr;
  selectedSlot.value = null; // Reset slot
  
  // Load time slots for selected date
  if (selectedTheme.value && studioStore.studio) {
    loadingSlots.value = true;
    try {
      const slots = await api.getAvailableTimeSlots(
        studioStore.studio.id,
        selectedTheme.value.id,
        dateStr
      );
      // Convert API format to component format
      timeSlots.value = slots.map((slot, index) => ({
        id: `slot-${index}`,
        start: formatTimeForDisplay(slot.start || '09:00'),
        end: formatTimeForDisplay(slot.end || '09:30'),
        available: slot.status === 'available',
        originalSlot: slot // Keep original for booking
      }));
    } catch (error) {
      console.error('Failed to load time slots:', error);
      timeSlots.value = [];
    } finally {
      loadingSlots.value = false;
    }
  }
};

// Helper to format time from "09:00" to "09:00 AM"
const formatTimeForDisplay = (time: string): string => {
  if (!time) return '09:00 AM';
  const parts = time.split(':');
  if (parts.length < 2) return '09:00 AM';
  const hours = parts[0] || '09';
  const minutes = parts[1] || '00';
  const hour = parseInt(hours);
  if (isNaN(hour)) return '09:00 AM';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const selectSlot = (slot: any) => {
  if (!slot.available) return;
    selectedSlot.value = slot;
};

const updateAddon = (addon: Addon, change: number) => {
  const current = selectedAddons.value[addon.id] || 0;
  let next = current + change;
  
  if (next < 0) next = 0;
  if (addon.max_quantity && next > addon.max_quantity) next = addon.max_quantity;
  
  selectedAddons.value[addon.id] = next;
};


const nextStep = async () => {
  if (currentStep.value < 6) {
    currentStep.value++;
  } else {
    // Handle Payment and Booking Creation
    if (!selectedTheme.value || !selectedDate.value || !selectedSlot.value) {
      return;
    }

    isProcessingPayment.value = true;
    
    try {
      // Prepare addons array
      const selectedAddonsArray = Object.entries(selectedAddons.value)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, quantity]) => ({
          addon_id: addonId,
          quantity: quantity as number
        }));

      // Parse time from slot (convert "09:00 AM" to "09:00")
      const parseTime = (timeStr: string): string => {
        if (!timeStr) return '09:00';
        // Remove AM/PM and spaces
        let time = timeStr.replace(/\s*(AM|PM)\s*/i, '');
        const timeParts = time.split(':');
        if (timeParts.length !== 2) return '09:00';
        
        const hours = Number(timeParts[0]);
        const minutes = Number(timeParts[1]);
        
        if (isNaN(hours) || isNaN(minutes)) return '09:00';
        
        // If PM and not 12:xx, add 12 hours
        if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
          time = `${String(hours + 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else if (timeStr.toUpperCase().includes('AM') && hours === 12) {
          // Handle 12:xx AM -> 00:xx
          time = `00:${String(minutes).padStart(2, '0')}`;
        } else {
          time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        return time;
      };
      
      // Use original slot time if available, otherwise parse from display format
      const slotStart = selectedSlot.value?.originalSlot?.start || selectedSlot.value?.start || '09:00';
      const slotEnd = selectedSlot.value?.originalSlot?.end || selectedSlot.value?.end || '09:30';
      const startTime = slotStart.includes('AM') || slotStart.includes('PM') ? parseTime(slotStart) : slotStart;
      const endTime = slotEnd.includes('AM') || slotEnd.includes('PM') ? parseTime(slotEnd) : slotEnd;
      
      // Create booking request
      const bookingRequest = {
        theme_id: selectedTheme.value.id,
        booking_date: selectedDate.value,
        start_time: startTime,
        end_time: endTime,
        pax_count: paxCount.value,
        customer_name: customerInfo.value.name,
        customer_phone: customerInfo.value.phone,
        customer_email: customerInfo.value.email || '',
        customer_notes: customerInfo.value.notes || '',
        consent_tc: true, // TODO: Add checkbox in form
        consent_marketing: false, // TODO: Add checkbox in form
        selected_addons: selectedAddonsArray
      };

      // Create booking
      const createdBooking = await createBooking(bookingRequest);
      
      // Redirect to success page with booking number
      router.push(`/success/${createdBooking.booking_number}`);
    } catch (error) {
      console.error('Failed to create booking:', error);
      isProcessingPayment.value = false;
      // TODO: Show error message to user
    }
  }
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
  else router.back();
};

// Calculations
const extraPaxCost = computed(() => {
  if (!selectedTheme.value) return 0;
  const extra = Math.max(0, paxCount.value - (selectedTheme.value.base_pax || 0));
  return extra * selectedTheme.value.extra_pax_price;
});

const addonsTotal = computed(() => {
  let total = 0;
  for (const [id, qty] of Object.entries(selectedAddons.value)) {
    const addon = studioStore.addons.find(a => a.id === id);
    if (addon && qty > 0) {
      total += addon.price * qty;
    }
  }
  return total;
});

const datePriceModifier = computed(() => {
  if (!selectedDateInfo.value || !selectedDateInfo.value.isSpecial) return 1;
  return selectedDateInfo.value.priceModifier;
});

const grandTotal = computed(() => {
  if (!selectedTheme.value) return 0;
  const baseTotal = selectedTheme.value.base_price + extraPaxCost.value + addonsTotal.value;
  return baseTotal * datePriceModifier.value;
});

const paymentType = computed(() => {
  return studioStore.studio?.settings.payment_type || 'deposit';
});

const depositPercentage = computed(() => {
  return studioStore.studio?.settings.deposit_percentage || 50;
});

const depositAmount = computed(() => {
  if (!grandTotal.value) return 0;
  return grandTotal.value * (depositPercentage.value / 100);
});

const paymentAmount = computed(() => {
  if (paymentType.value === 'full') {
    return grandTotal.value;
  }
  return depositAmount.value;
});

const selectedDateInfo = computed(() => {
  if (!selectedDate.value) return null;
  return dates.value.find((d: any) => d.date === selectedDate.value);
});

const isSpecialDateSelected = computed(() => {
  return selectedDateInfo.value?.isSpecial || false;
});

const isBlackoutDateSelected = computed(() => {
  return selectedDateInfo.value?.isBlackout || false;
});

</script>

<template>
  <div class="min-h-screen relative font-sans text-gray-900 pb-20" style="font-family: 'Bricolage Grotesque', sans-serif;">
    <!-- Rustic Background Images with Crossfade -->
    <div class="fixed inset-0 z-0 bg-black">
      <div 
        v-for="(img, index) in backgroundImages" 
        :key="index"
        class="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out will-change-opacity"
        :class="index === currentImageIndex ? 'opacity-100' : 'opacity-0'"
      >
        <img
          :src="img"
          alt="Rustic Interior Background"
          class="w-full h-full object-cover scale-105 animate-ken-burns"
        />
      </div>
      <!-- Frosted Glass Overlay -->
      <div
        class="absolute inset-0 bg-[#Fcf9f6]/90 backdrop-blur-sm z-10"
      ></div>
    </div>

    <!-- Content Wrapper -->
    <div class="relative z-20">
      <!-- Header -->
      <header class="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between transition-all duration-300">
        <button
          @click="prevStep" 
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          :disabled="isProcessingPayment"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>
        <h1 class="text-lg font-bold font-serif tracking-wide transition-opacity duration-300 text-gray-900">
          {{ steps[currentStep - 1]?.title || t('booking') }}
        </h1>
        <div class="w-8"></div> <!-- Spacer for centering -->
      </header>

      <!-- Payment Processing Overlay -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="isProcessingPayment" 
          class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          <div class="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center space-y-6 max-w-xs w-full mx-4">
            <div class="relative">
              <div class="w-16 h-16 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <CreditCard class="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <div class="text-center space-y-2">
              <h3 class="text-xl font-bold font-serif">{{ t('processingPayment') }}</h3>
              <p class="text-sm text-gray-500">{{ t('pleaseWait') }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Progress Bar -->
      <div class="h-1 bg-gray-200 w-full">
        <div 
          class="h-full bg-gray-900 transition-all duration-300 ease-out"
          :style="{ width: `${(currentStep / 6) * 100}%` }"
        ></div>
      </div>

      <main class="p-6 sm:p-8 max-w-4xl mx-auto space-y-8 pb-32">
      
      <!-- Theme Overview (shown in steps 2-5) -->
      <div v-if="currentStep > 1 && selectedTheme" class="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm animate-fade-in">
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            <img :src="selectedTheme.images[0]" :alt="selectedTheme.name" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold font-serif text-lg text-gray-900 truncate">{{ selectedTheme.name }}</h3>
            <p class="text-sm text-gray-600 font-sans mt-0.5 line-clamp-1">{{ selectedTheme.description_short }}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3" /> {{ selectedTheme.duration_minutes }}m
              </span>
              <span class="flex items-center gap-1">
                <Users class="w-3 h-3" /> {{ selectedTheme.base_pax }} {{ t('people') }}
              </span>
              <span class="font-bold text-gray-900">RM{{ selectedTheme.base_price }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Step 1: Themes -->
      <div v-if="currentStep === 1" class="space-y-6 animate-fade-in md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        <!-- Loading Skeleton -->
        <template v-if="loadingThemes">
          <div
            v-for="i in 4"
            :key="`skeleton-${i}`"
            class="bg-white rounded-3xl overflow-hidden shadow-sm border-2 border-gray-100 animate-pulse"
          >
            <!-- Image skeleton -->
            <div class="aspect-[4/3] bg-gray-200"></div>
            
            <!-- Content skeleton -->
            <div class="p-6 space-y-4">
              <!-- Title -->
              <div class="h-8 bg-gray-200 rounded w-3/4"></div>
              <!-- Description -->
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <!-- Price and badges -->
              <div class="flex items-center justify-between pt-2">
                <div class="flex gap-2">
                  <div class="h-6 bg-gray-200 rounded w-16"></div>
                  <div class="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div class="h-7 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Themes -->
        <div v-else v-for="theme in studioStore.themes" :key="theme.id" 
          class="bg-white rounded-3xl overflow-hidden shadow-sm border-2 group cursor-pointer hover:shadow-xl transition-all duration-300 relative"
          :class="selectedTheme?.id === theme.id ? 'border-gray-900 ring-2 ring-gray-900/20 shadow-lg' : 'border-gray-100 hover:border-gray-200'"
          @click="selectTheme(theme)"
        >
          <!-- Selected Indicator -->
          <div v-if="selectedTheme?.id === theme.id" class="absolute top-4 left-4 z-30 bg-gray-900 text-white rounded-full p-2 shadow-lg">
            <Check class="w-5 h-5" />
          </div>
          <div class="aspect-[4/3] bg-gray-100 relative overflow-hidden group">
            <img :src="theme.images[activeImageIndices[theme.id] || 0]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            
            <!-- Image Gallery Thumbs -->
            <div class="absolute top-4 right-4 flex gap-2 z-20" @click.stop>
              <button 
                v-for="(img, idx) in theme.images.slice(0, 4)" 
                :key="idx"
                @click="setActiveImage(theme.id, idx)"
                class="w-10 h-10 rounded-lg border-2 overflow-hidden transition-all duration-300 shadow-lg"
                :class="(activeImageIndices[theme.id] || 0) === idx ? 'border-white scale-110 ring-2 ring-black/20' : 'border-white/50 opacity-80 hover:opacity-100 hover:scale-105'"
              >
                <img :src="img" class="w-full h-full object-cover" />
        </button>
              <div v-if="theme.images.length > 4" class="w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm border border-white/30 flex items-center justify-center text-[10px] text-white font-bold">
                +{{ theme.images.length - 4 }}
              </div>
      </div>

            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col justify-end h-full pointer-events-none">
              
              <h3 class="text-3xl font-bold font-serif tracking-wide mb-2 leading-tight">{{ theme.name }}</h3>
              
              <p class="text-sm font-sans text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                {{ theme.description_short }}
              </p>

              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-3 text-xs font-sans font-medium uppercase tracking-widest text-gray-400">
                    <span class="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                        <Clock class="w-3 h-3" /> {{ theme.duration_minutes }}m
                    </span>
                    <span class="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                        <Users class="w-3 h-3" /> {{ theme.base_pax }}pax
          </span>
                </div>
                <span class="text-2xl font-bold font-serif text-white">RM{{ theme.base_price }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Date & Time -->
      <div v-if="currentStep === 2" class="space-y-10 animate-fade-in">
        <div class="flex flex-col space-y-4">
          <!-- Instructions Note -->
          <div class="bg-blue-50/80 backdrop-blur-sm border border-blue-100/50 p-4 rounded-2xl flex items-start gap-3 text-blue-900 shadow-sm">
            <div class="bg-blue-100 p-2 rounded-full flex-shrink-0">
              <Info class="w-4 h-4" />
            </div>
            <div class="text-sm font-sans leading-relaxed">
              <span class="font-bold block uppercase tracking-wider text-xs mb-1 text-blue-700">{{ t('selectDateAndTime') }}</span>
              {{ t('selectDateAndTimeDescription') }}
            </div>
          </div>
          
          <!-- Date Scroller -->
          <div class="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x mask-fade">
            <!-- Loading Skeleton -->
            <template v-if="loadingDates">
              <div
                v-for="i in 7"
                :key="`date-skeleton-${i}`"
                class="snap-center flex-shrink-0 w-[4.5rem] h-24 rounded-2xl bg-gray-100 animate-pulse"
              ></div>
            </template>
            
            <!-- Dates -->
            <button 
              v-else
              v-for="d in dates" 
              :key="d.date"
              @click="!d.isBlackout && selectDate(d.date)"
              :disabled="d.isBlackout"
              :class="[
                'snap-center flex-shrink-0 w-[4.5rem] h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group',
                d.isBlackout
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                  : selectedDate === d.date 
                    ? 'bg-gray-900 text-white shadow-xl scale-105 ring-4 ring-gray-100' 
                    : 'bg-white text-gray-900 border border-gray-100 hover:border-gray-300 hover:text-gray-600'
              ]"
            >
              <span class="text-[10px] uppercase font-sans tracking-widest font-medium mb-1">{{ d.month }}</span>
              <span class="text-2xl font-bold font-serif leading-none">{{ d.day }}</span>
              <span class="text-[10px] font-sans mt-1 opacity-80">{{ d.weekday }}</span>
              
              <!-- Blackout Indicator -->
              <div v-if="d.isBlackout" class="absolute top-2 right-2">
                <X class="w-3 h-3 text-gray-400" />
              </div>
              
              <!-- Special Pricing Indicator -->
              <div v-else-if="d.isSpecial" class="absolute top-2 right-2 flex flex-col items-end gap-0.5">
                <div :class="['w-1.5 h-1.5 rounded-full', selectedDate === d.date ? 'bg-white' : 'bg-amber-400']"></div>
                <span v-if="d.specialType === 'percentage_increase'" 
                      :class="['text-[8px] font-bold', selectedDate === d.date ? 'text-white' : 'text-amber-600']">
                  +{{ Math.round((d.priceModifier - 1) * 100) }}%
                </span>
              </div>
            </button>
          </div>
          
          <!-- Blackout Date Info -->
          <div v-if="isBlackoutDateSelected && selectedDateInfo?.blackoutReason" 
               class="bg-red-50/80 backdrop-blur-sm border border-red-100/50 p-4 rounded-2xl flex items-start gap-3 text-red-900 shadow-sm">
            <div class="bg-red-100 p-2 rounded-full flex-shrink-0">
              <AlertCircle class="w-4 h-4" />
            </div>
            <div class="text-xs font-sans leading-relaxed">
              <span class="font-bold block uppercase tracking-wider text-[10px] mb-0.5 text-red-700">{{ t('blackoutDate') }}</span>
              {{ selectedDateInfo.blackoutReason }}
            </div>
          </div>

          <!-- Special Date Info -->
          <div v-if="isSpecialDateSelected && selectedDateInfo" 
               class="bg-amber-50/80 backdrop-blur-sm border border-amber-100/50 p-4 rounded-2xl flex items-start gap-3 text-amber-900 shadow-sm">
            <div class="bg-amber-100 p-2 rounded-full flex-shrink-0">
              <Info class="w-4 h-4" />
            </div>
            <div class="text-xs font-sans leading-relaxed flex-1">
              <span class="font-bold block uppercase tracking-wider text-[10px] mb-1 text-amber-700">{{ t('specialDate') }}</span>
              <div class="space-y-1">
                <p class="font-semibold">{{ selectedDateInfo.specialLabel }}</p>
                <p v-if="selectedDateInfo.specialType === 'percentage_increase'" class="text-amber-800">
                  {{ t('priceIncrease') || 'Harga meningkat' }}: 
                  <span class="font-bold">+{{ Math.round((selectedDateInfo.priceModifier - 1) * 100) }}%</span>
                  {{ t('fromBasePrice') || 'daripada harga asas' }}
                </p>
                <p v-else-if="selectedDateInfo.specialType === 'fixed_price'" class="text-amber-800">
                  {{ t('specialFixedPrice') || 'Harga istimewa tetap' }}
                </p>
              </div>
            </div>
          </div>
          </div>

        <!-- Time Slots -->
        <div class="space-y-4 transition-all duration-500" :class="{ 'opacity-50 blur-sm pointer-events-none': !selectedDate }">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold font-serif flex items-center gap-2">
                  <Clock class="w-5 h-5" /> {{ t('selectTime') }}
              </h3>
              <span v-if="selectedDate" class="text-xs font-sans text-gray-400 uppercase tracking-wider">{{ selectedSlot ? t('oneSlotSelected') : t('selectOneSlot') }}</span>
            </div>
            
            <!-- Loading State -->
            <div v-if="loadingSlots" class="flex items-center justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-gray-400" />
            </div>
            
            <!-- Time Slots Grid -->
            <div v-else-if="timeSlots.length > 0" class="grid grid-cols-2 gap-3">
              <button 
                v-for="slot in timeSlots" 
                :key="slot.id"
                @click="selectSlot(slot)"
                :disabled="!slot.available"
                :class="[
                  'py-4 px-3 rounded-2xl text-sm font-sans font-medium text-center border transition-all duration-300 relative overflow-hidden flex items-center justify-center',
                  !slot.available 
                    ? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed' 
                    : selectedSlot?.id === slot.id 
                      ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                ]"
              >
                <span class="font-bold text-sm">{{ slot.start }} - {{ slot.end }}</span>
                
                <div v-if="selectedSlot?.id === slot.id" class="absolute inset-0 bg-white/10"></div>
              </button>
            </div>
            
            <!-- No Slots Available -->
            <div v-else-if="selectedDate && !loadingSlots" class="text-center py-8 text-gray-500 text-sm font-sans">
              {{ t('noSlotsAvailable') || 'Tiada slot tersedia untuk tarikh ini' }}
            </div>
        </div>
      </div>

      <!-- Step 3: Pax & Addons -->
      <div v-if="currentStep === 3" class="space-y-8 animate-fade-in">
        
        <!-- Pax Counter -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-bold font-serif text-xl">{{ t('numberOfPeople') }}</h3>
              <p class="text-sm text-gray-500 font-sans mt-1">
                {{ t('baseIncluded') }}: <span class="font-medium text-gray-900">{{ selectedTheme?.base_pax }} {{ t('people') }}</span>
              </p>
            </div>
            <div class="flex items-center gap-6 bg-gray-50 rounded-full p-1.5 border border-gray-200/50">
              <button 
                @click="paxCount > 1 ? paxCount-- : null"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black disabled:opacity-50 transition-all active:scale-90"
                :disabled="paxCount <= 1"
              >
                <Minus class="w-4 h-4" />
              </button>
              <span class="font-bold font-serif text-xl w-6 text-center">{{ paxCount }}</span>
              <button
                @click="paxCount++"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black transition-all active:scale-90"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="extraPaxCost > 0" class="bg-gray-50 p-4 rounded-xl flex justify-between items-center text-sm font-sans">
            <div class="text-gray-600 flex items-center gap-2">
              <Users class="w-4 h-4" />
              <span>{{ t('additionalCharge') }} ({{ paxCount - (selectedTheme!.base_pax || 0) }} {{ t('pax') }})</span>
            </div>
            <span class="font-bold text-gray-900">+ RM{{ extraPaxCost }}</span>
          </div>
        </div>

        <!-- Addons List -->
        <div class="space-y-3 sm:space-y-4">
          <h3 class="font-bold font-serif text-lg sm:text-xl px-1">{{ t('addOns') }}</h3>
          <div v-for="addon in studioStore.addons" :key="addon.id" 
            class="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center transition-all hover:shadow-md"
            :class="{ 'border-gray-900 ring-1 ring-gray-900 bg-gray-50/50': selectedAddons[addon.id] }"
          >
            <!-- Addon Image -->
            <div v-if="addon.image" class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100">
              <img :src="addon.image" :alt="addon.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 flex items-center justify-center">
              <Plus class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </div>
            
            <div class="flex-1 min-w-0 w-full sm:w-auto">
              <div class="font-bold font-serif text-base sm:text-lg">{{ addon.name }}</div>
              <div class="text-xs sm:text-sm text-gray-500 font-sans mt-0.5">RM{{ addon.price }} <span v-if="addon.max_quantity !== 1" class="text-xs opacity-70">{{ t('perUnit') }}</span></div>
            </div>
            
            <div v-if="addon.max_quantity === 1" class="flex items-center self-end sm:self-auto">
               <button 
                @click="updateAddon(addon, (selectedAddons[addon.id] ? -1 : 1))"
                :class="[
                  'w-10 h-10 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all duration-300',
                  selectedAddons[addon.id] 
                    ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-110' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                ]"
               >
                 <Check v-if="selectedAddons[addon.id]" class="w-5 h-5 sm:w-4 sm:h-4" />
               </button>
            </div>
            <div v-else class="flex items-center gap-3 sm:gap-4 bg-gray-50 rounded-full p-1 border border-gray-200/50 self-end sm:self-auto">
               <button 
                @click="updateAddon(addon, -1)"
                class="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-all active:scale-90"
                :disabled="!selectedAddons[addon.id]"
              >
                <Minus class="w-4 h-4 sm:w-3 sm:h-3" />
              </button>
              <span class="font-serif font-bold w-6 sm:w-4 text-center text-base sm:text-sm">{{ selectedAddons[addon.id] || 0 }}</span>
              <button 
                @click="updateAddon(addon, 1)"
                class="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-90"
              >
                <Plus class="w-4 h-4 sm:w-3 sm:h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Customer Information -->
      <div v-if="currentStep === 4" class="space-y-8 animate-fade-in">
        <div class="space-y-6 px-2">
          <h3 class="font-bold font-serif text-xl">{{ t('customerInformation') }}</h3>
          <div class="space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div class="relative group">
              <input 
                type="text" 
                v-model="customerInfo.name" 
                id="name"
                class="peer w-full bg-transparent border-b-2 border-gray-200 focus:border-gray-900 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent" 
                :placeholder="t('enterFullName')" 
              />
              <label for="name" class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:text-gray-900 peer-focus:font-bold peer-focus:uppercase">
                {{ t('fullName') }}
              </label>
            </div>
            
            <div class="relative group">
              <input 
                type="tel" 
                v-model="customerInfo.phone" 
                id="phone"
                class="peer w-full bg-transparent border-b-2 border-gray-200 focus:border-gray-900 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent" 
                :placeholder="t('enterPhone')" 
              />
              <label for="phone" class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:text-gray-900 peer-focus:font-bold peer-focus:uppercase">
                {{ t('phoneNumber') }}
              </label>
            </div>

            <div class="relative group">
              <input 
                type="email" 
                v-model="customerInfo.email" 
                id="email"
                class="peer w-full bg-transparent border-b-2 border-gray-200 focus:border-gray-900 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent" 
                :placeholder="t('enterEmail')" 
              />
              <label for="email" class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:text-gray-900 peer-focus:font-bold peer-focus:uppercase">
                {{ t('email') }} ({{ t('optional') }})
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 5: Terms & Conditions -->
      <div v-if="currentStep === 5" class="space-y-6 animate-fade-in">
        <div class="space-y-4">
          <h3 class="font-bold font-serif text-lg sm:text-xl px-1">{{ t('termsAndConditions') }}</h3>
          
          <!-- Scrollable Terms Container -->
          <div 
            class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto"
            style="max-height: 70vh;"
          >
            <div class="p-6 space-y-6">
              <!-- Terms Content -->
              <div class="prose prose-sm sm:prose max-w-none font-sans text-gray-700 space-y-4">
                <h4 class="font-bold font-serif text-lg text-gray-900">{{ t('bookingTerms') }}</h4>
                
                <div class="space-y-4 text-sm sm:text-base leading-relaxed">
                  <p><strong>1. Pengesahan Tempahan</strong></p>
                  <p>Tempahan anda akan disahkan setelah bayaran diterima. Anda akan menerima pengesahan melalui WhatsApp atau e-mel.</p>
                  
                  <p><strong>2. Dasar Pembatalan</strong></p>
                  <p>Pembatalan yang dibuat 48 jam sebelum tarikh tempahan akan menerima bayaran balik penuh. Pembatalan yang dibuat dalam tempoh 48 jam akan dikenakan yuran pembatalan 50%.</p>
                  
                  <p><strong>3. Penjadualan Semula</strong></p>
                  <p>Penjadualan semula dibenarkan sehingga 24 jam sebelum masa tempahan anda, tertakluk kepada ketersediaan. Permintaan penjadualan semula yang dibuat dalam tempoh 24 jam mungkin dikenakan caj tambahan.</p>
                  
                  <p><strong>4. Pembayaran</strong></p>
                  <p>Pembayaran mesti diselesaikan untuk mengesahkan tempahan anda. Kami menerima pembayaran dalam talian melalui gateway pembayaran selamat kami.</p>
                  
                  <p><strong>5. Ketibaan Lewat</strong></p>
                  <p>Sila hadir tepat pada masanya untuk sesi anda. Ketibaan lewat mungkin mengakibatkan masa sesi dikurangkan tanpa bayaran balik.</p>
                  
                  <p><strong>6. Peraturan Studio</strong></p>
                  <p>Sila hormati ruang studio dan peralatan. Sebarang kerosakan yang disebabkan oleh kecuaian akan dikenakan bayaran sewajarnya.</p>
                  
                  <p><strong>7. Hak Fotografi</strong></p>
                  <p>Studio berhak menggunakan gambar yang diambil semasa sesi untuk tujuan promosi melainkan dipersetujui sebaliknya.</p>
                  
                  <p><strong>8. Liabiliti</strong></p>
                  <p>Studio tidak bertanggungjawab ke atas barang peribadi. Sila simpan barang berharga anda dengan selamat semasa sesi anda.</p>
                  
                  <p><strong>9. Permintaan Khas</strong></p>
                  <p>Permintaan khas mesti disampaikan sekurang-kurangnya 48 jam sebelum tempahan anda. Kami akan berusaha sedaya upaya untuk menampungnya.</p>
                  
                  <p><strong>10. Maklumat Hubungan</strong></p>
                  <p>Untuk sebarang pertanyaan atau kebimbangan, sila hubungi kami melalui WhatsApp di {{ studioStore.studio?.whatsapp || 'nombor yang disediakan' }}.</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Custom Checkbox -->
          <div class="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 flex items-start gap-3 sm:gap-4 transition-all duration-300"
               :class="termsAccepted ? 'border-gray-900 bg-gray-50/50' : 'hover:border-gray-300'">
            <!-- Custom Checkbox Button -->
            <button
              @click="termsAccepted = !termsAccepted"
              type="button"
              class="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              :class="termsAccepted 
                ? 'bg-gray-900 border-gray-900 shadow-md scale-105' 
                : 'bg-white border-gray-300 hover:border-gray-400 active:scale-95'"
            >
              <Check 
                v-if="termsAccepted"
                class="w-4 h-4 sm:w-5 sm:h-5 text-white transition-all duration-200"
                :class="termsAccepted ? 'scale-100' : 'scale-0'"
              />
            </button>
            
            <!-- Label -->
            <label 
              @click="termsAccepted = !termsAccepted"
              class="flex-1 cursor-pointer select-none"
            >
              <span class="block text-sm sm:text-base font-bold font-sans text-gray-900 mb-1">
                {{ t('agreeToTerms') }}
              </span>
              <span class="block text-xs sm:text-sm text-gray-600 font-sans leading-relaxed">
                {{ t('termsAcceptanceNote') || 'Saya telah membaca dan memahami semua terma dan syarat di atas.' }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Step 6: Summary -->
      <div v-if="currentStep === 6" class="space-y-8 animate-fade-in">
        
        <!-- Booking Summary Card -->
        <div class="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div class="bg-gray-900 p-6 text-white flex justify-between items-center">
            <div>
              <h3 class="font-bold font-serif text-xl">{{ t('bookingSummary') }}</h3>
              <p class="text-xs text-gray-400 font-sans mt-1 uppercase tracking-wider">ID: {{ t('draft') }}</p>
                </div>
            <div class="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <CreditCard class="w-6 h-6" />
                </div>
              </div>

          <div class="p-6 space-y-6">
            <!-- Theme -->
            <div class="flex justify-between items-start pb-6 border-b border-dashed border-gray-200">
              <div>
                <div class="font-bold font-serif text-lg mb-1">{{ selectedTheme?.name }}</div>
                <div class="text-sm text-gray-500 font-sans flex items-center gap-2">
                  <Calendar class="w-3 h-3" /> {{ selectedDate }}
                  <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                  <Clock class="w-3 h-3" /> {{ selectedSlot?.start }}
                </div>
              </div>
              <div class="font-bold font-sans">RM{{ selectedTheme?.base_price }}</div>
                </div>

            <div class="space-y-3 text-sm font-sans">
              <!-- Extra Pax -->
              <div v-if="extraPaxCost > 0" class="flex justify-between">
                <span class="text-gray-600">{{ t('extraPaxLabel') }} ({{ paxCount - (selectedTheme!.base_pax || 0) }})</span>
                <span class="font-medium">+ RM{{ extraPaxCost }}</span>
              </div>

              <!-- Addons -->
              <div v-for="(qty, id) in selectedAddons" :key="id" class="flex justify-between">
                <template v-if="qty > 0">
                  <span class="text-gray-600">{{ studioStore.addons.find(a => a.id === id)?.name }} (x{{ qty }})</span>
                  <span class="font-medium">+ RM{{ (studioStore.addons.find(a => a.id === id)?.price || 0) * qty }}</span>
                </template>
              </div>
                </div>

            <!-- Totals -->
            <div class="bg-gray-50 rounded-xl p-4 space-y-3">
              <div class="flex justify-between items-end">
                <span class="text-sm text-gray-500 font-medium uppercase tracking-wider">{{ t('grandTotal') }}</span>
                <span class="text-2xl font-bold font-serif">RM{{ grandTotal }}</span>
                </div>
              <div class="flex justify-between items-center pt-3 border-t border-gray-200">
                <span class="text-sm font-bold text-gray-900">
                  {{ paymentType === 'full' 
                    ? t('payFullPaymentLabel') 
                    : t('payDeposit') + ` (${depositPercentage}%)` 
                  }}
                </span>
                <span class="font-bold font-sans text-lg text-gray-900">RM{{ paymentAmount }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
      </main>
    </div>

    <!-- Bottom Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 pb-2 z-50 pointer-events-none">
        <div class="max-w-4xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6 safe-area-bottom">
            <div class="bg-white/90 sm:bg-white/80 backdrop-blur-md border border-white/40 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pointer-events-auto">
                <div class="flex flex-col pl-1 sm:pl-2">
                <span class="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold">{{ t('estimatedTotal') }}</span>
                <span class="font-bold font-serif text-xl sm:text-2xl text-gray-900">RM{{ grandTotal }}</span>
                </div>
                <button 
                @click="nextStep" 
                :disabled="
                    (currentStep === 1 && !selectedTheme) || 
                    (currentStep === 2 && !selectedSlot) ||
                    (currentStep === 4 && (!customerInfo.name || !customerInfo.phone)) ||
                    (currentStep === 5 && !termsAccepted) ||
                    isProcessingPayment
                "
                class="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                >
                <span v-if="isProcessingPayment">{{ t('processingPayment') }}</span>
                <span v-else-if="currentStep === 6">{{ t('payNow') }}</span>
                <span v-else>{{ t('next') }}</span>
                <ArrowRight v-if="!isProcessingPayment" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Loader2 v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Updated Fonts: Playfair Display & Bricolage Grotesque */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');

.font-serif {
  font-family: 'Playfair Display', serif;
}

.font-sans {
  font-family: 'Bricolage Grotesque', sans-serif;
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

@keyframes ken-burns {
  0% { transform: scale(1.05); }
  100% { transform: scale(1.15); }
}

.animate-ken-burns {
  animation: ken-burns 20s linear infinite alternate;
}
</style>
