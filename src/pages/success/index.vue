<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { api } from "@/services/api";
import { format } from "date-fns";
import type { Booking } from "@/types";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  Users,
  Home,
  MessageCircle,
  CreditCard,
  Receipt,
  ChevronDown,
  Copy,
  Check,
  Camera,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const studioStore = useStudioStore();
const { t } = useTranslation();

const bookingIdParam = route.params.bookingId as string;
const bookingIds = bookingIdParam.split(",").filter((id) => id.trim());
const bookings = ref<Booking[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const expandedIndex = ref<number | null>(0);
const copiedId = ref(false);
const confettiFired = ref(false);

const toggleAccordion = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index;
};

const booking = computed(() => bookings.value[0] || null);
const isMultipleBookings = computed(() => bookings.value.length > 1);

const hasAnyPendingPayment = (bookingList: Booking[]) => {
  return bookingList.some((b) => b.payment_status === "pending");
};

const isCelebratoryPayment = (b: Booking | null) => {
  if (!b) return false;
  return b.payment_status === "paid" || b.payment_status === "partially_paid";
};

const fetchBookingsWithRetry = async (
  ids: string[],
  maxRetries: number = 5,
  delayMs: number = 1500,
): Promise<Booking[]> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const validBookings = await api.getBookingsBatch(ids);

    if (validBookings.length <= 1 || !hasAnyPendingPayment(validBookings)) {
      return validBookings;
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } else {
      return validBookings;
    }
  }

  return await api.getBookingsBatch(ids);
};

