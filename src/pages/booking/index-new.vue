<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { useCurrency } from "@/composables/useCurrency";
import { createBooking, api } from "@/services/api";
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
  AlertCircle,
  ShoppingBag,
  Trash2,
  Ticket,
} from "lucide-vue-next";
import type { Theme, Addon, PricingRule, Coupon } from "@/types";
import Modal from "@/components/Modal.vue";
import { marked } from "marked";

const router = useRouter();
const studioStore = useStudioStore();
const { t } = useTranslation();
const { formatPriceWhole } = useCurrency();

// ============================================
// Session Management
// ============================================
function getSessionId(): string {
  let sessionId = localStorage.getItem("booking_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("booking_session_id", sessionId);
  }
  return sessionId;
}

function initializeSession(): void {
  const sessionTimestamp = localStorage.getItem("booking_session_timestamp");
  const now = Date.now();

  if (sessionTimestamp) {
    const hoursSinceSession =
      (now - parseInt(sessionTimestamp)) / (1000 * 60 * 60);
    if (hoursSinceSession > 24) {
      clearSession();
    }
  } else {
    localStorage.setItem("booking_session_timestamp", now.toString());
  }

  getSessionId();
}

function clearSession(): void {
  localStorage.removeItem("booking_session_id");
  localStorage.removeItem("booking_session_timestamp");
  localStorage.removeItem("booking_state");
}

// Cart Mode Detection
const isCartModeEnabled = computed(() => {
  return studioStore.studio?.settings?.cart_mode_enabled === true;
});

// Cart State Management (only used when cart mode enabled)
interface CartItem {
  id: string;
  theme: Theme;
  date: string;
  slot: any;
  pax: number;
  addons: Record<string, number>;
  total: number;
  dateInfo?: any; // Store date info for special pricing
  hold?: CartHold; // Hold info for this cart item
  specialPricing?: {
    message: string;
    amount: number;
  };
}
const cart = ref<CartItem[]>([]);

// Steps
const currentStep = ref<number>(1);

// Terms acceptance tracking
const termsAccepted = ref(false);

// Terms content from database
const termsContent = ref<string>("");
const loadingTerms = ref(true);

// Computed property to parse markdown to HTML
const termsContentHtml = computed(() => {
  if (!termsContent.value) return "";
  return marked(termsContent.value) as string;
});

// Background Images Setup
const backgroundImages = [
  "https://plus.unsplash.com/premium_photo-1661963643348-e95c6387ee8a?q=80&w=2340&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1506112573664-1a1b66d93ff3?q=80&w=2254&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

const currentImageIndex = ref(0);
let intervalId: any;

onMounted(async () => {
  // Initialize session
  initializeSession();

  // Wait for studio to be loaded before attempting recovery
  // This ensures isCartModeEnabled computed property works correctly
  let waitCount = 0;
  while (!studioStore.studio && waitCount < 20) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    waitCount++;
  }
  loadingThemes.value = false;

  // Clean up any invalid saved state (no meaningful progress) immediately
  try {
    const savedState = localStorage.getItem("booking_state");
    if (savedState) {
      const state = JSON.parse(savedState);
      const hasMeaningfulProgress =
        state.selectedTheme ||
        state.currentStep > 1 ||
        (state.cartItems && state.cartItems.length > 0);

      if (!hasMeaningfulProgress) {
        localStorage.removeItem("booking_state");
      }
    }
  } catch (error) {
    console.error("Failed to clean up saved state:", error);
  }

  // Check for saved state after studio is loaded
  await attemptStateRecovery();

  // Clean expired holds
  cleanExpiredHolds();

  // Fetch terms and conditions from database
  try {
    const terms = await api.getTerms();
    if (terms.contentBm) {
      termsContent.value = terms.contentBm;
    }
  } catch (error) {
    console.error("Failed to fetch terms:", error);
  } finally {
    loadingTerms.value = false;
  }

  intervalId = setInterval(() => {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % backgroundImages.length;
  }, 5000); // Change every 5 seconds

  // Start background cleanup interval
  setInterval(() => {
    cleanExpiredHolds();
  }, 60000); // Every minute
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  if (holdCountdownInterval) clearInterval(holdCountdownInterval);

  // Clear all cart item timers
  cartItemTimers.forEach((timer) => clearInterval(timer));
  cartItemTimers.clear();
});

// ============================================
// Page Refresh Recovery
// ============================================
async function attemptStateRecovery() {
  const savedState = localStorage.getItem("booking_state");
  if (!savedState) return;

  try {
    const state = JSON.parse(savedState);
    const savedAt = new Date(state.savedAt);
    const minutesAgo = (new Date().getTime() - savedAt.getTime()) / (1000 * 60);

    // Only recover if saved within 30 minutes
    if (minutesAgo > 30) {
      localStorage.removeItem("booking_state");
      return;
    }

    // Don't show recovery if still at step 1 without theme selection
    // (user just browsing, nothing meaningful to recover)
    if (state.currentStep === 1 && !state.selectedTheme) {
      return; // Don't show dialog, but keep state in case they select theme
    }

    // Verify we're on the same studio
    // (Studio slug should already be correct due to early detection in slug.ts)
    if (state.studioSlug && studioStore.studio?.slug !== state.studioSlug) {
      // Different studio - clear state
      localStorage.removeItem("booking_state");
      return;
    }

    recoveryState.value = state;
    showRecoveryDialog.value = true;
  } catch (error) {
    console.error("Recovery failed:", error);
    localStorage.removeItem("booking_state");
  }
}

function clearBookingState() {
  try {
    localStorage.removeItem("booking_state");
    localStorage.removeItem("booking_session_id");
  } catch (error) {
    console.error("Failed to clear booking state:", error);
  }
}

function dismissRecoveryDialog() {
  showRecoveryDialog.value = false;
  recoveryState.value = null;
  clearBookingState();
}

async function restoreBookingState(state: any) {
  isRecovering.value = true;

  try {
    // Restore basic selections
    if (state.selectedTheme) {
      selectedTheme.value = state.selectedTheme;
      // Fetch dates for the restored theme
      fetchAvailableDates();
    }
    if (state.selectedDate) selectedDate.value = state.selectedDate;
    if (state.paxCount) paxCount.value = state.paxCount;
    if (state.selectedAddons) selectedAddons.value = state.selectedAddons;
    if (state.customerInfo) customerInfo.value = state.customerInfo;

    // Scroll to the selected date after a short delay (to allow dates to load)
    if (state.selectedDate) {
      setTimeout(() => {
        scrollToSelectedDate();
      }, 500);
    }

    // Validate and restore holds
    if (state.mode === "single" && state.confirmedSlot?.hold?.holdId) {
      const holds = await getActiveHolds();
      const hold = holds.find(
        (h) => h.holdId === state.confirmedSlot.hold.holdId
      );

      if (hold) {
        // Hold still valid
        confirmedSlot.value = state.confirmedSlot;
        selectedSlot.value = state.selectedSlot;
        holdExpiresAt.value = new Date(hold.expiresAt);
        startHoldCountdown();
        currentStep.value = state.currentStep || 3;

        // Load time slots if needed
        if (selectedTheme.value && studioStore.studio && selectedDate.value) {
          loadingSlots.value = true;
          try {
            const slots = await api.getAvailableTimeSlots(
              studioStore.studio.id,
              selectedTheme.value.id,
              selectedDate.value
            );
            timeSlots.value = slots.map((slot, index) => ({
              id: `slot-${index}`,
              start: formatTimeForDisplay(slot.start || "09:00"),
              end: formatTimeForDisplay(slot.end || "09:30"),
              available: slot.status === "available",
              originalSlot: slot,
            }));
          } catch (err) {
            console.error("Failed to load time slots:", err);
          } finally {
            loadingSlots.value = false;
          }
        }
      } else {
        // Hold expired
        selectedSlot.value = state.selectedSlot;
        currentStep.value = 2; // Back to time selection
        showModal({
          title: t("reservationExpired"),
          message: t("reservationExpiredMessage"),
          type: "warning",
          confirmText: t("ok"),
        });
      }
    } else if (state.mode === "single" && state.currentStep === 2) {
      // Restore step 2 (time slot selection)
      currentStep.value = 2;

      // Restore selected slot if exists
      if (state.selectedSlot) {
        selectedSlot.value = state.selectedSlot;
      }

      // Load time slots if date and theme are selected
      if (selectedTheme.value && studioStore.studio && selectedDate.value) {
        loadingSlots.value = true;
        try {
          const slots = await api.getAvailableTimeSlots(
            studioStore.studio.id,
            selectedTheme.value.id,
            selectedDate.value
          );
          timeSlots.value = slots.map((slot, index) => ({
            id: `slot-${index}`,
            start: formatTimeForDisplay(slot.start || "09:00"),
            end: formatTimeForDisplay(slot.end || "09:30"),
            available: slot.status === "available",
            originalSlot: slot,
          }));
        } catch (err) {
          console.error("Failed to load time slots:", err);
        } finally {
          loadingSlots.value = false;
        }
      }
    } else if (state.mode === "cart" && state.currentStep === 2) {
      // Restore cart mode step 2 (time slot selection for adding to cart)
      currentStep.value = 2;

      // Restore selected slot if exists
      if (state.selectedSlot) {
        selectedSlot.value = state.selectedSlot;
      }

      // Load time slots if date and theme are selected
      if (selectedTheme.value && studioStore.studio && selectedDate.value) {
        loadingSlots.value = true;
        try {
          const slots = await api.getAvailableTimeSlots(
            studioStore.studio.id,
            selectedTheme.value.id,
            selectedDate.value
          );
          timeSlots.value = slots.map((slot, index) => ({
            id: `slot-${index}`,
            start: formatTimeForDisplay(slot.start || "09:00"),
            end: formatTimeForDisplay(slot.end || "09:30"),
            available: slot.status === "available",
            originalSlot: slot,
          }));
        } catch (err) {
          console.error("Failed to load time slots:", err);
        } finally {
          loadingSlots.value = false;
        }
      }
    } else if (state.mode === "cart" && state.currentStep === 3) {
      // Restore cart mode step 3 (Pax & Addons - before adding to cart)
      currentStep.value = 3;

      // Restore selected slot (needed for Add to Cart button to work)
      if (state.selectedSlot) {
        selectedSlot.value = state.selectedSlot;
      }

      // Load time slots in background for when user goes back
      if (selectedTheme.value && studioStore.studio && selectedDate.value) {
        loadingSlots.value = true;
        try {
          const slots = await api.getAvailableTimeSlots(
            studioStore.studio.id,
            selectedTheme.value.id,
            selectedDate.value
          );
          timeSlots.value = slots.map((slot, index) => ({
            id: `slot-${index}`,
            start: formatTimeForDisplay(slot.start || "09:00"),
            end: formatTimeForDisplay(slot.end || "09:30"),
            available: slot.status === "available",
            originalSlot: slot,
          }));
        } catch (err) {
          console.error("Failed to load time slots:", err);
        } finally {
          loadingSlots.value = false;
        }
      }
    } else if (state.mode === "cart" && state.cartItems?.length > 0) {
      // Restore cart items with valid holds
      await restoreCartItems(state.cartItems);
      currentStep.value = state.currentStep || 4;
    } else {
      // No holds, just restore step
      currentStep.value = state.currentStep || 1;
    }

    showRecoveryDialog.value = false;
  } finally {
    isRecovering.value = false;
  }
}

async function restoreCartItems(savedCartItems: any[]) {
  const restoredItems = [];
  const expiredItems = [];

  for (const item of savedCartItems) {
    if (!item.hold?.holdId) continue;

    const holds = await getActiveHolds();
    const hold = holds.find((h) => h.holdId === item.hold.holdId);

    if (hold) {
      // Hold still active
      const restoredItem = {
        ...item,
        hold: hold,
      };
      restoredItems.push(restoredItem);
    } else {
      expiredItems.push(item);
    }
  }

  cart.value = restoredItems;

  // Start timers for restored items
  restoredItems.forEach((_, index) => {
    startCartItemHoldTimer(index);
  });

  // Show summary
  if (restoredItems.length > 0) {
    const message =
      expiredItems.length > 0
        ? `${restoredItems.length} ${t("restoredItems")}. ${
            expiredItems.length
          } ${t("itemsExpired")}.`
        : `${restoredItems.length} ${t("restoredItems")}!`;
    showModal({
      title: t("success"),
      message: message,
      type: "success",
      confirmText: t("ok"),
    });
  } else if (expiredItems.length > 0) {
    showModal({
      title: t("reservationExpired"),
      message: t("allItemsExpired"),
      type: "warning",
      confirmText: t("ok"),
    });
  }
}

// Auto scroll to top on step change
watch(currentStep, (newStep) => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Reset terms acceptance when leaving terms step
  if (isCartModeEnabled.value) {
    // In cart mode, terms are in step 6
    // Don't reset if moving to summary (step 7)
    if (newStep !== 6 && newStep !== 7) {
      termsAccepted.value = false;
    }
  } else {
    // In single mode, terms are in step 5
    // Don't reset if moving to summary (step 6)
    if (newStep !== 5 && newStep !== 6) {
      termsAccepted.value = false;
    }
  }
});

// Dynamic steps array based on cart mode
const steps = computed(() => {
  if (isCartModeEnabled.value) {
    // Cart mode: 7 steps
    return [
      { id: 1, title: t("stepSelectTheme") },
      { id: 2, title: t("stepDateAndTime") },
      { id: 3, title: t("stepPaxAndAddons") },
      { id: 4, title: t("cartReview") || "Cart Review" },
      { id: 5, title: t("stepCustomerInformation") },
      { id: 6, title: t("termsAndConditions") || "Terms & Conditions" },
      { id: 7, title: t("stepSummary") },
    ];
  } else {
    // Single mode: 6 steps
    return [
      { id: 1, title: t("stepSelectTheme") },
      { id: 2, title: t("stepDateAndTime") },
      { id: 3, title: t("stepPaxAndAddons") },
      { id: 4, title: t("stepCustomerInformation") },
      { id: 5, title: t("termsAndConditions") || "Terms & Conditions" },
      { id: 6, title: t("stepSummary") },
    ];
  }
});

