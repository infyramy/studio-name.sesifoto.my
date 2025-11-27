<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useBookingStore } from "@/stores/booking";
import { api } from "@/services/api";
import {
  mockHeroContent,
  mockBlackoutDates,
  mockPricingRules,
} from "@/services/mockData";
import type { Theme, Addon, TimeSlot, SelectedAddon } from "@/types";
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isBefore,
  startOfDay,
} from "date-fns";
import Modal from "@/components/Modal.vue";
import { useTranslation } from "@/composables/useTranslation";

const route = useRoute();
const router = useRouter();
const studioStore = useStudioStore();
const bookingStore = useBookingStore();
const { t } = useTranslation();

const loading = ref(false);
const loadingThemes = ref(true);
const currentStep = ref(0);

// Modal state
const showModal = ref(false);
const modalConfig = ref({
  title: "",
  message: "",
  type: "info" as "info" | "success" | "error" | "warning",
  confirmText: "OK",
  showCancel: false,
  onConfirm: () => {},
});

// Helper function to show modal
const showMessage = (
  message: string,
  type: "info" | "success" | "error" | "warning" = "info",
  title?: string
) => {
  modalConfig.value = {
    title: title || "",
    message,
    type,
    confirmText: "OK",
    showCancel: false,
    onConfirm: () => {},
  };
  showModal.value = true;
};

// Color theme from mockData - default colors as fallback
const defaultColors = {
  primary: "#A8DADC",
  secondary: "#457B9D",
  accent: "#F1FAEE",
  gradientFrom: "#A8DADC",
  gradientTo: "#457B9D",
};

const colorTheme = computed(() => {
  const studioId = studioStore.studio?.id || "studio-001";
  const content = mockHeroContent[studioId] || mockHeroContent["studio-001"];
  return content?.colors || defaultColors;
});

// Step 0: Theme Selection
const selectedTheme = ref<Theme | null>(null);

// Step 1: Date & Time Selection
const selectedDate = ref<Date | null>(null);
const selectedSlot = ref<TimeSlot | null>(null);
const availableSlots = ref<TimeSlot[]>([]);
const loadingSlots = ref(false);
const currentMonth = ref(new Date());
const loadingCalendar = ref(false);

// Step 2: Pax & Add-ons
const paxCount = ref(5);
const selectedAddons = ref<SelectedAddon[]>([]);

// Step 3: Customer Info
const customerForm = ref({
  name: "",
  phone: "",
  email: "",
  notes: "",
  consent_tc: false,
  consent_marketing: false,
});

const formErrors = ref<Record<string, string>>({});

// Cart hold timer
const cartHoldMinutes = ref(10);
const cartHoldSeconds = ref(0);
let cartHoldInterval: any = null;

// Cart mode
const isCartMode = computed(
  () => studioStore.studio?.settings?.cart_mode_enabled || false
);
const showCartSidebar = ref(false);

onMounted(async () => {
  if (isCartMode.value) {
    bookingStore.enableCartMode(true);
  }

  // Simulate API call to fetch themes
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  loadingThemes.value = false;

  const themeId = route.params.themeId as string | undefined;
  if (themeId) {
    const theme = studioStore.getThemeById(themeId);
    if (theme) {
      selectedTheme.value = theme;
      paxCount.value = theme.base_pax;
      currentStep.value = 1;
    }
  }
});

const calendarDates = computed(() => {
  const start = startOfMonth(currentMonth.value);
  const end = endOfMonth(currentMonth.value);
  return eachDayOfInterval({ start, end });
});

const isDateAvailable = (date: Date) => {
  // Check if date is in the past
  if (isBefore(date, startOfDay(new Date()))) return false;

  // Check if date is a blackout date
  const studioId = studioStore.studio?.id || "studio-001";
  const blackoutDates = mockBlackoutDates[studioId] || [];
  const dateString = format(date, "yyyy-MM-dd");

  const isBlackedOut = blackoutDates.some(
    (blackout) => blackout.date === dateString
  );
  if (isBlackedOut) return false;

  return true;
};

const isDateSelected = (date: Date) =>
  selectedDate.value && isSameDay(date, selectedDate.value);

const isDateBlackedOut = (date: Date) => {
  const studioId = studioStore.studio?.id || "studio-001";
  const blackoutDates = mockBlackoutDates[studioId] || [];
  const dateString = format(date, "yyyy-MM-dd");
  return blackoutDates.some((blackout) => blackout.date === dateString);
};

// Get applicable pricing rule for a given date
const getApplicablePricingRule = (date: Date) => {
  const studioId = studioStore.studio?.id || "studio-001";
  const pricingRules = mockPricingRules[studioId] || [];
  const dateString = format(date, "yyyy-MM-dd");

  return pricingRules.find(
    (rule) =>
      rule.status === "active" &&
      dateString >= rule.date_range_start &&
      dateString <= rule.date_range_end
  );
};

watch(selectedDate, async (newDate) => {
  if (!newDate || !selectedTheme.value) return;
  selectedSlot.value = null;
  loadingSlots.value = true;
  loadingCalendar.value = true;
  try {
    const dateString = format(newDate, "yyyy-MM-dd");
    availableSlots.value = await api.getAvailableTimeSlots(
      studioStore.studio!.id,
      selectedTheme.value.id,
      dateString
    );
  } catch (error) {
    console.error("Failed to load slots:", error);
    availableSlots.value = [];
  } finally {
    loadingSlots.value = false;
    loadingCalendar.value = false;
  }
});

watch(selectedSlot, (newSlot) => {
  if (newSlot) startCartHoldTimer();
});

const startCartHoldTimer = () => {
  if (cartHoldInterval) clearInterval(cartHoldInterval);
  const holdDuration = studioStore.studio?.settings?.cart_hold_duration || 10;
  cartHoldMinutes.value = holdDuration;
  cartHoldSeconds.value = 0;
  cartHoldInterval = setInterval(() => {
    if (cartHoldSeconds.value > 0) {
      cartHoldSeconds.value--;
    } else if (cartHoldMinutes.value > 0) {
      cartHoldMinutes.value--;
      cartHoldSeconds.value = 59;
    } else {
      clearInterval(cartHoldInterval);
      selectedSlot.value = null;
      showMessage(
        "Booking time expired. Please select a slot again.",
        "warning"
      );
    }
  }, 1000);
};

