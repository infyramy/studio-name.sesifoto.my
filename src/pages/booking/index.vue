<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { useCurrency } from "@/composables/useCurrency";
import { useSanitize } from "@/composables/useSanitize";
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
  ArrowLeft,
  X,
  AlertCircle,
  ShoppingBag,
  Trash2,
  Ticket,
  Image as ImageIcon,
  Pencil,
  Mail,
  Phone,
  Sparkles,
  Star,
} from "lucide-vue-next";
import type { Theme, Coupon } from "@/types";
import Modal from "@/components/Modal.vue";
import ImageCarousel from "@/components/ImageCarousel.vue";
import { marked } from "marked";

const { sanitize } = useSanitize();

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
const expandedCartItems = ref<Set<string>>(new Set());

const toggleCartItemExpansion = (itemId: string) => {
  if (expandedCartItems.value.has(itemId)) {
    expandedCartItems.value.delete(itemId);
  } else {
    expandedCartItems.value.add(itemId);
  }
};

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

  // Clear unified cart hold timer
  stopUnifiedCartHoldTimer();
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
    if (state.termsAccepted) termsAccepted.value = state.termsAccepted;

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
        (h) => h.holdId === state.confirmedSlot.hold.holdId,
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
              selectedDate.value,
            );
            timeSlots.value = processTimeSlots(slots, selectedDate.value);
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
            selectedDate.value,
          );
          timeSlots.value = processTimeSlots(slots, selectedDate.value);
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
            selectedDate.value,
          );
          timeSlots.value = processTimeSlots(slots, selectedDate.value);
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
            selectedDate.value,
          );
          timeSlots.value = processTimeSlots(slots, selectedDate.value);
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
  const restoredItems: any[] = [];
  const expiredItems: any[] = [];
  let latestExpiresAt: Date | null = null;

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

      // Track the latest expiry time (all holds should have same expiry with unified system)
      const holdExpiry = new Date(hold.expiresAt);
      if (!latestExpiresAt || holdExpiry > latestExpiresAt) {
        latestExpiresAt = holdExpiry;
      }
    } else {
      expiredItems.push(item);
    }
  }

  cart.value = restoredItems;

  // Start unified cart hold timer if there are restored items
  if (restoredItems.length > 0 && latestExpiresAt) {
    startUnifiedCartHoldTimer(latestExpiresAt);
  }

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

// UNIFIED CART HOLD: Single timer for entire cart (resets when new item added)
const unifiedCartHoldExpiresAt = ref<Date | null>(null);
const unifiedCartHoldCountdown = ref<string>("10:00");
let unifiedCartHoldTimer: any = null;

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

// Image Gallery State
const galleryState = ref({
  show: false,
  images: [] as string[],
  initialIndex: 0,
});

const openGallery = (theme: Theme) => {
  if (theme.images && theme.images.length > 0) {
    galleryState.value = {
      show: true,
      images: theme.images,
      initialIndex: 0,
    };
  }
};

const closeGallery = () => {
  galleryState.value.show = false;
};

// Transition Direction
const transitionName = ref("slide-left");