// Data Selections
const selectedTheme = ref<Theme | null>(null);
const selectedDate = ref<string | null>(null);
const selectedSlot = ref<any | null>(null);
const paxCount = ref(1);
const selectedAddons = ref<Record<string, number>>({});
const customerInfo = ref({
  name: "",
  phone: "",
  email: "",
  notes: "",
});

// ============================================
// Hold Management State
// ============================================
const confirmedSlot = ref<any | null>(null); // Slot with active hold
const holdExpiresAt = ref<Date | null>(null); // Hold expiry timestamp
const holdCountdown = ref<string>("10:00"); // Display countdown
const isCreatingHold = ref(false); // Loading state for hold creation

// Cart mode: holds for each cart item
const cartItemHolds = ref<Map<string, { expiresAt: Date; countdown: string }>>(
  new Map()
);

// Page refresh recovery
const isRecovering = ref(false);
const showRecoveryDialog = ref(false);
const recoveryState = ref<any | null>(null);

// ============================================
// Modal State Management
// ============================================
const modalState = ref({
  show: false,
  title: "",
  message: "",
  type: "info" as "info" | "success" | "error" | "warning",
  confirmText: "",
  cancelText: "",
  showCancel: false,
  onConfirm: () => {},
  onCancel: () => {},
});

function showModal(config: {
  title: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    modalState.value = {
      show: true,
      title: config.title,
      message: config.message,
      type: config.type || "info",
      confirmText: config.confirmText || t("ok"),
      cancelText: config.cancelText || t("cancel"),
      showCancel: config.showCancel || false,
      onConfirm: () => {
        modalState.value.show = false;
        resolve(true);
      },
      onCancel: () => {
        modalState.value.show = false;
        resolve(false);
      },
    };
  });
}

function closeModal() {
  modalState.value.show = false;
}

// Form validation errors
const formErrors = ref({
  name: "",
  phone: "",
  email: "",
});

// Validation functions
const validateName = () => {
  if (!customerInfo.value.name || customerInfo.value.name.trim() === "") {
    formErrors.value.name = t("fieldRequired");
    return false;
  }
  formErrors.value.name = "";
  return true;
};

const validatePhone = () => {
  if (!customerInfo.value.phone || customerInfo.value.phone.trim() === "") {
    formErrors.value.phone = t("fieldRequired");
    return false;
  }
  // Basic phone validation (Malaysian format)
  const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
  const cleanPhone = customerInfo.value.phone.replace(/[\s-]/g, "");
  if (!phoneRegex.test(cleanPhone)) {
    formErrors.value.phone = t("invalidPhone");
    return false;
  }
  formErrors.value.phone = "";
  return true;
};

const validateEmail = () => {
  if (!customerInfo.value.email || customerInfo.value.email.trim() === "") {
    formErrors.value.email = t("fieldRequired");
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerInfo.value.email)) {
    formErrors.value.email = t("invalidEmail");
    return false;
  }
  formErrors.value.email = "";
  return true;
};

const validateCustomerForm = () => {
  const nameValid = validateName();
  const phoneValid = validatePhone();
  const emailValid = validateEmail();
  return nameValid && phoneValid && emailValid;
};

const isProcessingPayment = ref(false);
const activeImageIndices = ref<Record<string, number>>({});
const loadingThemes = ref(true);
const loadingDates = ref(true);
const dateScroller = ref<HTMLElement | null>(null);

// Coupon State
const couponCode = ref("");
const validatedCoupon = ref<Coupon | null>(null);
const isValidatingCoupon = ref(false);
const couponError = ref("");
const selectedCouponItemIndex = ref<number | null>(null); // For cart mode: which item to apply to

const setActiveImage = (themeId: string, index: number) => {
  activeImageIndices.value[themeId] = index;
};

// Available dates fetched from backend API
const dates = ref<
  {
    date: string;
    day: number;
    month: string;
    weekday: string;
    isBlackout: boolean;
    blackoutReason?: string;
    isSpecial: boolean;
    slotsAvailable?: number;
    slotsTotal?: number;
    specialLabel?: string;
  }[]
>([]);

const dateRangeStart = ref<string>("");
const dateRangeEnd = ref<string>("");

// Pricing rules fetched from backend
const pricingRules = ref<
  {
    name: string;
    date_range_start: string;
    date_range_end: string;
    rule_type: "percentage_increase" | "fixed_price";
    value: number;
  }[]
>([]);

// Fetch available dates from backend
async function fetchAvailableDates() {
  if (!selectedTheme.value || !studioStore.studio) {
    dates.value = [];
    return;
  }

  // Helper function to format date as YYYY-MM-DD in LOCAL timezone (not UTC)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  loadingDates.value = true;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const studio = studioStore.studio;

    const websiteSettings = studioStore.websiteSettings;

    // Debug: log the booking window settings
    console.log("[fetchAvailableDates] websiteSettings:", {
      bookingWindowStart: websiteSettings?.bookingWindowStart,
      bookingWindowEnd: websiteSettings?.bookingWindowEnd,
      today: formatDateLocal(today),
    });

    // Determine start date: use booking window start if set and in the future, otherwise use today
    let startDate = new Date(today);
    if (websiteSettings?.bookingWindowStart) {
      // Parse as local date by appending time
      const windowStart = new Date(
        websiteSettings.bookingWindowStart + "T00:00:00"
      );
      startDate = windowStart > today ? windowStart : today;
    }

    // Determine end date: use booking window end if set, otherwise limit to 30 days from start
    let endDate = new Date(startDate);
    if (websiteSettings?.bookingWindowEnd) {
      const windowEnd = new Date(
        websiteSettings.bookingWindowEnd + "T00:00:00"
      );
      endDate = windowEnd;
    } else {
      endDate.setDate(startDate.getDate() + 29); // 30 days total
    }

    // Validation: If booking window end is before today, booking has passed
    if (websiteSettings?.bookingWindowEnd) {
      const windowEnd = new Date(
        websiteSettings.bookingWindowEnd + "T00:00:00"
      );
      if (windowEnd < today) {
        console.log(
          "[fetchAvailableDates] Booking window has passed, no dates available"
        );
        dates.value = [];
        loadingDates.value = false;
        return;
      }
    }

    // Validation: Ensure endDate is not before startDate
    if (endDate < startDate) {
      console.warn(
        "[fetchAvailableDates] endDate < startDate, adjusting endDate to startDate + 29 days"
      );
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 29);
    }

    // Format dates for API call using LOCAL timezone
    const startDateStr = formatDateLocal(startDate);
    const endDateStr = formatDateLocal(endDate);

    console.log("[fetchAvailableDates] Date range:", {
      startDate: startDateStr,
      endDate: endDateStr,
    });

    // Store range for reference
    dateRangeStart.value = startDateStr;
    dateRangeEnd.value = endDateStr;

    // Fetch from backend
    const dateInfos = await api.getAvailableDates(
      studio.id,
      selectedTheme.value.id,
      startDateStr,
      endDateStr
    );

    // Transform backend response to frontend format
    dates.value = dateInfos.map((info) => {
      const d = new Date(info.date + "T00:00:00"); // Parse as local date
      return {
        date: info.date,
        day: d.getDate(),
        month: d.toLocaleString("default", { month: "short" }),
        weekday: d.toLocaleString("default", { weekday: "short" }),
        isBlackout: info.status === "blackout",
        blackoutReason:
          info.status === "blackout" ? "Tidak tersedia" : undefined,
        isSpecial: info.status === "special_pricing",
        slotsAvailable: info.slots_available,
        slotsTotal: info.slots_total,
        specialLabel: info.special_pricing_label,
      };
    });
  } catch (error) {
    console.error("Failed to fetch available dates:", error);
    dates.value = [];
  } finally {
    loadingDates.value = false;
  }
}