const selectTheme = (theme: Theme) => {
  selectedTheme.value = theme;
  paxCount.value = theme.base_pax;
  goToStep(1);
};

const selectDate = (date: Date) => {
  if (isDateAvailable(date)) selectedDate.value = date;
};

const selectSlot = (slot: TimeSlot) => {
  if (slot.status === "available") selectedSlot.value = slot;
};

const nextMonth = () => {
  currentMonth.value = addDays(currentMonth.value, 30);
};
const prevMonth = () => {
  currentMonth.value = addDays(currentMonth.value, -30);
};

const incrementPax = () => {
  if (paxCount.value < 20) paxCount.value++;
};
const decrementPax = () => {
  if (selectedTheme.value && paxCount.value > 1) paxCount.value--;
};

const toggleAddon = (addon: Addon) => {
  const existingIndex = selectedAddons.value.findIndex(
    (a) => a.addon_id === addon.id
  );
  if (existingIndex >= 0) {
    selectedAddons.value.splice(existingIndex, 1);
  } else {
    selectedAddons.value.push({ addon_id: addon.id, quantity: 1 });
  }
};

const isAddonSelected = (addonId: string) =>
  selectedAddons.value.some((a) => a.addon_id === addonId);

const extraPaxFee = computed(() => {
  if (!selectedTheme.value) return 0;
  const extraPax = Math.max(0, paxCount.value - selectedTheme.value.base_pax);
  return extraPax * selectedTheme.value.extra_pax_price;
});

const addonsTotal = computed(() => {
  return selectedAddons.value.reduce((total, selected) => {
    const addon = studioStore.getAddonById(selected.addon_id);
    return total + (addon ? addon.price * selected.quantity : 0);
  }, 0);
});

// Original price without any pricing rules
const originalPrice = computed(() => {
  if (!selectedTheme.value || !selectedSlot.value)
    return selectedTheme.value?.base_price || 0;
  return selectedSlot.value.price;
});

// Base price with pricing rules applied
const basePrice = computed(() => {
  let price = originalPrice.value;

  // Apply pricing rule if applicable
  if (selectedDate.value) {
    const pricingRule = getApplicablePricingRule(selectedDate.value);
    if (pricingRule) {
      if (pricingRule.rule_type === "percentage_increase") {
        price = price * (1 + pricingRule.value / 100);
      } else if (pricingRule.rule_type === "fixed_price") {
        price = pricingRule.value;
      }
    }
  }

  return Math.round(price);
});

// Check if pricing rule is applied
const hasPricingRule = computed(() => {
  if (!selectedDate.value) return false;
  return !!getApplicablePricingRule(selectedDate.value);
});

const totalAmount = computed(
  () => basePrice.value + extraPaxFee.value + addonsTotal.value
);
const depositAmount = computed(() => {
  const depositPercentage =
    studioStore.studio?.settings?.deposit_percentage || 50;
  return Math.round(totalAmount.value * (depositPercentage / 100));
});
const balanceAmount = computed(() => totalAmount.value - depositAmount.value);

// Alias for template usage
const calculatedTotal = computed(() => totalAmount.value);

// Available addons computed
const availableAddons = computed(() => studioStore.addons || []);

// Cart timer display
const cartTimer = computed(() => {
  const mins = String(cartHoldMinutes.value).padStart(2, "0");
  const secs = String(cartHoldSeconds.value).padStart(2, "0");
  return `${mins}:${secs}`;
});

// Cart hold expiry (for display purposes)
const cartHoldExpiresAt = computed(() => {
  if (!selectedSlot.value) return null;
  const now = new Date();
  const holdDuration = studioStore.studio?.settings?.cart_hold_duration || 10;
  return new Date(now.getTime() + holdDuration * 60 * 1000);
});

const canProceedToStep = (step: number) => {
  switch (step) {
    case 1:
      return selectedTheme.value !== null;
    case 2:
      return selectedDate.value !== null && selectedSlot.value !== null;
    case 3:
      return true;
    case 4:
      return validateForm();
    default:
      return false;
  }
};

const goToStep = (step: number) => {
  if (step > currentStep.value && !canProceedToStep(step)) return;
  currentStep.value = step;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const validateForm = () => {
  formErrors.value = {};
  if (!customerForm.value.name.trim())
    formErrors.value.name = "Name is required";
  if (!customerForm.value.phone.trim()) {
    formErrors.value.phone = "Phone number is required";
  } else if (
    !/^01\d{8,9}$/.test(customerForm.value.phone.replace(/[-\s]/g, ""))
  ) {
    formErrors.value.phone = "Invalid phone format (e.g., 0123456789)";
  }
  if (!customerForm.value.email.trim()) {
    formErrors.value.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.value.email)) {
    formErrors.value.email = "Invalid email format";
  }
  // Removed consent_tc validation since we don't have that checkbox in the form
  return Object.keys(formErrors.value).length === 0;
};

const addToCart = () => {
  if (!selectedTheme.value || !selectedDate.value || !selectedSlot.value) {
    showMessage("Please select a theme, date, and time slot", "error");
    return;
  }

  // For cart mode, we don't collect customer info until checkout

  const cartItem = {
    theme_id: selectedTheme.value.id,
    theme: selectedTheme.value,
    booking_date: format(selectedDate.value, "yyyy-MM-dd"),
    start_time: selectedSlot.value.start,
    end_time: selectedSlot.value.end,
    pax_count: paxCount.value,
    base_price: basePrice.value,
    extra_pax_fee: extraPaxFee.value,
    addons_total: addonsTotal.value,
    special_pricing_applied: 0,
    total_amount: totalAmount.value,
    selected_addons: selectedAddons.value,
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_notes: "",
  };

  console.log("Adding to cart:", cartItem);
  bookingStore.addToCart(cartItem);
  console.log("Cart count after add:", bookingStore.cartCount);

  showMessage(
    `Added to cart! You have ${bookingStore.cartCount} item(s) in cart.`,
    "success"
  );
  resetBookingForm();
  goToStep(0);
};

