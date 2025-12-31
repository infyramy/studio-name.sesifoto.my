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
  ArrowRight,
  CreditCard,
  Receipt,
} from "lucide-vue-next";

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
    error.value = err instanceof Error ? err.message : t("bookingNotFound");
  } finally {
    isLoading.value = false;
  }
});

// Format amount from sen to RM
const formatAmount = (amountInSen: number | undefined): string => {
  if (!amountInSen) return "RM 0.00";
  const amountInRM = amountInSen / 100;
  return `RM ${amountInRM.toFixed(2)}`;
};

const formattedDate = computed(() => {
  if (!booking.value) return "";
  const dateStr = booking.value.booking_date;
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "d MMMM yyyy");
  } catch {
    return dateStr;
  }
});

const formattedTime = computed(() => {
  if (!booking.value) return "";
  return `${booking.value.start_time} - ${booking.value.end_time}`;
});

const paymentStatusLabel = computed(() => {
  if (!booking.value) return "";
  switch (booking.value.payment_status) {
    case "paid":
      return t("fullPayment") || "Full Payment";
    case "partially_paid":
      return t("depositPaid") || "Deposit Paid";
    case "pending":
      return t("paymentPending") || "Payment Pending";
    default:
      return booking.value.payment_status;
  }
});

const paymentStatusColor = computed(() => {
  if (!booking.value) return "bg-gray-100 text-gray-600";
  switch (booking.value.payment_status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "partially_paid":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
});

const goHome = () => router.push("/");

const getWhatsAppUrl = computed(() => {
  if (!studioStore.studio?.whatsapp || !booking.value) return "";
  const phone = studioStore.studio.whatsapp.replace(/[^0-9]/g, "");
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
  <div
    class="min-h-screen bg-[#Fcf9f6] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
    style="font-family: 'Playfair Display', serif"
  >
    <!-- Background Pattern (Optional) -->
    <div
      class="absolute inset-0 opacity-[0.03] pointer-events-none"
      style="
        background-image: radial-gradient(#000 1px, transparent 1px);
        background-size: 24px 24px;
      "
    ></div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="relative z-10 max-w-md w-full bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 text-center space-y-6 sm:space-y-8"
    >
      <div class="flex flex-col items-center space-y-4">
        <div
          class="w-14 h-14 sm:w-16 sm:h-16 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"
        ></div>
        <p class="text-sm sm:text-base text-gray-500">
          {{ t("loading") }}
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="relative z-10 max-w-md w-full bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 text-center space-y-6 sm:space-y-8"
    >
      <div class="space-y-4">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
          {{ t("error") }}
        </h1>
        <p class="text-sm sm:text-base text-gray-500">{{ error }}</p>
        <button
          @click="goHome"
          class="w-full bg-gray-900 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl hover:bg-black transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Home class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{{ t("backToHome") }}</span>
        </button>
      </div>
    </div>

    <!-- Success Content -->
    <div
      v-else-if="booking"
      class="relative z-10 max-w-md w-full bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-6 sm:space-y-8 animate-scale-in"
    >
      <!-- Success Icon -->
      <div class="text-center">
        <div
          class="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-full flex items-center justify-center mb-2"
        >
          <div
            class="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow"
          >
            <CheckCircle2 class="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </div>
      </div>

      <!-- Text Content -->
      <div class="text-center space-y-2 sm:space-y-3">
        <h1
          class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight"
        >
          {{ t("bookingSuccessful") }}
        </h1>
        <p class="text-sm sm:text-base text-gray-500 leading-relaxed px-2">
          {{ t("thankYouMessage") }}
        </p>
      </div>

      <!-- Booking ID with Payment Status -->
      <div
        class="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 text-center space-y-2"
      >
        <span
          class="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-1.5"
          >{{ t("bookingId") }}</span
        >
        <span
          class="font-mono text-lg sm:text-xl font-bold text-gray-900 tracking-wider break-all"
          >{{ booking.booking_number }}</span
        >
        <div class="pt-2">
          <span
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider',
              paymentStatusColor,
            ]"
          >
            <CreditCard class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {{ paymentStatusLabel }}
          </span>
        </div>
      </div>

      <!-- Booking Details -->
      <div class="space-y-3 sm:space-y-4">
        <!-- Theme -->
        <div
          v-if="booking.theme"
          class="flex gap-3 sm:gap-4 items-start bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100"
        >
          <img
            v-if="booking.theme.images?.[0]"
            :src="booking.theme.images[0]"
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-base sm:text-lg leading-tight">
              {{ booking.theme.name }}
            </h3>
            <p class="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              {{ studioStore.studio?.name }}
            </p>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3">
          <div
            class="bg-gray-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1"
          >
            <Calendar class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span
              class="text-xs sm:text-sm font-bold text-gray-900 break-words"
              >{{ formattedDate }}</span
            >
            <span class="text-[9px] sm:text-[10px] text-gray-400 uppercase">{{
              t("date")
            }}</span>
          </div>
          <div
            class="bg-gray-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1"
          >
            <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span
              class="text-xs sm:text-sm font-bold text-gray-900 break-words"
              >{{ formattedTime }}</span
            >
            <span class="text-[9px] sm:text-[10px] text-gray-400 uppercase">{{
              t("time")
            }}</span>
          </div>
        </div>

        <!-- Pax -->
        <div
          v-if="booking.pax_count"
          class="bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2 sm:gap-3">
            <Users class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span class="text-xs sm:text-sm font-medium text-gray-600">{{
              t("numberOfGuests")
            }}</span>
          </div>
          <span class="font-bold text-sm sm:text-base text-gray-900"
            >{{ booking.pax_count }} {{ t("people") }}</span
          >
        </div>

        <!-- Payment Info -->
        <div
          v-if="booking.total_amount"
          class="bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 space-y-3"
        >
          <div class="flex items-center gap-2 mb-1">
            <Receipt class="w-4 h-4 text-gray-400" />
            <span
              class="text-xs font-bold text-gray-500 uppercase tracking-wider"
              >{{ t("paymentSummary") || "Payment Summary" }}</span
            >
          </div>

          <!-- Payment Breakdown -->
          <div class="space-y-2 pb-2 border-b border-gray-200">
            <!-- Base Price -->
            <div class="flex justify-between items-center text-xs sm:text-sm">
              <span class="text-gray-500"
                >{{ booking.theme?.name }} ({{ booking.theme?.base_pax || 1 }}
                {{ t("people") }})</span
              >
              <span class="text-gray-900 font-medium">{{
                formatAmount(booking.base_price)
              }}</span>
            </div>

            <!-- Extra Pax -->
            <div
              v-if="booking.extra_pax_fee && booking.extra_pax_fee > 0"
              class="flex justify-between items-center text-xs sm:text-sm"
            >
              <span class="text-gray-500"
                >{{ t("extra") }} ({{
                  booking.pax_count - (booking.theme?.base_pax || 1)
                }}
                {{ t("people") }})</span
              >
              <span class="text-gray-900 font-medium">{{
                formatAmount(booking.extra_pax_fee)
              }}</span>
            </div>

            <!-- Special Pricing -->
            <div
              v-if="
                booking.special_pricing_applied &&
                booking.special_pricing_applied !== 0
              "
              class="flex justify-between items-center text-xs sm:text-sm"
            >
              <span class="text-gray-500 italic">
                {{ booking.special_pricing_label || t("specialPrice") }}
              </span>
              <span class="text-gray-900 font-medium">
                {{ booking.special_pricing_applied > 0 ? "+" : ""
                }}{{ formatAmount(booking.special_pricing_applied) }}
              </span>
            </div>

            <!-- Addons -->
            <div
              v-for="addon in booking.addons"
              :key="addon.addon.name"
              class="flex justify-between items-center text-xs sm:text-sm"
            >
              <span class="text-gray-500"
                >{{ addon.addon.name }} x {{ addon.quantity }}</span
              >
              <span class="text-gray-900 font-medium">{{
                formatAmount(addon.price_at_booking)
              }}</span>
            </div>

            <!-- Discount -->
            <div
              v-if="booking.discount_amount && booking.discount_amount > 0"
              class="flex justify-between items-center text-xs sm:text-sm pt-1 border-t border-gray-100 mt-1"
            >
              <span class="text-red-500 font-medium italic">
                {{ t("discount") }}
                <span v-if="booking.coupon_code"
                  >({{ booking.coupon_code }})</span
                >
              </span>
              <span class="text-red-500 font-medium">
                -{{ formatAmount(booking.discount_amount) }}
              </span>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-xs sm:text-sm font-medium text-gray-600">{{
              t("total")
            }}</span>
            <span class="font-bold text-base sm:text-lg text-gray-900">{{
              formatAmount(booking.total_amount)
            }}</span>
          </div>

          <div
            v-if="
              booking.deposit_amount &&
              booking.deposit_amount < booking.total_amount
            "
            class="flex justify-between items-center text-[10px] sm:text-xs pt-2 border-t border-gray-200"
          >
            <span class="text-green-600 font-medium"
              >{{ t("deposit") }} ({{ t("depositPaid") || "Paid" }})</span
            >
            <span class="text-green-600 font-bold">{{
              formatAmount(booking.deposit_amount)
            }}</span>
          </div>

          <div
            v-if="booking.balance_amount && booking.balance_amount > 0"
            class="flex justify-between items-center text-[10px] sm:text-xs text-amber-600"
          >
            <span class="font-medium"
              >{{ t("balance") }} ({{ t("remaining") || "Remaining" }})</span
            >
            <span class="font-bold">{{
              formatAmount(booking.balance_amount)
            }}</span>
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
          class="w-full bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
        >
          <MessageCircle class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{{ t("getDetailsInWhatsApp") }}</span>
          <ArrowRight
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1"
          />
        </a>

        <!-- Back to Home Button -->
        <button
          @click="goHome"
          class="w-full bg-gray-900 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl hover:bg-black hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span>{{ t("backToHome") }}</span>
          <Home
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-y-0.5"
          />
        </button>

        <!-- Info Text -->
        <p
          class="text-[10px] sm:text-xs text-gray-400 mt-3 sm:mt-4 text-center px-2"
        >
          {{ t("checkWhatsAppForConfirmation") }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap");

.font-serif {
  font-family: "Playfair Display", serif;
}

.font-sans {
  font-family: "Bricolage Grotesque", sans-serif;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(-5%);
  }
  50% {
    transform: translateY(5%);
  }
}

.animate-scale-in {
  animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-bounce-slow {
  animation: bounce-slow 2s infinite ease-in-out;
}
</style>
