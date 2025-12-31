<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import {
  XCircle,
  Home,
  RefreshCcw,
  MessageCircle,
  ArrowRight,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const studioStore = useStudioStore();
const { t } = useTranslation();

// Get error type from query params
const errorType = computed(
  () => (route.query.error as string) || "payment_failed"
);

const errorTitle = computed(() => {
  switch (errorType.value) {
    case "payment_cancelled":
      return t("paymentCancelled") || "Payment Cancelled";
    case "payment_expired":
      return t("paymentExpired") || "Payment Expired";
    default:
      return t("paymentFailed") || "Payment Failed";
  }
});

const errorMessage = computed(() => {
  switch (errorType.value) {
    case "payment_cancelled":
      return (
        t("paymentCancelledMessage") ||
        "You cancelled the payment. Your booking has not been confirmed."
      );
    case "payment_expired":
      return (
        t("paymentExpiredMessage") ||
        "The payment session has expired. Please try again."
      );
    default:
      return (
        t("paymentFailedMessage") ||
        "We were unable to process your payment. Please try again."
      );
  }
});

const goHome = () => router.push("/");
const goToBooking = () => router.push("/booking");

const getWhatsAppUrl = computed(() => {
  if (!studioStore.studio?.whatsapp) return "";
  const phone = studioStore.studio.whatsapp.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Hi, saya menghadapi masalah dengan pembayaran tempahan saya. Boleh bantu?\n\n` +
      `Error: ${errorType.value}`
  );
  return `https://wa.me/${phone}?text=${message}`;
});
</script>

<template>
  <div
    class="min-h-screen bg-[#Fcf9f6] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
    style="font-family: 'Bricolage Grotesque', sans-serif"
  >
    <!-- Background Pattern -->
    <div
      class="absolute inset-0 opacity-[0.03] pointer-events-none"
      style="
        background-image: radial-gradient(#000 1px, transparent 1px);
        background-size: 24px 24px;
      "
    ></div>

    <!-- Error Content -->
    <div
      class="relative z-10 max-w-md w-full bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-6 sm:space-y-8 animate-scale-in"
    >
      <!-- Error Icon -->
      <div class="text-center">
        <div
          class="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-red-50 rounded-full flex items-center justify-center mb-2"
        >
          <div
            class="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse"
          >
            <XCircle class="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
          </div>
        </div>
      </div>

      <!-- Text Content -->
      <div class="text-center space-y-2 sm:space-y-3">
        <h1
          class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight"
        >
          {{ errorTitle }}
        </h1>
        <p class="text-sm sm:text-base text-gray-500 leading-relaxed px-2">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Info Box -->
      <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
        <p class="text-xs sm:text-sm text-amber-700 text-center">
          {{
            t("noChargeApplied") ||
            "No charges have been applied to your account."
          }}
        </p>
      </div>

      <!-- Actions -->
      <div class="space-y-2.5 sm:space-y-3 pt-2">
        <!-- Try Again Button -->
        <button
          @click="goToBooking"
          class="w-full bg-gray-900 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl hover:bg-black hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <RefreshCcw class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{{ t("tryAgain") || "Try Again" }}</span>
        </button>

        <!-- WhatsApp Button -->
        <a
          v-if="getWhatsAppUrl"
          :href="getWhatsAppUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
        >
          <MessageCircle class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{{ t("contactStudio") || "Contact Studio" }}</span>
          <ArrowRight
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1"
          />
        </a>

        <!-- Back to Home Button -->
        <button
          @click="goHome"
          class="w-full bg-white text-gray-700 border border-gray-200 font-bold uppercase tracking-widest text-[10px] sm:text-xs py-3 sm:py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span>{{ t("backToHome") }}</span>
          <Home
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-y-0.5"
          />
        </button>
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

.animate-scale-in {
  animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