const submitBooking = async () => {
  if (
    !validateForm() ||
    !selectedTheme.value ||
    !selectedDate.value ||
    !selectedSlot.value
  ) {
    showMessage("Please complete all booking information", "error");
    return;
  }

  loading.value = true;
  try {
    const bookingRequest = {
      theme_id: selectedTheme.value.id,
      booking_date: format(selectedDate.value, "yyyy-MM-dd"),
      start_time: selectedSlot.value.start,
      end_time: selectedSlot.value.end,
      pax_count: paxCount.value,
      customer_name: customerForm.value.name,
      customer_phone: customerForm.value.phone,
      customer_email: customerForm.value.email,
      customer_notes: customerForm.value.notes,
      consent_tc: customerForm.value.consent_tc,
      consent_marketing: customerForm.value.consent_marketing,
      selected_addons: selectedAddons.value,
    };

    const booking = await api.createBooking(bookingRequest);
    bookingStore.setCompletedBooking(booking);
    if (cartHoldInterval) clearInterval(cartHoldInterval);
    router.push(`/success/${booking.id}`);
  } catch (error) {
    console.error("Booking failed:", error);
    showMessage("Booking failed. Please try again.", "error");
  } finally {
    loading.value = false;
  }
};

const resetBookingForm = () => {
  selectedTheme.value = null;
  selectedDate.value = null;
  selectedSlot.value = null;
  paxCount.value = 5;
  selectedAddons.value = [];
  customerForm.value = {
    name: "",
    phone: "",
    email: "",
    notes: "",
    consent_tc: false,
    consent_marketing: false,
  };
  formErrors.value = {};
  if (cartHoldInterval) clearInterval(cartHoldInterval);
};

