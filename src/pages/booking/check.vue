<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { api } from "@/services/api";
import { format } from "date-fns";
import { useTranslation } from "@/composables/useTranslation";
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  CreditCard,
  Receipt,
} from "lucide-vue-next";

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

// Background Images Setup (use studio images if available)
const backgroundImages = computed(() => {
  // Use studio theme images if available
  const studioImages = studioStore.themes
    ?.slice(0, 3)
    .map((theme) => theme.images?.[0])
    .filter(Boolean);

  if (studioImages && studioImages.length > 0) {
    return studioImages as string[];
  }

  // Fallback images
  return [
    "https://i.postimg.cc/t4wCcRhG/untitled-10.jpg",
    "https://i.postimg.cc/HsLYs8zy/untitled-19.jpg",
    "https://i.postimg.cc/T1NXWQ0R/untitled-180.jpg",
  ];
});

const currentImageIndex = ref(0);
let intervalId: any;

onMounted(() => {
  intervalId = setInterval(() => {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % backgroundImages.value.length;
  }, 5000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Form State
const bookingId = ref("");
const phone = ref("");
const isLoading = ref(false);
const error = ref("");
const foundBooking = ref<any>(null);

// Country codes for phone input
const countryCodes = [
  { code: "+60", label: "MY", flag: "🇲🇾" },
  { code: "+65", label: "SG", flag: "🇸🇬" },
];
const selectedCountryCode = ref("+60");
const localPhone = ref("");
const isCountryDropdownOpen = ref(false);
const countryDropdownRef = ref<HTMLElement | null>(null);

function toggleCountryDropdown(event: Event) {
  event.stopPropagation();
  isCountryDropdownOpen.value = !isCountryDropdownOpen.value;
}

function selectCountry(code: string) {
  selectedCountryCode.value = code;
  isCountryDropdownOpen.value = false;
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener("click", () => {
    isCountryDropdownOpen.value = false;
  });
});

// Sync localPhone/countryCode TO phone
import { watch } from "vue"; // Ensure watch is imported if not already, though it is in line 2
watch([selectedCountryCode, localPhone], () => {
  let cleanLocal = localPhone.value.trim().replace(/[\s-]/g, "");

  // Smart Clean for storage too
  if (cleanLocal.startsWith("0")) cleanLocal = cleanLocal.substring(1);
  if (selectedCountryCode.value === "+60") {
    if (cleanLocal.startsWith("60")) cleanLocal = cleanLocal.substring(2);
    else if (cleanLocal.startsWith("+60")) cleanLocal = cleanLocal.substring(3);
  } else if (selectedCountryCode.value === "+65") {
    if (cleanLocal.startsWith("65")) cleanLocal = cleanLocal.substring(2);
    else if (cleanLocal.startsWith("+65")) cleanLocal = cleanLocal.substring(3);
  }

  phone.value = `${selectedCountryCode.value}${cleanLocal}`;
  // Clear error if related to phone
  if (error.value && error.value.includes(t("phoneNumber"))) {
    error.value = "";
  }
});

// Sync phone FROM existing value
watch(
  phone,
  (newVal) => {
    if (!newVal) {
      localPhone.value = "";
      return;
    }
    // Avoid infinite loop
    let cleanLocal = localPhone.value.trim();
    if (cleanLocal.startsWith("0")) cleanLocal = cleanLocal.substring(1);
    // Note: We don't strip country code here as we want to detect it for selection

    if (newVal === `${selectedCountryCode.value}${cleanLocal}`) return;

    if (newVal.startsWith("+60")) {
      selectedCountryCode.value = "+60";
      localPhone.value = newVal.slice(3);
    } else if (newVal.startsWith("+65")) {
      selectedCountryCode.value = "+65";
      localPhone.value = newVal.slice(3);
    } else {
      localPhone.value = newVal;
    }
  },
  { immediate: true },
);

const validateForm = () => {
  error.value = "";

  if (!bookingId.value.trim()) {
    error.value = t("bookingId") + " " + t("required").toLowerCase();
    return false;
  }

  if (!localPhone.value || localPhone.value.trim() === "") {
    error.value = t("phoneNumber") + " " + t("required").toLowerCase();
    return false;
  }

  // Smart Cleaning Logic
  let cleanLocal = localPhone.value.replace(/[\s-]/g, "");

  if (cleanLocal.startsWith("0")) cleanLocal = cleanLocal.substring(1);

  if (selectedCountryCode.value === "+60") {
    if (cleanLocal.startsWith("60")) cleanLocal = cleanLocal.substring(2);
    else if (cleanLocal.startsWith("+60")) cleanLocal = cleanLocal.substring(3);
  } else if (selectedCountryCode.value === "+65") {
    if (cleanLocal.startsWith("65")) cleanLocal = cleanLocal.substring(2);
    else if (cleanLocal.startsWith("+65")) cleanLocal = cleanLocal.substring(3);
  }

  if (selectedCountryCode.value === "+60") {
    // Malaysian format: 9-10 digits (excluding +60), starts with 1
    const myRegex = /^1[0-9]-*[0-9]{7,8}$/;
    if (!myRegex.test(cleanLocal)) {
      error.value = t("pleaseEnterValidPhone");
      return false;
    }
  } else if (selectedCountryCode.value === "+65") {
    // Singapore format: 8 digits, starts with 3, 5, 6, 8, 9
    const sgRegex = /^[35689][0-9]{7}$/;
    if (!sgRegex.test(cleanLocal)) {
      error.value = t("pleaseEnterValidPhone");
      return false;
    }
  }

  return true;
};

const searchBooking = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  error.value = "";
  foundBooking.value = null;

  try {
    // Normalize phone number
    const normalizedPhone = phone.value.replace(/[\s-]/g, "");

    // Call API to lookup booking (api.ts already transforms to snake_case)
    const booking = await api.lookupBooking(
      bookingId.value.trim(),
      normalizedPhone,
    );

    if (!booking) {
      error.value = t("bookingNotFoundCheckDetails");
      return;
    }

    foundBooking.value = booking;
  } catch (err) {
    error.value = t("bookingNotFoundCheckDetails");
  } finally {
    isLoading.value = false;
  }
};

const formattedDate = computed(() => {
  if (!foundBooking.value?.booking_date) return "";
  try {
    return format(new Date(foundBooking.value.booking_date), "d MMMM yyyy");
  } catch {
    return foundBooking.value.booking_date;
  }
});

const formattedTime = computed(() => {
  if (!foundBooking.value) return "";
  const formatTime = (time: string | undefined) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours || "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes || "00"} ${ampm}`;
  };
  return `${formatTime(foundBooking.value.start_time)} - ${formatTime(
    foundBooking.value.end_time,
  )}`;
});

