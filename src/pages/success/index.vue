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
  ChevronDown,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const studioStore = useStudioStore();
const { t } = useTranslation();

// Support multiple booking IDs (comma-separated for cart mode)
const bookingIdParam = route.params.bookingId as string;
const bookingIds = bookingIdParam.split(",").filter((id) => id.trim());
const bookings = ref<Booking[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Accordion Expand State (for multiple bookings)
const expandedIndex = ref<number | null>(0);

const toggleAccordion = (index: number) => {
  if (expandedIndex.value === index) {
    expandedIndex.value = null;
  } else {
    expandedIndex.value = index;
  }
};

// For backward compatibility - primary booking is the first one
const booking = computed(() => bookings.value[0] || null);
const isMultipleBookings = computed(() => bookings.value.length > 1);

// Fetch all booking data
onMounted(async () => {
  try {
    const fetchedBookings = await Promise.all(
      bookingIds.map((id) => getBookingById(id.trim()))
    );
    bookings.value = fetchedBookings.filter((b) => b !== null) as Booking[];
    if (bookings.value.length === 0) {
      error.value = t("bookingNotFound");
    }
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

// Helper functions for formatting (usable in v-for loop)
const getFormattedDate = (b: Booking) => {
  const dateStr = b.booking_date;
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "d MMMM yyyy");
  } catch {
    return dateStr;
  }
};

const getFormattedTime = (b: Booking) => {
  const formatTime = (time: string | undefined) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours || "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes || "00"} ${ampm}`;
  };
  return `${formatTime(b.start_time)} - ${formatTime(b.end_time)}`;
};

const getFormattedCreatedDate = (b: Booking) => {
  if (!b.created_at) return "";
  try {
    return format(new Date(b.created_at), "d MMM yyyy, h:mm a");
  } catch {
    return "";
  }
};

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
    class="min-h-screen relative text-gray-900 pb-20 flex flex-col justify-center"
    style="font-family: 'Bricolage Grotesque', sans-serif"
  >
    <!-- Content Wrapper -->
    <div class="relative z-20 max-w-2xl mx-auto w-full px-5">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex flex-col items-center justify-center space-y-4 py-12"
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
      <div v-else-if="error" class="text-center space-y-6 py-12">
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
        class="space-y-8 animate-scale-in max-w-md mx-auto w-full"
      >
        <!-- Success Icon -->
        <div class="text-center mt-6">
          <div
            class="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-full flex items-center justify-center mb-2"
          >
            <div
              class="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center"
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

        <!-- Booking IDs with Payment Status -->
        <!-- Single Booking -->
        <div
          v-if="!isMultipleBookings"
          class="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 text-center space-y-2"
        >
          <span
            class="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-1.5"
            >{{ t("bookingId") }}</span
          >
          <span
            class="font-mono text-lg sm:text-xl font-bold text-gray-900 tracking-wider break-all"
            >{{ booking?.booking_number }}</span
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

        <!-- Multiple Bookings (Cart Mode) -->
        <div
          v-else
          class="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 space-y-3"
        >
          <div class="text-center">
            <span
              class="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"
              >{{ bookings.length }} {{ t("bookings") }}</span
            >
          </div>

          <!-- Booking IDs with Payment Status -->
          <div class="space-y-2">
            <div
              v-for="(b, index) in bookings"
              :key="b.booking_number"
              class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xs text-gray-400 font-medium"
                  >{{ index + 1 }}.</span
                >
                <span
                  class="font-mono text-sm font-bold text-gray-900 truncate"
                  >{{ b.booking_number }}</span
                >
              </div>
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
                  b.payment_status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : b.payment_status === 'partially_paid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700',
                ]"
              >
                <CreditCard class="w-2.5 h-2.5" />
                {{
                  b.payment_status === "paid"
                    ? t("fullPayment")
                    : b.payment_status === "partially_paid"
                    ? t("depositPaid")
                    : t("pending")
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- Booking Details -->
        <div class="space-y-4">
          <div
            v-for="(b, bIndex) in bookings"
            :key="b.id"
            :class="[
              isMultipleBookings
                ? 'bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 shadow-sm'
                : 'space-y-3 sm:space-y-4',
            ]"
          >
            <!-- Accordion Header (Only for Multiple Bookings) -->
            <div
              v-if="isMultipleBookings"
              @click="toggleAccordion(bIndex)"
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 bg-gray-50/50 transition-colors"
              :class="{
                'border-b border-gray-100': expandedIndex === bIndex,
              }"
            >
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold text-gray-500 uppercase tracking-wider"
                    >{{ t("booking") }} {{ bIndex + 1 }}</span
                  >
                  <span class="font-mono text-xs text-gray-400">{{
                    b.booking_number
                  }}</span>
                </div>
                <h3 class="font-bold text-gray-900 text-sm leading-tight">
                  {{ b.theme?.name }}
                </h3>
              </div>
              <ChevronDown
                class="w-5 h-5 text-gray-400 transition-transform duration-300"
                :class="{ 'rotate-180': expandedIndex === bIndex }"
              />
            </div>

            <!-- Content Container (Animated) -->
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-in-out"
              :class="
                !isMultipleBookings || expandedIndex === bIndex
                  ? 'grid-rows-[1fr]'
                  : 'grid-rows-[0fr]'
              "
            >
              <div class="overflow-hidden min-h-0">
                <div
                  :class="
                    isMultipleBookings
                      ? 'p-4 space-y-3'
                      : 'space-y-3 sm:space-y-4'
                  "
                >
                  <!-- Theme -->
                  <div
                    v-if="b.theme"
                    class="flex gap-3 sm:gap-4 items-start bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100"
                  >
                    <img
                      v-if="b.theme.images?.[0]"
                      :src="b.theme.images[0]"
                      class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-base sm:text-lg leading-tight">
                        {{ b.theme.name }}
                      </h3>
                      <p
                        class="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1"
                      >
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
                        >{{ getFormattedDate(b) }}</span
                      >
                      <span
                        class="text-[9px] sm:text-[10px] text-gray-400 uppercase"
                        >{{ t("date") }}</span
                      >
                    </div>
                    <div
                      class="bg-gray-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1"
                    >
                      <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <span
                        class="text-xs sm:text-sm font-bold text-gray-900 break-words"
                        >{{ getFormattedTime(b) }}</span
                      >
                      <span
                        class="text-[9px] sm:text-[10px] text-gray-400 uppercase"
                        >{{ t("time") }}</span
                      >
                    </div>
                  </div>

                  <!-- Pax -->
                  <div
                    v-if="b.pax_count"
                    class="bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 flex items-center justify-between"
                  >
                    <div class="flex items-center gap-2 sm:gap-3">
                      <Users class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <span
                        class="text-xs sm:text-sm font-medium text-gray-600"
                        >{{ t("numberOfGuests") }}</span
                      >
                    </div>
                    <span class="font-bold text-sm sm:text-base text-gray-900"
                      >{{ b.pax_count }} {{ t("people") }}</span
                    >
                  </div>

                  <!-- Customer Details -->
                  <div
                    class="bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 space-y-2"
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
                    <div class="space-y-1.5 text-xs sm:text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-500">{{
                          t("name") || "Name"
                        }}</span>
                        <span class="font-medium text-gray-900">{{
                          b.customer_name
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">{{
                          t("phone") || "Phone"
                        }}</span>
                        <span class="font-medium text-gray-900">{{
                          b.customer_phone
                        }}</span>
                      </div>
                      <div v-if="b.customer_email" class="flex justify-between">
                        <span class="text-gray-500">{{
                          t("email") || "Email"
                        }}</span>
                        <span class="font-medium text-gray-900 break-all">{{
                          b.customer_email
                        }}</span>
                      </div>
                      <div
                        v-if="b.customer_notes"
                        class="pt-1.5 border-t border-gray-100"
                      >
                        <span class="text-gray-500 block mb-1">{{
                          t("notes") || "Notes"
                        }}</span>
                        <span class="text-gray-700 italic"
                          >"{{ b.customer_notes }}"</span
                        >
                      </div>
                    </div>
                    <div
                      v-if="getFormattedCreatedDate(b)"
                      class="text-[10px] text-gray-400 pt-2 border-t border-gray-100"
                    >
                      {{ t("bookedOn") || "Booked on" }}:
                      {{ getFormattedCreatedDate(b) }}
                    </div>
                  </div>

                  <!-- Payment Info -->
                  <div
                    v-if="b.total_amount"
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
                      <div
                        class="flex justify-between items-center text-xs sm:text-sm"
                      >
                        <span class="text-gray-500"
                          >{{ b.theme?.name }} ({{ b.theme?.base_pax || 1 }}
                          {{ t("people") }})</span
                        >
                        <span class="text-gray-900 font-medium">{{
                          formatAmount(b.base_price)
                        }}</span>
                      </div>

                      <!-- Extra Pax -->
                      <div
                        v-if="b.extra_pax_fee && b.extra_pax_fee > 0"
                        class="flex justify-between items-center text-xs sm:text-sm"
                      >
                        <span class="text-gray-500"
                          >{{ t("extra") }} ({{
                            b.pax_count - (b.theme?.base_pax || 1)
                          }}
                          {{ t("people") }})</span
                        >
                        <span class="text-gray-900 font-medium">{{
                          formatAmount(b.extra_pax_fee)
                        }}</span>
                      </div>

                      <!-- Special Pricing -->
                      <div
                        v-if="
                          b.special_pricing_applied &&
                          b.special_pricing_applied !== 0
                        "
                        class="flex justify-between items-center text-xs sm:text-sm"
                      >
                        <span class="text-gray-500 italic">
                          {{ b.special_pricing_label || t("specialPrice") }}
                        </span>
                        <span class="text-gray-900 font-medium">
                          {{ b.special_pricing_applied > 0 ? "+" : ""
                          }}{{ formatAmount(b.special_pricing_applied) }}
                        </span>
                      </div>

                      <!-- Addons -->
                      <div
                        v-for="addon in b.addons"
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
                        v-if="b.discount_amount && b.discount_amount > 0"
                        class="flex justify-between items-center text-xs sm:text-sm pt-1 border-t border-gray-100 mt-1"
                      >
                        <span class="text-red-500 font-medium italic">
                          {{ t("discount") }}
                          <span v-if="b.coupon_code"
                            >({{ b.coupon_code }})</span
                          >
                        </span>
                        <span class="text-red-500 font-medium">
                          -{{ formatAmount(b.discount_amount) }}
                        </span>
                      </div>
                    </div>

                    <div class="flex justify-between items-center">
                      <span
                        class="text-xs sm:text-sm font-medium text-gray-600"
                        >{{ t("total") }}</span
                      >
                      <span
                        class="font-bold text-base sm:text-lg text-gray-900"
                        >{{ formatAmount(b.total_amount) }}</span
                      >
                    </div>

                    <div
                      v-if="
                        b.deposit_amount && b.deposit_amount < b.total_amount
                      "
                      class="flex justify-between items-center text-[10px] sm:text-xs pt-2 border-t border-gray-200"
                    >
                      <span class="text-green-600 font-medium"
                        >{{ t("deposit") }} ({{
                          t("depositPaid") || "Paid"
                        }})</span
                      >
                      <span class="text-green-600 font-bold">{{
                        formatAmount(b.deposit_amount)
                      }}</span>
                    </div>

                    <div
                      v-if="b.balance_amount && b.balance_amount > 0"
                      class="flex justify-between items-center text-[10px] sm:text-xs text-amber-600"
                    >
                      <span class="font-medium"
                        >{{ t("balance") }} ({{
                          t("remaining") || "Remaining"
                        }})</span
                      >
                      <span class="font-bold">{{
                        formatAmount(b.balance_amount)
                      }}</span>
                    </div>

                    <!-- Transaction Fee Info -->
                    <div
                      v-if="b.chip_fee_paid && b.chip_fee_paid > 0"
                      class="flex justify-between items-center text-[10px] sm:text-xs text-gray-400 border-t border-gray-100 pt-2"
                    >
                      <span class="italic"
                        >↳
                        {{
                          t("inclTransactionFee") || "Incl. Transaction Fee"
                        }}</span
                      >
                      <span>{{ formatAmount(b.chip_fee_paid) }}</span>
                    </div>
                  </div>
                </div>
              </div>
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
  </div>
</template>

<style scoped>
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