const removeCartItem = (index: number) => bookingStore.removeFromCart(index);
const proceedToCheckout = () => router.push("/cart/checkout");
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100"
  >
    <!-- Header with dynamic color -->
    <header
      class="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b shadow-sm"
      :style="{ borderColor: colorTheme.primary + '30' }"
    >
      <div class="container mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4">
        <div class="flex items-center justify-between gap-2">
          <!-- Back Button -->
          <button
            @click="router.push('/')"
            class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 hover:bg-gray-50 transition-all group active:scale-95 touch-manipulation min-w-[60px] sm:min-w-0"
          >
            <svg
              class="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1"
              :style="{ color: colorTheme.secondary }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span
              class="font-medium text-[10px] sm:text-xs uppercase tracking-wider"
              :style="{ color: colorTheme.secondary }"
              >{{ t('back') }}</span
            >
          </button>

          <!-- Studio Info -->
          <div class="flex items-center gap-2 flex-1 justify-center sm:justify-start sm:flex-initial">
            <img
              v-if="studioStore.studio?.logo_url"
              :src="studioStore.studio.logo_url"
              :alt="studioStore.studio.name"
              class="h-7 w-7 sm:h-10 sm:w-10 rounded-full object-cover shadow-md ring-2"
              :style="{
                borderColor: colorTheme.primary,
                borderWidth: '2px',
                borderStyle: 'solid',
              }"
            />
            <div class="hidden sm:block">
              <div class="text-xs text-gray-500 font-medium">{{ t('bookingAt') }}</div>
              <div class="text-sm font-semibold text-gray-900">
                {{ studioStore.studio?.name }}
              </div>
            </div>
          </div>

          <!-- Cart Button -->
          <button
            v-if="isCartMode && bookingStore.cartCount > 0"
            @click="showCartSidebar = true"
            class="relative p-2 rounded-lg transition-all active:scale-95 touch-manipulation min-w-[44px] min-h-[44px]"
            :style="{ backgroundColor: colorTheme.primary + '20' }"
          >
            <svg
              class="w-5 h-5 sm:w-6 sm:h-6"
              :style="{ color: colorTheme.secondary }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span
              class="absolute -top-1 -right-1 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-lg"
              :style="{ backgroundColor: colorTheme.secondary }"
            >
              {{ bookingStore.cartCount }}
            </span>
          </button>
          <div v-else class="w-[44px] sm:w-10"></div>
        </div>
      </div>

      <!-- Timer Banner -->
      <div
        v-if="selectedSlot && currentStep > 0"
        class="border-t py-2 px-4"
        :style="{
          backgroundColor: colorTheme.primary + '15',
          borderColor: colorTheme.primary + '30',
        }"
      >
        <div
          class="container mx-auto flex items-center justify-center gap-2 text-sm"
        >
          <svg
            class="w-4 h-4 animate-pulse"
            :style="{ color: colorTheme.secondary }"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="font-medium"
            >Slot held: {{ String(cartHoldMinutes).padStart(2, "0") }}:{{
              String(cartHoldSeconds).padStart(2, "0")
            }}</span
          >
        </div>
      </div>
    </header>

    <!-- Progress Indicator -->
    <div
      v-if="currentStep > 0"
      class="bg-white border-b py-4 sm:py-5"
      :style="{ borderColor: colorTheme.primary + '20' }"
    >
      <div class="container mx-auto px-4 sm:px-6">
        <div
          class="flex items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto"
        >
          <!-- Step 1: Date & Time -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <div
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
              :style="
                currentStep >= 1
                  ? { backgroundColor: colorTheme.secondary, color: 'white' }
                  : { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
              "
            >
              1
            </div>
            <span
              class="text-xs sm:text-sm font-medium hidden sm:inline transition-colors"
              :style="{
                color: currentStep >= 1 ? colorTheme.secondary : '#9CA3AF',
              }"
            >
              {{ t('dateAndTime') }}
            </span>
          </div>

          <!-- Divider -->
          <div
            class="w-8 sm:w-12 h-0.5 rounded-full transition-colors"
            :style="{
              backgroundColor:
                currentStep >= 2 ? colorTheme.secondary : '#E5E7EB',
            }"
          ></div>

          <!-- Step 2: Pax & Add-ons -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <div
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
              :style="
                currentStep >= 2
                  ? { backgroundColor: colorTheme.secondary, color: 'white' }
                  : { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
              "
            >
              2
            </div>
            <span
              class="text-xs sm:text-sm font-medium hidden sm:inline transition-colors"
              :style="{
                color: currentStep >= 2 ? colorTheme.secondary : '#9CA3AF',
              }"
            >
              {{ t('customizeSession') }}
            </span>
          </div>

          <!-- Step 3: Customer Info (Only show in single booking mode) -->
          <template v-if="!isCartMode">
            <!-- Divider -->
            <div
              class="w-8 sm:w-12 h-0.5 rounded-full transition-colors"
              :style="{
                backgroundColor:
                  currentStep >= 3 ? colorTheme.secondary : '#E5E7EB',
              }"
            ></div>

            <!-- Step 3 -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <div
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                :style="
                  currentStep >= 3
                    ? { backgroundColor: colorTheme.secondary, color: 'white' }
                    : { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
                "
              >
                3
              </div>
              <span
                class="text-xs sm:text-sm font-medium hidden sm:inline transition-colors"
                :style="{
                  color: currentStep >= 3 ? colorTheme.secondary : '#9CA3AF',
                }"
              >
                {{ t('customerInformation') }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Main -->
    <div
      class="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-6xl"
    >
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div class="lg:col-span-2 space-y-4 sm:space-y-6">
          <!-- Step 0: Theme Selection -->
          <div v-show="currentStep === 0" class="space-y-5 sm:space-y-6">
            <div class="text-center sm:text-left">
              <h2
                class="text-2xl sm:text-3xl font-extralight text-gray-900 mb-2"
              >
                {{ t('selectThemeTitle') }}
              </h2>
              <p class="text-sm sm:text-base text-gray-600 font-light">
                {{ t('selectThemeSubtitle') }}
              </p>
            </div>

            <!-- Loading Skeleton -->
            <div v-if="loadingThemes" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div
                v-for="i in 3"
                :key="i"
                class="bg-white overflow-hidden shadow-sm border border-gray-100 animate-pulse"
              >
                <!-- Image skeleton -->
                <div class="aspect-[4/3] bg-gray-200"></div>
                
                <!-- Content skeleton -->
                <div class="p-4 sm:p-5 space-y-3">
                  <!-- Title -->
                  <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                  <!-- Description -->
                  <div class="space-y-2">
                    <div class="h-4 bg-gray-200 rounded"></div>
                    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <!-- Price and button -->
                  <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div class="space-y-2">
                      <div class="h-3 bg-gray-200 rounded w-20"></div>
                      <div class="h-7 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div class="h-9 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <button
                v-for="theme in studioStore.activeThemes"
                :key="theme.id"
                @click="selectTheme(theme)"
                class="group bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200 text-left"
              >
                <!-- Theme Image -->
                <div class="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    :src="theme.images[0]"
                    :alt="theme.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div
                    class="absolute top-3 right-3 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white"
                    :style="{ backgroundColor: colorTheme.secondary }"
                  >
                    {{ theme.duration_minutes }} min
                  </div>
                  <div
                    v-if="theme.is_deposit"
                    class="absolute top-3 left-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-yellow-500 text-white shadow"
                  >
                    Deposit
                  </div>
                </div>

                <!-- Theme Info -->
                <div class="p-4 sm:p-5">
                  <h3 class="text-lg sm:text-xl font-light text-gray-900 mb-2">
                    {{ theme.name }}
                  </h3>
                  <p
                    class="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed font-light"
                  >
                    {{ theme.description_short }}
                  </p>

                  <div
                    class="flex items-center justify-between pt-3 border-t border-gray-100"
                  >
                    <div>
                      <div
                        class="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-medium"
                      >
                        {{ t('startingFrom') }}
                      </div>
                      <div
                        class="text-xl sm:text-2xl font-medium"
                        :style="{ color: colorTheme.secondary }"
                      >
                        RM{{ theme.base_price }}
                      </div>
                    </div>
                    <div
                      class="flex items-center gap-2 px-3 py-1.5 transition-all group-hover:gap-3"
                      :style="{
                        backgroundColor: colorTheme.primary + '15',
                        color: colorTheme.secondary,
                      }"
                    >
                      <span class="text-xs font-medium uppercase tracking-wider"
                        >{{ t('select') }}</span
                      >
                      <svg
                        class="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Step 1: Date & Time Selection -->
          <div v-if="currentStep === 1" class="space-y-5 sm:space-y-6">
            <div class="text-center sm:text-left">
              <h2
                class="text-2xl sm:text-3xl font-extralight text-gray-900 mb-2"
              >
                {{ t('chooseDateTimeTitle') }}
              </h2>
              <p class="text-sm sm:text-base text-gray-600 font-light">
                {{ t('chooseDateTimeSubtitle') }}
              </p>
            </div>

            <!-- Calendar -->
            <div class="card p-2.5 sm:p-3">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm sm:text-base font-medium">
                  {{ format(currentMonth, "MMMM yyyy") }}
                </h3>
                <div class="flex gap-1.5">
                  <button
                    @click="prevMonth"
                    class="p-2 hover:bg-gray-100 active:scale-95 transition-all border border-gray-200 touch-manipulation min-w-[40px] min-h-[40px]"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    @click="nextMonth"
                    class="p-2 hover:bg-gray-100 active:scale-95 transition-all border border-gray-200 touch-manipulation min-w-[40px] min-h-[40px]"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Day headers -->
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div
                  v-for="day in ['S', 'M', 'T', 'W', 'T', 'F', 'S']"
                  :key="day"
                  class="text-center text-[11px] sm:text-xs font-medium text-gray-500 py-1"
                >
                  {{ day }}
                </div>
              </div>

              <!-- Calendar dates -->
              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="date in calendarDates"
                  :key="date.toISOString()"
                  @click="selectDate(date)"
                  :disabled="!isDateAvailable(date)"
                  :title="isDateBlackedOut(date) ? 'Studio Closed' : ''"
                  class="aspect-square flex items-center justify-center text-xs sm:text-sm font-medium transition-all relative active:scale-95 touch-manipulation min-h-[40px]"
                  :class="[
                    !isSameMonth(date, currentMonth) && 'opacity-30',
                    !isDateAvailable(date) && 'cursor-not-allowed',
                    isDateBlackedOut(date) && 'bg-red-50',
                  ]"
                  :style="
                    isDateSelected(date)
                      ? {
                          backgroundColor: colorTheme.secondary,
                          color: 'white',
                        }
                      : isDateBlackedOut(date)
                      ? { color: '#DC2626', textDecoration: 'line-through' }
                      : isDateAvailable(date)
                      ? { color: '#374151' }
                      : { color: '#D1D5DB' }
                  "
                >
                  {{ format(date, "d") }}
                  <!-- Blackout indicator dot -->
                  <span
                    v-if="isDateBlackedOut(date)"
                    class="absolute bottom-1 w-1 h-1 rounded-full bg-red-500"
                  ></span>
                  <!-- Pricing rule indicator dot -->
                  <span
                    v-else-if="
                      getApplicablePricingRule(date) && isDateAvailable(date)
                    "
                    class="absolute bottom-1 w-1 h-1 rounded-full bg-orange-500"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Time Slots -->
            <div v-if="selectedDate" class="card p-3 sm:p-4">
              <h3
                class="text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2"
              >
                {{ t('selectTimeSlot') }}
                <svg
                  v-if="loadingSlots"
                  class="animate-spin w-4 h-4"
                  :style="{ color: colorTheme.secondary }"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </h3>

              <!-- Loading State -->
              <div v-if="loadingSlots" class="text-center py-8">
                <div class="inline-flex flex-col items-center gap-3">
                  <svg
                    class="animate-spin w-8 h-8"
                    :style="{ color: colorTheme.secondary }"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p class="text-sm text-gray-600">
                    {{ t('loadingSlots') }}
                  </p>
                </div>
              </div>

              <!-- No Slots -->
              <div
                v-else-if="availableSlots.length === 0"
                class="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base"
              >
                {{ t('noSlotsAvailable') }}
              </div>

              <!-- Slots Grid -->
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  v-for="slot in availableSlots"
                  :key="slot.start"
                  @click="selectSlot(slot)"
                  :disabled="slot.status !== 'available'"
                  :title="
                    slot.status === 'booked'
                      ? 'Fully Booked'
                      : slot.status === 'held'
                      ? 'Temporarily Held'
                      : ''
                  "
                  class="py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm transition-all relative border active:scale-95 touch-manipulation min-h-[48px]"
                  :class="[
                    slot.status === 'available' &&
                      'hover:shadow-md cursor-pointer',
                    slot.status !== 'available' &&
                      'cursor-not-allowed opacity-60',
                  ]"
                  :style="
                    selectedSlot?.start === slot.start
                      ? {
                          backgroundColor: colorTheme.secondary,
                          color: 'white',
                          borderColor: colorTheme.secondary,
                        }
                      : slot.status === 'available'
                      ? {
                          backgroundColor: colorTheme.primary + '10',
                          color: colorTheme.secondary,
                          borderColor: colorTheme.primary + '30',
                        }
                      : {
                          backgroundColor: '#F3F4F6',
                          color: '#9CA3AF',
                          borderColor: '#E5E7EB',
                          textDecoration: 'line-through',
                        }
                  "
                >
                  <span class="block">{{ slot.start }} - {{ slot.end }}</span>
                  <!-- Status Indicator -->
                  <span
                    v-if="slot.status === 'booked'"
                    class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                  ></span>
                  <span
                    v-if="slot.status === 'held'"
                    class="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"
                  ></span>
                  <span
                    v-if="
                      slot.is_special_pricing && slot.status === 'available'
                    "
                    class="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] sm:text-[10px] font-medium uppercase tracking-wider"
                  >
                    +
                  </span>
                </button>
              </div>

              <!-- Slot Legend -->
              <div
                v-if="availableSlots.length > 0 && !loadingSlots"
                class="mt-4 pt-4 border-t border-gray-200"
              >
                <p
                  class="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2"
                >
                  {{ t('legend') }}
                </p>
                <div
                  class="flex flex-wrap gap-3 text-xs text-gray-600 font-light"
                >
                  <div class="flex items-center gap-1.5">
                    <div
                      class="w-3 h-3 rounded"
                      :style="{ backgroundColor: colorTheme.primary + '40' }"
                    ></div>
                    <span>{{ t('available') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{{ t('booked') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{{ t('held') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div
                      class="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-medium uppercase tracking-wider"
                    >
                      +
                    </div>
                    <span>{{ t('specialPrice') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation -->
            <div class="flex gap-2 sm:gap-3 pt-4">
              <button
                @click="goToStep(0)"
                class="flex-1 py-3 sm:py-3.5 px-4 sm:px-6 font-medium text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 touch-manipulation bg-gray-100 text-gray-900 min-h-[48px]"
              >
                {{ t('back') }}
              </button>
              <button
                @click="goToStep(2)"
                :disabled="!selectedDate || !selectedSlot"
                class="flex-1 py-3 sm:py-3.5 px-4 sm:px-6 font-medium text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed text-white min-h-[48px]"
                :style="{ backgroundColor: colorTheme.secondary }"
              >
                {{ t('continue') }}
              </button>
            </div>
          </div>

          <!-- Step 2: Pax & Add-ons -->
          <div v-if="currentStep === 2" class="space-y-5 sm:space-y-6">
            <div class="text-center sm:text-left">
              <h2
                class="text-2xl sm:text-3xl font-extralight text-gray-900 mb-2"
              >
                {{ t('customizeSessionTitle') }}
              </h2>
              <p class="text-sm sm:text-base text-gray-600 font-light">
                {{ t('customizeSessionSubtitle') }}
              </p>
            </div>

            <!-- Pax Selection -->
            <div class="card p-4 sm:p-6">
              <div class="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 class="text-base sm:text-lg font-medium">
                    {{ t('numberOfPeople') }}
                  </h3>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1">
                    {{ t('base') }}: {{ selectedTheme?.base_pax }} {{ t('pax') }} ({{ t('baseIncluded') }})
                    <span
                      v-if="paxCount > (selectedTheme?.base_pax || 0)"
                      class="text-orange-600"
                    >
                      + {{ paxCount - (selectedTheme?.base_pax || 0) }} {{ t('extra') }}
                    </span>
                  </p>
                </div>
                <div class="flex items-center gap-2 sm:gap-4">
                  <button
                    @click="decrementPax"
                    :disabled="paxCount <= (selectedTheme?.base_pax || 1)"
                    class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200 active:scale-95 touch-manipulation"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <span
                    class="text-xl sm:text-2xl font-medium w-10 sm:w-12 text-center"
                    >{{ paxCount }}</span
                  >
                  <button
                    @click="incrementPax"
                    class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-white transition-all active:scale-95 touch-manipulation"
                    :style="{ backgroundColor: colorTheme.secondary }"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                v-if="paxCount > (selectedTheme?.base_pax || 0)"
                class="text-sm text-gray-700 p-3 font-light"
                :style="{ backgroundColor: colorTheme.primary + '15' }"
              >
                <span class="font-medium">{{ t('extraPaxFee') }}</span> RM{{
                  (
                    (paxCount - (selectedTheme?.base_pax || 0)) *
                    (selectedTheme?.extra_pax_price || 0)
                  ).toFixed(2)
                }}
              </div>
            </div>

            <!-- Add-ons -->
            <div v-if="availableAddons.length > 0" class="card p-4 sm:p-6">
              <h3 class="text-base sm:text-lg font-medium mb-3 sm:mb-4">
                {{ t('optionalAddons') }}
              </h3>
              <div class="space-y-2 sm:space-y-3">
                <button
                  v-for="addon in availableAddons"
                  :key="addon.id"
                  @click="toggleAddon(addon)"
                  :class="[
                    'w-full p-3 sm:p-4 border-2 transition-all text-left',
                    isAddonSelected(addon.id)
                      ? ''
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                  :style="
                    isAddonSelected(addon.id)
                      ? {
                          borderColor: colorTheme.secondary,
                          backgroundColor: colorTheme.primary + '10',
                        }
                      : {}
                  "
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          :style="
                            isAddonSelected(addon.id)
                              ? {
                                  borderColor: colorTheme.secondary,
                                  backgroundColor: colorTheme.secondary,
                                }
                              : { borderColor: '#D1D5DB' }
                          "
                        >
                          <svg
                            v-if="isAddonSelected(addon.id)"
                            class="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span class="font-medium text-sm">{{
                          addon.name
                        }}</span>
                      </div>
                    </div>
                    <span
                      class="text-base font-medium flex-shrink-0"
                      :style="{ color: colorTheme.secondary }"
                    >
                      RM{{ addon.price.toFixed(2) }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Navigation -->
            <div class="space-y-3 pt-4">
              <!-- Cart Mode: Show Add to Cart button -->
              <template v-if="isCartMode">
                <div class="flex flex-wrap gap-3">
                  <button
                    @click="goToStep(1)"
                    class="w-full py-3 px-6 font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg bg-gray-100 text-gray-900"
                  >
                    {{ t('back') }}
                  </button>
                  <button
                    @click="addToCart"
                    class="w-full py-4 px-6 font-medium text-sm uppercase tracking-wider text-white transition-all hover:shadow-lg flex items-center justify-center gap-2"
                    :style="{
                      backgroundColor: colorTheme.secondary,
                    }"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {{ t('addToCart') }}
                  </button>
                </div>
              </template>

              <!-- Single Booking Mode: Continue to customer info -->
              <template v-else>
                <div class="flex gap-3">
                  <button
                    @click="goToStep(1)"
                    class="flex-1 py-3 px-6 font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg bg-gray-100 text-gray-900"
                  >
                    {{ t('back') }}
                  </button>
                  <button
                    @click="goToStep(3)"
                    class="flex-1 py-3 px-6 font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg text-white"
                    :style="{ backgroundColor: colorTheme.secondary }"
                  >
                    {{ t('continue') }}
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Step 3: Customer Info (Only for Single Booking Mode) -->
          <div
            v-if="currentStep === 3 && !isCartMode"
            class="space-y-5 sm:space-y-6"
          >
            <div class="text-center sm:text-left">
              <h2
                class="text-2xl sm:text-3xl font-extralight text-gray-900 mb-2"
              >
                {{ t('customerInfoTitle') }}
              </h2>
              <p class="text-sm sm:text-base text-gray-600 font-light">
                {{ t('customerInfoSubtitle') }}
              </p>
            </div>

            <!-- Customer Form -->
            <div class="card p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label
                  class="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium"
                  >{{ t('fullName') }} *</label
                >
                <input
                  v-model="customerForm.name"
                  type="text"
                  :placeholder="t('enterFullName')"
                  :class="[
                    'w-full px-4 py-3 sm:py-3.5 border rounded-lg text-base transition-colors min-h-[48px]',
                    formErrors.name
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                  ]"
                />
                <p
                  v-if="formErrors.name"
                  class="mt-1 text-xs sm:text-sm text-red-600"
                >
                  {{ formErrors.name }}
                </p>
              </div>

              <div>
                <label
                  class="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium"
                  >{{ t('whatsappNumber') }} *</label
                >
                <input
                  v-model="customerForm.phone"
                  type="tel"
                  inputmode="tel"
                  :placeholder="t('enterPhone')"
                  :class="[
                    'w-full px-4 py-3 sm:py-3.5 border rounded-lg text-base transition-colors min-h-[48px]',
                    formErrors.phone
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                  ]"
                />
                <p
                  v-if="formErrors.phone"
                  class="mt-1 text-xs sm:text-sm text-red-600"
                >
                  {{ formErrors.phone }}
                </p>
              </div>

              <div>
                <label
                  class="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium"
                  >{{ t('emailAddress') }} *</label
                >
                <input
                  v-model="customerForm.email"
                  type="email"
                  inputmode="email"
                  :placeholder="t('enterEmail')"
                  :class="[
                    'w-full px-4 py-3 sm:py-3.5 border rounded-lg text-base transition-colors min-h-[48px]',
                    formErrors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                  ]"
                />
                <p
                  v-if="formErrors.email"
                  class="mt-1 text-xs sm:text-sm text-red-600"
                >
                  {{ formErrors.email }}
                </p>
              </div>

              <div>
                <label
                  class="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium"
                  >{{ t('notesOptional') }}</label
                >
                <textarea
                  v-model="customerForm.notes"
                  rows="3"
                  :placeholder="t('specialRequests')"
                  class="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-base resize-none min-h-[80px]"
                ></textarea>
              </div>
            </div>

            <!-- Cart hold timer warning (if cart mode enabled) -->
            <div
              v-if="isCartMode && cartHoldExpiresAt"
              class="card p-3 sm:p-4 bg-orange-50 border border-orange-200"
            >
              <div class="flex items-start gap-2 sm:gap-3">
                <svg
                  class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div class="text-xs sm:text-sm text-orange-800">
                  <p class="font-medium">
                    Cart hold expires in {{ cartTimer }}
                  </p>
                  <p class="mt-1">
                    Complete your booking or add to cart to save your slot
                  </p>
                </div>
              </div>
            </div>

            <!-- Navigation & Actions -->
            <div class="space-y-3 pt-4">
              <!-- If cart mode enabled, show both Add to Cart and Pay Now -->
              <template v-if="isCartMode">
                <button
                  @click="addToCart"
                  class="w-full py-4 px-6 font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  :style="{
                    backgroundColor: colorTheme.primary + '20',
                    color: colorTheme.secondary,
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {{ t('addToCart') }}
                </button>
                <button
                  @click="submitBooking"
                  class="w-full py-4 px-6 font-medium text-sm uppercase tracking-wider text-white transition-all hover:shadow-lg"
                  :style="{
                    backgroundColor: colorTheme.secondary,
                  }"
                >
                  {{ t('payNow') }} - RM{{ calculatedTotal.toFixed(2) }}
                </button>
              </template>

              <!-- If single booking mode, only show Pay Now -->
              <template v-else>
                <button
                  @click="submitBooking"
                  class="w-full py-4 px-6 font-medium text-sm uppercase tracking-wider text-white transition-all hover:shadow-lg"
                  :style="{
                    backgroundColor: colorTheme.secondary,
                  }"
                >
                  {{ t('payNow') }} - RM{{ calculatedTotal.toFixed(2) }}
                </button>
              </template>

              <button
                @click="goToStep(2)"
                class="w-full py-3 px-6 font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg bg-gray-100 text-gray-900"
              >
                {{ t('back') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Summary Sidebar -->
        <div class="lg:col-span-1" v-if="selectedTheme && currentStep > 0">
          <div class="card sticky top-20 sm:top-24 space-y-3 sm:space-y-4">
            <h3 class="text-base sm:text-lg font-medium text-gray-900">
              {{ t('summary') }}
            </h3>
            <div class="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div class="pb-2 sm:pb-3 border-b border-gray-200">
                <div class="flex items-center gap-2 sm:gap-3">
                  <img
                    :src="selectedTheme.images[0]"
                    :alt="selectedTheme.name"
                    class="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium truncate">
                      {{ selectedTheme.name }}
                    </div>
                    <div class="text-xs text-gray-500 font-light">
                      {{ selectedTheme.duration_minutes }} mins
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-if="selectedDate && selectedSlot"
                class="pb-2 sm:pb-3 border-b border-gray-200"
              >
                <div class="flex items-center gap-2 text-gray-600 mb-1">
                  <svg
                    class="w-3 h-3 sm:w-4 sm:h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="font-medium text-xs sm:text-sm"
                    >{{ t('dateAndTime') }}</span
                  >
                </div>
                <div class="text-gray-900 text-xs sm:text-sm font-light">
                  {{ format(selectedDate, "dd MMM yyyy") }} @
                  {{ selectedSlot.start }}
                </div>
              </div>
              <div class="pb-2 sm:pb-3 border-b border-gray-200">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <span class="text-gray-600"
                      >{{ t('base') }} ({{ selectedTheme.base_pax }} {{ t('pax') }})</span
                    >
                    <div
                      v-if="
                        selectedDate && getApplicablePricingRule(selectedDate)
                      "
                      class="flex items-center gap-1 mt-1"
                    >
                      <span
                        class="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white bg-orange-500"
                      >
                        {{ getApplicablePricingRule(selectedDate)?.name }}
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      v-if="hasPricingRule"
                      class="text-xs text-gray-400 line-through mb-0.5"
                    >
                      RM{{ originalPrice }}
                    </div>
                    <span
                      class="font-medium"
                      :class="{ 'text-orange-600': hasPricingRule }"
                      >RM{{ basePrice }}</span
                    >
                  </div>
                </div>
                <div
                  v-if="paxCount > selectedTheme.base_pax"
                  class="flex justify-between mt-2"
                >
                  <span class="text-gray-600 font-light"
                    >{{ t('extra') }} {{ paxCount - selectedTheme.base_pax }} {{ t('pax') }}</span
                  >
                  <span class="font-medium">RM{{ extraPaxFee }}</span>
                </div>
              </div>
              <div
                v-if="selectedAddons.length > 0"
                class="pb-2 sm:pb-3 border-b border-gray-200"
              >
                <div
                  v-for="selected in selectedAddons"
                  :key="selected.addon_id"
                  class="flex justify-between"
                >
                  <span class="text-gray-600 truncate mr-2 font-light">{{
                    studioStore.getAddonById(selected.addon_id)?.name
                  }}</span>
                  <span class="font-medium flex-shrink-0"
                    >RM{{
                      studioStore.getAddonById(selected.addon_id)?.price
                    }}</span
                  >
                </div>
              </div>
              <div class="pt-2 sm:pt-3 border-t-2 border-gray-300">
                <div
                  class="flex justify-between text-base sm:text-lg font-medium"
                >
                  <span class="uppercase tracking-wider text-xs">{{ t('total') }}</span>
                  <span class="text-primary-600">RM{{ totalAmount }}</span>
                </div>
              </div>
              <div class="bg-primary-50 p-2 sm:p-3">
                <div class="flex justify-between text-xs sm:text-sm mb-1">
                  <span class="text-gray-600 font-light"
                    >{{ t('deposit') }} ({{
                      studioStore.studio?.settings?.deposit_percentage || 50
                    }}%)</span
                  >
                  <span class="font-medium text-primary-700"
                    >RM{{ depositAmount }}</span
                  >
                </div>
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-gray-600 font-light">{{ t('balance') }}</span>
                  <span class="font-medium text-gray-900"
                    >RM{{ balanceAmount }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Sidebar -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCartSidebar"
        @click="showCartSidebar = false"
        class="fixed inset-0 bg-black/50 z-50"
      >
        <Transition
          enter-active-class="transition-transform duration-300"
          leave-active-class="transition-transform duration-300"
          enter-from-class="translate-x-full"
          leave-to-class="translate-x-full"
        >
          <div
            v-if="showCartSidebar"
            @click.stop
            class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl p-4 sm:p-6 overflow-y-auto flex flex-col"
          >
            <!-- Cart Header -->
            <div
              class="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b"
              :style="{ borderColor: colorTheme.primary + '30' }"
            >
              <div>
                <h3 class="text-lg sm:text-xl font-light text-gray-900">{{ t('yourCart') }}</h3>
                <p class="text-xs sm:text-sm text-gray-500 mt-1 font-light">
                  {{ bookingStore.cartCount }}
                  {{ bookingStore.cartCount === 1 ? t('booking') : t('bookings') }}
                </p>
              </div>
              <button
                @click="showCartSidebar = false"
                class="p-2 active:bg-gray-100 transition-all border border-gray-200 active:scale-95 touch-manipulation min-w-[44px] min-h-[44px]"
              >
                <svg
                  class="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <!-- Cart Items -->
            <div
              v-if="bookingStore.cartCount === 0"
              class="flex flex-col items-center justify-center py-12"
            >
              <svg
                class="w-16 h-16 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p class="text-gray-500 text-center font-light">
                {{ t('cartEmptyMessage') }}
              </p>
              <button
                @click="showCartSidebar = false"
                class="mt-4 px-6 py-2 font-medium text-xs uppercase tracking-wider transition-all hover:shadow-lg"
                :style="{
                  backgroundColor: colorTheme.primary + '20',
                  color: colorTheme.secondary,
                }"
              >
                {{ t('startBooking') }}
              </button>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(item, index) in bookingStore.cartItems"
                :key="index"
                class="bg-white border p-4 hover:shadow-md transition-shadow"
                :style="{ borderColor: colorTheme.primary + '30' }"
              >
                <div class="flex gap-3">
                  <img
                    :src="item.theme.images[0]"
                    :alt="item.theme.name"
                    class="w-20 h-20 object-cover flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-base truncate text-gray-900">
                      {{ item.theme.name }}
                    </h4>
                    <div
                      class="flex items-center gap-2 mt-1 text-sm text-gray-600 font-light"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{{
                        format(new Date(item.booking_date), "dd MMM yyyy")
                      }}</span>
                    </div>
                    <div
                      class="flex items-center gap-2 mt-1 text-sm text-gray-600"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{{ item.start_time }} - {{ item.end_time }}</span>
                    </div>
                    <div
                      class="flex items-center gap-2 mt-1 text-sm text-gray-600"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>{{ item.pax_count }} pax</span>
                    </div>
                    <p
                      class="font-medium text-lg mt-2"
                      :style="{ color: colorTheme.secondary }"
                    >
                      RM{{ item.total_amount.toFixed(2) }}
                    </p>
                  </div>
                  <button
                    @click="removeCartItem(index)"
                    class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 transition-colors self-start"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <!-- Cart Footer -->
            <div
              v-if="bookingStore.cartCount > 0"
              class="mt-auto pt-4 sm:pt-6 border-t bg-white"
              :style="{ borderColor: colorTheme.primary + '30' }"
            >
              <div class="space-y-2 mb-3 sm:mb-4">
                <div
                  class="flex justify-between text-xs sm:text-sm text-gray-600 font-light"
                >
                  <span>{{ t('subtotal') }}</span>
                  <span class="font-medium"
                    >RM{{ bookingStore.cartTotal.toFixed(2) }}</span
                  >
                </div>
                <div
                  class="flex justify-between text-sm sm:text-base font-medium text-gray-900"
                >
                  <span class="text-[10px] sm:text-xs uppercase tracking-wider"
                    >{{ t('depositRequired') }}</span
                  >
                  <span :style="{ color: colorTheme.secondary }"
                    >RM{{ bookingStore.cartDepositTotal.toFixed(2) }}</span
                  >
                </div>
                <p class="text-xs text-gray-500 font-light">
                  {{ t('payNowBalanceAtStudio') }}
                </p>
              </div>
              <button
                @click="proceedToCheckout"
                class="w-full py-4 text-white font-medium text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 touch-manipulation min-h-[52px]"
                :style="{
                  backgroundColor: colorTheme.secondary,
                }"
              >
                {{ t('proceedToCheckout') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Modal Component -->
    <Modal
      :show="showModal"
      :title="modalConfig.title"
      :message="modalConfig.message"
      :type="modalConfig.type"
      :confirm-text="modalConfig.confirmText"
      :show-cancel="modalConfig.showCancel"
      :brand-color="colorTheme.primary"
      @close="showModal = false"
      @confirm="modalConfig.onConfirm"
    />
  </div>
</template>

<style scoped>
.card {
  @apply bg-white shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
