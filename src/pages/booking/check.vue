<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { api } from "@/services/api";
import { format } from "date-fns";
import { useTranslation } from "@/composables/useTranslation";
import {
  ArrowLeft,
  ChevronDown,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  Receipt,
} from "lucide-vue-next";

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();

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
function onDocumentClick() {
  isCountryDropdownOpen.value = false;
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick);
});

// Sync localPhone/countryCode TO phone
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

</script>

<template>
  <div class="bk-page">
    <header class="sticky top-0 z-40">
      <div class="bk-header-bar">
        <div class="mx-auto flex h-14 max-w-md items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            class="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-gray-100"
            :aria-label="t('back')"
            @click="router.back()"
          >
            <ArrowLeft class="h-5 w-5" />
          </button>
          <h1 class="truncate text-base font-medium text-gray-900">
            {{ t("checkBooking") }}
          </h1>
        </div>
      </div>
    </header>

    <main class="bk-shell flex flex-1 flex-col py-6 sm:py-8">
      <!-- Search form -->
      <div v-if="!foundBooking" class="my-auto w-full space-y-6">
        <div class="space-y-1">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ t("checkYourBooking") }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ t("enterBookingDetailsToCheckStatus") }}
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="searchBooking">
          <div class="space-y-1.5">
            <label for="bookingId" class="bk-label">
              {{ t("bookingId") }}
            </label>
            <input
              id="bookingId"
              v-model="bookingId"
              type="text"
              required
              autocomplete="off"
              class="bk-input"
              :placeholder="t('enterBookingId')"
            />
            <p class="bk-hint">
              {{ t("bookingIdSentToWhatsApp") }}
            </p>
          </div>

          <div class="space-y-1.5">
            <label for="phone" class="bk-label">
              {{ t("phoneNumber") }}
            </label>
            <div class="flex gap-2">
              <div ref="countryDropdownRef" class="relative w-28 shrink-0">
                <button
                  type="button"
                  class="bk-select"
                  :aria-label="t('code') || 'Code'"
                  :aria-expanded="isCountryDropdownOpen"
                  @click="toggleCountryDropdown"
                >
                  <span class="flex items-center gap-1.5">
                    <span>{{
                      countryCodes.find((c) => c.code === selectedCountryCode)
                        ?.flag
                    }}</span>
                    <span class="tabular-nums">{{ selectedCountryCode }}</span>
                  </span>
                  <ChevronDown class="h-4 w-4 text-gray-400" />
                </button>

                <div
                  v-if="isCountryDropdownOpen"
                  class="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                >
                  <button
                    v-for="country in countryCodes"
                    :key="country.code"
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    @click="selectCountry(country.code)"
                  >
                    <span>{{ country.flag }}</span>
                    <span class="tabular-nums">{{ country.code }}</span>
                  </button>
                </div>
              </div>

              <input
                id="phone"
                v-model="localPhone"
                type="tel"
                required
                autocomplete="tel-national"
                class="bk-input bk-input--flex"
                :placeholder="t('enterPhone')"
              />
            </div>
          </div>

          <div
            v-if="error"
            class="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600"
          >
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <button
            type="submit"
            class="bk-cta-primary w-full"
            :disabled="isLoading"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <span>{{ isLoading ? t("checking") : t("checkNow") }}</span>
          </button>
        </form>
      </div>

      <!-- Result -->
      <div v-else class="space-y-6 pb-8">
        <div class="space-y-2">
          <span
            class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize"
            :class="getStatusBadge(foundBooking.booking_status).class"
          >
            {{ getStatusBadge(foundBooking.booking_status).text }}
          </span>
          <p class="text-sm text-gray-500">{{ t("bookingId") }}</p>
          <p class="font-mono text-lg font-medium text-gray-900">
            {{ foundBooking.booking_number }}
          </p>
        </div>

        <section class="flex items-center gap-3 border-y border-gray-100 py-4">
          <img
            v-if="foundBooking.theme?.images?.[0]"
            :src="foundBooking.theme.images[0]"
            alt=""
            class="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
          <div
            v-else
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
          >
            <Calendar class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-medium text-gray-900">
              {{ foundBooking.theme?.name }}
            </p>
            <p class="truncate text-sm text-gray-500">
              {{ studioStore.studio?.name }}
            </p>
          </div>
        </section>

        <dl class="divide-y divide-gray-100 border-y border-gray-100">
          <div class="flex items-center gap-3 py-3">
            <Calendar class="h-4 w-4 shrink-0 text-gray-400" />
            <div class="min-w-0 flex-1">
              <dt class="text-xs text-gray-500">{{ t("date") }}</dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ formattedDate }}
              </dd>
            </div>
          </div>
          <div class="flex items-center gap-3 py-3">
            <Clock class="h-4 w-4 shrink-0 text-gray-400" />
            <div class="min-w-0 flex-1">
              <dt class="text-xs text-gray-500">{{ t("time") }}</dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ formattedTime }}
              </dd>
            </div>
          </div>
          <div
            v-if="foundBooking.pax_count"
            class="flex items-center gap-3 py-3"
          >
            <Users class="h-4 w-4 shrink-0 text-gray-400" />
            <div class="min-w-0 flex-1">
              <dt class="text-xs text-gray-500">{{ t("numberOfGuests") }}</dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ foundBooking.pax_count }} {{ t("people") }}
              </dd>
            </div>
          </div>
        </dl>

        <section class="space-y-3">
          <h3 class="text-sm font-medium text-gray-900">
            {{ t("customerDetails") || "Customer Details" }}
          </h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">{{ t("name") || "Name" }}</dt>
              <dd class="text-right font-medium text-gray-900">
                {{ foundBooking.customer_name }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">{{ t("phone") || "Phone" }}</dt>
              <dd class="text-right font-medium text-gray-900">
                {{ foundBooking.customer_phone }}
              </dd>
            </div>
            <div
              v-if="foundBooking.customer_email"
              class="flex justify-between gap-3"
            >
              <dt class="text-gray-500">{{ t("email") || "Email" }}</dt>
              <dd class="break-all text-right font-medium text-gray-900">
                {{ foundBooking.customer_email }}
              </dd>
            </div>
          </dl>
          <p
            v-if="formattedCreatedDate"
            class="text-xs text-gray-400"
          >
            {{ t("bookedOn") || "Booked on" }}: {{ formattedCreatedDate }}
          </p>
        </section>

        <section
          v-if="foundBooking.total_amount !== undefined"
          class="space-y-3 border-t border-gray-100 pt-5"
        >
          <h3 class="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Receipt class="h-4 w-4 text-gray-400" />
            {{ t("paymentSummary") }}
          </h3>

          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">
                {{ foundBooking.theme?.name }} ({{
                  foundBooking.theme?.base_pax || 1
                }}
                {{ t("people") }})
              </dt>
              <dd class="tabular-nums font-medium text-gray-900">
                {{ formatAmount(foundBooking.base_price) }}
              </dd>
            </div>

            <div
              v-if="
                foundBooking.extra_pax_fee && foundBooking.extra_pax_fee > 0
              "
              class="flex justify-between gap-3"
            >
              <dt class="text-gray-500">
                {{ t("extraPax") }} ({{
                  foundBooking.pax_count - (foundBooking.theme?.base_pax || 1)
                }}
                {{ t("people") }})
              </dt>
              <dd class="tabular-nums font-medium text-gray-900">
                {{ formatAmount(foundBooking.extra_pax_fee) }}
              </dd>
            </div>

            <div
              v-if="
                foundBooking.special_pricing_applied &&
                foundBooking.special_pricing_applied !== 0
              "
              class="flex justify-between gap-3"
            >
              <dt class="text-gray-500">
                {{
                  foundBooking.special_pricing_label || t("specialPrice")
                }}
              </dt>
              <dd class="tabular-nums font-medium text-gray-900">
                {{ foundBooking.special_pricing_applied > 0 ? "+" : ""
                }}{{ formatAmount(foundBooking.special_pricing_applied) }}
              </dd>
            </div>

            <div
              v-for="addon in foundBooking.addons"
              :key="addon.addon?.name || addon.name"
              class="flex justify-between gap-3"
            >
              <dt class="text-gray-500">
                {{ addon.addon?.name || addon.name }} × {{ addon.quantity }}
              </dt>
              <dd class="tabular-nums font-medium text-gray-900">
                {{ formatAmount(addon.price_at_booking || addon.price) }}
              </dd>
            </div>

            <div
              v-if="
                foundBooking.discount_amount &&
                foundBooking.discount_amount > 0
              "
              class="flex justify-between gap-3 border-t border-gray-100 pt-2"
            >
              <dt class="text-green-700">
                {{ t("discount") }}
                <span v-if="foundBooking.coupon_code"
                  >({{ foundBooking.coupon_code }})</span
                >
              </dt>
              <dd class="tabular-nums font-medium text-green-700">
                -{{ formatAmount(foundBooking.discount_amount) }}
              </dd>
            </div>
          </dl>

          <div class="flex items-center justify-between border-t border-gray-100 pt-3">
            <span class="text-sm text-gray-500">{{ t("status") }}</span>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                getPaymentStatusBadge(foundBooking.payment_status).class,
              ]"
            >
              {{ getPaymentStatusBadge(foundBooking.payment_status).text }}
            </span>
          </div>

          <div class="flex justify-between items-baseline">
            <span class="text-base font-medium text-gray-900">{{
              t("total")
            }}</span>
            <span class="text-lg font-semibold tabular-nums text-gray-900">{{
              formatAmount(foundBooking.total_amount)
            }}</span>
          </div>

          <div
            v-if="
              foundBooking.deposit_amount &&
              foundBooking.deposit_amount < foundBooking.total_amount
            "
            class="flex justify-between text-sm text-green-700"
          >
            <span>{{ t("deposit") }} ({{ t("depositPaid") }})</span>
            <span class="tabular-nums font-medium">{{
              formatAmount(foundBooking.deposit_amount)
            }}</span>
          </div>

          <div
            v-if="
              foundBooking.balance_amount && foundBooking.balance_amount > 0
            "
            class="flex justify-between text-sm text-amber-700"
          >
            <span>{{ t("balance") }} ({{ t("remaining") }})</span>
            <span class="tabular-nums font-medium">{{
              formatAmount(foundBooking.balance_amount)
            }}</span>
          </div>
        </section>

        <div class="flex flex-col gap-2 pt-2">
          <a
            v-if="getWhatsAppUrl"
            :href="getWhatsAppUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="bk-cta-primary"
          >
            <MessageCircle class="h-4 w-4" />
            {{ t("contactStudio") }}
          </a>
          <button type="button" class="bk-cta-secondary w-full" @click="reset">
            <RefreshCw class="h-4 w-4" />
            {{ t("checkAnother") }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