const formattedCreatedDate = computed(() => {
  if (!foundBooking.value?.created_at) return "";
  try {
    return format(
      new Date(foundBooking.value.created_at),
      "d MMM yyyy, h:mm a",
    );
  } catch {
    return "";
  }
});

// Format amount from sen to RM
const formatAmount = (amountInSen: number | undefined): string => {
  if (!amountInSen) return "RM 0.00";
  const amountInRM = amountInSen / 100;
  return `RM ${amountInRM.toFixed(2)}`;
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "confirmed":
      return {
        text: t("confirmed"),
        class: "bg-green-100 text-green-800 border-green-200",
      };
    case "pending_payment":
    case "cart_hold":
      return {
        text: t("paymentPending"),
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    case "cancelled":
      return {
        text: t("cancelled"),
        class: "bg-red-100 text-red-800 border-red-200",
      };
    case "completed":
      return {
        text: t("completed"),
        class: "bg-blue-100 text-blue-800 border-blue-200",
      };
    default:
      return {
        text: t("pending"),
        class: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
};

const getPaymentStatusBadge = (status?: string) => {
  switch (status) {
    case "paid":
      return {
        text: t("fullPayment"),
        class: "bg-green-100 text-green-700",
      };
    case "partially_paid":
      return {
        text: t("depositPaid"),
        class: "bg-blue-100 text-blue-700",
      };
    case "pending":
      return {
        text: t("paymentPending"),
        class: "bg-amber-100 text-amber-700",
      };
    default:
      return {
        text: t("pending"),
        class: "bg-gray-100 text-gray-600",
      };
  }
};

const reset = () => {
  bookingId.value = "";
  phone.value = "";
  foundBooking.value = null;
  error.value = "";
};

const getWhatsAppUrl = computed(() => {
  if (!studioStore.studio?.whatsapp || !foundBooking.value) return "";
  const phoneNum = studioStore.studio.whatsapp.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Hi, saya ingin bertanya tentang tempahan saya.\n\n` +
      `ID Tempahan: ${foundBooking.value.booking_number}\n` +
      `Nama: ${foundBooking.value.customer_name}`,
  );
  return `https://wa.me/${phoneNum}?text=${message}`;
});

const brandColor = computed(() => studioStore.studio?.brand_color || "#000000");
</script>

<template>
  <div
    class="min-h-screen relative text-gray-900 pb-20"
    style="font-family: &quot;Bricolage Grotesque&quot;, sans-serif"
  >
    <!-- Content Wrapper -->
    <div class="relative z-20 max-w-2xl mx-auto">
      <!-- Header -->
      <header class="sticky top-0 z-40">
        <div
          class="bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between transition-all duration-300"
        >
          <!-- Left: Back & Title -->
          <div class="flex items-center gap-4">
            <button
              @click="router.back()"
              class="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-gray-900"
            >
              <ArrowLeft class="w-6 h-6 stroke-[2.5]" />
            </button>
            <h1 class="text-xl font-bold tracking-tight text-gray-900">
              {{ t("checkBooking") }}
            </h1>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main
        class="relative z-20 px-5 w-full animate-slide-up flex flex-col justify-center min-h-[calc(100vh-140px)]"
      >
        <!-- Search Form State -->
        <div v-if="!foundBooking" class="space-y-8 w-full max-w-md mx-auto">
          <div class="text-center space-y-2">
            <div
              class="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-gray-100 mb-4"
            >
              <Search class="w-8 h-8 text-gray-400" />
            </div>
            <h2 class="text-2xl font-bold tracking-tight">
              {{ t("checkYourBooking") }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ t("enterBookingDetailsToCheckStatus") }}
            </p>
          </div>

          <form @submit.prevent="searchBooking" class="space-y-8">
            <!-- Booking ID Input -->
            <div class="relative group">
              <input
                type="text"
                v-model="bookingId"
                id="bookingId"
                required
                class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent border-gray-200 focus:border-gray-900 uppercase font-medium"
                :placeholder="t('enterBookingId')"
              />
              <label
                for="bookingId"
                class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900"
              >
                {{ t("bookingId") }}
              </label>
              <p class="mt-1 text-[10px] text-gray-400">
                {{ t("bookingIdSentToWhatsApp") }}
              </p>
            </div>

            <!-- Phone Number Input with Country Code -->
            <div class="flex gap-3">
              <div class="relative w-24 group" ref="countryDropdownRef">
                <button
                  type="button"
                  @click="toggleCountryDropdown"
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors border-gray-200 focus:border-gray-900 flex items-center justify-between gap-1"
                >
                  <span class="flex items-center gap-2">
                    <span>{{
                      countryCodes.find((c) => c.code === selectedCountryCode)
                        ?.flag
                    }}</span>
                    <span>{{ selectedCountryCode }}</span>
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-gray-400"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <!-- Custom Dropdown Menu -->
                <div
                  v-if="isCountryDropdownOpen"
                  class="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-b-xl z-50 overflow-hidden mt-1 animate-fade-in-up"
                >
                  <button
                    v-for="country in countryCodes"
                    :key="country.code"
                    type="button"
                    @click="selectCountry(country.code)"
                    class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span class="text-xl">{{ country.flag }}</span>
                    <span class="font-medium text-gray-700">{{
                      country.code
                    }}</span>
                  </button>
                </div>

                <label
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  {{ t("code") || "Code" }}
                </label>
              </div>

              <div class="relative group flex-1">
                <input
                  type="tel"
                  v-model="localPhone"
                  id="phone"
                  required
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent border-gray-200 focus:border-gray-900 font-medium"
                  :placeholder="t('enterPhone')"
                />
                <label
                  for="phone"
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900"
                >
                  {{ t("phoneNumber") }}
                </label>
              </div>
            </div>

            <div
              v-if="error"
              class="bg-red-50 text-red-600 text-xs font-medium p-3 rounded-xl flex items-start gap-2"
            >
              <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{{ error }}</span>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isLoading">{{ t("checkNow") }}</span>
              <span v-else>{{ t("checking") }}</span>
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            </button>
          </form>
        </div>

        <!-- Result State -->
        <div v-else class="space-y-6 animate-fade-in">
          <!-- Success Header -->
          <div
            class="text-center border-b border-dashed border-gray-200 pb-6 mt-6"
          >
            <div
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border"
              :class="getStatusBadge(foundBooking.booking_status).class"
            >
              {{ getStatusBadge(foundBooking.booking_status).text }}
            </div>
            <h2 class="text-3xl font-bold tracking-tight mb-1">
              {{ foundBooking.booking_number }}
            </h2>
            <p class="text-sm text-gray-500">{{ t("bookingId") }}</p>
          </div>

          <!-- Details -->
          <div class="space-y-4">
            <!-- Theme -->
            <div
              class="flex gap-4 items-start bg-white p-4 rounded-2xl border border-gray-100"
            >
              <img
                v-if="foundBooking.theme?.images?.[0]"
                :src="foundBooking.theme.images[0]"
                class="w-16 h-16 rounded-lg object-cover"
              />
              <div
                v-else
                class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"
              >
                <Calendar class="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">
                  {{ foundBooking.theme?.name }}
                </h3>
                <p class="text-xs text-gray-500 mt-1">
                  {{ studioStore.studio?.name }}
                </p>
              </div>
            </div>

            <!-- Date & Time -->
            <div class="grid grid-cols-2 gap-3">
              <div
                class="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1"
              >
                <Calendar class="w-5 h-5 text-gray-400" />
                <span class="text-sm font-bold text-gray-900">{{
                  formattedDate
                }}</span>
                <span class="text-[10px] text-gray-400 uppercase">{{
                  t("date")
                }}</span>
              </div>
              <div
                class="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1"
              >
                <Clock class="w-5 h-5 text-gray-400" />
                <span class="text-sm font-bold text-gray-900">{{
                  formattedTime
                }}</span>
                <span class="text-[10px] text-gray-400 uppercase">{{
                  t("time")
                }}</span>
              </div>
            </div>

            <!-- Pax -->
            <div
              v-if="foundBooking.pax_count"
              class="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <Users class="w-5 h-5 text-gray-400" />
                <span class="text-sm font-medium text-gray-600">{{
                  t("numberOfGuests")
                }}</span>
              </div>
              <span class="font-bold text-gray-900"
                >{{ foundBooking.pax_count }} {{ t("people") }}</span
              >
            </div>

            <!-- Customer Details -->
            <div
              class="bg-white p-4 rounded-2xl border border-gray-100 space-y-2"
            >
              <div class="flex items-center gap-2 mb-2">
                <svg
                  class="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span
                  class="text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >{{ t("customerDetails") || "Customer Details" }}</span
                >
              </div>
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">{{ t("name") || "Name" }}</span>
                  <span class="font-medium text-gray-900">{{
                    foundBooking.customer_name
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">{{ t("phone") || "Phone" }}</span>
                  <span class="font-medium text-gray-900">{{
                    foundBooking.customer_phone
                  }}</span>
                </div>
                <div
                  v-if="foundBooking.customer_email"
                  class="flex justify-between"
                >
                  <span class="text-gray-500">{{ t("email") || "Email" }}</span>
                  <span class="font-medium text-gray-900 break-all">{{
                    foundBooking.customer_email
                  }}</span>
                </div>
                <!-- <div
                  v-if="foundBooking.customer_notes"
                  class="pt-1.5 border-t border-gray-50"
                >
                  <span class="text-gray-500 block mb-1">{{
                    t("notes") || "Notes"
                  }}</span>
                  <span class="text-gray-700 italic"
                    >"{{ foundBooking.customer_notes }}"</span
                  >
                </div> -->
              </div>
              <div
                v-if="formattedCreatedDate"
                class="text-[10px] text-gray-400 pt-2 border-t border-gray-50"
              >
                {{ t("bookedOn") || "Booked on" }}: {{ formattedCreatedDate }}
              </div>
            </div>

            <!-- Payment Info -->
            <div
              v-if="foundBooking.total_amount !== undefined"
              class="bg-white p-4 rounded-2xl border border-gray-100 space-y-3"
            >
              <div class="flex items-center gap-2 mb-2">
                <Receipt class="w-4 h-4 text-gray-400" />
                <span
                  class="text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >{{ t("paymentSummary") }}</span
                >
              </div>

              <!-- Payment Breakdown -->
              <div class="space-y-2 pb-3 border-b border-gray-50">
                <!-- Base Price -->
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-500"
                    >{{ foundBooking.theme?.name }} ({{
                      foundBooking.theme?.base_pax || 1
                    }}
                    {{ t("people") }})</span
                  >
                  <span class="text-gray-900 font-medium">{{
                    formatAmount(foundBooking.base_price)
                  }}</span>
                </div>

                <!-- Extra Pax -->
                <div
                  v-if="
                    foundBooking.extra_pax_fee && foundBooking.extra_pax_fee > 0
                  "
                  class="flex justify-between items-center text-sm"
                >
                  <span class="text-gray-500"
                    >{{ t("extraPax") }} ({{
                      foundBooking.pax_count -
                      (foundBooking.theme?.base_pax || 1)
                    }}
                    {{ t("people") }})</span
                  >
                  <span class="text-gray-900 font-medium">{{
                    formatAmount(foundBooking.extra_pax_fee)
                  }}</span>
                </div>

                <!-- Special Pricing -->
                <div
                  v-if="
                    foundBooking.special_pricing_applied &&
                    foundBooking.special_pricing_applied !== 0
                  "
                  class="flex justify-between items-center text-sm"
                >
                  <span class="text-gray-500 italic">
                    {{
                      foundBooking.special_pricing_label || t("specialPrice")
                    }}
                  </span>
                  <span class="text-gray-900 font-medium">
                    {{ foundBooking.special_pricing_applied > 0 ? "+" : ""
                    }}{{ formatAmount(foundBooking.special_pricing_applied) }}
                  </span>
                </div>

                <!-- Addons -->
                <div
                  v-for="addon in foundBooking.addons"
                  :key="addon.addon?.name || addon.name"
                  class="flex justify-between items-center text-sm"
                >
                  <span class="text-gray-500"
                    >{{ addon.addon?.name || addon.name }} x
                    {{ addon.quantity }}</span
                  >
                  <span class="text-gray-900 font-medium">{{
                    formatAmount(addon.price_at_booking || addon.price)
                  }}</span>
                </div>

                <!-- Discount / Coupon -->
                <div
                  v-if="
                    foundBooking.discount_amount &&
                    foundBooking.discount_amount > 0
                  "
                  class="flex justify-between items-center text-sm pt-1 border-t border-gray-50 mt-1"
                >
                  <span class="text-red-500 font-medium italic">
                    {{ t("discount") }}
                    <span v-if="foundBooking.coupon_code"
                      >({{ foundBooking.coupon_code }})</span
                    >
                  </span>
                  <span class="text-red-500 font-medium">
                    -{{ formatAmount(foundBooking.discount_amount) }}
                  </span>
                </div>
              </div>

              <!-- Payment Status Badge -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ t("status") }}</span>
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                    getPaymentStatusBadge(foundBooking.payment_status).class,
                  ]"
                >
                  <CreditCard class="w-3 h-3" />
                  {{ getPaymentStatusBadge(foundBooking.payment_status).text }}
                </span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-base font-bold text-gray-900">{{
                  t("total")
                }}</span>
                <span class="text-base font-bold text-gray-900">{{
                  formatAmount(foundBooking.total_amount)
                }}</span>
              </div>

              <div
                v-if="
                  foundBooking.deposit_amount &&
                  foundBooking.deposit_amount < foundBooking.total_amount
                "
                class="flex justify-between items-center text-xs pt-2 border-t border-gray-100"
              >
                <span class="text-green-600"
                  >{{ t("deposit") }} ({{ t("depositPaid") }})</span
                >
                <span class="text-green-600 font-medium">{{
                  formatAmount(foundBooking.deposit_amount)
                }}</span>
              </div>

              <div
                v-if="
                  foundBooking.balance_amount && foundBooking.balance_amount > 0
                "
                class="flex justify-between items-center text-xs text-amber-600"
              >
                <span>{{ t("balance") }} ({{ t("remaining") }})</span>
                <span class="font-medium">{{
                  formatAmount(foundBooking.balance_amount)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-4 space-y-3">
            <a
              v-if="getWhatsAppUrl"
              :href="getWhatsAppUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full bg-green-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-green-600 transition-all flex items-center justify-center gap-2 border border-green-100"
            >
              <MessageCircle class="w-4 h-4" />
              {{ t("contactStudio") }}
            </a>

            <button
              @click="reset"
              class="w-full bg-white border border-gray-200 text-gray-500 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              {{ t("checkAnother") }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
@keyframes ken-burns {
  0% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1.15);
  }
}

.animate-ken-burns {
  animation: ken-burns 20s linear infinite alternate;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}
</style>