// Watch for theme changes to reload dates and pricing rules
watch(selectedTheme, async () => {
  if (selectedTheme.value) {
    fetchAvailableDates();
    // Fetch pricing rules for showing surcharge/discount info
    if (studioStore.studio) {
      try {
        const rules = await api.getPricingRules(studioStore.studio.id);
        pricingRules.value = rules.map((r) => ({
          name: r.name,
          date_range_start: r.date_range_start,
          date_range_end: r.date_range_end,
          rule_type: r.rule_type,
          value: r.value,
        }));
      } catch (e) {
        console.error("Failed to fetch pricing rules:", e);
        pricingRules.value = [];
      }
    }
  } else {
    dates.value = [];
    pricingRules.value = [];
  }
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
        start: formatTimeForDisplay(slot.start || "09:00"),
        end: formatTimeForDisplay(slot.end || "09:30"),
        available: slot.status === "available",
        originalSlot: slot, // Keep original for booking
      }));
    } catch (error) {
      console.error("Failed to load time slots:", error);
      timeSlots.value = [];
    } finally {
      loadingSlots.value = false;
    }
  }

  // Auto scroll to time selection section after a short delay
  setTimeout(() => {
    const timeSection = document.querySelector("[data-time-section]");
    if (timeSection) {
      timeSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 300);
};

// Helper to format time from "09:00" to "09:00 AM"
const formatTimeForDisplay = (time: string): string => {
  if (!time) return "09:00 AM";
  const parts = time.split(":");
  if (parts.length < 2) return "09:00 AM";
  const hours = parts[0] || "09";
  const minutes = parts[1] || "00";
  const hour = parseInt(hours);
  if (isNaN(hour)) return "09:00 AM";
  const ampm = hour >= 12 ? "PM" : "AM";
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
  if (addon.max_quantity && next > addon.max_quantity)
    next = addon.max_quantity;

  selectedAddons.value[addon.id] = next;
};

// ============================================
// Cart Hold API (Backend Integration)
// ============================================

interface CartHold {
  holdId: string;
  sessionId: string;
  studioId: string;
  themeId: string;
  date: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
  createdAt: string;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

async function createCartHold(slotData: any): Promise<CartHold> {
  try {
    const response = await api.createSlotHold(
      slotData.themeId,
      slotData.date,
      slotData.startTime,
      slotData.endTime,
      getSessionId()
    );

    return {
      holdId: response.holdId,
      sessionId: response.sessionId,
      studioId: studioStore.studio?.id || "",
      themeId: response.themeId,
      date: response.date,
      startTime: response.startTime,
      endTime: response.endTime,
      expiresAt: response.expiresAt,
      createdAt: response.createdAt,
    };
  } catch (error: any) {
    // Handle conflict error from backend
    if (
      error?.data?.message === "SLOT_NO_LONGER_AVAILABLE" ||
      error?.message === "SLOT_NO_LONGER_AVAILABLE" ||
      error?.statusCode === 400
    ) {
      throw new Error("SLOT_NO_LONGER_AVAILABLE");
    }
    throw error;
  }
}

async function releaseCartHold(holdId: string): Promise<void> {
  try {
    await api.releaseSlotHold(holdId, getSessionId());
  } catch (error) {
    console.error("Failed to release hold:", error);
    // Ignore error - hold will expire anyway
  }
}

async function getActiveHolds(): Promise<CartHold[]> {
  try {
    const holds = await api.getSessionHolds(getSessionId());
    return holds.map((h) => ({
      holdId: h.holdId,
      sessionId: h.sessionId,
      studioId: studioStore.studio?.id || "",
      themeId: h.themeId,
      date: h.date,
      startTime: h.startTime,
      endTime: h.endTime,
      expiresAt: h.expiresAt,
      createdAt: h.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching holds:", error);
    return [];
  }
}

function cleanExpiredHolds(): void {
  // No longer needed - backend handles cleanup
}

// ============================================
// Hold Countdown Timer
// ============================================
let holdCountdownInterval: any = null;

function startHoldCountdown() {
  if (holdCountdownInterval) clearInterval(holdCountdownInterval);

  holdCountdownInterval = setInterval(() => {
    if (!holdExpiresAt.value) {
      clearInterval(holdCountdownInterval);
      return;
    }

    const now = new Date();
    const timeLeft = holdExpiresAt.value.getTime() - now.getTime();

    if (timeLeft <= 0) {
      clearInterval(holdCountdownInterval);
      handleHoldExpiry();
    } else {
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      holdCountdown.value = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      // Warning at 2 minutes
      if (timeLeft < 120000 && timeLeft > 119000) {
        console.warn("Hold expires in 2 minutes!");
      }
    }
  }, 1000);
}

async function handleHoldExpiry() {
  const expiredHoldId = confirmedSlot.value?.hold?.holdId;

  confirmedSlot.value = null;
  holdExpiresAt.value = null;
  holdCountdown.value = "10:00";

  await showModal({
    title: t("reservationExpired"),
    message: t("reservationExpiredMessage"),
    type: "warning",
    confirmText: t("ok"),
  });

  currentStep.value = 2; // Back to date & time selection

  // Release hold from storage
  if (expiredHoldId) {
    releaseCartHold(expiredHoldId);
  }
}

async function handleChangeSlot() {
  const confirmChange = await showModal({
    title: t("changeSlotConfirm"),
    message: t("changeSlotMessage"),
    type: "warning",
    confirmText: t("yes"),
    cancelText: t("no"),
    showCancel: true,
  });

  if (confirmChange) {
    if (confirmedSlot.value?.hold?.holdId) {
      releaseCartHold(confirmedSlot.value.hold.holdId);
    }
    confirmedSlot.value = null;
    holdExpiresAt.value = null;
    if (holdCountdownInterval) clearInterval(holdCountdownInterval);
    currentStep.value = 2;
  }
}

// Cart mode: Timer for each cart item
const cartItemTimers = new Map<string, any>();

function startCartItemHoldTimer(index: number) {
  const item = cart.value[index];
  if (!item?.hold) return;

  const itemId = item.id;

  // Clear existing timer
  if (cartItemTimers.has(itemId)) {
    clearInterval(cartItemTimers.get(itemId));
  }

  const timer = setInterval(() => {
    const expiresAt = new Date(item.hold.expiresAt);
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();

    if (timeLeft <= 0) {
      clearInterval(timer);
      cartItemTimers.delete(itemId);

      // Remove expired item from cart
      const currentIndex = cart.value.findIndex((c) => c.id === itemId);
      if (currentIndex >= 0) {
        cart.value.splice(currentIndex, 1);
        showModal({
          title: t("reservationExpired"),
          message: `${item.slot.start} ${t("itemExpiredRemoved")}`,
          type: "warning",
          confirmText: t("ok"),
        });

        if (cart.value.length === 0 && isCartModeEnabled.value) {
          currentStep.value = 1;
        }
      }
    } else {
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      cartItemHolds.value.set(itemId, {
        expiresAt: expiresAt,
        countdown: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      });
    }
  }, 1000);

  cartItemTimers.set(itemId, timer);
}

function showHoldConfirmationDialog(): Promise<boolean> {
  return showModal({
    title: t("reserveThisSlot"),
    message: `${selectedSlot.value.start} - ${selectedSlot.value.end}\n\n${t(
      "reserveSlotMessage"
    )}`,
    type: "info",
    confirmText: t("yes"),
    cancelText: t("no"),
    showCancel: true,
  });
}

function showAddToCartConfirmationDialog(): Promise<boolean> {
  const themeName = selectedTheme.value?.name || "";
  const slotTime = `${selectedSlot.value.start} - ${selectedSlot.value.end}`;
  const pax = paxCount.value;

  return showModal({
    title: t("addToCartConfirm"),
    message: `${themeName}\n${slotTime}\n${pax} ${t("pax")}\n\n${t(
      "addToCartMessage"
    )}`,
    type: "info",
    confirmText: t("addToCart"),
    cancelText: t("cancel"),
    showCancel: true,
  });
}

// Coupon Functions
const handleApplyCoupon = async () => {
  if (!couponCode.value.trim()) return;

  isValidatingCoupon.value = true;
  couponError.value = "";
  validatedCoupon.value = null;
  selectedCouponItemIndex.value = null; // Reset selection

  try {
    const coupon = await api.validateCoupon(couponCode.value);
    validatedCoupon.value = coupon;

    // Auto-select item if only 1 item in cart (Cart Mode) or in Single Mode
    if (isCartModeEnabled.value && cart.value.length === 1) {
      selectedCouponItemIndex.value = 0;
    } else if (!isCartModeEnabled.value) {
      // Single mode doesn't need index, logic handles it
      selectedCouponItemIndex.value = 0; // Just to be safe
    }
    // If multiple items in cart, user must select
  } catch (error: any) {
    console.error("Coupon validation failed:", error);
    couponError.value = error.message || t("invalidCoupon");
    validatedCoupon.value = null;
  } finally {
    isValidatingCoupon.value = false;
  }
};

const removeCoupon = () => {
  validatedCoupon.value = null;
  couponCode.value = "";
  couponError.value = "";
  selectedCouponItemIndex.value = null;
};

const selectCouponItem = (index: number) => {
  selectedCouponItemIndex.value = index;
};

// Cart Functions (only used when cart mode enabled)
const addToCart = async () => {
  if (!selectedTheme.value || !selectedDate.value || !selectedSlot.value)
    return;

  try {
    // Create hold for this cart item
    const hold = await createCartHold({
      studioId: studioStore.studio!.id,
      themeId: selectedTheme.value.id,
      date: selectedDate.value,
      startTime: parseTime(selectedSlot.value.start),
      endTime: parseTime(selectedSlot.value.end),
    });

    // Calculate item total with date price modifier
    const extraPax = Math.max(
      0,
      paxCount.value - (selectedTheme.value.base_pax || 0)
    );
    const extraPaxCost = extraPax * selectedTheme.value.extra_pax_price;

    let addonsTotal = 0;
    for (const [id, qty] of Object.entries(selectedAddons.value)) {
      const addon = studioStore.addons.find((a) => a.id === id);
      if (addon && qty > 0) {
        addonsTotal += addon.price * qty;
      }
    }

    // Apply special pricing to session base price only
    let sessionPrice = selectedTheme.value.base_price;
    const rule = selectedDatePricingRule.value;
    if (rule && selectedDateInfo.value?.isSpecial) {
      if (rule.rule_type === "percentage_increase") {
        sessionPrice = sessionPrice * (1 + rule.value / 100);
      } else if (rule.rule_type === "fixed_price") {
        // fixed_price means add/subtract a fixed amount (surcharge/discount)
        sessionPrice = sessionPrice + rule.value;
      }
    }

    const itemTotal = sessionPrice + extraPaxCost + addonsTotal;

    const dateInfo = selectedDateInfo.value;

    const cartItem = {
      id: Date.now().toString(),
      theme: selectedTheme.value,
      date: selectedDate.value,
      slot: selectedSlot.value,
      pax: paxCount.value,
      addons: { ...selectedAddons.value },
      total: itemTotal,
      dateInfo: dateInfo,
      hold: hold, // Store hold info
      specialPricing:
        specialPricingAmount.value !== 0
          ? {
              message: specialPricingMessage.value || "",
              amount: specialPricingAmount.value,
            }
          : undefined,
    };

    cart.value.push(cartItem);

    // Start timer for this item
    startCartItemHoldTimer(cart.value.length - 1);

    // Reset selection for next item
    selectedTheme.value = null;
    selectedDate.value = null;
    selectedSlot.value = null;
    paxCount.value = 1;
    selectedAddons.value = {};
    timeSlots.value = [];
  } catch (error: any) {
    if (error.message === "SLOT_NO_LONGER_AVAILABLE") {
      await showModal({
        title: t("slotNoLongerAvailable"),
        message: t("failedToAddToCart"),
        type: "error",
        confirmText: t("ok"),
      });
    } else {
      await showModal({
        title: t("error"),
        message: t("failedToAddToCart"),
        type: "error",
        confirmText: t("ok"),
      });
    }
  }
};

const removeCartItem = async (index: number) => {
  const item = cart.value[index];

  // Release hold if exists
  if (item.hold?.holdId) {
    await releaseCartHold(item.hold.holdId);

    // Clear timer
    if (cartItemTimers.has(item.id)) {
      clearInterval(cartItemTimers.get(item.id));
      cartItemTimers.delete(item.id);
    }
  }

  cart.value.splice(index, 1);

  // Reset coupon selection if cart changes
  if (selectedCouponItemIndex.value === index) {
    selectedCouponItemIndex.value = null; // Selected item removed
  } else if (
    selectedCouponItemIndex.value !== null &&
    selectedCouponItemIndex.value > index
  ) {
    selectedCouponItemIndex.value--; // Shift index if needed
  }

  // If only 1 item left and coupon is valid, auto-select it?
  // Maybe better to just let user select to avoid confusion.
  // But if cart becomes empty, step resets anyway.

  if (cart.value.length === 0 && isCartModeEnabled.value) {
    currentStep.value = 1; // Go back to selection if empty
    removeCoupon(); // Remove coupon if cart is empty
  }
};

const addAnotherSession = () => {
  currentStep.value = 1; // Go to step 1
};

// Date scroller navigation
const scrollDates = (direction: "left" | "right") => {
  if (!dateScroller.value) return;
  const scrollAmount = 200; // pixels to scroll
  const currentScroll = dateScroller.value.scrollLeft;
  const newScroll =
    direction === "left"
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;
  dateScroller.value.scrollTo({ left: newScroll, behavior: "smooth" });
};

// Scroll to the selected date in the date scroller
const scrollToSelectedDate = () => {
  if (!dateScroller.value || !selectedDate.value) return;

  // Wait for DOM to update with dates
  nextTick(() => {
    const selectedDateElement = dateScroller.value?.querySelector(
      `[data-date="${selectedDate.value}"]`
    ) as HTMLElement | null;

    if (selectedDateElement && dateScroller.value) {
      // Scroll the selected date into center of the scroller
      const scrollerWidth = dateScroller.value.offsetWidth;
      const elementLeft = selectedDateElement.offsetLeft;
      const elementWidth = selectedDateElement.offsetWidth;
      const scrollPosition = elementLeft - scrollerWidth / 2 + elementWidth / 2;

      dateScroller.value.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: "smooth",
      });
    }
  });
};
// Helper function to parse time
const parseTime = (timeStr: string): string => {
  if (!timeStr) return "09:00";
  // Remove AM/PM and spaces
  let time = timeStr.replace(/\s*(AM|PM)\s*/i, "");
  const timeParts = time.split(":");
  if (timeParts.length !== 2) return "09:00";

  const hours = Number(timeParts[0]);
  const minutes = Number(timeParts[1]);

  if (isNaN(hours) || isNaN(minutes)) return "09:00";

  // If PM and not 12:xx, add 12 hours
  if (timeStr.toUpperCase().includes("PM") && hours !== 12) {
    time = `${String(hours + 12).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  } else if (timeStr.toUpperCase().includes("AM") && hours === 12) {
    // Handle 12:xx AM -> 00:xx
    time = `00:${String(minutes).padStart(2, "0")}`;
  } else {
    time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }
  return time;
};

const nextStep = async () => {
  const maxStep = isCartModeEnabled.value ? 7 : 6; // Cart mode: 7 steps, Single mode: 6 steps

  // ============================================
  // Step 2 -> 3: Create hold for single mode
  // ============================================
  if (currentStep.value === 2 && !isCartModeEnabled.value) {
    if (!selectedSlot.value) return;

    const confirmed = await showHoldConfirmationDialog();

    if (confirmed) {
      try {
        isCreatingHold.value = true;

        const hold = await createCartHold({
          studioId: studioStore.studio!.id,
          themeId: selectedTheme.value!.id,
          date: selectedDate.value!,
          startTime: parseTime(selectedSlot.value.start),
          endTime: parseTime(selectedSlot.value.end),
        });

        confirmedSlot.value = {
          ...selectedSlot.value,
          hold: hold,
        };
        holdExpiresAt.value = new Date(hold.expiresAt);

        startHoldCountdown();

        currentStep.value++;
      } catch (error: any) {
        if (error.message === "SLOT_NO_LONGER_AVAILABLE") {
          await showModal({
            title: t("slotNoLongerAvailable"),
            message: t("slotNoLongerAvailableMessage"),
            type: "error",
            confirmText: t("ok"),
          });
          // Refresh time slots
          if (selectedTheme.value && studioStore.studio && selectedDate.value) {
            loadingSlots.value = true;
            try {
              const slots = await api.getAvailableTimeSlots(
                studioStore.studio.id,
                selectedTheme.value.id,
                selectedDate.value
              );
              timeSlots.value = slots.map((slot, index) => ({
                id: `slot-${index}`,
                start: formatTimeForDisplay(slot.start || "09:00"),
                end: formatTimeForDisplay(slot.end || "09:30"),
                available: slot.status === "available",
                originalSlot: slot,
              }));
            } catch (err) {
              console.error("Failed to load time slots:", err);
            } finally {
              loadingSlots.value = false;
            }
          }
        }
      } finally {
        isCreatingHold.value = false;
      }
    }
    return;
  }

  // Validate customer form before proceeding from customer info step
  if (
    (isCartModeEnabled.value && currentStep.value === 5) ||
    (!isCartModeEnabled.value && currentStep.value === 4)
  ) {
    if (!validateCustomerForm()) {
      return; // Don't proceed if validation fails
    }
  }

  if (currentStep.value < maxStep) {
    // Cart mode: After step 3, show confirmation then add to cart and go to step 4
    if (isCartModeEnabled.value && currentStep.value === 3) {
      // Show confirmation dialog before adding to cart
      const confirmed = await showAddToCartConfirmationDialog();

      if (confirmed) {
        await addToCart();
        currentStep.value = 4;
      }
    } else {
      currentStep.value++;
    }
  } else {
    // Handle Payment and Booking Creation
    if (isCartModeEnabled.value) {
      // Cart mode: Create bookings for all cart items
      if (cart.value.length === 0) {
        return;
      }

      isProcessingPayment.value = true;

      try {
        const bookingNumbers: string[] = [];

        // Create bookings for each cart item
        for (let i = 0; i < (cart.value || []).length; i++) {
          const item = cart.value[i];

          // Prepare addons array
          const selectedAddonsArray = Object.entries(item.addons)
            .filter(([_, qty]) => qty > 0)
            .map(([addonId, quantity]) => ({
              addon_id: addonId,
              quantity: quantity as number,
            }));

          // Parse time from slot
          const slotStart =
            item.slot?.originalSlot?.start || item.slot?.start || "09:00";
          const slotEnd =
            item.slot?.originalSlot?.end || item.slot?.end || "09:30";
          const startTime =
            slotStart.includes("AM") || slotStart.includes("PM")
              ? parseTime(slotStart)
              : slotStart;
          const endTime =
            slotEnd.includes("AM") || slotEnd.includes("PM")
              ? parseTime(slotEnd)
              : slotEnd;

          // Check if coupon applies to this item
          const isCouponApplied =
            validatedCoupon.value && selectedCouponItemIndex.value === i;

          // Create booking request
          const bookingRequest = {
            theme_id: item.theme.id,
            booking_date: item.date,
            start_time: startTime,
            end_time: endTime,
            pax_count: item.pax,
            customer_name: customerInfo.value.name,
            customer_phone: customerInfo.value.phone,
            customer_email: customerInfo.value.email || "",
            customer_notes: customerInfo.value.notes || "",
            consent_tc: termsAccepted.value,
            consent_marketing: false,
            selected_addons: selectedAddonsArray,
            coupon_code: isCouponApplied
              ? validatedCoupon.value?.code
              : undefined,
            discount_amount: isCouponApplied ? discountAmount.value : undefined,
            session_id: getSessionId(),
          };

          // Create booking
          const createdBooking = await createBooking(bookingRequest);
          bookingNumbers.push(createdBooking.booking_number);

          // Initiate payment for the first booking (all items paid together)
          if (i === 0) {
            // Determine payment type from studio settings
            const paymentType =
              studioStore.websiteSettings?.paymentType || "deposit";

            // Call payment initiation API
            const paymentResult = await api.initiatePayment(
              createdBooking.id,
              paymentType
            );

            // Clear booking state before redirecting
            clearBookingState();

            // Redirect to CHIP checkout
            if (paymentResult.checkoutUrl) {
              window.location.href = paymentResult.checkoutUrl;
              return; // Stop execution after redirect
            }
          }
        }

        // Fallback: If no checkoutUrl (CHIP not configured), redirect to success
        clearBookingState();
        router.push(`/success/${bookingNumbers[0]}`);
      } catch (error: any) {
        console.error("Failed to create bookings:", error);

        // Show error to user
        await showModal({
          title: t("error") || "Error",
          message:
            error.message ||
            t("bookingFailed") ||
            "Failed to create booking. Please try again.",
          type: "error",
          confirmText: t("ok") || "OK",
        });

        isProcessingPayment.value = false;
      }
    } else {
      // Single mode: Create single booking
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
            quantity: quantity as number,
          }));

        // Parse time from slot
        const slotStart =
          selectedSlot.value?.originalSlot?.start ||
          selectedSlot.value?.start ||
          "09:00";
        const slotEnd =
          selectedSlot.value?.originalSlot?.end ||
          selectedSlot.value?.end ||
          "09:30";
        const startTime =
          slotStart.includes("AM") || slotStart.includes("PM")
            ? parseTime(slotStart)
            : slotStart;
        const endTime =
          slotEnd.includes("AM") || slotEnd.includes("PM")
            ? parseTime(slotEnd)
            : slotEnd;

        // Create booking request
        const bookingRequest = {
          theme_id: selectedTheme.value.id,
          booking_date: selectedDate.value,
          start_time: startTime,
          end_time: endTime,
          pax_count: paxCount.value,
          customer_name: customerInfo.value.name,
          customer_phone: customerInfo.value.phone,
          customer_email: customerInfo.value.email || "",
          customer_notes: customerInfo.value.notes || "",
          consent_tc: termsAccepted.value,
          consent_marketing: false,
          selected_addons: selectedAddonsArray,
          coupon_code: validatedCoupon.value?.code,
          discount_amount:
            discountAmount.value > 0 ? discountAmount.value : undefined,
          session_id: getSessionId(),
        };

        // Create booking
        const createdBooking = await createBooking(bookingRequest);

        // Determine payment type from studio settings
        const paymentType =
          studioStore.websiteSettings?.paymentType || "deposit";

        // Initiate payment with CHIP
        const paymentResult = await api.initiatePayment(
          createdBooking.id,
          paymentType
        );

        // Clear booking state before redirecting
        clearBookingState();

        // Redirect to CHIP checkout
        if (paymentResult.checkoutUrl) {
          window.location.href = paymentResult.checkoutUrl;
          return; // Stop execution after redirect
        }

        // Fallback: If no checkoutUrl (CHIP not configured), redirect to success
        router.push(`/success/${createdBooking.booking_number}`);
      } catch (error: any) {
        console.error("Failed to create booking:", error);

        // Show error to user
        await showModal({
          title: t("error") || "Error",
          message:
            error.message ||
            t("bookingFailed") ||
            "Failed to create booking. Please try again.",
          type: "error",
          confirmText: t("ok") || "OK",
        });

        isProcessingPayment.value = false;
      }
    }
  }
};

const prevStep = async () => {
  if (currentStep.value > 1) {
    // If going back from step 3 (Pax & Addons) to step 2 (Time) in single mode with active hold
    // ONLY show warning when going from step 3 to step 2
    if (
      currentStep.value === 3 &&
      !isCartModeEnabled.value &&
      confirmedSlot.value
    ) {
      const confirmGoBack = await showModal({
        title: t("goingBackWillRelease"),
        message: t("goingBackMessage"),
        type: "warning",
        confirmText: t("yes"),
        cancelText: t("no"),
        showCancel: true,
      });

      if (!confirmGoBack) return;

      // Release hold
      if (confirmedSlot.value?.hold?.holdId) {
        await releaseCartHold(confirmedSlot.value.hold.holdId);
      }
      confirmedSlot.value = null;
      holdExpiresAt.value = null;
      if (holdCountdownInterval) clearInterval(holdCountdownInterval);
    }

    currentStep.value--;
    // In cart mode, if going back from step 4 and cart is empty, go to step 1
    if (
      isCartModeEnabled.value &&
      currentStep.value === 4 &&
      cartItemCount.value === 0
    ) {
      currentStep.value = 1;
    }
  } else {
    router.back();
  }
};

// Calculations

// Maximum pax allowed based on theme settings
const maxPax = computed(() => {
  if (!selectedTheme.value) return 1;

  // If strictMaxPeople is true, max is base_pax (no extra pax allowed)
  // If strictMaxPeople is false, max is max_total_people
  if (selectedTheme.value.strict_max_people) {
    return selectedTheme.value.base_pax || 1;
  }

  return (
    selectedTheme.value.max_total_people || selectedTheme.value.base_pax || 1
  );
});

const extraPaxCost = computed(() => {
  if (!selectedTheme.value) return 0;
  const extra = Math.max(
    0,
    paxCount.value - (selectedTheme.value.base_pax || 0)
  );
  return extra * selectedTheme.value.extra_pax_price;
});

const addonsTotal = computed(() => {
  let total = 0;
  for (const [id, qty] of Object.entries(selectedAddons.value)) {
    const addon = studioStore.addons.find((a) => a.id === id);
    if (addon && qty > 0) {
      total += addon.price * qty;
    }
  }
  return total;
});

// Current item total (for cart mode)
const currentItemTotal = computed(() => {
  if (!selectedTheme.value) return 0;

  let sessionPrice = selectedTheme.value.base_price;

  // Apply special pricing to base session price only
  const rule = selectedDatePricingRule.value;
  if (rule && selectedDateInfo.value?.isSpecial) {
    if (rule.rule_type === "percentage_increase") {
      // Apply percentage modifier (e.g., 20% increase)
      sessionPrice = sessionPrice * (1 + rule.value / 100);
    } else if (rule.rule_type === "fixed_price") {
      // fixed_price means add/subtract a fixed amount (surcharge/discount)
      // positive value = surcharge, negative value = discount
      sessionPrice = sessionPrice + rule.value;
    }
  }

  // Add extras and addons on top of the (possibly modified) session price
  return sessionPrice + extraPaxCost.value + addonsTotal.value;
});

// Cart totals (for cart mode)
const cartTotal = computed(() => {
  if (!cart.value || !Array.isArray(cart.value)) return 0;
  return cart.value.reduce((sum, item) => sum + item.total, 0);
});

const cartItemCount = computed(() => {
  if (!cart.value || !Array.isArray(cart.value)) return 0;
  return cart.value.length;
});

const discountAmount = computed(() => {
  if (!validatedCoupon.value) return 0;

  let targetTotal = 0;

  if (isCartModeEnabled.value) {
    // Check if item selected
    if (
      selectedCouponItemIndex.value === null ||
      selectedCouponItemIndex.value < 0 ||
      selectedCouponItemIndex.value >= cart.value.length
    ) {
      return 0;
    }
    targetTotal = cart.value[selectedCouponItemIndex.value].total;
  } else {
    targetTotal = currentItemTotal.value;
  }

  // Check min spend
  if (
    validatedCoupon.value.min_spend &&
    targetTotal < validatedCoupon.value.min_spend
  ) {
    return 0; // Min spend not met
  }

  let discount = 0;
  if (validatedCoupon.value.type === "percentage") {
    discount = targetTotal * (validatedCoupon.value.value / 100);
  } else {
    discount = validatedCoupon.value.value;
  }

  // Cap discount at target total
  return Math.min(discount, targetTotal);
});

// Grand total (conditional based on mode)
const grandTotal = computed(() => {
  let total = 0;
  if (isCartModeEnabled.value) {
    // In cart mode: use cartTotal if items exist, otherwise use currentItemTotal (for steps 1-3)
    total = cart.value.length > 0 ? cartTotal.value : currentItemTotal.value;
  } else {
    total = currentItemTotal.value;
  }
  return Math.max(0, total - discountAmount.value);
});

const paymentType = computed(() => {
  return studioStore.studio?.settings.payment_type || "deposit";
});

const depositPercentage = computed(() => {
  // Calculate percentage for display based on theme's deposit amount
  if (!selectedTheme.value || !grandTotal.value) return 50;

  // If theme has a deposit_amount, calculate percentage from that
  if (selectedTheme.value.deposit_amount) {
    return Math.round(
      (selectedTheme.value.deposit_amount / grandTotal.value) * 100
    );
  }

  return studioStore.studio?.settings.deposit_percentage || 50;
});

const depositAmount = computed(() => {
  if (!selectedTheme.value) return 0;

  // Use theme's deposit_amount if available (fixed deposit in sen)
  if (selectedTheme.value.deposit_amount) {
    return selectedTheme.value.deposit_amount;
  }

  // Fallback: calculate based on percentage
  if (!grandTotal.value) return 0;
  const percentage = studioStore.studio?.settings.deposit_percentage || 50;
  return grandTotal.value * (percentage / 100);
});

const paymentAmount = computed(() => {
  if (paymentType.value === "full") {
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

// Get the pricing rule for the selected date (if any)
const selectedDatePricingRule = computed(() => {
  if (!selectedDate.value) return null;
  const dateStr = selectedDate.value;

  return pricingRules.value.find((rule) => {
    return dateStr >= rule.date_range_start && dateStr <= rule.date_range_end;
  });
});

// Format the surcharge/discount message for display
const specialPricingMessage = computed(() => {
  const rule = selectedDatePricingRule.value;
  if (!rule) return null;

  if (rule.rule_type === "percentage_increase") {
    // Positive value = surcharge, negative value = discount
    if (rule.value > 0) {
      return `+${rule.value}% ${t("surcharge")}`;
    } else {
      return `${rule.value}% ${t("discount")}`;
    }
  } else if (rule.rule_type === "fixed_price") {
    // fixed_price means add/subtract a fixed amount (surcharge/discount)
    // value is in cents, convert to RM for display
    const amountInRM = Number(rule.value) / 100;
    if (amountInRM >= 0) {
      return `+RM ${amountInRM.toFixed(2)} ${t("surcharge")}`;
    } else {
      return `RM ${amountInRM.toFixed(2)} ${t("discount")}`;
    }
  }

  return null;
});

// Calculate the special pricing amount (surcharge/discount)
const specialPricingAmount = computed(() => {
  if (!selectedTheme.value) return 0;
  if (!selectedDatePricingRule.value || !selectedDateInfo.value?.isSpecial)
    return 0;

  const rule = selectedDatePricingRule.value;
  const basePrice = selectedTheme.value.base_price;

  if (rule.rule_type === "percentage_increase") {
    // Calculate the percentage amount
    return basePrice * (rule.value / 100);
  } else if (rule.rule_type === "fixed_price") {
    // Fixed amount surcharge/discount
    return rule.value;
  }

  return 0;
});
// ============================================
// Auto-Save Booking State
// ============================================
watch(
  [
    selectedTheme,
    selectedDate,
    selectedSlot,
    confirmedSlot,
    cart,
    customerInfo,
    currentStep,
    paxCount,
    selectedAddons,
  ],
  () => {
    if (!studioStore.studio) return;

    // Only save if there's meaningful progress to recover
    const hasMeaningfulProgress =
      selectedTheme.value ||
      currentStep.value > 1 ||
      (cart.value && cart.value.length > 0);

    if (!hasMeaningfulProgress) {
      // Clear saved state if no meaningful progress
      try {
        localStorage.removeItem("booking_state");
      } catch (error) {
        console.error("Failed to clear booking state:", error);
      }
      return;
    }

    const state = {
      mode: isCartModeEnabled.value ? "cart" : "single",
      sessionId: getSessionId(),
      studioSlug: studioStore.studio.slug,
      selectedTheme: selectedTheme.value,
      selectedDate: selectedDate.value,
      selectedSlot: selectedSlot.value,
      confirmedSlot: confirmedSlot.value,
      paxCount: paxCount.value,
      selectedAddons: selectedAddons.value,
      cartItems: cart.value,
      customerInfo: customerInfo.value,
      currentStep: currentStep.value,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("booking_state", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save booking state:", error);
    }
  },
  { deep: true }
);
</script>

<template>
  <div
    class="min-h-screen relative font-sans text-gray-900 pb-20"
    style="font-family: 'Bricolage Grotesque', sans-serif"
  >
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
      <div class="absolute inset-0 bg-[#Fcf9f6]/90 backdrop-blur-sm z-10"></div>
    </div>

    <!-- Content Wrapper -->
    <div class="relative z-20">
      <!-- Header -->
      <header
        class="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between transition-all duration-300"
      >
        <button
          @click="prevStep"
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          :disabled="isProcessingPayment"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>
        <h1
          class="text-lg font-bold font-serif tracking-wide transition-opacity duration-300 text-gray-900"
        >
          {{ steps[currentStep - 1]?.title || t("booking") }}
        </h1>
        <div class="w-8 flex items-center justify-end">
          <div
            v-if="isCartModeEnabled && cartItemCount > 0"
            @click="currentStep = 4"
            class="relative flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity"
          >
            <ShoppingBag class="w-5 h-5" />
            <span
              class="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >{{ cartItemCount }}</span
            >
          </div>
        </div>
      </header>

      <!-- Hold Status Banner (shown when hold is active) -->
      <div
        v-if="
          confirmedSlot &&
          holdExpiresAt &&
          currentStep > 2 &&
          !isCartModeEnabled
        "
        class="sticky top-16 z-30 bg-amber-50 border-b border-amber-200 px-4 py-3"
      >
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-amber-600" />
            <span class="text-sm font-medium text-amber-900">
              {{ t("reserved") }}: {{ selectedSlot?.start }} -
              {{ selectedSlot?.end }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-amber-900">
              {{ holdCountdown }}
            </span>
            <button
              @click="handleChangeSlot"
              class="text-xs text-amber-700 hover:text-amber-900 underline"
            >
              {{ t("changeTime") }}
            </button>
          </div>
        </div>
      </div>

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
          <div
            class="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center space-y-6 max-w-xs w-full mx-4"
          >
            <div class="relative">
              <div
                class="w-16 h-16 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"
              ></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <CreditCard class="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <div class="text-center space-y-2">
              <h3 class="text-xl font-bold font-serif">
                {{ t("processingPayment") }}
              </h3>
              <p class="text-sm text-gray-500">{{ t("pleaseWait") }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Recovery Dialog -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showRecoveryDialog && recoveryState"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div class="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
            <h3 class="text-2xl font-bold font-serif mb-4">
              {{ t("restoreYourBooking") }}
            </h3>
            <p class="text-sm text-gray-600 mb-6">
              {{ t("restoreBookingMessage") }}
            </p>

            <div class="space-y-2 text-sm mb-6 bg-gray-50 p-4 rounded-xl">
              <div v-if="recoveryState.selectedTheme">
                <span class="font-bold">{{ t("theme") }}:</span>
                {{ recoveryState.selectedTheme.name }}
              </div>
              <div v-if="recoveryState.selectedDate">
                <span class="font-bold">{{ t("date") }}:</span>
                {{ recoveryState.selectedDate }}
              </div>
              <div v-if="recoveryState.selectedSlot">
                <span class="font-bold">{{ t("time") }}:</span>
                {{ recoveryState.selectedSlot.start }}
              </div>
            </div>

            <div class="flex gap-3">
              <button
                @click="restoreBookingState(recoveryState)"
                :disabled="isRecovering"
                class="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isRecovering" class="w-4 h-4 animate-spin" />
                {{
                  isRecovering
                    ? t("restoring")
                    : `${t("yes")}, ${t("continue")}`
                }}
              </button>
              <button
                @click="dismissRecoveryDialog"
                class="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-bold text-sm uppercase tracking-wider"
              >
                {{ t("startFresh") }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Progress Bar -->
      <div class="h-1 bg-gray-200 w-full">
        <div
          class="h-full bg-gray-900 transition-all duration-300 ease-out"
          :style="{
            width: `${(currentStep / (isCartModeEnabled ? 7 : 6)) * 100}%`,
          }"
        ></div>
      </div>

      <main class="p-4 sm:p-6 max-w-4xl mx-auto space-y-8 pb-32">
        <!-- Theme Overview (shown in steps 2-4, excluding terms and summary) -->
        <div
          v-if="
            currentStep > 1 &&
            currentStep < (isCartModeEnabled ? 6 : 5) &&
            selectedTheme &&
            currentStep !== (isCartModeEnabled ? 7 : 6)
          "
          class="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm animate-fade-in"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
            >
              <img
                :src="selectedTheme.images[0]"
                :alt="selectedTheme.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold font-serif text-lg text-gray-900 truncate">
                {{ selectedTheme.name }}
              </h3>
              <p class="text-sm text-gray-600 font-sans mt-0.5 line-clamp-1">
                {{ selectedTheme.description_short }}
              </p>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ selectedTheme.duration_minutes }}m
                </span>
                <span class="flex items-center gap-1">
                  <Users class="w-3 h-3" /> {{ selectedTheme.base_pax }}
                  {{ t("people") }}
                </span>
                <span class="font-bold text-gray-900"
                  >RM{{ formatPriceWhole(selectedTheme.base_price) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Step 1: Themes -->
        <div
          v-if="currentStep === 1"
          class="space-y-6 animate-fade-in md:grid md:grid-cols-2 md:gap-6 md:space-y-0"
        >
          <!-- Loading Skeleton -->
          <template v-if="loadingThemes">
            <div
              v-for="i in 4"
              :key="`skeleton-${i}`"
              class="bg-white rounded-3xl overflow-hidden shadow-sm border-2 border-gray-100 animate-pulse"
            >
              <!-- Image skeleton -->
              <div class="aspect-[4/3] bg-gray-200 animate-pulse"></div>
            </div>
          </template>

          <!-- Themes -->
          <div
            v-else
            v-for="theme in studioStore.themes"
            :key="theme.id"
            class="bg-white rounded-3xl overflow-hidden shadow-sm border-2 group cursor-pointer hover:shadow-xl transition-all duration-300 relative"
            :class="
              selectedTheme?.id === theme.id
                ? 'border-gray-900 ring-2 ring-gray-900/20 shadow-lg'
                : 'border-gray-100 hover:border-gray-200'
            "
            @click="selectTheme(theme)"
          >
            <!-- Selected Indicator -->
            <div
              v-if="selectedTheme?.id === theme.id"
              class="absolute top-4 left-4 z-30 bg-gray-900 text-white rounded-full p-2 shadow-lg"
            >
              <Check class="w-5 h-5" />
            </div>
            <div
              class="aspect-[4/3] bg-gray-100 relative overflow-hidden group"
            >
              <img
                :src="theme.images[activeImageIndices[theme.id] || 0]"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              <!-- Image Gallery Thumbs -->
              <div class="absolute top-4 right-4 flex gap-2 z-20" @click.stop>
                <button
                  v-for="(img, idx) in theme.images.slice(0, 4)"
                  :key="idx"
                  @click="setActiveImage(theme.id, idx)"
                  class="w-10 h-10 rounded-lg border-2 overflow-hidden transition-all duration-300 shadow-lg"
                  :class="
                    (activeImageIndices[theme.id] || 0) === idx
                      ? 'border-white scale-110 ring-2 ring-black/20'
                      : 'border-white/50 opacity-80 hover:opacity-100 hover:scale-105'
                  "
                >
                  <img :src="img" class="w-full h-full object-cover" />
                </button>
                <div
                  v-if="theme.images.length > 4"
                  class="w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm border border-white/30 flex items-center justify-center text-[10px] text-white font-bold"
                >
                  +{{ theme.images.length - 4 }}
                </div>
              </div>

              <div
                class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 pointer-events-none"
              ></div>
              <div
                class="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col justify-end h-full pointer-events-none"
              >
                <h3
                  class="text-3xl font-bold font-serif tracking-wide mb-2 leading-tight"
                >
                  {{ theme.name }}
                </h3>

                <p
                  class="text-sm font-sans text-gray-300 mb-4 line-clamp-2 leading-relaxed"
                >
                  {{ theme.description_short }}
                </p>

                <div class="flex items-center justify-between mt-2">
                  <div
                    class="flex items-center gap-3 text-xs font-sans font-medium uppercase tracking-widest text-gray-400"
                  >
                    <span
                      class="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5"
                    >
                      <Clock class="w-3 h-3" /> {{ theme.duration_minutes }}m
                    </span>
                    <span
                      class="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5"
                    >
                      <Users class="w-3 h-3" /> {{ theme.base_pax }}pax
                    </span>
                  </div>
                  <span class="text-2xl font-bold font-serif text-white"
                    >RM{{ formatPriceWhole(theme.base_price) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Date & Time -->
        <div v-if="currentStep === 2" class="space-y-10 animate-fade-in">
          <div class="flex flex-col space-y-4">
            <!-- Instructions Note -->
            <div
              class="bg-blue-50/80 backdrop-blur-sm border border-blue-100/50 p-4 rounded-2xl flex items-start gap-3 text-blue-900 shadow-sm"
            >
              <div class="bg-blue-100 p-2 rounded-full flex-shrink-0">
                <Info class="w-4 h-4" />
              </div>
              <div class="text-sm font-sans leading-relaxed">
                <span
                  class="font-bold block uppercase tracking-wider text-xs mb-1 text-blue-700"
                  >{{ t("selectDateAndTime") }}</span
                >
                {{ t("selectDateAndTimeDescription") }}
              </div>
            </div>

            <!-- Date Scroller -->
            <div class="relative">
              <!-- Left Navigation Button -->
              <button
                @click="scrollDates('left')"
                class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/30 backdrop-blur-md border border-white/50 rounded-full p-2 shadow-lg hover:bg-white/50 transition-all hover:scale-110 active:scale-95 text-gray-700 hover:text-gray-900"
                aria-label="Scroll dates left"
              >
                <ChevronLeft class="w-5 h-5" />
              </button>

              <!-- Right Navigation Button -->
              <button
                @click="scrollDates('right')"
                class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/30 backdrop-blur-md border border-white/50 rounded-full p-2 shadow-lg hover:bg-white/50 transition-all hover:scale-110 active:scale-95 text-gray-700 hover:text-gray-900"
                aria-label="Scroll dates right"
              >
                <ArrowRight class="w-5 h-5" />
              </button>

              <div
                ref="dateScroller"
                class="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x mask-fade scroll-smooth"
              >
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
                  :data-date="d.date"
                  @click="!d.isBlackout && selectDate(d.date)"
                  :disabled="d.isBlackout"
                  :class="[
                    'snap-center flex-shrink-0 w-[4.5rem] h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group',
                    d.isBlackout
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                      : selectedDate === d.date
                      ? 'bg-gray-900 text-white shadow-xl scale-105 ring-4 ring-gray-100'
                      : 'bg-white text-gray-900 border border-gray-100 hover:border-gray-300 hover:text-gray-600',
                  ]"
                >
                  <span
                    class="text-[10px] uppercase font-sans tracking-widest font-medium mb-1"
                    >{{ d.month }}</span
                  >
                  <span class="text-2xl font-bold font-serif leading-none">{{
                    d.day
                  }}</span>
                  <span class="text-[10px] font-sans mt-1 opacity-80">{{
                    d.weekday
                  }}</span>

                  <!-- Blackout Indicator -->
                  <div v-if="d.isBlackout" class="absolute top-2 right-2">
                    <X class="w-3 h-3 text-gray-400" />
                  </div>

                  <!-- Special Pricing Indicator -->
                  <div
                    v-else-if="d.isSpecial"
                    class="absolute top-2 right-2 flex flex-col items-end gap-0.5"
                  >
                    <div
                      :class="[
                        'w-1.5 h-1.5 rounded-full',
                        selectedDate === d.date ? 'bg-white' : 'bg-amber-400',
                      ]"
                    ></div>
                    <span
                      v-if="d.isSpecial"
                      :class="[
                        'text-[8px] font-bold',
                        selectedDate === d.date
                          ? 'text-white'
                          : 'text-amber-600',
                      ]"
                    >
                      Special
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Blackout Date Info -->
            <div
              v-if="isBlackoutDateSelected && selectedDateInfo?.blackoutReason"
              class="bg-red-50/80 backdrop-blur-sm border border-red-100/50 p-4 rounded-2xl flex items-start gap-3 text-red-900 shadow-sm"
            >
              <div class="bg-red-100 p-2 rounded-full flex-shrink-0">
                <AlertCircle class="w-4 h-4" />
              </div>
              <div class="text-xs font-sans leading-relaxed">
                <span
                  class="font-bold block uppercase tracking-wider text-[10px] mb-0.5 text-red-700"
                  >{{ t("blackoutDate") }}</span
                >
                {{ selectedDateInfo.blackoutReason }}
              </div>
            </div>

            <!-- Special Date Info -->
            <div
              v-if="isSpecialDateSelected && selectedDateInfo"
              class="bg-amber-50/80 backdrop-blur-sm border border-amber-100/50 p-4 rounded-2xl flex items-start gap-3 text-amber-900 shadow-sm"
            >
              <div class="bg-amber-100 p-2 rounded-full flex-shrink-0">
                <Info class="w-4 h-4" />
              </div>
              <div class="text-xs font-sans leading-relaxed flex-1">
                <span
                  class="font-bold block uppercase tracking-wider text-[10px] mb-1 text-amber-700"
                  >{{ t("specialDate") }}</span
                >
                <div class="space-y-1">
                  <p class="font-semibold">
                    {{ selectedDateInfo.specialLabel }}
                  </p>
                  <p class="text-amber-800">
                    {{ t("specialPriceApply") }}
                  </p>
                  <!-- Show surcharge/discount amount -->
                  <p
                    v-if="specialPricingMessage"
                    class="font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded-lg inline-block"
                  >
                    {{ specialPricingMessage }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Time Slots -->
          <div
            data-time-section
            class="space-y-4 transition-all duration-500"
            :class="{ 'opacity-50 blur-sm pointer-events-none': !selectedDate }"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold font-serif flex items-center gap-2">
                <Clock class="w-5 h-5" /> {{ t("selectTime") }}
              </h3>
              <span
                v-if="selectedDate"
                class="text-xs font-sans text-gray-400 uppercase tracking-wider"
                >{{
                  selectedSlot ? t("oneSlotSelected") : t("selectOneSlot")
                }}</span
              >
            </div>

            <!-- Loading State -->
            <div
              v-if="loadingSlots"
              class="flex items-center justify-center py-8"
            >
              <Loader2 class="w-6 h-6 animate-spin text-gray-400" />
            </div>

            <!-- Time Slots Grid -->
            <div
              v-else-if="timeSlots.length > 0"
              class="grid grid-cols-2 gap-3"
            >
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
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900',
                ]"
              >
                <span class="font-bold text-sm"
                  >{{ slot.start }} - {{ slot.end }}</span
                >

                <div
                  v-if="selectedSlot?.id === slot.id"
                  class="absolute inset-0 bg-white/10"
                ></div>
              </button>
            </div>

            <!-- No Slots Available -->
            <div
              v-else-if="selectedDate && !loadingSlots"
              class="text-center py-8 text-gray-500 text-sm font-sans"
            >
              {{
                t("noSlotsAvailable") || "Tiada slot tersedia untuk tarikh ini"
              }}
            </div>
          </div>
        </div>

        <!-- Step 3: Pax & Addons -->
        <div v-if="currentStep === 3" class="space-y-8 animate-fade-in">
          <!-- Note about entering pax -->
          <div
            class="bg-blue-50/80 backdrop-blur-sm border border-blue-100/50 p-4 rounded-2xl flex items-start gap-3 text-blue-900 shadow-sm"
          >
            <div class="bg-blue-100 p-2 rounded-full flex-shrink-0">
              <Info class="w-4 h-4" />
            </div>
            <div class="text-sm font-sans leading-relaxed">
              <span
                class="font-bold block uppercase tracking-wider text-xs mb-1 text-blue-700"
                >{{ t("note") }}</span
              >
              {{ t("enterPaxNote") }}
            </div>
          </div>

          <!-- Pax Counter -->
          <div
            class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6"
          >
            <div
              class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 sm:gap-0"
            >
              <div class="w-full sm:w-auto">
                <h3 class="font-bold font-serif text-xl">
                  {{ t("numberOfPeople") }}
                </h3>
                <p class="text-sm text-gray-500 font-sans mt-1">
                  {{ t("baseIncluded") }}:
                  <span class="font-medium text-gray-900"
                    >{{ selectedTheme?.base_pax }} {{ t("people") }}</span
                  >
                  <span class="text-gray-400 mx-1">•</span>
                  <span class="text-gray-500"
                    >Max:
                    {{
                      selectedTheme?.strict_max_people
                        ? maxPax
                        : selectedTheme?.max_total_people
                    }}
                    {{ t("people") }}</span
                  >
                </p>
              </div>
              <div
                class="flex items-center justify-between sm:justify-start gap-6 bg-gray-50 rounded-full p-1.5 border border-gray-200/50 w-full sm:w-auto"
              >
                <button
                  @click="paxCount > 1 ? paxCount-- : null"
                  class="w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black disabled:opacity-50 transition-all active:scale-95"
                  :disabled="paxCount <= 1"
                >
                  <Minus class="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <span
                  class="font-bold font-serif text-xl sm:text-xl w-8 sm:w-6 text-center"
                  >{{ paxCount }}</span
                >
                <button
                  @click="paxCount < maxPax ? paxCount++ : null"
                  class="w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-600 hover:text-black disabled:opacity-50 transition-all active:scale-95"
                  :disabled="paxCount >= maxPax"
                >
                  <Plus class="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div
              v-if="extraPaxCost > 0"
              class="bg-gray-50 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm font-sans gap-2 sm:gap-0"
            >
              <div class="text-gray-600 flex items-center gap-2">
                <Users class="w-4 h-4" />
                <span
                  >{{ t("additionalCharge") }} ({{
                    paxCount - (selectedTheme!.base_pax || 0)
                  }}
                  {{ t("pax") }})</span
                >
              </div>
              <span class="font-bold text-gray-900"
                >+ RM{{ formatPriceWhole(extraPaxCost) }}</span
              >
            </div>
          </div>

          <!-- Addons List -->
          <div class="space-y-3 sm:space-y-4">
            <h3 class="font-bold font-serif text-lg sm:text-xl px-1">
              {{ t("addOns") }}
            </h3>

            <!-- Empty State - No Addons Available -->
            <div
              v-if="!studioStore.addons || studioStore.addons.length === 0"
              class="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center"
            >
              <div
                class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <Plus class="w-8 h-8 text-gray-300" />
              </div>
              <p class="text-gray-500 font-sans text-sm">
                {{
                  t("noAddonsAvailable") ||
                  "No add-ons available for this theme"
                }}
              </p>
            </div>

            <!-- Addons List -->
            <div
              v-for="addon in studioStore.addons"
              :key="addon.id"
              class="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center transition-all hover:shadow-md"
              :class="{
                'border-gray-900 ring-1 ring-gray-900 bg-gray-50/50':
                  selectedAddons[addon.id],
              }"
            >
              <!-- Addon Image -->
              <div
                v-if="addon.image"
                class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100"
              >
                <img
                  :src="addon.image"
                  :alt="addon.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <Plus class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>

              <div class="flex-1 min-w-0 w-full sm:w-auto">
                <div class="font-bold font-serif text-base sm:text-lg">
                  {{ addon.name }}
                </div>
                <div class="text-xs sm:text-sm text-gray-500 font-sans mt-0.5">
                  RM{{ formatPriceWhole(addon.price) }}
                  <span
                    v-if="addon.max_quantity !== 1"
                    class="text-xs opacity-70"
                    >{{ t("perUnit") }}</span
                  >
                </div>
              </div>

              <div
                v-if="addon.max_quantity === 1"
                class="flex items-center self-end sm:self-auto"
              >
                <button
                  @click="updateAddon(addon, selectedAddons[addon.id] ? -1 : 1)"
                  :class="[
                    'w-10 h-10 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all duration-300',
                    selectedAddons[addon.id]
                      ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-110'
                      : 'bg-white border-gray-300 hover:border-gray-400',
                  ]"
                >
                  <Check
                    v-if="selectedAddons[addon.id]"
                    class="w-5 h-5 sm:w-4 sm:h-4"
                  />
                </button>
              </div>
              <div
                v-else
                class="flex items-center gap-3 sm:gap-4 bg-gray-50 rounded-full p-1 border border-gray-200/50 self-end sm:self-auto"
              >
                <button
                  @click="updateAddon(addon, -1)"
                  class="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-all active:scale-90"
                  :disabled="!selectedAddons[addon.id]"
                >
                  <Minus class="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
                <span
                  class="font-serif font-bold w-6 sm:w-4 text-center text-base sm:text-sm"
                  >{{ selectedAddons[addon.id] || 0 }}</span
                >
                <button
                  @click="updateAddon(addon, 1)"
                  class="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-90"
                >
                  <Plus class="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Conditional - Cart Review (Cart Mode) or Customer Information (Single Mode) -->
        <!-- Cart Mode: Cart Review -->
        <div
          v-if="currentStep === 4 && isCartModeEnabled"
          class="space-y-8 animate-fade-in"
        >
          <div class="space-y-4">
            <h2 class="text-2xl font-bold font-serif">
              {{ t("yourSessions") || "Your Sessions" }}
            </h2>
            <!-- Empty Cart State -->
            <div
              v-if="cartItemCount === 0"
              class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center"
            >
              <p class="text-gray-500 font-sans">
                {{
                  t("cartEmpty") ||
                  "Your cart is empty. Add a session to continue."
                }}
              </p>
              <button
                @click="addAnotherSession"
                class="mt-4 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg transition-all"
              >
                {{ t("addSession") || "Add Session" }}
              </button>
            </div>
            <!-- Cart Items -->
            <div
              v-for="(item, index) in cart || []"
              :key="item.id"
              class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group"
            >
              <button
                @click="removeCartItem(index)"
                class="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              <div class="pr-10">
                <h3 class="font-bold font-serif text-lg">
                  {{ item.theme.name }}
                </h3>
                <div class="text-sm text-gray-500 mt-1 space-y-1">
                  <div class="flex items-center gap-2">
                    <Calendar class="w-3 h-3" /> {{ item.date }}
                    <Clock class="w-3 h-3 ml-2" /> {{ item.slot.start }} -
                    {{ item.slot.end }}
                  </div>
                  <div class="flex items-center gap-2">
                    <Users class="w-3 h-3" /> {{ item.pax }}
                    {{ t("pax") || "Pax" }}
                  </div>
                  <!-- Hold countdown for this item -->
                  <div
                    v-if="cartItemHolds.get(item.id)"
                    class="flex items-center gap-2 text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit"
                  >
                    <Clock class="w-3 h-3" />
                    <span class="text-xs font-bold">
                      {{ cartItemHolds.get(item.id)?.countdown }}
                    </span>
                  </div>
                </div>
                <div class="mt-3 font-bold font-serif text-gray-900">
                  RM{{ formatPriceWhole(item.total) }}
                </div>
              </div>
            </div>

            <!-- Add Another Session Button -->
            <button
              @click="addAnotherSession"
              class="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase tracking-widest text-xs hover:border-gray-900 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
            >
              <Plus class="w-4 h-4" />
              {{ t("addAnotherSession") || "Add Another Session" }}
            </button>
          </div>

          <!-- Totals -->
          <div
            class="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 space-y-4"
          >
            <h3 class="font-bold font-serif text-lg">
              {{ t("paymentSummary") || "Payment Summary" }}
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500"
                  >{{ t("totalSessions") || "Total Sessions" }} ({{
                    cartItemCount
                  }})</span
                >
                <span class="font-medium"
                  >RM{{ formatPriceWhole(cartTotal) }}</span
                >
              </div>
              <div
                class="flex justify-between items-center pt-4 border-t border-gray-100"
              >
                <span class="font-bold text-gray-900">
                  {{
                    paymentType === "full"
                      ? t("payFullPaymentLabel") || "Pay Full Amount"
                      : t("payDeposit") + ` (${depositPercentage}%)`
                  }}
                </span>
                <span class="font-bold font-serif text-2xl text-gray-900"
                  >RM{{ formatPriceWhole(paymentAmount) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Single Mode: Customer Information -->
        <div
          v-if="currentStep === 4 && !isCartModeEnabled"
          class="space-y-8 animate-fade-in"
        >
          <div class="space-y-6 px-2">
            <h3 class="font-bold font-serif text-xl">
              {{ t("customerInformation") }}
            </h3>

            <!-- Note about filling details -->
            <div
              class="bg-blue-50/80 backdrop-blur-sm border border-blue-100/50 p-4 rounded-2xl flex items-start gap-3 text-blue-900 shadow-sm"
            >
              <div class="bg-blue-100 p-2 rounded-full flex-shrink-0">
                <Info class="w-4 h-4" />
              </div>
              <div class="text-sm font-sans leading-relaxed">
                <span
                  class="font-bold block uppercase tracking-wider text-xs mb-1 text-blue-700"
                  >{{ t("important") }}</span
                >
                {{ t("fillDetailsNote") }}
              </div>
            </div>

            <div
              class="space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div class="relative group">
                <input
                  type="text"
                  v-model="customerInfo.name"
                  @blur="validateName"
                  @input="formErrors.name = ''"
                  id="name"
                  required
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent"
                  :class="
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-900'
                  "
                  :placeholder="t('enterFullName')"
                />
                <label
                  for="name"
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase"
                  :class="
                    formErrors.name
                      ? 'text-red-600 peer-placeholder-shown:text-red-400'
                      : 'text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900'
                  "
                >
                  {{ t("fullName") }}
                </label>
                <p
                  v-if="formErrors.name"
                  class="mt-1 text-xs text-red-500 font-sans"
                >
                  {{ formErrors.name }}
                </p>
              </div>

              <div class="relative group">
                <input
                  type="tel"
                  v-model="customerInfo.phone"
                  @blur="validatePhone"
                  @input="formErrors.phone = ''"
                  id="phone"
                  required
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent"
                  :class="
                    formErrors.phone
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-900'
                  "
                  :placeholder="t('enterPhone')"
                />
                <label
                  for="phone"
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase"
                  :class="
                    formErrors.phone
                      ? 'text-red-600 peer-placeholder-shown:text-red-400'
                      : 'text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900'
                  "
                >
                  {{ t("phoneNumber") }}
                </label>
                <p
                  v-if="formErrors.phone"
                  class="mt-1 text-xs text-red-500 font-sans"
                >
                  {{ formErrors.phone }}
                </p>
                <p v-else class="mt-1 text-xs text-gray-500 font-sans">
                  {{ t("preferWhatsApp") }}
                </p>
              </div>

              <div class="relative group">
                <input
                  type="email"
                  v-model="customerInfo.email"
                  @blur="validateEmail"
                  @input="formErrors.email = ''"
                  id="email"
                  required
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent"
                  :class="
                    formErrors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-900'
                  "
                  :placeholder="t('enterEmail')"
                />
                <label
                  for="email"
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase"
                  :class="
                    formErrors.email
                      ? 'text-red-600 peer-placeholder-shown:text-red-400'
                      : 'text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900'
                  "
                >
                  {{ t("email") }}
                </label>
                <p
                  v-if="formErrors.email"
                  class="mt-1 text-xs text-red-500 font-sans"
                >
                  {{ formErrors.email }}
                </p>
                <p v-else class="mt-1 text-xs text-gray-500 font-sans">
                  {{ t("emailConfirmationNote") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Conditional - Customer Information (Cart Mode) or Terms & Conditions (Single Mode) -->
        <!-- Cart Mode: Customer Information -->
        <div
          v-if="currentStep === 5 && isCartModeEnabled"
          class="space-y-8 animate-fade-in"
        >
          <div class="space-y-6 px-2">
            <h3 class="font-bold font-serif text-xl">
              {{ t("customerInformation") }}
            </h3>

            <!-- Note about filling details -->
            <div
              class="bg-blue-50/80 backdrop-blur-sm border border-blue-100/50 p-4 rounded-2xl flex items-start gap-3 text-blue-900 shadow-sm"
            >
              <div class="bg-blue-100 p-2 rounded-full flex-shrink-0">
                <Info class="w-4 h-4" />
              </div>
              <div class="text-sm font-sans leading-relaxed">
                <span
                  class="font-bold block uppercase tracking-wider text-xs mb-1 text-blue-700"
                  >Penting</span
                >
                {{ t("fillDetailsNote") }}
              </div>
            </div>

            <div
              class="space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div class="relative group">
                <input
                  type="text"
                  v-model="customerInfo.name"
                  @blur="validateName"
                  @input="formErrors.name = ''"
                  id="cart-name"
                  required
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent"
                  :class="
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-900'
                  "
                  :placeholder="t('enterFullName')"
                />
                <label
                  for="cart-name"
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase"
                  :class="
                    formErrors.name
                      ? 'text-red-600 peer-placeholder-shown:text-red-400'
                      : 'text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900'
                  "
                >
                  {{ t("fullName") }}
                </label>
                <p
                  v-if="formErrors.name"
                  class="mt-1 text-xs text-red-500 font-sans"
                >
                  {{ formErrors.name }}
                </p>
              </div>

              <div class="relative group">
                <input
                  type="tel"
                  v-model="customerInfo.phone"
                  @blur="validatePhone"
                  @input="formErrors.phone = ''"
                  id="cart-phone"
                  required
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent"
                  :class="
                    formErrors.phone
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-900'
                  "
                  :placeholder="t('enterPhone')"
                />
                <label
                  for="cart-phone"
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase"
                  :class="
                    formErrors.phone
                      ? 'text-red-600 peer-placeholder-shown:text-red-400'
                      : 'text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900'
                  "
                >
                  {{ t("phoneNumber") }}
                </label>
                <p
                  v-if="formErrors.phone"
                  class="mt-1 text-xs text-red-500 font-sans"
                >
                  {{ formErrors.phone }}
                </p>
                <p v-else class="mt-1 text-xs text-gray-500 font-sans">
                  {{ t("preferWhatsApp") }}
                </p>
              </div>

              <div class="relative group">
                <input
                  type="email"
                  v-model="customerInfo.email"
                  @blur="validateEmail"
                  @input="formErrors.email = ''"
                  id="cart-email"
                  required
                  class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none font-sans text-lg transition-colors placeholder-transparent"
                  :class="
                    formErrors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-900'
                  "
                  :placeholder="t('enterEmail')"
                />
                <label
                  for="cart-email"
                  class="absolute left-0 -top-1 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:-top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase"
                  :class="
                    formErrors.email
                      ? 'text-red-600 peer-placeholder-shown:text-red-400'
                      : 'text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-gray-900'
                  "
                >
                  {{ t("email") }}
                </label>
                <p
                  v-if="formErrors.email"
                  class="mt-1 text-xs text-red-500 font-sans"
                >
                  {{ formErrors.email }}
                </p>
                <p v-else class="mt-1 text-xs text-gray-500 font-sans">
                  {{ t("emailConfirmationNote") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 6: Conditional - Terms & Conditions (Cart Mode) or Summary (Single Mode) -->
        <!-- Cart Mode: Terms & Conditions -->
        <div
          v-if="currentStep === 6 && isCartModeEnabled"
          class="space-y-6 animate-fade-in"
        >
          <div class="space-y-4">
            <!-- <h3 class="font-bold font-serif text-lg sm:text-xl px-1">{{ t('termsAndConditions') }}</h3> -->

            <!-- Scrollable Terms Container -->
            <div
              class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto"
            >
              <div class="p-6 space-y-6">
                <!-- Loading State -->
                <div v-if="loadingTerms" class="flex justify-center py-8">
                  <Loader2 class="w-6 h-6 animate-spin text-gray-400" />
                </div>

                <!-- Terms Content -->
                <div
                  v-else-if="termsContent"
                  class="prose prose-sm sm:prose max-w-none font-sans text-gray-700 space-y-4"
                >
                  <h4 class="font-bold font-serif text-lg text-gray-900">
                    {{ t("bookingTerms") || "Booking Terms" }}
                  </h4>

                  <div
                    class="space-y-4 text-sm sm:text-base leading-relaxed"
                    v-html="termsContentHtml"
                  />
                </div>

                <!-- No Terms Configured Fallback -->
                <div v-else class="text-center py-8 text-gray-500">
                  <p>
                    {{
                      t("noTermsConfigured") ||
                      "Tiada terma dan syarat dikonfigurasi."
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Custom Checkbox -->
            <div
              class="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 flex items-start gap-3 sm:gap-4 transition-all duration-300"
              :class="
                termsAccepted
                  ? 'border-gray-900 bg-gray-50/50'
                  : 'hover:border-gray-300'
              "
            >
              <!-- Custom Checkbox Button -->
              <button
                @click="termsAccepted = !termsAccepted"
                type="button"
                class="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                :class="
                  termsAccepted
                    ? 'bg-gray-900 border-gray-900 shadow-md scale-105'
                    : 'bg-white border-gray-300 hover:border-gray-400 active:scale-95'
                "
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
                <span
                  class="block text-sm sm:text-base font-bold font-sans text-gray-900 mb-1"
                >
                  {{ t("agreeToTerms") }}
                </span>
                <span
                  class="block text-xs sm:text-sm text-gray-600 font-sans leading-relaxed"
                >
                  {{
                    t("termsAcceptanceNote") ||
                    "Saya telah membaca dan memahami semua terma dan syarat di atas."
                  }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Single Mode: Terms & Conditions -->
        <div
          v-if="currentStep === 5 && !isCartModeEnabled"
          class="space-y-6 animate-fade-in"
        >
          <div class="space-y-4">
            <!-- <h3 class="font-bold font-serif text-lg sm:text-xl px-1">{{ t('termsAndConditions') }}</h3> -->

            <!-- Scrollable Terms Container -->
            <div
              class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto"
              style=""
            >
              <div class="p-6 space-y-6">
                <!-- Loading State -->
                <div v-if="loadingTerms" class="flex justify-center py-8">
                  <Loader2 class="w-6 h-6 animate-spin text-gray-400" />
                </div>

                <!-- Terms Content -->
                <div
                  v-else-if="termsContent"
                  class="prose prose-sm sm:prose max-w-none font-sans text-gray-700 space-y-4"
                >
                  <h4 class="font-bold font-serif text-lg text-gray-900">
                    {{ t("bookingTerms") }}
                  </h4>

                  <div
                    class="space-y-4 text-sm sm:text-base leading-relaxed"
                    v-html="termsContentHtml"
                  />
                </div>

                <!-- No Terms Configured Fallback -->
                <div v-else class="text-center py-8 text-gray-500">
                  <p>
                    {{
                      t("noTermsConfigured") ||
                      "Tiada terma dan syarat dikonfigurasi."
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Custom Checkbox -->
            <div
              class="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 flex items-start gap-3 sm:gap-4 transition-all duration-300"
              :class="
                termsAccepted
                  ? 'border-gray-900 bg-gray-50/50'
                  : 'hover:border-gray-300'
              "
            >
              <!-- Custom Checkbox Button -->
              <button
                @click="termsAccepted = !termsAccepted"
                type="button"
                class="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                :class="
                  termsAccepted
                    ? 'bg-gray-900 border-gray-900 shadow-md scale-105'
                    : 'bg-white border-gray-300 hover:border-gray-400 active:scale-95'
                "
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
                <span
                  class="block text-sm sm:text-base font-bold font-sans text-gray-900 mb-1"
                >
                  {{ t("agreeToTerms") }}
                </span>
                <span
                  class="block text-xs sm:text-sm text-gray-600 font-sans leading-relaxed"
                >
                  {{
                    t("termsAcceptanceNote") ||
                    "Saya telah membaca dan memahami semua terma dan syarat di atas."
                  }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 7: Summary (Cart Mode) -->
        <div
          v-if="currentStep === 7 && isCartModeEnabled"
          class="space-y-8 animate-fade-in"
        >
          <!-- Booking Summary Card -->
          <div
            class="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
          >
            <div
              class="bg-gray-900 p-6 text-white flex justify-between items-center"
            >
              <div>
                <h3 class="font-bold font-serif text-xl">
                  {{ t("bookingSummary") }}
                </h3>
                <p
                  class="text-xs text-gray-400 font-sans mt-1 uppercase tracking-wider"
                >
                  {{ t("multipleSessions") || "Multiple Sessions" }}
                </p>
              </div>
              <div class="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <CreditCard class="w-6 h-6" />
              </div>
            </div>

            <div class="p-6 space-y-6">
              <!-- Cart Items Summary -->
              <div
                v-for="item in cart || []"
                :key="item.id"
                class="pb-6 border-b border-dashed border-gray-200 last:border-0 last:pb-0"
              >
                <div
                  class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3"
                >
                  <div class="flex-1">
                    <div class="font-bold font-serif text-lg mb-2">
                      {{ item.theme.name }}
                    </div>
                    <!-- Mobile: Stacked layout -->
                    <div class="flex flex-col gap-2 sm:hidden">
                      <div
                        class="flex items-center gap-2 text-sm text-gray-600 font-sans"
                      >
                        <div
                          class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100"
                        >
                          <Calendar class="w-4 h-4 text-gray-600" />
                        </div>
                        <span>{{ item.date }}</span>
                      </div>
                      <div
                        class="flex items-center gap-2 text-sm text-gray-600 font-sans"
                      >
                        <div
                          class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100"
                        >
                          <Clock class="w-4 h-4 text-gray-600" />
                        </div>
                        <span>{{ item.slot.start }} - {{ item.slot.end }}</span>
                      </div>
                      <div
                        class="flex items-center gap-2 text-sm text-gray-600 font-sans"
                      >
                        <div
                          class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100"
                        >
                          <Users class="w-4 h-4 text-gray-600" />
                        </div>
                        <span>{{ item.pax }} {{ t("pax") || "Pax" }}</span>
                      </div>
                      <!-- Hold countdown on mobile -->
                      <div
                        v-if="cartItemHolds.get(item.id)"
                        class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold w-fit"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                        ></span>
                        {{ cartItemHolds.get(item.id)?.countdown }}
                      </div>
                    </div>
                    <!-- Desktop: Inline layout -->
                    <div
                      class="hidden sm:flex text-sm text-gray-500 font-sans items-center gap-2 flex-wrap"
                    >
                      <Calendar class="w-3 h-3" /> {{ item.date }}
                      <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                      <Clock class="w-3 h-3" /> {{ item.slot.start }} -
                      {{ item.slot.end }}
                      <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                      <Users class="w-3 h-3" /> {{ item.pax }}
                      {{ t("pax") || "Pax" }}
                      <!-- Hold countdown -->
                      <template v-if="cartItemHolds.get(item.id)">
                        <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span class="text-amber-600 font-bold text-xs">
                          {{ cartItemHolds.get(item.id)?.countdown }}
                        </span>
                      </template>
                    </div>

                    <!-- Special Pricing Badge -->
                    <div
                      v-if="item.specialPricing"
                      class="mt-3 flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg w-fit"
                    >
                      <AlertCircle
                        v-if="item.specialPricing.amount > 0"
                        class="w-4 h-4 text-orange-600"
                      />
                      <Check v-else class="w-4 h-4 text-green-600" />
                      <span
                        :class="
                          item.specialPricing.amount > 0
                            ? 'text-orange-700'
                            : 'text-green-700'
                        "
                      >
                        {{ item.specialPricing.message }}
                        <span class="font-bold ml-1">
                          {{ item.specialPricing.amount > 0 ? "+" : "-" }}RM{{
                            formatPriceWhole(
                              Math.abs(item.specialPricing.amount)
                            )
                          }}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div class="font-bold font-sans text-lg sm:text-base">
                    RM{{ item.total }}
                  </div>
                </div>
              </div>

              <!-- User Details -->
              <div class="pt-6 border-t border-dashed border-gray-200">
                <h4 class="font-bold font-serif text-base mb-4">
                  {{ t("customerInformation") }}
                </h4>
                <div class="space-y-2 text-sm font-sans">
                  <div class="flex justify-between">
                    <span class="text-gray-600">{{ t("fullName") }}</span>
                    <span class="font-medium text-gray-900">{{
                      customerInfo.name
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">{{ t("phoneNumber") }}</span>
                    <span class="font-medium text-gray-900">{{
                      customerInfo.phone
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">{{ t("email") }}</span>
                    <span class="font-medium text-gray-900">{{
                      customerInfo.email
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Coupon Section -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-4">
                <div class="flex items-center gap-2 mb-2">
                  <Ticket class="w-4 h-4 text-gray-900" />
                  <span class="font-bold font-serif text-sm">{{
                    t("haveCoupon")
                  }}</span>
                </div>

                <div v-if="!validatedCoupon" class="flex gap-2">
                  <input
                    type="text"
                    v-model="couponCode"
                    :placeholder="t('enterCode')"
                    class="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900 text-sm font-sans uppercase"
                    @keydown.enter.prevent="handleApplyCoupon"
                  />
                  <button
                    @click="handleApplyCoupon"
                    :disabled="!couponCode.trim() || isValidatingCoupon"
                    class="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {{ isValidatingCoupon ? "..." : t("apply") }}
                  </button>
                </div>

                <p
                  v-if="couponError"
                  class="text-xs text-red-500 font-sans mt-1"
                >
                  {{ couponError }}
                </p>

                <!-- Coupon Applied State -->
                <div
                  v-if="validatedCoupon"
                  class="bg-white p-3 rounded-lg border border-green-100 flex items-start justify-between"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-green-700 font-sans">{{
                        validatedCoupon.code
                      }}</span>
                      <span
                        class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold"
                        >{{ t("applied") }}</span
                      >
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      {{
                        validatedCoupon.type === "percentage"
                          ? `${validatedCoupon.value}% off`
                          : `RM${validatedCoupon.value} off`
                      }}
                      <span v-if="isCartModeEnabled && cartItemCount > 1">{{
                        t("selectedSession")
                      }}</span>
                    </p>
                  </div>
                  <button
                    @click="removeCoupon"
                    class="text-gray-400 hover:text-red-500"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <!-- Cart Item Selector for Coupon -->
                <div
                  v-if="
                    validatedCoupon && isCartModeEnabled && cartItemCount > 1
                  "
                  class="space-y-2 mt-2"
                >
                  <p
                    class="text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    {{ t("selectSessionForDiscount") }}
                  </p>
                  <div class="space-y-2">
                    <div
                      v-for="(item, idx) in cart"
                      :key="item.id"
                      @click="selectCouponItem(idx)"
                      class="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all"
                      :class="
                        selectedCouponItemIndex === idx
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      "
                    >
                      <div
                        class="w-4 h-4 rounded-full border flex items-center justify-center"
                        :class="
                          selectedCouponItemIndex === idx
                            ? 'border-green-600 bg-green-600'
                            : 'border-gray-300'
                        "
                      >
                        <Check
                          v-if="selectedCouponItemIndex === idx"
                          class="w-3 h-3 text-white"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold truncate">
                          {{ item.theme.name }}
                        </p>
                        <p class="text-[10px] text-gray-500">
                          {{ item.date }} • {{ item.slot.start }}
                        </p>
                      </div>
                      <div class="text-xs font-bold">
                        RM{{ formatPriceWhole(item.total) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Totals -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                <div class="flex justify-between items-end">
                  <span
                    class="text-sm text-gray-500 font-medium uppercase tracking-wider"
                    >{{ t("grandTotal") }}</span
                  >
                  <span class="text-2xl font-bold font-serif"
                    >RM{{ formatPriceWhole(cartTotal) }}</span
                  >
                </div>

                <div
                  v-if="discountAmount > 0"
                  class="flex justify-between items-center text-green-600"
                >
                  <span class="text-sm font-medium">{{ t("discount") }}</span>
                  <span class="font-bold"
                    >-RM{{ formatPriceWhole(discountAmount) }}</span
                  >
                </div>

                <div
                  class="flex justify-between items-center pt-3 border-t border-gray-200"
                >
                  <span class="text-sm font-bold text-gray-900">
                    {{
                      paymentType === "full"
                        ? t("payFullPaymentLabel")
                        : t("payDeposit") + ` (${depositPercentage}%)`
                    }}
                  </span>
                  <span class="font-bold font-sans text-lg text-gray-900"
                    >RM{{ formatPriceWhole(paymentAmount) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Single Mode: Summary -->
        <div
          v-if="currentStep === 6 && !isCartModeEnabled"
          class="space-y-8 animate-fade-in"
        >
          <!-- Booking Summary Card -->
          <div
            class="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
          >
            <div
              class="bg-gray-900 p-6 text-white flex justify-between items-center"
            >
              <div>
                <h3 class="font-bold font-serif text-xl">
                  {{ t("bookingSummary") }}
                </h3>
                <p
                  class="text-xs text-gray-400 font-sans mt-1 uppercase tracking-wider"
                >
                  ID: {{ t("draft") }}
                </p>
              </div>
              <div class="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <CreditCard class="w-6 h-6" />
              </div>
            </div>

            <div class="p-6 space-y-3">
              <!-- Theme Information -->
              <div
                class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-dashed border-gray-200"
              >
                <div class="flex-1">
                  <div class="font-bold font-serif text-lg mb-2">
                    {{ selectedTheme?.name }}
                  </div>
                  <!-- Mobile: Stacked layout -->
                  <div class="flex flex-col gap-2 sm:hidden">
                    <div
                      class="flex items-center gap-2 text-sm text-gray-600 font-sans"
                    >
                      <div
                        class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100"
                      >
                        <Calendar class="w-4 h-4 text-gray-600" />
                      </div>
                      <span>{{ selectedDate }}</span>
                    </div>
                    <div
                      class="flex items-center gap-2 text-sm text-gray-600 font-sans"
                    >
                      <div
                        class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100"
                      >
                        <Clock class="w-4 h-4 text-gray-600" />
                      </div>
                      <span
                        >{{ selectedSlot?.start }} -
                        {{ selectedSlot?.end }}</span
                      >
                    </div>
                    <div
                      class="flex items-center gap-2 text-sm text-gray-600 font-sans"
                    >
                      <div
                        class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100"
                      >
                        <Users class="w-4 h-4 text-gray-600" />
                      </div>
                      <span>{{ paxCount }} {{ t("pax") || "Pax" }}</span>
                    </div>
                  </div>
                  <!-- Desktop: Inline layout -->
                  <div
                    class="hidden sm:flex text-sm text-gray-500 font-sans items-center gap-2"
                  >
                    <Calendar class="w-3 h-3" /> {{ selectedDate }}
                    <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                    <Clock class="w-3 h-3" /> {{ selectedSlot?.start }} -
                    {{ selectedSlot?.end }}
                    <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                    <Users class="w-3 h-3" /> {{ paxCount }}
                    {{ t("pax") || "Pax" }}
                  </div>
                </div>
                <div
                  class="flex items-center font-bold font-sans text-lg sm:text-base justify-end"
                >
                  RM{{ formatPriceWhole(selectedTheme?.base_price || 0) }}
                </div>
              </div>

              <div class="space-y-3 text-sm font-sans">
                <!-- Special Pricing -->
                <div
                  v-if="specialPricingAmount !== 0"
                  class="flex items-center justify-between"
                >
                  <span class="text-gray-600">
                    {{ t("specialDate") }}
                  </span>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs"
                      :class="
                        specialPricingAmount > 0
                          ? 'text-orange-600'
                          : 'text-green-600'
                      "
                    >
                      {{ specialPricingMessage }}
                    </span>
                    <span
                      class="font-medium"
                      :class="
                        specialPricingAmount > 0
                          ? 'text-gray-900'
                          : 'text-green-600'
                      "
                    >
                      {{ specialPricingAmount > 0 ? "+" : "-" }} RM{{
                        formatPriceWhole(Math.abs(specialPricingAmount))
                      }}
                    </span>
                  </div>
                </div>

                <!-- Extra Pax -->
                <div v-if="extraPaxCost > 0" class="flex justify-between">
                  <span class="text-gray-600"
                    >{{ t("extraPaxLabel") }} ({{
                      paxCount - (selectedTheme!.base_pax || 0)
                    }})</span
                  >
                  <span class="font-medium"
                    >+ RM{{ formatPriceWhole(extraPaxCost) }}</span
                  >
                </div>

                <!-- Addons -->
                <div
                  v-for="(qty, id) in selectedAddons"
                  :key="id"
                  class="flex justify-between"
                >
                  <template v-if="qty > 0">
                    <span class="text-gray-600"
                      >{{
                        studioStore.addons.find((a) => a.id === id)?.name
                      }}
                      (x{{ qty }})</span
                    >
                    <span class="font-medium"
                      >+ RM{{
                        formatPriceWhole(
                          (studioStore.addons.find((a) => a.id === id)?.price ||
                            0) * qty
                        )
                      }}</span
                    >
                  </template>
                </div>
              </div>

              <!-- Edit Buttons (under addon section, aligned right) -->
              <div
                v-if="Object.values(selectedAddons).some((qty) => qty > 0)"
                class="flex justify-end gap-3"
              >
                <button
                  @click="currentStep = 3"
                  class="flex items-center gap-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-sans font-medium text-gray-700 transition-all"
                >
                  {{ t("editAddons") }}
                </button>
              </div>

              <!-- User Details -->
              <div class="pt-3 border-t border-dashed border-gray-200">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="font-bold font-serif text-base mb-4">
                    {{ t("customerInformation") }}
                  </h4>

                  <button
                    @click="currentStep = 4"
                    class="flex items-center gap-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-sans font-medium text-gray-700 transition-all"
                  >
                    {{ t("editDetails") }}
                  </button>
                </div>
                <div class="space-y-2 text-sm font-sans">
                  <div class="flex justify-between">
                    <span class="text-gray-600">{{ t("fullName") }}</span>
                    <span class="font-medium text-gray-900">{{
                      customerInfo.name
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">{{ t("phoneNumber") }}</span>
                    <span class="font-medium text-gray-900">{{
                      customerInfo.phone
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">{{ t("email") }}</span>
                    <span class="font-medium text-gray-900">{{
                      customerInfo.email
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Coupon Section (Single Mode) -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-4">
                <div class="flex items-center gap-2 mb-2">
                  <Ticket class="w-4 h-4 text-gray-900" />
                  <span class="font-bold font-serif text-sm">{{
                    t("haveCoupon")
                  }}</span>
                </div>

                <div v-if="!validatedCoupon" class="flex gap-2">
                  <input
                    type="text"
                    v-model="couponCode"
                    :placeholder="t('enterCode')"
                    class="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900 text-sm font-sans uppercase"
                    @keydown.enter.prevent="handleApplyCoupon"
                  />
                  <button
                    @click="handleApplyCoupon"
                    :disabled="!couponCode.trim() || isValidatingCoupon"
                    class="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {{ isValidatingCoupon ? "..." : t("apply") }}
                  </button>
                </div>

                <p
                  v-if="couponError"
                  class="text-xs text-red-500 font-sans mt-1"
                >
                  {{ couponError }}
                </p>

                <!-- Coupon Applied State -->
                <div
                  v-if="validatedCoupon"
                  class="bg-white p-3 rounded-lg border border-green-100 flex items-start justify-between"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-green-700 font-sans">{{
                        validatedCoupon.code
                      }}</span>
                      <span
                        class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold"
                        >{{ t("applied") }}</span
                      >
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      {{
                        validatedCoupon.type === "percentage"
                          ? `${validatedCoupon.value}% off`
                          : `RM${validatedCoupon.value} off`
                      }}
                    </p>
                  </div>
                  <button
                    @click="removeCoupon"
                    class="text-gray-400 hover:text-red-500"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Totals -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                <div class="flex justify-between items-end">
                  <span
                    class="text-sm text-gray-500 font-medium uppercase tracking-wider"
                    >{{ t("grandTotal") }}</span
                  >
                  <!-- Show original total (which is grandTotal in Single mode before discount logic applied, but grandTotal is computed to include discount) -->
                  <!-- Actually, for single mode, grandTotal uses currentItemTotal. I modified grandTotal to include discount. -->
                  <!-- So to show original, I need to show currentItemTotal -->
                  <span class="text-2xl font-bold"
                    >RM{{ formatPriceWhole(currentItemTotal) }}</span
                  >
                </div>

                <div
                  v-if="discountAmount > 0"
                  class="flex justify-between items-center text-green-600"
                >
                  <span class="text-sm font-medium">{{ t("discount") }}</span>
                  <span class="font-bold"
                    >-RM{{ formatPriceWhole(discountAmount) }}</span
                  >
                </div>

                <div
                  class="flex justify-between items-center pt-3 border-t border-gray-200"
                >
                  <span class="text-sm font-bold text-gray-900">
                    {{
                      paymentType === "full"
                        ? t("payFullPaymentLabel")
                        : t("payDeposit")
                    }}
                  </span>
                  <span class="font-bold font-sans text-lg text-gray-900"
                    >RM{{ formatPriceWhole(paymentAmount) }}</span
                  >
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
        <div
          class="bg-white/90 sm:bg-white/80 backdrop-blur-md border border-white/40 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pointer-events-auto"
        >
          <div class="flex flex-col pl-1 sm:pl-2">
            <span
              class="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold"
            >
              {{
                isCartModeEnabled && (currentStep === 4 || currentStep === 7)
                  ? t("cartTotal") || "Cart Total"
                  : t("estimatedTotal")
              }}
            </span>
            <span
              class="font-bold font-serif text-xl sm:text-2xl text-gray-900"
            >
              RM{{
                isCartModeEnabled && (currentStep === 4 || currentStep === 7)
                  ? formatPriceWhole(cartTotal || 0)
                  : formatPriceWhole(grandTotal || 0)
              }}
            </span>
          </div>
          <button
            @click="nextStep"
            :disabled="
              (currentStep === 1 && !selectedTheme) ||
              (currentStep === 2 && !selectedSlot) ||
              (isCartModeEnabled &&
                currentStep === 3 &&
                (!selectedTheme || !selectedDate || !selectedSlot)) ||
              (isCartModeEnabled && currentStep === 4 && cartItemCount === 0) ||
              (isCartModeEnabled &&
                currentStep === 5 &&
                (!customerInfo.name ||
                  !customerInfo.phone ||
                  !customerInfo.email)) ||
              (isCartModeEnabled && currentStep === 6 && !termsAccepted) ||
              (isCartModeEnabled &&
                currentStep === 7 &&
                (cartItemCount === 0 ||
                  !customerInfo.name ||
                  !customerInfo.phone ||
                  !customerInfo.email ||
                  !termsAccepted ||
                  (validatedCoupon &&
                    cartItemCount > 1 &&
                    selectedCouponItemIndex === null))) ||
              (!isCartModeEnabled &&
                currentStep === 4 &&
                (!customerInfo.name ||
                  !customerInfo.phone ||
                  !customerInfo.email)) ||
              (!isCartModeEnabled && currentStep === 5 && !termsAccepted) ||
              (!isCartModeEnabled &&
                currentStep === 6 &&
                (!selectedTheme || !selectedDate || !selectedSlot)) ||
              isProcessingPayment
            "
            class="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
          >
            <span v-if="isProcessingPayment">{{ t("processingPayment") }}</span>
            <span v-else-if="isCartModeEnabled && currentStep === 3">{{
              t("addToCart") || "Add to Cart"
            }}</span>
            <span v-else-if="isCartModeEnabled && currentStep === 7">{{
              t("payNow")
            }}</span>
            <span v-else-if="!isCartModeEnabled && currentStep === 6">{{
              t("payNow")
            }}</span>
            <span v-else>{{ t("next") }}</span>
            <Plus
              v-if="
                isCartModeEnabled && currentStep === 3 && !isProcessingPayment
              "
              class="w-3.5 h-3.5 sm:w-4 sm:h-4"
            />
            <ArrowRight
              v-else-if="!isProcessingPayment"
              class="w-3.5 h-3.5 sm:w-4 sm:h-4"
            />
            <Loader2 v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          </button>
        </div>
      </div>
    </div>

    <!-- Global Modal Component -->
    <Modal
      :show="modalState.show"
      :title="modalState.title"
      :message="modalState.message"
      :type="modalState.type"
      :confirmText="modalState.confirmText"
      :cancelText="modalState.cancelText"
      :showCancel="modalState.showCancel"
      @confirm="modalState.onConfirm"
      @cancel="modalState.onCancel"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
/* Updated Fonts: Playfair Display & Bricolage Grotesque */
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap");

.font-serif {
  font-family: "Playfair Display", serif;
}

.font-sans {
  font-family: "Bricolage Grotesque", sans-serif;
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

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
</style>