function fireConfetti() {
  if (confettiFired.value) return;
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  confettiFired.value = true;
  const colors = ["#000000", "#3a3a3c", "#34c759", "#f2f2f7", "#ffffff"];

  confetti({
    particleCount: 80,
    spread: 65,
    startVelocity: 34,
    origin: { x: 0.5, y: 0.12 },
    colors,
    disableForReducedMotion: true,
  });

  window.setTimeout(() => {
    confetti({
      particleCount: 36,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 36,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
  }, 200);
}

onMounted(async () => {
  try {
    bookings.value = await fetchBookingsWithRetry(bookingIds);
    if (bookings.value.length === 0) {
      error.value = t("bookingNotFound");
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("bookingNotFound");
  } finally {
    isLoading.value = false;
  }
});

watch(
  () => [isLoading.value, booking.value?.payment_status] as const,
  async ([loading, status]) => {
    if (loading || !status) return;
    if (!isCelebratoryPayment(booking.value)) return;
    await nextTick();
    fireConfetti();
  },
);

const formatAmount = (amountInSen: number | undefined): string => {
  if (!amountInSen) return "RM 0.00";
  return `RM ${(amountInSen / 100).toFixed(2)}`;
};

const getFormattedDate = (b: Booking) => {
  const dateStr = b.booking_date;
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "d MMM yyyy");
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
  return `${formatTime(b.start_time)} – ${formatTime(b.end_time)}`;
};

const getPaymentStatusLabel = (b: Booking | null) => {
  if (!b) return "";
  switch (b.payment_status) {
    case "paid":
      return t("fullPayment");
    case "partially_paid":
      return t("depositPaid");
    case "pending":
      return t("paymentPending");
    default:
      return b.payment_status;
  }
};

const getPaymentStatusColor = (b: Booking | null) => {
  if (!b) return "bg-gray-100 text-gray-600";
  switch (b.payment_status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "partially_paid":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const goHome = () => router.push("/");

const copyBookingNumber = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    copiedId.value = true;
    window.setTimeout(() => {
      copiedId.value = false;
    }, 1800);
  } catch {
    // ignore
  }
};

const getWhatsAppUrl = computed(() => {
  if (!studioStore.studio?.whatsapp || !booking.value) return "";
  const phone = studioStore.studio.whatsapp.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Hi, saya ingin mendapatkan butiran tempahan saya.\n\n` +
      `ID Tempahan: ${booking.value.booking_number}\n` +
      `Nama: ${booking.value.customer_name}\n` +
      `Telefon: ${booking.value.customer_phone}`,
  );
  return `https://wa.me/${phone}?text=${message}`;
});
</script>

<template>
  <div class="bk-page bk-page--sticky-cta">
    <div class="bk-shell flex flex-1 flex-col pt-6 sm:pt-10">
      <div
        v-if="isLoading"
        class="flex flex-col items-center justify-center gap-3 py-20"
        role="status"
        aria-live="polite"
      >
        <Loader2 class="h-8 w-8 animate-spin text-gray-900" />
        <p class="text-sm text-gray-500">{{ t("loading") }}</p>
      </div>

      <div v-else-if="error" class="space-y-5 py-10 text-center">
        <h1 class="text-xl font-semibold text-gray-900">{{ t("error") }}</h1>
        <p class="text-sm text-gray-500">{{ error }}</p>
        <button type="button" class="bk-cta-primary" @click="goHome">
          <Home class="h-4 w-4" />
          {{ t("backToHome") }}
        </button>
      </div>

      <div
        v-else-if="booking"
        class="success-content w-full space-y-6"
      >
        <header class="space-y-3 text-center">
          <p class="text-sm text-gray-500">
            {{ studioStore.studio?.name }}
          </p>

          <div class="success-check bk-success-mark mx-auto">
            <div class="bk-success-mark-inner">
              <CheckCircle2 class="h-6 w-6" />
            </div>
          </div>

          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-gray-900 sm:text-2xl">
              {{ t("bookingSuccessful") }}
            </h1>
            <p class="mx-auto max-w-sm text-sm text-gray-500">
              {{ t("thankYouMessage") }}
            </p>
            <p
              v-if="isMultipleBookings"
              class="text-sm text-gray-500"
            >
              {{ bookings.length }} {{ t("sessionsBooked") }}
            </p>
          </div>
        </header>

        <section
          v-if="!isMultipleBookings"
          class="space-y-2 border-y border-gray-100 py-4 text-center"
        >
          <p class="text-sm text-gray-500">{{ t("bookingId") }}</p>
          <button
            type="button"
            class="mx-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-2 transition-colors hover:bg-gray-50"
            @click="copyBookingNumber(booking.booking_number)"
          >
            <span class="break-all font-mono text-base font-medium text-gray-900">
              {{ booking.booking_number }}
            </span>
            <Check v-if="copiedId" class="h-4 w-4 shrink-0 text-green-600" />
            <Copy v-else class="h-4 w-4 shrink-0 text-gray-400" />
          </button>
          <p
            v-if="copiedId"
            class="text-xs font-medium capitalize text-green-600"
          >
            {{ t("bookingIdCopied") }}
          </p>
          <div class="pt-1">
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                getPaymentStatusColor(booking),
              ]"
            >
              {{ getPaymentStatusLabel(booking) }}
            </span>
          </div>
        </section>

        <div class="space-y-4">
          <article
            v-for="(b, bIndex) in bookings"
            :key="b.id"
            :class="
              isMultipleBookings
                ? 'border-y border-gray-100'
                : 'space-y-4'
            "
          >
            <button
              v-if="isMultipleBookings"
              type="button"
              class="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left"
              :aria-expanded="expandedIndex === bIndex"
              @click="toggleAccordion(bIndex)"
            >
              <div class="min-w-0 space-y-0.5">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-xs font-medium capitalize text-gray-500">
                    {{ t("booking") }} {{ bIndex + 1 }}
                  </span>
                  <span class="font-mono text-xs text-gray-400">{{
                    b.booking_number
                  }}</span>
                  <span
                    :class="[
                      'inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium capitalize',
                      getPaymentStatusColor(b),
                    ]"
                  >
                    {{ getPaymentStatusLabel(b) }}
                  </span>
                </div>
                <h3 class="truncate text-sm font-medium text-gray-900">
                  {{ b.theme?.name }}
                </h3>
              </div>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300"
                :class="{ 'rotate-180': expandedIndex === bIndex }"
              />
            </button>

            <div
              class="grid transition-[grid-template-rows] duration-300 ease-in-out"
              :class="
                !isMultipleBookings || expandedIndex === bIndex
                  ? 'grid-rows-[1fr]'
                  : 'grid-rows-[0fr]'
              "
            >
              <div class="min-h-0 overflow-hidden">
                <div
                  :class="
                    isMultipleBookings ? 'space-y-4 pb-4' : 'space-y-4'
                  "
                >
                  <div
                    v-if="b.theme"
                    class="flex items-center gap-3"
                    :class="isMultipleBookings ? '' : 'border-y border-gray-100 py-4'"
                  >
                    <img
                      v-if="b.theme.images?.[0]"
                      :src="b.theme.images[0]"
                      alt=""
                      class="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div
                      v-else
                      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-500"
                    >
                      {{ (b.theme.name || "?").slice(0, 1) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="truncate text-base font-medium text-gray-900">
                        {{ b.theme.name }}
                      </h3>
                      <p class="truncate text-sm text-gray-500">
                        {{ studioStore.studio?.name }}
                      </p>
                    </div>
                  </div>

                  <dl
                    class="divide-y divide-gray-100"
                    :class="isMultipleBookings ? 'border-y border-gray-100' : 'border-y border-gray-100'"
                  >
                    <div class="flex items-center gap-3 py-3">
                      <Calendar class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1">
                        <dt class="text-xs text-gray-500">{{ t("date") }}</dt>
                        <dd class="text-sm font-medium text-gray-900">
                          {{ getFormattedDate(b) }}
                        </dd>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 py-3">
                      <Clock class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1">
                        <dt class="text-xs text-gray-500">{{ t("time") }}</dt>
                        <dd class="text-sm font-medium text-gray-900">
                          {{ getFormattedTime(b) }}
                        </dd>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 py-3">
                      <Users class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1">
                        <dt class="text-xs text-gray-500">
                          {{ t("numberOfGuests") }}
                        </dt>
                        <dd class="text-sm font-medium text-gray-900">
                          {{ b.pax_count || 0 }} {{ t("people") }}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <section class="space-y-3">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ t("customerDetails") }}
                    </h4>
                    <dl class="space-y-2 text-sm">
                      <div class="flex justify-between gap-3">
                        <dt class="text-gray-500">{{ t("name") }}</dt>
                        <dd class="text-right font-medium text-gray-900">
                          {{ b.customer_name }}
                        </dd>
                      </div>
                      <div
                        v-if="b.customer_phone"
                        class="flex justify-between gap-3"
                      >
                        <dt class="text-gray-500">{{ t("phone") }}</dt>
                        <dd class="text-right font-medium text-gray-900">
                          {{ b.customer_phone }}
                        </dd>
                      </div>
                      <div
                        v-if="b.customer_email"
                        class="flex justify-between gap-3"
                      >
                        <dt class="text-gray-500">{{ t("email") }}</dt>
                        <dd class="break-all text-right font-medium text-gray-900">
                          {{ b.customer_email }}
                        </dd>
                      </div>
                      <div
                        v-if="b.customer_notes"
                        class="border-t border-gray-100 pt-2"
                      >
                        <dt class="mb-0.5 text-gray-500">{{ t("notes") }}</dt>
                        <dd class="text-gray-700">{{ b.customer_notes }}</dd>
                      </div>
                    </dl>
                  </section>

                  <section
                    v-if="b.total_amount"
                    class="space-y-3 border-t border-gray-100 pt-4"
                  >
                    <h4
                      class="flex items-center gap-2 text-sm font-medium text-gray-900"
                    >
                      <Receipt class="h-4 w-4 text-gray-400" />
                      {{ t("paymentSummary") }}
                    </h4>

                    <dl class="space-y-2 text-sm">
                      <div class="flex justify-between gap-3">
                        <dt class="text-gray-500">
                          {{ b.theme?.name }} ({{ b.theme?.base_pax || 1 }}
                          {{ t("people") }})
                        </dt>
                        <dd class="tabular-nums font-medium text-gray-900">
                          {{ formatAmount(b.base_price) }}
                        </dd>
                      </div>

                      <div
                        v-if="b.extra_pax_fee && b.extra_pax_fee > 0"
                        class="flex justify-between gap-3"
                      >
                        <dt class="text-gray-500">
                          {{ t("extra") }} ({{
                            b.pax_count - (b.theme?.base_pax || 1)
                          }}
                          {{ t("people") }})
                        </dt>
                        <dd class="tabular-nums font-medium text-gray-900">
                          {{ formatAmount(b.extra_pax_fee) }}
                        </dd>
                      </div>

                      <div
                        v-if="
                          b.special_pricing_applied &&
                          b.special_pricing_applied !== 0
                        "
                        class="flex justify-between gap-3"
                      >
                        <dt class="text-gray-500">
                          {{ b.special_pricing_label || t("specialPrice") }}
                        </dt>
                        <dd class="tabular-nums font-medium text-gray-900">
                          {{ b.special_pricing_applied > 0 ? "+" : ""
                          }}{{ formatAmount(b.special_pricing_applied) }}
                        </dd>
                      </div>

                      <div
                        v-for="addon in b.addons"
                        :key="addon.addon.name"
                        class="flex justify-between gap-3"
                      >
                        <dt class="text-gray-500">
                          {{ addon.addon.name }} × {{ addon.quantity }}
                        </dt>
                        <dd class="tabular-nums font-medium text-gray-900">
                          {{ formatAmount(addon.price_at_booking) }}
                        </dd>
                      </div>

                      <div
                        v-if="b.discount_amount && b.discount_amount > 0"
                        class="flex justify-between gap-3 border-t border-gray-100 pt-2"
                      >
                        <dt class="text-green-700">
                          {{ t("discount") }}
                          <span v-if="b.coupon_code"
                            >({{ b.coupon_code }})</span
                          >
                        </dt>
                        <dd class="tabular-nums font-medium text-green-700">
                          -{{ formatAmount(b.discount_amount) }}
                        </dd>
                      </div>
                    </dl>

                    <div class="flex items-baseline justify-between border-t border-gray-100 pt-3">
                      <span class="text-base font-medium text-gray-900">{{
                        t("total")
                      }}</span>
                      <span class="text-lg font-semibold tabular-nums text-gray-900">{{
                        formatAmount(b.total_amount)
                      }}</span>
                    </div>

                    <div
                      v-if="
                        b.deposit_amount && b.deposit_amount < b.total_amount
                      "
                      class="flex justify-between text-sm text-green-700"
                    >
                      <span>{{ t("deposit") }} ({{ t("depositPaid") }})</span>
                      <span class="tabular-nums font-medium">{{
                        formatAmount(b.deposit_amount)
                      }}</span>
                    </div>

                    <div
                      v-if="b.balance_amount && b.balance_amount > 0"
                      class="flex justify-between text-sm text-amber-700"
                    >
                      <span>{{ t("balance") }} ({{ t("remaining") }})</span>
                      <span class="tabular-nums font-medium">{{
                        formatAmount(b.balance_amount)
                      }}</span>
                    </div>

                    <p
                      v-if="b.chip_fee_paid && b.chip_fee_paid > 0"
                      class="text-xs text-gray-400"
                    >
                      {{ t("inclTransactionFee") }}:
                      {{ formatAmount(b.chip_fee_paid) }}
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </article>
        </div>

        <section class="space-y-3 border-t border-gray-100 pt-5">
          <h2 class="text-sm font-medium text-gray-900">
            {{ t("whatNext") }}
          </h2>
          <ul class="divide-y divide-gray-100 border-y border-gray-100">
            <li class="flex gap-3 py-3">
              <Camera class="mt-0.5 h-4 w-4 shrink-0 text-gray-900" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ t("saveBookingId") }}
                </p>
                <p class="text-xs leading-snug text-gray-500">
                  {{ t("saveBookingIdDesc") }}
                </p>
              </div>
            </li>
            <li class="flex gap-3 py-3">
              <Clock class="mt-0.5 h-4 w-4 shrink-0 text-gray-900" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ t("arriveOnTime") }}
                </p>
                <p class="text-xs leading-snug text-gray-500">
                  {{ t("arriveOnTimeDesc") }}
                </p>
              </div>
            </li>
            <li
              v-if="booking.balance_amount && booking.balance_amount > 0"
              class="flex gap-3 py-3"
            >
              <CreditCard class="mt-0.5 h-4 w-4 shrink-0 text-gray-900" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ t("bringPayment") }}
                </p>
                <p class="text-xs leading-snug text-gray-500">
                  {{ t("bringPaymentDesc") }}
                </p>
              </div>
            </li>
            <li class="flex gap-3 py-3">
              <MessageCircle class="mt-0.5 h-4 w-4 shrink-0 text-gray-900" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ t("questions") }}
                </p>
                <p class="text-xs leading-snug text-gray-500">
                  {{ t("questionsDesc") }}
                </p>
              </div>
            </li>
          </ul>
          <p class="text-center text-xs text-gray-400">
            {{ t("checkWhatsAppForConfirmation") }}
          </p>
        </section>
      </div>
    </div>

    <div
      v-if="booking && !isLoading && !error"
      class="bk-sticky-bar"
    >
      <div class="bk-sticky-bar-inner">
        <button
          type="button"
          class="bk-cta-secondary shrink-0"
          :aria-label="t('backToHome')"
          @click="goHome"
        >
          <Home class="h-5 w-5" />
        </button>
        <a
          v-if="getWhatsAppUrl"
          :href="getWhatsAppUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="bk-cta-primary flex-1"
        >
          <MessageCircle class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ t("getDetailsInWhatsApp") }}</span>
        </a>
        <button
          v-else
          type="button"
          class="bk-cta-primary flex-1"
          @click="goHome"
        >
          <span>{{ t("backToHome") }}</span>
          <Home class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.success-content {
  animation: success-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.success-check {
  animation: success-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
}

@keyframes success-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes success-pop {
  from {
    opacity: 0;
    transform: scale(0.75);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .success-content,
  .success-check {
    animation: none;
  }
}
</style>