watch(currentStep, (newStep, oldStep) => {
  if (newStep > oldStep) {
    transitionName.value = "slide-left";
  } else {
    transitionName.value = "slide-right";
  }
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
const loadingThemes = ref(true);
const loadingDates = ref(true);
const dateScroller = ref<HTMLElement | null>(null);

// Coupon State
const couponCode = ref("");
const validatedCoupon = ref<Coupon | null>(null);
const isValidatingCoupon = ref(false);
const couponError = ref("");
const selectedCouponItemIndex = ref<number | null>(null); // For cart mode: which item to apply to

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

    // Determine start date: prioritize theme custom availability, then global booking window
    let startDate = new Date(today);
    
    // Check if theme has custom availability with start date
    if (
      selectedTheme.value?.use_custom_availability &&
      selectedTheme.value?.available_start_date
    ) {
      const themeStart = new Date(
        selectedTheme.value.available_start_date + "T00:00:00",
      );
      startDate = themeStart > today ? themeStart : today;
    } else if (websiteSettings?.bookingWindowStart) {
      // Fall back to global booking window start
      const windowStart = new Date(
        websiteSettings.bookingWindowStart + "T00:00:00",
      );
      startDate = windowStart > today ? windowStart : today;
    }

    // Determine end date: prioritize theme custom availability, then global booking window
    let endDate = new Date(startDate);
    
    // Check if theme has custom availability with end date
    if (
      selectedTheme.value?.use_custom_availability &&
      selectedTheme.value?.available_end_date
    ) {
      const themeEnd = new Date(
        selectedTheme.value.available_end_date + "T00:00:00",
      );
      endDate = themeEnd;
    } else if (websiteSettings?.bookingWindowEnd) {
      // Fall back to global booking window end
      const windowEnd = new Date(
        websiteSettings.bookingWindowEnd + "T00:00:00",
      );
      endDate = windowEnd;
    } else {
      // Default: 30 days from start
      endDate.setDate(startDate.getDate() + 29); // 30 days total
    }

    // Validation: If booking window end is before today, booking has passed
    if (websiteSettings?.bookingWindowEnd) {
      const windowEnd = new Date(
        websiteSettings.bookingWindowEnd + "T00:00:00",
      );
      if (windowEnd < today) {
        console.log(
          "[fetchAvailableDates] Booking window has passed, no dates available",
        );
        dates.value = [];
        loadingDates.value = false;
        return;
      }
    }

    // Validation: Ensure endDate is not before startDate
    if (endDate < startDate) {
      console.warn(
        "[fetchAvailableDates] endDate < startDate, adjusting endDate to startDate + 29 days",
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
      themeCustomAvailability: selectedTheme.value?.use_custom_availability,
      themeStartDate: selectedTheme.value?.available_start_date,
      themeEndDate: selectedTheme.value?.available_end_date,
      globalStartDate: websiteSettings?.bookingWindowStart,
      globalEndDate: websiteSettings?.bookingWindowEnd,
    });

    // Store range for reference
    dateRangeStart.value = startDateStr;
    dateRangeEnd.value = endDateStr;

    // Fetch from backend
    const dateInfos = await api.getAvailableDates(
      studio.id,
      selectedTheme.value.id,
      startDateStr,
      endDateStr,
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

// Watch for theme changes to reload dates, pricing rules, and addons
watch(selectedTheme, async () => {
  if (selectedTheme.value) {
    fetchAvailableDates();
    // Load theme-specific addons (if the theme has custom addons configured)
    await studioStore.loadAddonsForTheme(selectedTheme.value.id);
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
  selectedDate.value = null; // Reset date
  selectedSlot.value = null; // Reset slot
  // Don't auto-navigate - user must click next button
};

// Helper to convert time string to minutes for comparison
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  // Handle both 24-hour format (09:00) and display format (9:00 AM)
  let hours: number;
  let minutes: number;

  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    // Display format: "9:00 AM" or "12:30 PM"
    const isPM = timeStr.toUpperCase().includes("PM");
    const timePart = timeStr.replace(/\s*(AM|PM)\s*/i, "");
    const parts = timePart.split(":").map(Number);
    hours = parts[0] || 0;
    minutes = parts[1] || 0;

    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    // 24-hour format: "09:00" or "14:30"
    const parts = timeStr.split(":").map(Number);
    hours = parts[0] || 0;
    minutes = parts[1] || 0;
  }

  return hours * 60 + minutes;
};

// Helper function to process time slots and disable past slots for current date
const processTimeSlots = (slots: any[], dateStr: string) => {
  // Check if selected date is today
  const today = new Date();
  const selectedDateObj = new Date(dateStr + "T00:00:00");
  const isToday =
    selectedDateObj.getFullYear() === today.getFullYear() &&
    selectedDateObj.getMonth() === today.getMonth() &&
    selectedDateObj.getDate() === today.getDate();

  // Get current time in hours and minutes
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();

  // Get cart items for the same theme and date to check for overlap
  const cartItemsForThemeAndDate = cart.value.filter(
    (item) =>
      item.theme.id === selectedTheme.value?.id && item.date === dateStr,
  );

  return slots.map((slot, index) => {
    let isAvailable = slot.status === "available";

    // If it's today, check if the slot time has passed
    if (isToday && isAvailable) {
      // Parse the slot start time (format: "HH:MM" in 24-hour format)
      const slotStart = slot.start || "09:00";
      const [slotHour, slotMinute] = slotStart.split(":").map(Number);

      // Disable if slot time has already passed
      if (
        slotHour < currentHour ||
        (slotHour === currentHour && slotMinute <= currentMinute)
      ) {
        isAvailable = false;
      }
    }

    // Check if this slot overlaps with any cart item (for the same theme and date)
    if (isAvailable && cartItemsForThemeAndDate.length > 0) {
      const slotStartMinutes = timeToMinutes(slot.start || "09:00");
      const slotEndMinutes = timeToMinutes(slot.end || "09:30");

      for (const cartItem of cartItemsForThemeAndDate) {
        // Cart item slot times are in display format (e.g., "9:00 AM")
        const cartSlotStartMinutes = timeToMinutes(cartItem.slot.start);
        const cartSlotEndMinutes = timeToMinutes(cartItem.slot.end);

        // Check for overlap: slot starts before cart item ends AND slot ends after cart item starts
        if (
          slotStartMinutes < cartSlotEndMinutes &&
          slotEndMinutes > cartSlotStartMinutes
        ) {
          isAvailable = false;
          break;
        }
      }
    }

    return {
      id: `slot-${index}`,
      start: formatTimeForDisplay(slot.start || "09:00"),
      end: formatTimeForDisplay(slot.end || "09:30"),
      available: isAvailable,
      price: slot.price,
      isSpecialPricing: slot.is_special_pricing,
      specialPricingLabel: slot.special_pricing_label,
      originalSlot: slot,
    };
  });
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
        dateStr,
      );

      // Process slots and disable past ones for current date
      timeSlots.value = processTimeSlots(slots, dateStr);
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
      getSessionId(),
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
    // Handle past time slot error from backend
    if (
      error?.data?.message === "SLOT_TIME_HAS_PASSED" ||
      error?.message === "SLOT_TIME_HAS_PASSED"
    ) {
      throw new Error("SLOT_TIME_HAS_PASSED");
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

// ============================================
// UNIFIED CART HOLD TIMER
// Single timer for entire cart - resets when new item is added
// ============================================

function startUnifiedCartHoldTimer(expiresAt: Date) {
  // Clear any existing timer
  if (unifiedCartHoldTimer) {
    clearInterval(unifiedCartHoldTimer);
  }

  unifiedCartHoldExpiresAt.value = expiresAt;

  unifiedCartHoldTimer = setInterval(() => {
    if (!unifiedCartHoldExpiresAt.value) {
      clearInterval(unifiedCartHoldTimer);
      return;
    }

    const now = new Date();
    const timeLeft = unifiedCartHoldExpiresAt.value.getTime() - now.getTime();

    if (timeLeft <= 0) {
      clearInterval(unifiedCartHoldTimer);
      handleUnifiedCartExpiry();
    } else {
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      unifiedCartHoldCountdown.value = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;

      // Also update each cart item's hold info to reflect unified expiry
      cart.value.forEach((item) => {
        if (item.hold) {
          item.hold.expiresAt = unifiedCartHoldExpiresAt.value!.toISOString();
        }
      });

      // Warning at 2 minutes
      if (timeLeft < 120000 && timeLeft > 119000) {
        console.warn("Cart hold expires in 2 minutes!");
      }
    }
  }, 1000);
}

async function handleUnifiedCartExpiry() {
  // Clear all cart items on expiry
  cart.value = [];
  unifiedCartHoldExpiresAt.value = null;
  unifiedCartHoldCountdown.value = "10:00";

  await showModal({
    title: t("reservationExpired"),
    message: t("cartExpiredMessage"),
    type: "warning",
    confirmText: t("ok"),
  });

  currentStep.value = 1; // Back to theme selection
}

function stopUnifiedCartHoldTimer() {
  if (unifiedCartHoldTimer) {
    clearInterval(unifiedCartHoldTimer);
    unifiedCartHoldTimer = null;
  }
  unifiedCartHoldExpiresAt.value = null;
  unifiedCartHoldCountdown.value = "10:00";
}

function showHoldConfirmationDialog(): Promise<boolean> {
  const duration = studioStore.studio?.settings?.cart_hold_duration || 10;
  return showModal({
    title: t("reserveThisSlot"),
    message: `<b>${selectedSlot.value.start} - ${
      selectedSlot.value.end
    }</b>\n\n${t("reserveSlotMessage").replace(
      "{duration}",
      `<b>${duration}</b>`,
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
  const duration = studioStore.studio?.settings?.cart_hold_duration || 10;

  return showModal({
    title: t("addToCartConfirm"),
    message: `<b>${themeName}</b>\n<b>${slotTime}</b>\n<b>${pax} ${t(
      "pax",
    )}</b>\n\n${t("addToCartMessage").replace(
      "{duration}",
      `<b>${duration}</b>`,
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
    // Calculate the subtotal to send to backend for min spend validation
    let subtotal = 0;
    if (isCartModeEnabled.value && cart.value.length > 0) {
      // In cart mode, use the total of all cart items (or first item if only 1)
      subtotal = cart.value.reduce((sum, item) => sum + item.total, 0);
    } else {
      // In single mode, use current item total
      subtotal = currentItemTotal.value;
    }

    const coupon = await api.validateCoupon(couponCode.value, subtotal);
    validatedCoupon.value = coupon;

    // Auto-select item if only 1 item in cart (Cart Mode) or in Single Mode
    if (isCartModeEnabled.value && cart.value.length === 1) {
      selectedCouponItemIndex.value = 0;
    } else if (!isCartModeEnabled.value) {
      // Single mode doesn't need index, logic handles it
      selectedCouponItemIndex.value = 0; // Just to be safe
    }
    // If multiple items in cart, user must select
    // If multiple items in cart, user must select
  } catch (error: any) {
    console.error("Coupon validation failed:", error);
    // Try to get message from backend response
    const backendMessage =
      error.data?.message || error.response?._data?.message || error.message;

    if (backendMessage) {
      const lowerMsg = backendMessage.toLowerCase();
      if (
        lowerMsg.includes("invalid coupon") ||
        lowerMsg.includes("not found")
      ) {
        couponError.value = t("invalidCoupon");
      } else if (lowerMsg.includes("expired")) {
        couponError.value = t("couponExpired");
      } else if (lowerMsg.includes("limit reached")) {
        couponError.value = t("couponLimitReached");
      } else if (lowerMsg.includes("minimum spend")) {
        // Try to extract amount if possible, otherwise just use the message or a generic one
        // ideally we parse it, but for now let's just use the backend message if it contains specific currency info
        // or failover to a generic min spend message without amount if parsing fails
        couponError.value = backendMessage;
      } else {
        couponError.value = backendMessage;
      }
    } else {
      couponError.value = t("invalidCoupon");
    }

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
      paxCount.value - (selectedTheme.value.base_pax || 0),
    );
    const extraPaxCost = extraPax * selectedTheme.value.extra_pax_price;

    let addonsTotal = 0;
    for (const [id, qty] of Object.entries(selectedAddons.value)) {
      const addon = studioStore.addons.find((a) => a.id === id);
      if (addon && qty > 0) {
        addonsTotal += addon.price * qty;
      }
    }

    // Use the slot price (already includes special pricing from backend)
    // If the selected slot has a price from the backend, use that
    // Otherwise fall back to theme base_price
    let sessionPrice =
      selectedSlot.value?.price || selectedTheme.value.base_price;

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

    // UNIFIED CART HOLD: Start/reset the unified timer with the new expiry time
    // Backend extends all existing holds to this same expiry when creating a new hold
    startUnifiedCartHoldTimer(new Date(hold.expiresAt));

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
    } else if (error.message === "SLOT_TIME_HAS_PASSED") {
      await showModal({
        title: t("slotTimeHasPassed") || "Slot Time Has Passed",
        message:
          t("slotTimeHasPassedMessage") ||
          "This time slot has already passed. Please select a different time.",
        type: "error",
        confirmText: t("ok"),
      });
      // Refresh time slots to show updated availability
      if (selectedDate.value) {
        await selectDate(selectedDate.value);
      }
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

  // If cart becomes empty, stop the unified timer
  if (cart.value.length === 0 && isCartModeEnabled.value) {
    stopUnifiedCartHoldTimer();
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
      `[data-date="${selectedDate.value}"]`,
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
// Date formatter
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
      "0",
    )}`;
  } else if (timeStr.toUpperCase().includes("AM") && hours === 12) {
    // Handle 12:xx AM -> 00:xx
    time = `00:${String(minutes).padStart(2, "0")}`;
  } else {
    time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
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
                selectedDate.value,
              );
              timeSlots.value = processTimeSlots(slots, selectedDate.value);
            } catch (err) {
              console.error("Failed to load time slots:", err);
            } finally {
              loadingSlots.value = false;
            }
          }
        } else if (error.message === "SLOT_TIME_HAS_PASSED") {
          await showModal({
            title: t("slotTimeHasPassed") || "Slot Time Has Passed",
            message:
              t("slotTimeHasPassedMessage") ||
              "This time slot has already passed. Please select a different time.",
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
                selectedDate.value,
              );
              timeSlots.value = processTimeSlots(slots, selectedDate.value);
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
        const createdBookings: Array<{ id: string; booking_number: string }> =
          [];

        // Calculate proportional discount for each cart item
        const calculateProportionalDiscount = (itemIndex: number): number => {
          if (!validatedCoupon.value) return 0;

          const cartTotalAmount = cart.value.reduce(
            (sum, item) => sum + item.total,
            0,
          );
          const itemTotal = cart.value[itemIndex].total;
          const proportion = itemTotal / cartTotalAmount;

          // Calculate total discount based on cart total
          let totalDiscount = 0;
          if (
            validatedCoupon.value.min_spend &&
            cartTotalAmount < validatedCoupon.value.min_spend
          ) {
            return 0; // Min spend not met
          }

          if (validatedCoupon.value.type === "percentage") {
            totalDiscount =
              cartTotalAmount * (validatedCoupon.value.value / 100);
          } else {
            totalDiscount = validatedCoupon.value.value;
          }

          // Cap at cart total
          totalDiscount = Math.min(totalDiscount, cartTotalAmount);

          // Return proportional share for this item
          return Math.round(totalDiscount * proportion);
        };

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

          // Calculate proportional discount for this item
          const itemDiscount = calculateProportionalDiscount(i);

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
            // Apply coupon to all items with proportional discount
            coupon_code:
              validatedCoupon.value && itemDiscount > 0
                ? validatedCoupon.value.code
                : undefined,
            discount_amount: itemDiscount > 0 ? itemDiscount : undefined,
            session_id: getSessionId(),
          };

          // Create booking
          const createdBooking = await createBooking(bookingRequest);
          createdBookings.push({
            id: createdBooking.id,
            booking_number: createdBooking.booking_number,
          });
        }

        // Determine payment type from studio settings
        const paymentType =
          studioStore.websiteSettings?.paymentType || "deposit";

        // Get all booking IDs (first one is primary, rest are additional)
        const primaryBookingId = createdBookings[0].id;
        const additionalBookingIds = createdBookings.slice(1).map((b) => b.id);

        // Calculate total payment amount based on payment type
        let totalPaymentAmount = 0;
        for (const item of cart.value) {
          const itemDiscount = calculateProportionalDiscount(
            cart.value.indexOf(item),
          );
          const itemTotal = item.total - itemDiscount;

          if (paymentType === "deposit") {
            // Use theme's deposit amount or calculate based on studio settings
            const depositAmount =
              item.theme.deposit_amount ||
              Math.round(
                itemTotal *
                  ((studioStore.studio?.settings.deposit_percentage || 50) /
                    100),
              );
            totalPaymentAmount += depositAmount;
          } else {
            totalPaymentAmount += itemTotal;
          }
        }

        // Call payment initiation API with all booking IDs
        // Pass the calculated amount to prevent double discount (bookings already have discount applied)
        const paymentResult = await api.initiatePayment(
          primaryBookingId,
          paymentType,
          additionalBookingIds.length > 0 ? additionalBookingIds : undefined,
          totalPaymentAmount, // Always pass calculated amount to avoid recalculation from discounted booking amounts
        );

        // Clear booking state before redirecting
        clearBookingState();

        // Handle zero payment (auto-confirmed)
        if (paymentResult.paymentSkipped) {
          // Bookings were auto-confirmed, redirect to success with all booking numbers
          const allBookingNumbers = createdBookings
            .map((b) => b.booking_number)
            .join(",");
          router.push(`/success/${allBookingNumbers}`);
          return;
        }

        // Redirect to CHIP checkout
        if (paymentResult.checkoutUrl) {
          window.location.href = paymentResult.checkoutUrl;
          return; // Stop execution after redirect
        }

        // Fallback: If no checkoutUrl (CHIP not configured), redirect to success with all booking numbers
        const allBookingNumbers = createdBookings
          .map((b) => b.booking_number)
          .join(",");
        router.push(`/success/${allBookingNumbers}`);
      } catch (error: any) {
        console.error("Failed to create bookings:", error);

        // Check for payment unavailable error (CHIP no payment method)
        if (
          error.message?.includes("Cannot proceed with payment") ||
          error.data?.message?.includes("Cannot proceed with payment")
        ) {
          router.push("/payment/failed?error=payment_unavailable");
          return;
        }

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

        // Calculate payment amount to check for zero payment
        let paymentAmount = grandTotal.value;
        if (paymentType === "deposit") {
          // Use effective deposit to respect coupon discounts
          paymentAmount = effectiveDepositAmount.value;
        }

        // Initiate payment with CHIP
        const paymentResult = await api.initiatePayment(
          createdBooking.id,
          paymentType,
          undefined, // No additional booking IDs for single mode
          paymentAmount <= 0 ? 0 : undefined, // Pass 0 to trigger zero payment handling
        );

        // Clear booking state before redirecting
        clearBookingState();

        // Handle zero payment (auto-confirmed)
        if (paymentResult.paymentSkipped) {
          // Booking was auto-confirmed, redirect to success
          router.push(`/success/${createdBooking.booking_number}`);
          return;
        }

        // Redirect to CHIP checkout
        if (paymentResult.checkoutUrl) {
          window.location.href = paymentResult.checkoutUrl;
          return; // Stop execution after redirect
        }

        // Fallback: If no checkoutUrl (CHIP not configured), redirect to success
        router.push(`/success/${createdBooking.booking_number}`);
      } catch (error: any) {
        console.error("Failed to create booking:", error);

        // Check for payment unavailable error (CHIP no payment method)
        if (
          error.message?.includes("Cannot proceed with payment") ||
          error.data?.message?.includes("Cannot proceed with payment")
        ) {
          router.push("/payment/failed?error=payment_unavailable");
          return;
        }

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

const handleChangeTheme = async () => {
  if (!isCartModeEnabled.value && confirmedSlot.value) {
    const confirmChange = await showModal({
      title: t("goingBackWillRelease"),
      message: t("goingBackMessage"),
      type: "warning",
      confirmText: t("yes"),
      cancelText: t("no"),
      showCancel: true,
    });

    if (!confirmChange) return;

    // Release hold
    if (confirmedSlot.value?.hold?.holdId) {
      await releaseCartHold(confirmedSlot.value.hold.holdId);
    }
    confirmedSlot.value = null;
    holdExpiresAt.value = null;
    if (holdCountdownInterval) clearInterval(holdCountdownInterval);
  }
  currentStep.value = 1;
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
    paxCount.value - (selectedTheme.value.base_pax || 0),
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

  // Use the slot price (already includes special pricing from backend)
  // If the selected slot has a price from the backend, use that
  // Otherwise fall back to theme base_price
  const sessionPrice =
    selectedSlot.value?.price || selectedTheme.value.base_price;

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
    // In cart mode, calculate discount based on entire cart total
    if (cart.value.length === 0) {
      return 0;
    }
    // Use total cart amount for discount calculation
    targetTotal = cart.value.reduce((sum, item) => sum + item.total, 0);
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

const isSummaryStep = computed(() => {
  if (isCartModeEnabled.value) {
    return currentStep.value === 7;
  }
  return currentStep.value === 6;
});

const paymentType = computed(() => {
  return studioStore.studio?.settings.payment_type || "deposit";
});

const depositPercentage = computed(() => {
  // For cart mode, use studio settings percentage
  if (isCartModeEnabled.value && cart.value.length > 0) {
    return studioStore.studio?.settings.deposit_percentage || 50;
  }

  // Calculate percentage for display based on theme's deposit amount
  if (!selectedTheme.value || !grandTotal.value) return 50;

  // If theme has a deposit_amount, calculate percentage from that
  if (selectedTheme.value.deposit_amount) {
    return Math.round(
      (selectedTheme.value.deposit_amount / grandTotal.value) * 100,
    );
  }

  return studioStore.studio?.settings.deposit_percentage || 50;
});

// Single item deposit amount
const singleItemDepositAmount = computed(() => {
  if (!selectedTheme.value) return 0;

  // Use theme's deposit_amount if available (fixed deposit in sen)
  if (selectedTheme.value.deposit_amount) {
    return selectedTheme.value.deposit_amount;
  }

  // Fallback: calculate based on percentage
  if (!currentItemTotal.value) return 0;
  const percentage = studioStore.studio?.settings.deposit_percentage || 50;
  return currentItemTotal.value * (percentage / 100);
});

// Cart total deposit amount (sum of deposits for all cart items)
const cartDepositTotal = computed(() => {
  if (!isCartModeEnabled.value || cart.value.length === 0) return 0;

  // Calculate total cart value for proportional discount
  const totalCartValue = cart.value.reduce((sum, item) => sum + item.total, 0);

  let totalDeposit = 0;
  for (const item of cart.value) {
    // Calculate proportional discount for this item
    let itemDiscount = 0;
    if (validatedCoupon.value && totalCartValue > 0) {
      const itemProportion = item.total / totalCartValue;
      itemDiscount = Math.round(discountAmount.value * itemProportion);
    }

    const itemTotal = item.total - itemDiscount;

    // Use theme's deposit amount or calculate based on studio settings
    const itemDeposit =
      item.theme.deposit_amount ||
      Math.round(
        itemTotal *
          ((studioStore.studio?.settings.deposit_percentage || 50) / 100),
      );
    totalDeposit += itemDeposit;
  }
  return totalDeposit;
});

// Combined deposit amount (works for both single and cart modes) - before discount
const depositAmount = computed(() => {
  if (isCartModeEnabled.value && cart.value.length > 0) {
    return cartDepositTotal.value;
  }
  return singleItemDepositAmount.value;
});

// Calculate the original balance (total - deposit) before any discount
const originalBalance = computed(() => {
  let total = 0;
  if (isCartModeEnabled.value && cart.value.length > 0) {
    total = cartTotal.value;
  } else {
    total = currentItemTotal.value;
  }
  return total - depositAmount.value;
});

// Effective deposit amount - discount is applied to deposit FIRST
// Example: Total RM150, Deposit RM50, Coupon RM10 → Deposit becomes RM40
const effectiveDepositAmount = computed(() => {
  return Math.max(0, depositAmount.value - discountAmount.value);
});

// Calculate remaining discount after deposit is zeroed (if coupon > deposit)
const remainingDiscountAfterDeposit = computed(() => {
  return Math.max(0, discountAmount.value - depositAmount.value);
});

// Effective balance - any remaining discount after deposit is applied here
// Example: Total RM150, Deposit RM50, Coupon RM60 → Deposit RM0, Balance RM100-10=RM90
const effectiveBalance = computed(() => {
  return Math.max(
    0,
    originalBalance.value - remainingDiscountAfterDeposit.value,
  );
});

const paymentAmount = computed(() => {
  if (paymentType.value === "full") {
    // For full payment, pay the entire discounted amount
    return effectiveDepositAmount.value + effectiveBalance.value;
  }
  // For deposit payment, only pay the effective deposit (after discount applied)
  return effectiveDepositAmount.value;
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

// Get all pricing rules for the selected date (if any)
const selectedDatePricingRules = computed(() => {
  if (!selectedDate.value) return [];
  const dateStr = selectedDate.value;

  return pricingRules.value.filter((rule) => {
    return dateStr >= rule.date_range_start && dateStr <= rule.date_range_end;
  });
});

// Get unique pricing information from time slots for the selected date
const datePricingInfo = computed(() => {
  if (!selectedDate.value || !timeSlots.value.length || !selectedTheme.value) return null;

  const basePrice = selectedTheme.value.base_price;
  
  // Group slots by pricing label and price
  const pricingMap = new Map<string, {
    label: string;
    slots: Array<{ start: string; end: string; price: number; displayStart?: string; displayEnd?: string }>;
    minPrice: number;
    maxPrice: number;
    basePrice: number;
  }>();

  timeSlots.value.forEach((slot) => {
    if (
      slot.isSpecialPricing && 
      slot.specialPricingLabel && 
      slot.originalSlot &&
      slot.originalSlot.start && 
      slot.originalSlot.end &&
      typeof slot.price === 'number'
    ) {
      const label = slot.specialPricingLabel;
      if (!pricingMap.has(label)) {
        pricingMap.set(label, {
          label,
          slots: [],
          minPrice: Infinity,
          maxPrice: -Infinity,
          basePrice,
        });
      }
      const info = pricingMap.get(label)!;
      const slotPrice = slot.price;
      // Use original 24-hour format times for proper sorting
      const originalStart = slot.originalSlot?.start || slot.start;
      const originalEnd = slot.originalSlot?.end || slot.end;
      info.slots.push({
        start: originalStart, // Use 24-hour format for sorting
        end: originalEnd, // Use 24-hour format for sorting
        price: slotPrice,
        displayStart: slot.start, // Keep formatted version for display
        displayEnd: slot.end, // Keep formatted version for display
      });
      info.minPrice = Math.min(info.minPrice, slotPrice);
      info.maxPrice = Math.max(info.maxPrice, slotPrice);
    }
  });

  // Convert to array and calculate differences
  return Array.from(pricingMap.values())
    .filter((info) => info.slots.length > 0)
    .map((info) => {
      const minDiff = info.minPrice - basePrice;
      const maxDiff = info.maxPrice - basePrice;
      
      // Sort slots by start time (using 24-hour format for proper sorting)
      // Need to find the latest end time across all slots, not just the last one in sorted order
      const sortedSlots = [...info.slots].sort((a, b) => a.start.localeCompare(b.start));
      
      // Find overall time range (earliest start to latest end)
      // Use display format for showing to user
      const earliestStart = sortedSlots[0]?.displayStart || sortedSlots[0]?.start || '';
      
      // Find the latest end time by comparing all end times (in 24-hour format)
      const latestEndSlot = [...info.slots].sort((a, b) => {
        // Compare end times in 24-hour format for proper sorting
        return a.end.localeCompare(b.end);
      })[info.slots.length - 1];
      const latestEnd = latestEndSlot?.displayEnd || latestEndSlot?.end || '';
      
      // Check if this pricing rule applies to all time slots
      // If all available slots have this special pricing, it means the rule applies to all slots (no time restriction)
      const totalAvailableSlots = timeSlots.value.length;
      const appliesToAllSlots = info.slots.length === totalAvailableSlots;
      
      return {
        ...info,
        minDiff,
        maxDiff,
        hasTimeRange: info.slots.length > 0 && !appliesToAllSlots, // Only show time range if it doesn't apply to all slots
        earliestStart,
        latestEnd,
        totalSlots: info.slots.length,
        appliesToAllSlots,
      };
    });
});

// Helper to group time slots that are close together (within 30 minutes gap)
function groupTimeSlots(slots: Array<{ start: string; end: string; price: number; displayStart?: string; displayEnd?: string }>): Array<{ start: string; end: string; price: number }> {
  if (slots.length === 0) return [];
  
  const groups: Array<{ start: string; end: string; price: number }> = [];
  let currentGroup: { start: string; end: string; price: number } | null = null;
  
  for (const slot of slots) {
    if (!currentGroup) {
      // Start a new group - use display format if available
      currentGroup = { 
        start: slot.displayStart || slot.start,
        end: slot.displayEnd || slot.end,
        price: slot.price 
      };
    } else {
      // Check if this slot is close to the current group (within 30 minutes)
      // Use original 24-hour format for time calculations
      const currentEndMinutes = timeToMinutes(slot.end); // Use original end time for calculation
      const slotStartMinutes = timeToMinutes(slot.start); // Use original start time for calculation
      const gap = slotStartMinutes - currentEndMinutes;
      
      // If same price and gap is <= 30 minutes, extend the group
      if (slot.price === currentGroup.price && gap <= 30 && gap >= 0) {
        currentGroup.end = slot.displayEnd || slot.end;
      } else {
        // Save current group and start a new one
        groups.push(currentGroup);
        currentGroup = { 
          start: slot.displayStart || slot.start,
          end: slot.displayEnd || slot.end,
          price: slot.price 
        };
      }
    }
  }
  
  // Don't forget the last group
  if (currentGroup) {
    groups.push(currentGroup);
  }
  
  return groups;
}

// Format the surcharge/discount message for display
const specialPricingMessage = computed(() => {
  if (!selectedSlot.value?.isSpecialPricing || !selectedTheme.value)
    return null;

  const slotPrice = selectedSlot.value.price;
  const basePrice = selectedTheme.value.base_price;
  const difference = slotPrice - basePrice;

  if (difference === 0) return null;

  if (difference > 0) {
    return t("specialPriceSurcharge") || "Special Price Surcharge";
  } else {
    return t("specialPriceDiscount") || "Special Price Discount";
  }
});

// Calculate the special pricing amount (surcharge/discount)
const specialPricingAmount = computed(() => {
  if (!selectedSlot.value?.isSpecialPricing || !selectedTheme.value) return 0;

  const slotPrice = selectedSlot.value.price;
  const basePrice = selectedTheme.value.base_price;

  return slotPrice - basePrice; // Returns the surcharge/discount amount in sen
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
    termsAccepted,
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
      termsAccepted: termsAccepted.value,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("booking_state", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save booking state:", error);
    }
  },
  { deep: true },
);
</script>

<template>
  <div
    class="min-h-screen relative text-gray-900 pb-20"
    style="font-family: &quot;Bricolage Grotesque&quot;, sans-serif"
  >
    <!-- Rustic Background Images with Crossfade -->
    <!-- <div class="fixed inset-0 z-0 bg-black">
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

      <div class="absolute inset-0 bg-[#Fcf9f6]/90 backdrop-blur-sm z-10"></div>
    </div> -->

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
              @click="prevStep"
              class="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-gray-900"
              :disabled="isProcessingPayment"
            >
              <ArrowLeft class="w-6 h-6 stroke-[2.5]" />
            </button>
            <h1 class="text-xl font-bold tracking-tight text-gray-900">
              {{ steps[currentStep - 1]?.title || t("booking") }}
            </h1>
          </div>

          <!-- Right: Segmented Progress & Cart -->
          <div class="flex items-center gap-4">
            <!-- Segmented Progress -->
            <div class="flex items-center gap-1.5">
              <template v-for="step in isCartModeEnabled ? 7 : 6" :key="step">
                <div
                  class="h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  :class="
                    step <= currentStep ? 'w-5 bg-black' : 'w-1.5 bg-gray-200'
                  "
                ></div>
              </template>
            </div>
          </div>
        </div>

        <div
          v-if="
            currentStep > 1 &&
            currentStep <= (isCartModeEnabled ? 5 : 5) &&
            selectedTheme &&
            currentStep !== (isCartModeEnabled ? 7 : 6)
          "
          class="bg-gray-50 shadow-sm border-b border-gray-100 overflow-hidden animate-fade-in relative z-30"
        >
          <!-- Top Section: Details -->
          <div class="p-4 flex gap-4 items-center">
            <!-- Image -->
            <div
              class="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
            >
              <img
                v-if="selectedTheme.images?.[0]"
                :src="selectedTheme.images[0]"
                :alt="selectedTheme.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-300"
              >
                <ImageIcon class="w-6 h-6" />
              </div>
            </div>

            <!-- Middle: Title & Date -->
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-base leading-tight">
                {{ selectedTheme.name }}
              </h3>

              <!-- Date & Time (if selected) -->
              <p
                v-if="selectedDate && selectedSlot"
                class="text-xs text-gray-500 mt-1 line-clamp-1"
              >
                {{ formatDate(selectedDate) }}, {{ selectedSlot.start }} -
                {{ selectedSlot.end }}
              </p>
              <!-- Fallback if only theme selected -->
              <p v-else class="text-xs text-gray-400 mt-1">
                {{ t("selectDateAndTime") }}
              </p>
            </div>

            <!-- Right: Price & Action -->
            <div class="flex flex-col items-center justify-between">
              <span class="font-bold text-base">
                RM{{ formatPriceWhole(selectedTheme.base_price) }}
              </span>
              <button
                @click="handleChangeTheme"
                class="text-xs text-gray-400 underline hover:text-gray-600 transition-colors"
              >
                {{ t("change") }}
              </button>
            </div>
          </div>

          <!-- Bottom Section: Hold Timer (only if hold active) -->
          <div
            v-if="confirmedSlot && holdExpiresAt && !isCartModeEnabled"
            @click="prevStep"
            class="bg-orange-50 py-2.5 flex items-center justify-center gap-2 text-orange-700 font-bold text-xs tracking-widest uppercase cursor-pointer hover:bg-orange-100 transition-colors"
          >
            <Clock class="w-3.5 h-3.5" />
            <span
              >{{ t("slotLocked") }}: {{ holdCountdown }} •
              {{ t("change") }}</span
            >
          </div>
        </div>
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
              <h3 class="text-xl font-bold">
                {{ t("processingPayment") }}
              </h3>
              <p class="text-sm text-gray-500">{{ t("pleaseWait") }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Recovery Dialog -->

      <!-- Theme Overview (shown in steps 2-4) -->

      <main
        class="p-4 sm:p-6 max-w-4xl mx-auto space-y-8 pb-32 overflow-hidden"
      >
        <Transition :name="transitionName" mode="out-in">
          <!-- Step 1: Themes -->
          <div v-if="currentStep === 1" :key="1" class="space-y-3">
            <!-- Header -->
            <div class="mb-5">
              <h2 class="text-2xl font-bold tracking-tight">
                {{ t("selectTheme") }}
              </h2>
              <p class="text-gray-500 text-xs font-light">
                {{ t("selectThemeDescription") }}
              </p>
            </div>

            <!-- Loading Skeleton -->
            <template v-if="loadingThemes">
              <div
                v-for="i in 3"
                :key="`skeleton-${i}`"
                class="bg-white rounded-[2rem] border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 animate-pulse"
              >
                <div
                  class="w-full sm:w-28 h-48 sm:h-28 bg-gray-100 rounded-2xl flex-shrink-0"
                ></div>
                <div class="flex-1 space-y-3 py-1">
                  <div class="h-6 bg-gray-100 rounded w-1/3"></div>
                  <div class="h-4 bg-gray-100 rounded w-2/3"></div>
                  <div class="flex gap-2 mt-4">
                    <div class="h-8 w-20 bg-gray-100 rounded-full"></div>
                    <div class="h-8 w-20 bg-gray-100 rounded-full"></div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Themes List -->
            <div
              v-else
              v-for="theme in studioStore.themes"
              :key="theme.id"
              class="bg-white rounded-2xl p-4 sm:p-6 border transition-all duration-300 cursor-pointer group hover:shadow-lg relative overflow-hidden"
              :class="
                selectedTheme?.id === theme.id
                  ? 'border-black shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              "
              @click="selectTheme(theme)"
            >
              <!-- Mobile Checkmark (Absolute) -->
              <div
                v-if="selectedTheme?.id === theme.id"
                class="absolute top-5 right-5 z-10 bg-gray-900 text-white rounded-full p-1 sm:hidden"
              >
                <Check class="w-3 h-3" />
              </div>

              <div class="flex flex-row gap-5 items-stretch">
                <!-- Left: Image (Fixed Square) -->
                <div
                  class="group/image relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-50 cursor-zoom-in"
                  @click.stop="openGallery(theme)"
                >
                  <img
                    v-if="theme.images?.[0]"
                    :src="theme.images[0]"
                    :alt="theme.name"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-gray-300"
                  >
                    <ImageIcon class="w-8 h-8" />
                  </div>

                  <!-- Hover Overlay -->
                  <div
                    v-if="theme.images && theme.images.length > 0"
                    class="absolute inset-0 bg-black/10 opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-all duration-300"
                  >
                    <div
                      class="bg-white/90 p-1.5 rounded-full shadow-sm backdrop-blur-sm transform scale-75 group-hover/image:scale-100 transition-all duration-300"
                    >
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
                        class="w-3.5 h-3.5 text-gray-900"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" x2="14" y1="3" y2="10" />
                        <line x1="3" x2="10" y1="21" y2="14" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Middle: Content -->
                <div class="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3
                      class="text-xl font-bold text-gray-900 leading-none mb-1"
                    >
                      {{ theme.name }}
                    </h3>
                    <p
                      class="text-[0.9rem] text-gray-500 leading-tight line-clamp-2 w-full"
                    >
                      {{ theme.description_short }}
                    </p>
                  </div>

                  <div class="flex justify-between items-end">
                    <!-- Pills / Badges -->
                    <div class="flex items-center gap-2">
                      <div
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F3F4F6] text-gray-600 text-[11px] font-bold tracking-wide"
                      >
                        <Clock class="w-3 h-3" />
                        {{ theme.duration_minutes }}m
                      </div>

                      <div
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F3F4F6] text-gray-600 text-[11px] font-bold tracking-wide"
                      >
                        <Users class="w-3 h-3" />
                        {{ theme.base_pax }} pax
                      </div>
                    </div>

                    <!-- Mobile Price -->
                    <div
                      class="sm:hidden font-bold text-lg text-gray-900 leading-none"
                    >
                      RM{{ formatPriceWhole(theme.base_price) }}
                    </div>
                  </div>
                </div>

                <!-- Right: Selection & Price (Desktop Only) -->
                <div
                  class="hidden sm:flex flex-col items-end justify-between self-stretch py-1"
                >
                  <!-- Checkmark -->
                  <div class="h-8 w-8 flex items-center justify-end">
                    <transition
                      enter-active-class="transform transition duration-300 ease-out"
                      enter-from-class="scale-50 opacity-0"
                      enter-to-class="scale-100 opacity-100"
                      leave-active-class="transform transition duration-200 ease-in"
                      leave-from-class="scale-100 opacity-100"
                      leave-to-class="scale-50 opacity-0"
                    >
                      <div
                        v-if="selectedTheme?.id === theme.id"
                        class="bg-gray-900 text-white rounded-full shadow-sm"
                      >
                        <Check class="w-4 h-4" />
                      </div>
                    </transition>
                  </div>

                  <!-- Price -->
                  <div class="font-bold text-xl text-gray-900">
                    RM{{ formatPriceWhole(theme.base_price) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Date & Time -->
          <div v-else-if="currentStep === 2" :key="2" class="space-y-10">
            <div class="flex flex-col space-y-4">
              <!-- Instructions Note -->

              <!-- Header -->
              <div class="mb-3">
                <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
                  {{ t("selectDateAndTime") }}
                </h2>
                <p class="text-gray-500 text-sm font-light">
                  {{ t("selectDateAndTimeDescription") }}
                </p>
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
                      class="snap-center flex-shrink-0 w-16 sm:w-[4.5rem] h-20 sm:h-24 rounded-2xl bg-gray-100 animate-pulse"
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
                      'snap-center flex-shrink-0 w-16 sm:w-[4.5rem] h-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group',
                      d.isBlackout
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                        : selectedDate === d.date
                          ? 'bg-gray-900 text-white shadow-xl scale-105 ring-4 ring-gray-100'
                          : 'bg-white text-gray-900 border border-gray-100 hover:border-gray-300 hover:text-gray-600',
                    ]"
                  >
                    <span
                      class="text-[10px] uppercase tracking-widest font-medium mb-1"
                      >{{ d.month }}</span
                    >
                    <span class="text-2xl font-bold leading-none">{{
                      d.day
                    }}</span>
                    <span class="text-[10px] mt-1 opacity-80">{{
                      d.weekday
                    }}</span>

                    <!-- Blackout Indicator -->
                    <div v-if="d.isBlackout" class="absolute top-2 right-2">
                      <X class="w-3 h-3 text-gray-400" />
                    </div>

                    <!-- Special Pricing Indicator -->
                    <div v-else-if="d.isSpecial" class="absolute top-2 right-2">
                      <Sparkles
                        :class="[
                          'w-3.5 h-3.5',
                          selectedDate === d.date
                            ? 'text-white fill-white/20'
                            : 'text-amber-500 fill-amber-500',
                        ]"
                      />
                    </div>
                  </button>
                </div>
              </div>

              <!-- Blackout Date Info -->
              <div
                v-if="
                  isBlackoutDateSelected && selectedDateInfo?.blackoutReason
                "
                class="bg-red-50/80 backdrop-blur-sm border border-red-100/50 p-4 rounded-2xl flex items-start gap-3 text-red-900 shadow-sm"
              >
                <div class="bg-red-100 p-2 rounded-full flex-shrink-0">
                  <AlertCircle class="w-4 h-4" />
                </div>
                <div class="text-xs leading-relaxed">
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
                class="bg-gradient-to-br from-amber-50 to-orange-50/50 backdrop-blur-sm border border-amber-200/60 p-4 rounded-2xl shadow-sm relative overflow-hidden"
              >
                <!-- Decorative background sparkle -->
                <Sparkles
                  class="absolute -top-4 -right-4 w-16 h-16 text-amber-100/50 -rotate-12"
                />

                <div class="flex items-start gap-3 relative z-10">
                  <!-- <div
                    class="bg-amber-100 p-2 rounded-full flex-shrink-0 relative z-10"
                  >
                    <Sparkles class="w-4 h-4 text-amber-600" />
                  </div> -->
                  <div class="text-xs leading-relaxed flex-1 relative z-10 space-y-2">
                    <div>
                      <span
                        class="font-bold block uppercase tracking-wider text-[10px] mb-1 text-amber-600"
                        >{{ t("specialDate") }}</span
                      >
                      <!-- <p class="font-bold text-amber-900 text-sm">
                        {{ selectedDateInfo.specialLabel || t("specialPrice") }}
                      </p> -->
                    </div>

                    <!-- Pricing Info from Time Slots -->
                    <div v-if="datePricingInfo && datePricingInfo.length > 0" class="space-y-2">
                      <div
                        v-for="(info, idx) in datePricingInfo"
                        :key="idx"
                        class="bg-amber-100/80 px-3 py-2 rounded-lg border border-amber-200/50 space-y-1.5"
                      >
                        <!-- Rule Name -->
                        <p class="font-semibold text-amber-900 text-xs">
                          {{ info.label }}
                        </p>
                        
                        <!-- Price (shown when applies to all slots) -->
                        <div v-if="info.appliesToAllSlots" class="flex items-center gap-2 text-[11px]">
                          <span class="text-amber-900 font-semibold">
                            RM{{ formatPriceWhole(info.minPrice) }}
                            <span v-if="info.minPrice !== info.maxPrice" class="text-amber-700 text-[10px]">
                              - RM{{ formatPriceWhole(info.maxPrice) }}
                            </span>
                          </span>
                        </div>
                        
                        <!-- Time Ranges with Prices (only shown if rule has time restriction) -->
                        <div v-else-if="info.hasTimeRange" class="space-y-1.5">
                          <!-- Show overall time range for clarity -->
                          <div class="flex items-center gap-2 text-[11px]">
                            <Clock class="w-3 h-3 text-amber-700 flex-shrink-0" />
                            <span class="text-amber-800 font-mono flex-1">
                              {{ info.earliestStart }} - {{ info.latestEnd }}
                            </span>
                            <span class="text-amber-900 font-semibold">
                              RM{{ formatPriceWhole(info.minPrice) }}
                              <span v-if="info.minPrice !== info.maxPrice" class="text-amber-700 text-[10px]">
                                - RM{{ formatPriceWhole(info.maxPrice) }}
                              </span>
                            </span>
                          </div>
                        </div>
                        
                        <!-- Price Difference Summary -->
                        <div v-if="info.minDiff !== 0 || info.maxDiff !== 0" class="flex items-center gap-1.5 pt-1 border-t border-amber-200/50">
                          <span class="text-[10px] text-amber-700">
                            <template v-if="info.minDiff === info.maxDiff">
                              <!-- Same price for all slots -->
                              {{ info.minDiff > 0 ? "+" : "-" }}RM{{
                                formatPriceWhole(Math.abs(info.minDiff))
                              }}
                              {{ 
                                info.minDiff > 0 
                                  ? (t("specialPriceSurcharge") || "surcharge")
                                  : (t("specialPriceDiscount") || "discount")
                              }}
                            </template>
                            <template v-else>
                              <!-- Different prices for different slots -->
                              {{ info.minDiff > 0 ? "+" : "-" }}RM{{
                                formatPriceWhole(Math.abs(info.minDiff))
                              }}
                              {{ 
                                info.minDiff > 0 
                                  ? (t("specialPriceSurcharge") || "surcharge")
                                  : (t("specialPriceDiscount") || "discount")
                              }}
                              <span v-if="info.maxDiff !== info.minDiff" class="ml-1">
                                to {{ info.maxDiff > 0 ? "+" : "-" }}RM{{
                                  formatPriceWhole(Math.abs(info.maxDiff))
                                }}
                              </span>
                            </template>
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Fallback: Show generic message if no time-based info -->
                    <div
                      v-else-if="specialPricingMessage"
                      class="flex items-center gap-2 font-bold text-amber-800 bg-amber-100/80 px-2 py-1 rounded-md border border-amber-200/50"
                    >
                      <span>{{ specialPricingAmount > 0 ? "+" : "-" }}</span>
                      <span>{{ specialPricingMessage }}</span>
                      <span>
                        {{ specialPricingAmount > 0 ? "+" : "-" }}RM{{
                          formatPriceWhole(Math.abs(specialPricingAmount))
                        }}
                      </span>
                    </div>
                    <p v-else class="text-amber-700/80 italic text-xs">
                      {{ t("specialPriceApply") || "Special pricing applies to this date" }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Time Slots -->
            <div
              data-time-section
              class="space-y-4 transition-all duration-500"
              :class="{
                'opacity-50 blur-sm pointer-events-none': !selectedDate,
              }"
            >
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold flex items-center gap-2">
                  <Clock class="w-5 h-5" /> {{ t("selectTime") }}
                </h3>
                <span
                  v-if="selectedDate"
                  class="text-xs text-gray-400 uppercase tracking-wider"
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
                    'py-4 px-3 rounded-2xl text-sm  font-medium text-center border transition-all duration-300 relative overflow-hidden flex items-center justify-center',
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
                class="text-center py-8 text-gray-500 text-sm"
              >
                {{
                  t("noSlotsAvailable") ||
                  "Tiada slot tersedia untuk tarikh ini"
                }}
              </div>
            </div>
          </div>

          <!-- Step 3: Pax & Addons -->
          <div v-else-if="currentStep === 3" :key="3" class="space-y-8">
            <!-- Main Header -->
            <div class="space-y-1 mt-5">
              <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
                {{ t("paxAndAddons") }}
              </h2>
              <p class="text-gray-500 font-light">
                {{ t("paxAndAddonsDescription") }}
              </p>
            </div>

            <!-- Pax Counter Card -->
            <div
              class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <!-- Top Section -->
              <div class="p-3 flex items-center justify-between">
                <!-- Left: Label -->
                <div class="flex items-center gap-4">
                  <div
                    class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center"
                  >
                    <Users class="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h3 class="font-bold text-lg text-gray-900">
                      {{ t("paxCount") }}
                    </h3>
                    <p class="text-gray-400 text-sm">
                      {{ t("totalPaxPresent") }}
                    </p>
                  </div>
                </div>

                <!-- Right: Counter -->
                <div class="flex items-center gap-6">
                  <button
                    @click="paxCount > 1 ? paxCount-- : null"
                    class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:hover:border-gray-200"
                    :disabled="paxCount <= 1"
                  >
                    <Minus class="w-5 h-5" />
                  </button>

                  <span class="text-2xl font-bold w-6 text-center">{{
                    paxCount
                  }}</span>

                  <button
                    @click="paxCount < maxPax ? paxCount++ : null"
                    class="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-black transition-colors disabled:opacity-50"
                    :disabled="paxCount >= maxPax"
                  >
                    <Plus class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Bottom Section: Extra Pax Summary -->
              <div
                v-if="extraPaxCost > 0"
                class="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex items-center justify-between"
              >
                <div
                  class="flex items-center gap-2 text-orange-600 font-medium"
                >
                  <Plus class="w-4 h-4" />
                  <span
                    >{{ paxCount - (selectedTheme!.base_pax || 0) }} {{ t('extraPaxLabel') }}
                    (RM{{
                      formatPriceWhole(selectedTheme.extra_pax_price)
                    }}/head)</span
                  >
                </div>
                <span class="font-bold text-gray-900"
                  >+ RM{{ formatPriceWhole(extraPaxCost) }}</span
                >
              </div>
            </div>

            <!-- Addons Section -->
            <div class="space-y-6">
              <h3 class="font-bold text-xl text-gray-900">
                Tambahan (Add-ons)
              </h3>

              <!-- Addons List -->
              <div class="space-y-4">
                <!-- Empty State -->
                <div
                  v-if="!studioStore.addons || studioStore.addons.length === 0"
                  class="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center"
                >
                  <p class="text-gray-500">
                    {{ t('noAddonsAvailable') }}
                  </p>
                </div>

                <div
                  v-for="addon in studioStore.addons"
                  :key="addon.id"
                  class="bg-white p-4 rounded-2xl border flex items-center gap-4 transition-all hover:shadow-sm"
                  :class="
                    selectedAddons[addon.id]
                      ? 'border-gray-900 bg-gray-50/50'
                      : 'border-gray-100'
                  "
                >
                  <!-- Image -->
                  <div
                    class="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden"
                  >
                    <img
                      v-if="addon.image"
                      :src="addon.image"
                      :alt="addon.name"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-gray-300"
                    >
                      <ImageIcon class="w-8 h-8" />
                    </div>
                  </div>

                  <!-- Content -->
                  <div
                    class="flex-1 min-w-0 h-24 flex flex-col justify-between py-1"
                  >
                    <div>
                      <div class="flex justify-between items-start mb-1">
                        <div class="flex flex-col items-start gap-1">
                          <h4 class="font-bold text-gray-900 leading-tight">
                            {{ addon.name }}
                          </h4>
                          <span
                            v-if="selectedAddons[addon.id]"
                            class="bg-gray-900 text-white px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            >{{ t("added") }}</span
                          >
                        </div>
                        <span
                          class="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-900 flex-shrink-0 ml-2"
                          >RM{{ formatPriceWhole(addon.price) }}</span
                        >
                      </div>
                      <p
                        class="text-sm text-gray-500 line-clamp-2 leading-relaxed"
                      >
                        {{ addon.description }}
                      </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end">
                      <button
                        v-if="!selectedAddons[addon.id]"
                        @click="selectedAddons[addon.id] = 1"
                        class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Plus class="w-4 h-4" /> {{ t("add") }}
                      </button>

                      <div
                        v-else
                        class="flex items-center gap-4 bg-gray-50 rounded-lg px-2 py-1"
                      >
                        <!-- If addon_type is 'single', show a simple Remove button -->
                        <button
                          v-if="addon.addon_type === 'single'"
                          @click="delete selectedAddons[addon.id]"
                          class="px-2 py-1 text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 class="w-4 h-4" /> Remove
                        </button>

                        <!-- Else show the quantity counter -->
                        <template v-else>
                          <button
                            @click="
                              selectedAddons[addon.id] > 0
                                ? selectedAddons[addon.id]--
                                : null;
                              if (selectedAddons[addon.id] === 0)
                                delete selectedAddons[addon.id];
                            "
                            class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900"
                          >
                            <Minus class="w-4 h-4" />
                          </button>
                          <span class="font-bold w-4 text-center">{{
                            selectedAddons[addon.id]
                          }}</span>
                          <button
                            @click="selectedAddons[addon.id]++"
                            class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900"
                            :disabled="
                              addon.max_quantity &&
                              addon.max_quantity > 0 &&
                              selectedAddons[addon.id] >= addon.max_quantity
                            "
                          >
                            <Plus class="w-4 h-4" />
                          </button>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Conditional - Cart Review (Cart Mode) or Customer Information (Single Mode) -->
          <!-- Cart Mode: Cart Review -->
          <div
            v-else-if="currentStep === 4 && isCartModeEnabled"
            :key="4.1"
            class="space-y-8"
          >
            <div class="space-y-4">
              <h2 class="text-xl sm:text-2xl font-bold">
                {{ t("yourSessions") }}
              </h2>
              <!-- Empty Cart State -->
              <div
                v-if="cartItemCount === 0"
                class="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm text-center"
              >
                <p class="text-gray-500">
                  {{ t("cartEmpty") }}
                </p>
                <button
                  @click="addAnotherSession"
                  class="mt-4 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg transition-all"
                >
                  {{ t("addSession") }}
                </button>
              </div>

              <!-- Unified Cart Hold Timer (Subtle Style) -->
              <div
                v-if="unifiedCartHoldExpiresAt && cart.length > 0"
                class="bg-orange-50 rounded-xl py-3 px-4 flex items-center justify-between border border-orange-100"
              >
                <div
                  class="flex items-center gap-2 text-orange-800 font-bold text-xs uppercase tracking-wider"
                >
                  <Clock class="w-4 h-4 animate-pulse" />
                  <span>{{ t("slotHeld") }}</span>
                </div>
                <div class="text-orange-700 font-mono font-bold text-sm">
                  {{ unifiedCartHoldCountdown }}
                </div>
              </div>

              <!-- Cart Items -->
              <div
                v-for="(item, index) in cart || []"
                :key="item.id"
                class="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm relative group"
              >
                <button
                  @click="removeCartItem(index)"
                  class="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
                <div class="pr-10">
                  <h3 class="font-bold text-lg">
                    {{ item.theme.name }}
                  </h3>
                  <!-- Theme & Slot Details -->
                  <div class="text-sm text-gray-500 mt-2 space-y-1">
                    <div class="flex items-center gap-2">
                      <Calendar class="w-3.5 h-3.5" />
                      <span class="font-medium text-gray-700">{{
                        item.date
                      }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Clock class="w-3.5 h-3.5" />
                      <span>{{ item.slot.start }} - {{ item.slot.end }}</span>
                    </div>
                  </div>

                  <!-- Accordion Toggle Button -->
                  <button
                    @click="toggleCartItemExpansion(item.id)"
                    class="mt-4 flex items-center gap-1 text-xs font-bold text-gray-900 border-b border-dashed border-gray-300 pb-0.5 hover:text-gray-600 hover:border-gray-400 transition-colors w-fit"
                  >
                    <span>{{
                      expandedCartItems.has(item.id)
                        ? t("hideDetails")
                        : t("viewBreakdown")
                    }}</span>
                    <component
                      :is="expandedCartItems.has(item.id) ? Minus : Plus"
                      class="w-3 h-3"
                    />
                  </button>

                  <!-- Expanded Pricing Breakdown -->
                  <div
                    v-if="expandedCartItems.has(item.id)"
                    class="mt-4 pt-4 border-t border-dashed border-gray-100 space-y-2 text-sm bg-gray-50/50 p-4 rounded-xl animate-fade-in"
                  >
                    <!-- Base Price -->
                    <div
                      class="flex justify-between items-center text-gray-600"
                    >
                      <span
                        >{{ t("setPrice") }} ({{
                          item.theme.base_pax
                        }}
                        Pax)</span
                      >
                      <span
                        >RM{{ formatPriceWhole(item.theme.base_price) }}</span
                      >
                    </div>

                    <!-- Special Pricing -->
                    <div
                      v-if="item.specialPricing"
                      class="flex justify-between items-center"
                    >
                      <div class="flex items-center gap-1.5 text-amber-700">
                        <AlertCircle class="w-3 h-3" />
                        <span>{{ item.specialPricing.message }}</span>
                      </div>
                      <span
                        :class="
                          item.specialPricing.amount > 0
                            ? 'text-amber-700'
                            : 'text-green-600'
                        "
                      >
                        {{ item.specialPricing.amount > 0 ? "+" : "" }}RM{{
                          formatPriceWhole(item.specialPricing.amount)
                        }}
                      </span>
                    </div>

                    <!-- Extra Pax -->
                    <div
                      v-if="
                        Math.max(0, item.pax - (item.theme.base_pax || 0)) > 0
                      "
                      class="flex justify-between items-center text-gray-600"
                    >
                      <span
                        >{{ t('extraPaxLabel') }} (x{{
                          Math.max(0, item.pax - (item.theme.base_pax || 0))
                        }})</span
                      >
                      <span
                        >+RM{{
                          formatPriceWhole(
                            Math.max(0, item.pax - (item.theme.base_pax || 0)) *
                              item.theme.extra_pax_price,
                          )
                        }}</span
                      >
                    </div>

                    <!-- Addons -->
                    <template v-for="(qty, id) in item.addons" :key="id">
                      <div
                        v-if="
                          qty > 0 && studioStore.addons.find((a) => a.id === id)
                        "
                        class="flex justify-between items-center text-gray-600"
                      >
                        <span class="truncate pr-4"
                          >{{
                            studioStore.addons.find((a) => a.id === id).name
                          }}
                          (x{{ qty }})</span
                        >
                        <span
                          >+RM{{
                            formatPriceWhole(
                              (studioStore.addons.find((a) => a.id === id)
                                .price || 0) * qty,
                            )
                          }}</span
                        >
                      </div>
                    </template>
                  </div>

                  <!-- Item Total -->
                  <div
                    class="mt-4 border-t border-gray-100 pt-3 flex justify-between items-center"
                  >
                    <span class="font-bold text-gray-900 text-sm">Total</span>
                    <span class="font-bold text-lg text-gray-900"
                      >RM{{ formatPriceWhole(item.total) }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- Add Another Session Button -->
              <button
                @click="addAnotherSession"
                class="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase tracking-widest text-xs hover:border-gray-900 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
              >
                <Plus class="w-4 h-4" />
                {{ t("addAnotherSession") }}
              </button>
            </div>
          </div>

          <!-- Single Mode: Customer Information -->
          <div
            v-else-if="currentStep === 4 && !isCartModeEnabled"
            class="animate-fade-in"
          >
            <div class="space-y-8 px-2 mt-5">
              <!-- Main Header -->
              <div class="space-y-1">
                <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
                  {{ t("customerInformation") }}
                </h2>
                <p class="text-gray-500 font-light">
                  {{ t("fillDetailsNote") }}
                </p>
              </div>

              <div class="space-y-6">
                <div class="relative group">
                  <input
                    type="text"
                    v-model="customerInfo.name"
                    @blur="validateName"
                    @input="formErrors.name = ''"
                    id="name"
                    required
                    class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent"
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
                  <p v-if="formErrors.name" class="mt-1 text-xs text-red-500">
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
                    class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent"
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
                  <p v-if="formErrors.phone" class="mt-1 text-xs text-red-500">
                    {{ formErrors.phone }}
                  </p>
                  <p v-else class="mt-1 text-xs text-gray-500">
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
                    class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent"
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
                  <p v-if="formErrors.email" class="mt-1 text-xs text-red-500">
                    {{ formErrors.email }}
                  </p>
                  <p v-else class="mt-1 text-xs text-gray-500">
                    {{ t("emailConfirmationNote") }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Cart Mode: Customer Information -->
          <div
            v-else-if="currentStep === 5 && isCartModeEnabled"
            :key="5.1"
            class="space-y-8 animate-fade-in"
          >
            <div class="space-y-6 px-2">
              <div class="space-y-1">
                <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
                  {{ t("customerInformation") }}
                </h2>
                <p class="text-gray-500 font-light">
                  {{ t("fillDetailsNote") }}
                </p>
              </div>

              <div class="space-y-6 mt-5">
                <div class="relative group">
                  <input
                    type="text"
                    v-model="customerInfo.name"
                    @blur="validateName"
                    @input="formErrors.name = ''"
                    id="cart-name"
                    required
                    class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent"
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
                  <p v-if="formErrors.name" class="mt-1 text-xs text-red-500">
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
                    class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent"
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
                  <p v-if="formErrors.phone" class="mt-1 text-xs text-red-500">
                    {{ formErrors.phone }}
                  </p>
                  <p v-else class="mt-1 text-xs text-gray-500">
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
                    class="peer w-full bg-transparent border-b-2 py-2.5 pt-4 outline-none text-lg transition-colors placeholder-transparent"
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
                  <p v-if="formErrors.email" class="mt-1 text-xs text-red-500">
                    {{ formErrors.email }}
                  </p>
                  <p v-else class="mt-1 text-xs text-gray-500">
                    {{ t("emailConfirmationNote") }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 6: Conditional - Terms & Conditions (Cart Mode) or Summary (Single Mode) -->
          <!-- Cart Mode: Terms & Conditions -->
          <div
            v-else-if="currentStep === 6 && isCartModeEnabled"
            class="space-y-6 animate-fade-in"
          >
            <div class="space-y-4">
              <!-- <h3 class="font-bold text-lg sm:text-xl px-1">{{ t('termsAndConditions') }}</h3> -->

              <!-- Scrollable Terms Container -->
              <div
                class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto"
              >
                <div class="p-4 sm:p-6 space-y-6">
                  <!-- Loading State -->
                  <div v-if="loadingTerms" class="flex justify-center py-8">
                    <Loader2 class="w-6 h-6 animate-spin text-gray-400" />
                  </div>

                  <!-- Terms Content -->
                  <div
                    v-else-if="termsContent"
                    class="prose prose-sm sm:prose max-w-none text-gray-700 space-y-4"
                  >
                    <h4 class="font-bold text-lg text-gray-900">
                      {{ t("bookingTerms") || "Booking Terms" }}
                    </h4>

                    <div
                      class="space-y-4 text-sm sm:text-base leading-relaxed"
                      v-html="sanitize(termsContentHtml)"
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
                    class="block text-sm sm:text-base font-bold text-gray-900 mb-1"
                  >
                    {{ t("agreeToTerms") }}
                  </span>
                  <span
                    class="block text-xs sm:text-sm text-gray-600 leading-relaxed"
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
            v-else-if="currentStep === 5 && !isCartModeEnabled"
            class="space-y-6 animate-fade-in"
          >
            <div class="space-y-4">
              <!-- <h3 class="font-bold text-lg sm:text-xl px-1">{{ t('termsAndConditions') }}</h3> -->

              <!-- Scrollable Terms Container -->
              <div
                class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto"
                style=""
              >
                <div class="p-4 sm:p-6 space-y-6">
                  <!-- Loading State -->
                  <div v-if="loadingTerms" class="flex justify-center py-8">
                    <Loader2 class="w-6 h-6 animate-spin text-gray-400" />
                  </div>

                  <!-- Terms Content -->
                  <div
                    v-else-if="termsContent"
                    class="prose prose-sm sm:prose max-w-none text-gray-700 space-y-4"
                  >
                    <h4 class="font-bold text-lg text-gray-900">
                      {{ t("bookingTerms") }}
                    </h4>

                    <div
                      class="space-y-4 text-sm sm:text-base leading-relaxed"
                      v-html="sanitize(termsContentHtml)"
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
                    class="block text-sm sm:text-base font-bold text-gray-900 mb-1"
                  >
                    {{ t("agreeToTerms") }}
                  </span>
                  <span
                    class="block text-xs sm:text-sm text-gray-600 leading-relaxed"
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
            v-else-if="currentStep === 7 && isCartModeEnabled"
            class="space-y-8 animate-fade-in"
          >
            <!-- Header -->
            <div class="mb-5">
              <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
                {{ t("bookingSummary") }}
              </h2>
              <p class="text-gray-500 text-xs font-light">
                {{ t("bookingSummaryDescription") }}
              </p>
            </div>

            <!-- Unified Cart Hold Timer (Subtle Style) -->
            <div
              v-if="unifiedCartHoldExpiresAt && cart.length > 0"
              class="bg-orange-50 rounded-xl py-3 px-4 flex items-center justify-between border border-orange-100"
            >
              <div
                class="flex items-center gap-2 text-orange-800 font-bold text-xs uppercase tracking-wider"
              >
                <Clock class="w-4 h-4 animate-pulse" />
                <span>{{ t("slotHeld") }}</span>
              </div>
              <div class="text-orange-700 font-mono font-bold text-sm">
                {{ unifiedCartHoldCountdown }}
              </div>
            </div>

            <!-- Booking Summary Card -->
            <div
              class="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
            >
              <!-- Card Header: Customer Info (Matches Step 6) -->
              <div
                class="bg-gray-50/80 p-4 sm:p-6 flex justify-between items-start border-b border-gray-100"
              >
                <div>
                  <h3 class="font-bold text-lg text-gray-900">
                    {{ customerInfo.name }}
                  </h3>
                  <div
                    class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500 mt-1"
                  >
                    <div class="flex items-center gap-1.5">
                      <Phone class="w-3.5 h-3.5" /> {{ customerInfo.phone }}
                    </div>
                    <div class="hidden sm:block w-px h-3 bg-gray-300"></div>
                    <div class="flex items-center gap-1.5">
                      <Mail class="w-3.5 h-3.5" /> {{ customerInfo.email }}
                    </div>
                  </div>
                </div>
                <button
                  @click="currentStep = 5"
                  class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Pencil class="w-4 h-4 text-gray-900" />
                </button>
              </div>

              <!-- Cart Items Content -->
              <div class="p-4 sm:p-6">
                <div class="space-y-8">
                  <!-- Iterate over cart items -->
                  <div
                    v-for="(item, index) in cart || []"
                    :key="item.id"
                    class="relative"
                  >
                    <!-- Item Header -->
                    <div class="flex justify-between items-start mb-1">
                      <h4 class="font-bold text-lg text-gray-900">
                        {{ item.theme.name }}
                      </h4>
                      <span class="font-bold text-lg text-gray-900">
                        RM{{ formatPriceWhole(item.theme.base_price) }}
                      </span>
                    </div>

                    <!-- Date & Time -->
                    <div class="text-gray-500 text-sm flex items-center gap-2">
                      <span>{{ item.date }}</span>
                      <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{{ item.slot.start }} - {{ item.slot.end }}</span>
                    </div>

                    <!-- Breakdown Details (Extras) -->
                    <div
                      v-if="
                        Math.max(0, item.pax - (item.theme.base_pax || 0)) >
                          0 ||
                        Object.values(item.addons).some((v) => v > 0) ||
                        item.specialPricing
                      "
                      class="mt-4 space-y-2"
                    >
                      <!-- Special Pricing -->
                      <!-- Special Pricing -->
                      <!-- Special Pricing -->
                      <div
                        v-if="item.specialPricing"
                        class="flex justify-between text-sm pl-4 relative"
                      >
                        <span class="absolute left-0 text-gray-400">
                          {{ item.specialPricing.amount > 0 ? "+" : "-" }}
                        </span>
                        <span class="text-gray-500">{{
                          item.specialPricing.message
                        }}</span>
                        <span
                          class="font-bold"
                          :class="
                            item.specialPricing.amount > 0
                              ? 'text-gray-900'
                              : 'text-green-600'
                          "
                        >
                          {{ item.specialPricing.amount > 0 ? "+" : "-" }}RM{{
                            formatPriceWhole(
                              Math.abs(item.specialPricing.amount),
                            )
                          }}
                        </span>
                      </div>

                      <!-- Extra Pax -->
                      <div
                        v-if="
                          Math.max(0, item.pax - (item.theme.base_pax || 0)) > 0
                        "
                        class="flex justify-between text-sm pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-gray-400"
                      >
                        <span class="text-gray-500"
                          >{{ t('extraPaxLabel') }} (x{{
                            Math.max(0, item.pax - (item.theme.base_pax || 0))
                          }})</span
                        >
                        <span class="font-bold text-gray-900">
                          +RM{{
                            formatPriceWhole(
                              Math.max(
                                0,
                                item.pax - (item.theme.base_pax || 0),
                              ) * item.theme.extra_pax_price,
                            )
                          }}
                        </span>
                      </div>

                      <!-- Addons -->
                      <template v-for="(qty, id) in item.addons" :key="id">
                        <div
                          v-if="
                            qty > 0 &&
                            studioStore.addons.find((a) => a.id === id)
                          "
                          class="flex justify-between text-sm pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-gray-400"
                        >
                          <span class="text-gray-500">
                            {{
                              studioStore.addons.find((a) => a.id === id)?.name
                            }}
                            (x{{ qty }})
                          </span>
                          <span class="font-bold text-gray-900">
                            +RM{{
                              formatPriceWhole(
                                (studioStore.addons.find((a) => a.id === id)
                                  ?.price || 0) * qty,
                              )
                            }}
                          </span>
                        </div>
                      </template>
                    </div>

                    <!-- Item Total Row -->
                    <div
                      class="mt-4 pt-4 border-t border-dashed border-gray-100 flex justify-between items-center"
                    >
                      <span
                        class="text-xs font-bold uppercase tracking-wider text-gray-400"
                        >{{ t("total") || "Total" }}</span
                      >
                      <span class="font-bold text-gray-900"
                        >RM{{ formatPriceWhole(item.total) }}</span
                      >
                    </div>

                    <!-- Divider between items (except last) -->
                    <div
                      v-if="index < cart.length - 1"
                      class="my-8 border-b border-gray-100 w-full absolute -left-0 right-0"
                    ></div>
                  </div>
                </div>

                <!-- Separator -->
                <div class="border-t border-dashed border-gray-200 my-6"></div>

                <!-- Coupon Section (Matches Step 6) -->
                <div>
                  <div v-if="!validatedCoupon" class="flex gap-2">
                    <input
                      type="text"
                      v-model="couponCode"
                      :placeholder="t('haveCoupon')"
                      class="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-900 focus:ring-0 text-sm transition-colors"
                      @keydown.enter.prevent="handleApplyCoupon"
                    />
                    <button
                      @click="handleApplyCoupon"
                      :disabled="!couponCode.trim() || isValidatingCoupon"
                      class="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-black transition-colors"
                    >
                      {{ isValidatingCoupon ? "..." : t("apply") || "Guna" }}
                    </button>
                  </div>

                  <p v-if="couponError" class="text-xs text-red-500 mt-2 ml-1">
                    {{ couponError }}
                  </p>

                  <!-- Applied Coupon -->
                  <div
                    v-if="validatedCoupon"
                    class="bg-green-50 p-3 rounded-xl border border-green-100 space-y-3"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Ticket class="w-4 h-4 text-green-700" />
                        <span class="font-bold text-green-700">{{
                          validatedCoupon.code
                        }}</span>
                        <span class="text-green-600 text-sm"
                          >(-RM{{ formatPriceWhole(discountAmount) }})</span
                        >
                      </div>
                      <button
                        @click="removeCoupon"
                        class="p-1 hover:bg-green-100 rounded-full text-green-700 transition-colors"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Separator -->
                <div class="border-t border-gray-100 my-6"></div>

                <!-- Payment Summary -->
                <div class="space-y-3">
                  <!-- Jumlah Harga -->
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">{{
                      t("totalPrice") || "Jumlah Harga"
                    }}</span>
                    <span class="font-medium text-gray-900"
                      >RM{{ formatPriceWhole(grandTotal) }}</span
                    >
                  </div>

                  <!-- Caj Transaksi (when on_top mode and amount > 0) -->
                  <div
                    v-if="
                      studioStore.websiteSettings?.chipFeeMode === 'on_top' &&
                      grandTotal > 0
                    "
                    class="flex justify-between text-sm"
                  >
                    <span class="text-gray-600">{{
                      t("chipFee") || "Caj Transaksi"
                    }}</span>
                    <span class="font-medium text-gray-900">RM1.00</span>
                  </div>

                  <!-- Deposit row (only for deposit mode) -->
                  <div
                    v-if="paymentType === 'deposit'"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-gray-600">{{
                      t("depositAmount") || "Deposit"
                    }}</span>
                    <span class="font-medium text-gray-900"
                      >RM{{ formatPriceWhole(depositAmount) }}</span
                    >
                  </div>

                  <!-- Separator -->
                  <div class="border-t border-gray-200 my-2"></div>

                  <!-- Jumlah Perlu Dibayar - Highlighted -->
                  <div class="bg-gray-900 rounded-xl p-4 -mx-2">
                    <div class="flex justify-between items-center">
                      <span
                        class="text-sm font-medium text-white uppercase tracking-wide"
                      >
                        {{ t("amountToPay") || "Jumlah Perlu Dibayar" }}
                      </span>
                      <span class="text-2xl font-bold text-white">
                        RM{{
                          formatPriceWhole(
                            paymentType === "deposit"
                              ? effectiveDepositAmount +
                                  (studioStore.websiteSettings?.chipFeeMode ===
                                    "on_top" &&
                                  effectiveDepositAmount + effectiveBalance > 0
                                    ? 100
                                    : 0)
                              : effectiveDepositAmount +
                                  effectiveBalance +
                                  (studioStore.websiteSettings?.chipFeeMode ===
                                    "on_top" &&
                                  effectiveDepositAmount + effectiveBalance > 0
                                    ? 100
                                    : 0),
                          )
                        }}
                      </span>
                    </div>
                  </div>

                  <!-- Balance to pay at studio (for deposit mode) -->
                  <div
                    v-if="paymentType === 'deposit'"
                    class="text-center text-xs text-gray-500"
                  >
                    {{ t("balanceAtStudio") || "Baki bayar di studio" }}:
                    <span class="font-bold text-gray-700"
                      >RM{{ formatPriceWhole(effectiveBalance) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Single Mode: Summary -->
          <div
            v-else-if="currentStep === 6 && !isCartModeEnabled"
            class="space-y-8 animate-fade-in"
          >
            <!-- Header -->
            <div class="mb-5">
              <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
                {{ t("bookingSummary") }}
              </h2>
              <p class="text-gray-500 text-xs font-light">
                {{ t("bookingSummaryDescription") }}
              </p>
            </div>
            <!-- Booking Summary Card -->
            <div
              class="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
            >
              <div
                class="bg-gray-50/80 p-4 sm:p-6 flex justify-between items-start border-b border-gray-100"
              >
                <div>
                  <h3 class="font-bold text-lg text-gray-900">
                    {{ customerInfo.name }}
                  </h3>
                  <div
                    class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500 mt-1"
                  >
                    <div class="flex items-center gap-1.5">
                      <Phone class="w-3.5 h-3.5" /> {{ customerInfo.phone }}
                    </div>
                    <div class="hidden sm:block w-px h-3 bg-gray-300"></div>
                    <div class="flex items-center gap-1.5">
                      <Mail class="w-3.5 h-3.5" /> {{ customerInfo.email }}
                    </div>
                  </div>
                </div>
                <button
                  @click="currentStep = 4"
                  class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Pencil class="w-4 h-4 text-gray-900" />
                </button>
              </div>

              <!-- Hold Timer Banner -->
              <div
                v-if="confirmedSlot && holdExpiresAt"
                class="bg-orange-50 border-b border-orange-100 flex items-center justify-center gap-2 py-2 text-orange-700 text-xs font-bold uppercase tracking-wider"
              >
                <Clock class="w-3.5 h-3.5 animate-pulse" />
                <span> {{ t("slotLocked") }}: {{ holdCountdown }} </span>
              </div>

              <div class="p-4 sm:p-6">
                <!-- 2. Main Booking Details -->
                <div class="space-y-6">
                  <!-- Theme Item -->
                  <div>
                    <div class="flex justify-between items-start mb-1">
                      <h4 class="font-bold text-lg text-gray-900">
                        {{ selectedTheme?.name }}
                      </h4>
                      <span class="font-bold text-lg text-gray-900"
                        >RM{{
                          formatPriceWhole(selectedTheme?.base_price || 0)
                        }}</span
                      >
                    </div>
                    <p class="text-gray-500 text-sm">
                      {{ formatDate(selectedDate) }},
                      {{ selectedSlot?.start }} -
                      {{ selectedSlot?.end }}
                    </p>

                    <!-- Extras (Pax & Addons) -->
                    <div
                      v-if="
                        extraPaxCost > 0 ||
                        Object.values(selectedAddons).some((v) => v > 0) ||
                        specialPricingAmount !== 0
                      "
                      class="mt-4 space-y-2"
                    >
                      <!-- Special Pricing -->
                      <!-- Special Pricing -->
                      <div
                        v-if="specialPricingAmount !== 0"
                        class="flex justify-between text-sm pl-4 relative"
                      >
                        <span class="absolute left-0 text-gray-400">
                          {{ specialPricingAmount > 0 ? "+" : "-" }}
                        </span>
                        <span class="text-gray-500">
                          {{ specialPricingMessage || t("specialDate") }}
                        </span>
                        <span
                          class="font-bold"
                          :class="
                            specialPricingAmount > 0
                              ? 'text-gray-900'
                              : 'text-green-600'
                          "
                        >
                          {{ specialPricingAmount > 0 ? "+" : "-" }}RM{{
                            formatPriceWhole(Math.abs(specialPricingAmount))
                          }}
                        </span>
                      </div>

                      <!-- Extra Pax -->
                      <div
                        v-if="extraPaxCost > 0"
                        class="flex justify-between text-sm pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-gray-400"
                      >
                        <span class="text-gray-500">
                          {{ t('extraPaxLabel') }} (x{{
                            paxCount - (selectedTheme!.base_pax || 0)
                          }})
                        </span>
                        <span class="font-bold text-gray-900"
                          >+RM{{ formatPriceWhole(extraPaxCost) }}</span
                        >
                      </div>

                      <!-- Addons -->
                      <template v-for="(qty, id) in selectedAddons" :key="id">
                        <div
                          v-if="qty > 0"
                          class="flex justify-between text-sm pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-gray-400"
                        >
                          <span class="text-gray-500">
                            {{
                              studioStore.addons.find((a) => a.id === id)?.name
                            }}
                            (x{{ qty }})
                          </span>
                          <span class="font-bold text-gray-900">
                            +RM{{
                              formatPriceWhole(
                                (studioStore.addons.find((a) => a.id === id)
                                  ?.price || 0) * qty,
                              )
                            }}
                          </span>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Separator -->
                  <div class="border-t border-dashed border-gray-200"></div>

                  <!-- 3. Coupon Section -->
                  <div>
                    <div v-if="!validatedCoupon" class="flex gap-2">
                      <input
                        type="text"
                        v-model="couponCode"
                        :placeholder="t('haveCoupon')"
                        class="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-900 focus:ring-0 text-sm transition-colors"
                        @keydown.enter.prevent="handleApplyCoupon"
                      />
                      <button
                        @click="handleApplyCoupon"
                        :disabled="!couponCode.trim() || isValidatingCoupon"
                        class="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-black transition-colors"
                      >
                        {{ isValidatingCoupon ? "..." : t("apply") || "Guna" }}
                      </button>
                    </div>

                    <p
                      v-if="couponError"
                      class="text-xs text-red-500 mt-2 ml-1"
                    >
                      {{ couponError }}
                    </p>

                    <!-- Applied Coupon -->
                    <div
                      v-if="validatedCoupon"
                      class="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between"
                    >
                      <div class="flex items-center gap-2">
                        <Ticket class="w-4 h-4 text-green-700" />
                        <span class="font-bold text-green-700">{{
                          validatedCoupon.code
                        }}</span>
                        <span class="text-green-600 text-sm"
                          >(-RM{{ formatPriceWhole(discountAmount) }})</span
                        >
                      </div>
                      <button
                        @click="removeCoupon"
                        class="p-1 hover:bg-green-100 rounded-full text-green-700 transition-colors"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Separator -->
                  <div class="border-t border-gray-100"></div>

                  <!-- Payment Summary -->
                  <div class="space-y-3">
                    <!-- Jumlah Harga -->
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">{{
                        t("totalPrice") || "Jumlah Harga"
                      }}</span>
                      <span class="font-medium text-gray-900"
                        >RM{{ formatPriceWhole(grandTotal) }}</span
                      >
                    </div>

                    <!-- Caj Transaksi (when on_top mode and amount > 0) -->
                    <div
                      v-if="
                        studioStore.websiteSettings?.chipFeeMode === 'on_top' &&
                        grandTotal > 0
                      "
                      class="flex justify-between text-sm"
                    >
                      <span class="text-gray-600">{{
                        t("chipFee") || "Caj Transaksi"
                      }}</span>
                      <span class="font-medium text-gray-900">RM1.00</span>
                    </div>

                    <!-- Deposit row (only for deposit mode) -->
                    <div
                      v-if="paymentType === 'deposit'"
                      class="flex justify-between text-sm"
                    >
                      <span class="text-gray-600">{{
                        t("depositAmount") || "Deposit"
                      }}</span>
                      <span class="font-medium text-gray-900"
                        >RM{{ formatPriceWhole(depositAmount) }}</span
                      >
                    </div>

                    <!-- Separator -->
                    <div class="border-t border-gray-200 my-2"></div>

                    <!-- Jumlah Perlu Dibayar - Highlighted -->
                    <div class="bg-gray-900 rounded-xl p-4 -mx-2">
                      <div class="flex justify-between items-center">
                        <span
                          class="text-sm font-medium text-white uppercase tracking-wide"
                        >
                          {{ t("amountToPay") || "Jumlah Perlu Dibayar" }}
                        </span>
                        <span class="text-2xl font-bold text-white">
                          RM{{
                            formatPriceWhole(
                              paymentType === "deposit"
                                ? effectiveDepositAmount +
                                    (studioStore.websiteSettings
                                      ?.chipFeeMode === "on_top" &&
                                    effectiveDepositAmount + effectiveBalance >
                                      0
                                      ? 100
                                      : 0)
                                : effectiveDepositAmount +
                                    effectiveBalance +
                                    (studioStore.websiteSettings
                                      ?.chipFeeMode === "on_top" &&
                                    effectiveDepositAmount + effectiveBalance >
                                      0
                                      ? 100
                                      : 0),
                            )
                          }}
                        </span>
                      </div>
                    </div>

                    <!-- Balance to pay at studio (for deposit mode) -->
                    <div
                      v-if="paymentType === 'deposit'"
                      class="text-center text-xs text-gray-500"
                    >
                      {{ t("balanceAtStudio") || "Baki bayar di studio" }}:
                      <span class="font-bold text-gray-700"
                        >RM{{ formatPriceWhole(effectiveBalance) }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </main>
    </div>

    <!-- Bottom Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div class="safe-area-bottom max-w-2xl mx-auto border-t border-gray-200">
        <div
          class="bg-white/90 sm:bg-white/80 backdrop-blur-md border border-white/40 p-3 sm:p-4 shadow-2xl shadow-black/5 flex flex-row items-center justify-between gap-4 pointer-events-auto"
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
            <span class="font-bold text-xl sm:text-2xl">
              RM{{
                formatPriceWhole(
                  (grandTotal || 0) +
                    (studioStore.websiteSettings?.chipFeeMode === "on_top" &&
                    (grandTotal || 0) > 0 &&
                    isSummaryStep
                      ? 100
                      : 0),
                )
              }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <!-- Cart Indicator (Bottom Bar) -->
            <div
              v-if="isCartModeEnabled && cartItemCount > 0"
              @click="currentStep = 4"
              class="relative flex items-center justify-center cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <ShoppingBag class="w-6 h-6 text-gray-900" />
              <span
                class="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
                >{{ cartItemCount }}</span
              >
            </div>

            <button
              @click="nextStep"
              :disabled="
                (currentStep === 1 && !selectedTheme) ||
                (currentStep === 2 && !selectedSlot) ||
                (isCartModeEnabled &&
                  currentStep === 3 &&
                  (!selectedTheme || !selectedDate || !selectedSlot)) ||
                (isCartModeEnabled &&
                  currentStep === 4 &&
                  cartItemCount === 0) ||
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
                    !termsAccepted)) ||
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
              class="bg-gray-900 text-white px-5 sm:px-8 py-3 sm:py-6 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] w-auto"
            >
              <span v-if="isProcessingPayment">{{
                t("processingPayment")
              }}</span>
              <span v-else-if="isCartModeEnabled && currentStep === 3">{{
                t("addToCart") || "Add to Cart"
              }}</span>
              <span v-else-if="isCartModeEnabled && currentStep === 7">
                {{ t("pay") || "Bayar" }} RM{{
                  formatPriceWhole(
                    paymentType === "deposit"
                      ? effectiveDepositAmount +
                          (studioStore.websiteSettings?.chipFeeMode ===
                            "on_top" &&
                          effectiveDepositAmount + effectiveBalance > 0
                            ? 100
                            : 0)
                      : effectiveDepositAmount +
                          effectiveBalance +
                          (studioStore.websiteSettings?.chipFeeMode ===
                            "on_top" &&
                          effectiveDepositAmount + effectiveBalance > 0
                            ? 100
                            : 0),
                  )
                }}
              </span>
              <span v-else-if="!isCartModeEnabled && currentStep === 6">
                {{ t("pay") || "Bayar" }} RM{{
                  formatPriceWhole(
                    paymentType === "deposit"
                      ? effectiveDepositAmount +
                          (studioStore.websiteSettings?.chipFeeMode ===
                            "on_top" &&
                          effectiveDepositAmount + effectiveBalance > 0
                            ? 100
                            : 0)
                      : effectiveDepositAmount +
                          effectiveBalance +
                          (studioStore.websiteSettings?.chipFeeMode ===
                            "on_top" &&
                          effectiveDepositAmount + effectiveBalance > 0
                            ? 100
                            : 0),
                  )
                }}
              </span>
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
    </div>

    <!-- Recovery Dialog (Moved to end for stacking order) -->
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
        class="fixed inset-0 z-[99] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
          <h3 class="text-2xl font-bold mb-4">
            {{ t("restoreYourBooking") }}
          </h3>
          <p class="text-sm text-gray-600 mb-6">
            {{ t("restoreBookingMessage") }}
          </p>

          <div
            class="space-y-2 text-sm mb-6 bg-gray-50 p-4 rounded-xl max-h-60 overflow-y-auto"
          >
            <!-- Cart Items Recovery -->
            <template
              v-if="
                recoveryState.cartItems && recoveryState.cartItems.length > 0
              "
            >
              <div class="font-bold mb-2 border-b border-gray-200 pb-2">
                {{ t("cartItems") }} ({{ recoveryState.cartItems.length }})
              </div>
              <div
                v-for="(item, idx) in recoveryState.cartItems"
                :key="idx"
                class="mb-3 last:mb-0 border-b last:border-0 border-dashed border-gray-200 pb-2 last:pb-0"
              >
                <div class="font-bold text-gray-900">
                  {{ item.theme.name }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ formatDate(item.date) }} • {{ item.slot.start }}
                </div>
              </div>
            </template>

            <!-- Single Session Recovery -->
            <template v-else>
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
            </template>
          </div>

          <div class="flex gap-3">
            <button
              @click="restoreBookingState(recoveryState)"
              :disabled="isRecovering"
              class="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isRecovering" class="w-4 h-4 animate-spin" />
              {{
                isRecovering ? t("restoring") : `${t("yes")}, ${t("continue")}`
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

    <!-- Image Carousel -->
    <ImageCarousel
      :show="galleryState.show"
      :images="galleryState.images"
      :initialIndex="galleryState.initialIndex"
      @close="closeGallery"
    />
  </div>
</template>

<style scoped>
/* Updated Fonts: Playfair Display & Bricolage Grotesque */
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap");

.font-serif {
  font-family: "Playfair Display", serif;
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

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

/* Slide Left Transition (Next Step) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-left-enter-to,
.slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Slide Right Transition (Previous Step) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Prose styling for markdown content (terms & conditions) */
:deep(.prose) {
  @apply text-sm;
}

:deep(.prose h1) {
  @apply text-2xl font-bold mt-6 mb-4;
}

:deep(.prose h2) {
  @apply text-xl font-bold mt-5 mb-3;
}

:deep(.prose h3) {
  @apply text-lg font-semibold mt-4 mb-2;
}

:deep(.prose p) {
  @apply my-3;
}

:deep(.prose ul) {
  @apply my-3 ml-6 list-disc;
}

:deep(.prose ol) {
  @apply my-3 ml-6 list-decimal;
}

:deep(.prose li) {
  @apply my-1;
}

:deep(.prose strong) {
  @apply font-semibold;
}

:deep(.prose code) {
  @apply bg-gray-100 px-1 py-0.5 rounded text-xs;
}

:deep(.prose hr) {
  @apply my-6 border-gray-200;
}

:deep(.prose a) {
  @apply text-gray-900 underline;
}
</style>
