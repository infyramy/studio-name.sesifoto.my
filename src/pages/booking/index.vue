<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStudioStore } from "@/stores/studio";
import { useTranslation } from "@/composables/useTranslation";
import { useCurrency } from "@/composables/useCurrency";
import { useDateFormat } from "@/composables/useDateFormat";
import { useSanitize } from "@/composables/useSanitize";
import { api } from "@/services/api";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Plus,
  Minus,
  Check,
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
} from "lucide-vue-next";
import type {
  Theme,
  Coupon,
  BatchBookingRequest,
} from "@/types";
import Modal from "@/components/Modal.vue";
import ImageCarousel from "@/components/ImageCarousel.vue";
import { marked } from "marked";
import {
  useBookingSession,
  useBookingHolds,
  useBookingStatePersistence,
  submitPublicBookingCheckout,
  applyCheckoutResult,
  isPaymentUnavailableError,
  isSlotUnavailableError,
  type CartHold,
  type BookingCartItem,
} from "@/composables/booking";

const { sanitize } = useSanitize();

const router = useRouter();
const route = useRoute();
const studioStore = useStudioStore();
const { t } = useTranslation();
const { formatPriceWhole } = useCurrency();
const { formatDate } = useDateFormat();

const bookingClosed = computed(
  () => studioStore.websiteSettings?.bookingOpen === false,
);

// ============================================
// Session / holds / persistence (extracted)
// ============================================
const {
  getSessionId,
  getReferralCode,
  initializeSession,
  clearSession,
} = useBookingSession();

const {
  clearBookingState: clearPersistedBookingState,
  scheduleSave,
  disposePersistence,
} = useBookingStatePersistence(400);

const {
  holdExpiresAt,
  holdCountdown,
  unifiedCartHoldExpiresAt,
  unifiedCartHoldCountdown,
  createCartHold,
  createBatchCartHold,
  releaseCartHold,
  getActiveHolds,
  startHoldCountdown: startHoldCountdownBase,
  stopHoldCountdown,
  startUnifiedCartHoldTimer: startUnifiedCartHoldTimerBase,
  stopUnifiedCartHoldTimer: stopUnifiedCartHoldTimerBase,
  disposeHoldTimers,
} = useBookingHolds({
  getSessionId,
  getStudioId: () => studioStore.studio?.id || "",
});

// Cart Mode Detection
const isCartModeEnabled = computed(() => {
  return studioStore.studio?.settings?.cart_mode_enabled === true;
});

// Multiple Slot Mode Detection
const isMultipleSlotEnabled = computed(() => {
  return studioStore.websiteSettings?.allowMultipleSlot === true;
});

// Cart State Management (only used when cart mode enabled)
type CartItem = BookingCartItem;
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

let holdCleanupIntervalId: ReturnType<typeof setInterval> | null = null;

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

  // Deep-link: /booking?theme=<id> (only if recovery did not restore a theme)
  const themeQuery = route.query.theme;
  if (typeof themeQuery === "string" && themeQuery && !selectedTheme.value) {
    const match = studioStore.themes.find((th) => th.id === themeQuery);
    if (match) {
      selectedTheme.value = match;
      currentStep.value = 2;
    }
  }

  // Clean expired holds
  cleanExpiredHolds();

  // Fetch terms and conditions from database
  try {
    const terms = await api.getTerms();
    const preferEn =
      studioStore.currentLanguage === "EN" ||
      studioStore.websiteSettings?.defaultLanguage === "EN";
    if (preferEn && terms.contentEn) {
      termsContent.value = terms.contentEn;
    } else if (terms.contentBm) {
      termsContent.value = terms.contentBm;
    } else if (terms.contentEn) {
      termsContent.value = terms.contentEn;
    }
  } catch (error) {
    console.error("Failed to fetch terms:", error);
  } finally {
    loadingTerms.value = false;
  }

  // Start background cleanup interval
  holdCleanupIntervalId = setInterval(() => {
    cleanExpiredHolds();
  }, 60000); // Every minute
});

onUnmounted(() => {
  disposeHoldTimers();
  disposePersistence();
  if (holdCleanupIntervalId) clearInterval(holdCleanupIntervalId);
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
  clearPersistedBookingState();
  try {
    localStorage.removeItem("booking_session_id");
  } catch (error) {
    console.error("Failed to clear booking state:", error);
  }
}

async function dismissRecoveryDialog() {
  const sessionId = recoveryState.value?.sessionId;
  showRecoveryDialog.value = false;

  if (sessionId) {
    try {
      await api.releaseSessionHolds(sessionId);
    } catch (error) {
      console.error("Failed to release session holds:", error);
    }
  }

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
    if (state.addonsApplyTo === "all" || state.addonsApplyTo === "firstOnly")
      addonsApplyTo.value = state.addonsApplyTo;
    if (state.customerInfo) customerInfo.value = state.customerInfo;
    if (state.termsAccepted) termsAccepted.value = state.termsAccepted;

    // Scroll to the selected date after a short delay (to allow dates to load)
    if (state.selectedDate) {
      setTimeout(() => {
        scrollToSelectedDate();
      }, 500);
    }

    // Determine holds for restoration
    const hasMultipleHolds =
      state.mode === "single" && state.confirmedSlots?.length > 0;
    const hasSingleHold =
      state.mode === "single" && state.confirmedSlot?.hold?.holdId;

    // Validate and restore holds
    if (hasMultipleHolds) {
      const activeHolds = await getActiveHolds();
      const allHoldsStillValid = state.confirmedSlots.every((s: any) =>
        activeHolds.some((h) => h.holdId === s.hold?.holdId),
      );

      if (allHoldsStillValid) {
        // All holds still valid
        confirmedSlots.value = state.confirmedSlots;
        confirmedSlot.value = state.confirmedSlots[0];
        selectedSlots.value = state.selectedSlots || [];
        selectedSlot.value = state.selectedSlot;

        const latestHold =
          state.confirmedSlots[state.confirmedSlots.length - 1].hold;
        if (latestHold?.expiresAt) {
          holdExpiresAt.value = new Date(latestHold.expiresAt);
          startHoldCountdown();
        }
        currentStep.value = state.currentStep || 3;

        // Load time slots if needed
        if (selectedTheme.value && studioStore.studio && selectedDate.value) {
          loadingSlots.value = true;
          try {
            const slots = await api.getAvailableTimeSlots(
              studioStore.studio.id,
              selectedTheme.value.id,
              selectedDate.value,
              getSessionId(),
            );
            timeSlots.value = processTimeSlots(slots, selectedDate.value);
          } catch (err) {
            console.error("Failed to load time slots:", err);
          } finally {
            loadingSlots.value = false;
          }
        }
      } else {
        // Some/all holds expired
        selectedSlots.value = state.selectedSlots || [];
        selectedSlot.value = state.selectedSlot;
        currentStep.value = 2; // Back to time selection
        showModal({
          title: t("reservationExpired"),
          message: t("reservationExpiredMessage"),
          type: "warning",
          confirmText: t("ok"),
        });
      }
    } else if (hasSingleHold) {
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
              getSessionId(),
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

      // Restore selected slots if exists
      if (state.selectedSlots) {
        selectedSlots.value = state.selectedSlots;
      }
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
            getSessionId(),
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

      // Restore selected slots if exists
      if (state.selectedSlots) {
        selectedSlots.value = state.selectedSlots;
      }
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
            getSessionId(),
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

      // Restore selected slots (needed for Add to Cart button to work)
      if (state.selectedSlots) {
        selectedSlots.value = state.selectedSlots;
      }
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
            getSessionId(),
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
const selectedSlots = ref<any[]>([]); // Multi-slot mode: array of selected slots
const paxCount = ref(1);
const selectedAddons = ref<Record<string, number>>({});

/** When multiple slots: apply addons to all slots or first slot only. Only used when allowMultipleSlot is true. */
const addonsApplyTo = ref<"all" | "firstOnly">("all");
const expandedAddonDesc = ref<Record<string, boolean>>({});
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
const confirmedSlots = ref<any[]>([]); // Multi-slot mode: array of confirmed slots with holds
const isCreatingHold = ref(false); // Loading state for hold creation

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
  title: "" as string,
  description: "" as string,
});

const openGallery = (theme: Theme) => {
  if (theme.images && theme.images.length > 0) {
    galleryState.value = {
      show: true,
      images: theme.images,
      initialIndex: 0,
      title: theme.name,
      description: theme.description_long || theme.description_short,
    };
  }
};

const closeGallery = () => {
  galleryState.value.show = false;
};

const openAddonImage = (addon: any) => {
  if (!addon?.image) return;
  galleryState.value = {
    show: true,
    images: [addon.image],
    initialIndex: 0,
    title: addon.name || "",
    description: addon.description || "",
  };
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

// Country codes for phone input
const countryCodes = [
  { code: "+60", label: "MY", flag: "🇲🇾" },
  { code: "+65", label: "SG", flag: "🇸🇬" },
];
const selectedCountryCode = ref("+60");
const localPhone = ref("");

// Sync localPhone/countryCode TO customerInfo.phone
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

  customerInfo.value.phone = `${selectedCountryCode.value}${cleanLocal}`;
  formErrors.value.phone = "";
});

// Custom Dropdown State
const isCountryDropdownOpen = ref(false);
const countryDropdownRef = ref<HTMLElement | null>(null);

function toggleCountryDropdown(event: Event) {
  event.stopPropagation(); // Prevent immediate closing due to document listener
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

// Sync customerInfo.phone FROM existing value (e.g. if pre-filled)
watch(
  () => customerInfo.value.phone,
  (newVal) => {
    if (!newVal) return;
    // Avoid infinite loop if values match constructed phone
    let cleanLocal = localPhone.value.trim();
    if (cleanLocal.startsWith("0")) cleanLocal = cleanLocal.substring(1);
    if (newVal === `${selectedCountryCode.value}${cleanLocal}`) return;

    if (newVal.startsWith("+60")) {
      selectedCountryCode.value = "+60";
      localPhone.value = newVal.slice(3);
    } else if (newVal.startsWith("+65")) {
      selectedCountryCode.value = "+65";
      localPhone.value = newVal.slice(3);
    } else {
      // Default to input value if no matching prefix (fallback) or assume local MY
      localPhone.value = newVal;
    }
  },
  { immediate: true },
);

const validatePhone = () => {
  if (!localPhone.value || localPhone.value.trim() === "") {
    formErrors.value.phone = t("fieldRequired");
    return false;
  }

  const cleanLocal = localPhone.value.replace(/[\s-]/g, "");
  // Remove leading 0 for validation logic if user typed it
  const effectiveLocal = cleanLocal.startsWith("0")
    ? cleanLocal.substring(1)
    : cleanLocal;

  if (selectedCountryCode.value === "+60") {
    // Malaysian format: 9-10 digits (excluding +60), starts with 1
    // e.g. 12-3456789 (9 digits) or 11-23456789 (10 digits)
    const myRegex = /^1[0-46-9]-*[0-9]{7,8}$/;
    if (!myRegex.test(effectiveLocal)) {
      formErrors.value.phone = t("invalidPhone");
      return false;
    }
  } else if (selectedCountryCode.value === "+65") {
    // Singapore format: 8 digits, starts with 8 or 9
    const sgRegex = /^[89][0-9]{7}$/;
    if (!sgRegex.test(effectiveLocal)) {
      formErrors.value.phone = t("invalidPhone"); // Reuse or add specific SG message
      return false;
    }
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
  selectedSlots.value = []; // Reset multi-slot selection
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
  selectedSlots.value = []; // Reset multi-slot selection

  // Load time slots for selected date
  if (selectedTheme.value && studioStore.studio) {
    loadingSlots.value = true;
    try {
      const slots = await api.getAvailableTimeSlots(
        studioStore.studio.id,
        selectedTheme.value.id,
        dateStr,
        getSessionId(),
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

  if (isMultipleSlotEnabled.value) {
    // Toggle: add if not selected, remove if already selected
    const index = selectedSlots.value.findIndex((s) => s.id === slot.id);
    if (index >= 0) {
      selectedSlots.value.splice(index, 1);
    } else {
      selectedSlots.value.push(slot);
    }
    // Keep selectedSlot in sync (last selected, or null if empty)
    selectedSlot.value =
      selectedSlots.value.length > 0
        ? selectedSlots.value[selectedSlots.value.length - 1]
        : null;
  } else {
    // Original single-select behavior
    selectedSlot.value = slot;
  }
};

// ============================================
// Cart holds (API + timers via composable)
// ============================================

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function cleanExpiredHolds(): void {
  // Backend handles cleanup
}

function startHoldCountdown() {
  startHoldCountdownBase(() => handleHoldExpiry());
}

async function handleHoldExpiry() {
  // Release all multi-slot holds if any
  if (confirmedSlots.value.length > 0) {
    for (const slot of confirmedSlots.value) {
      if (slot.hold?.holdId) {
        releaseCartHold(slot.hold.holdId);
      }
    }
    confirmedSlots.value = [];
  }

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

function startUnifiedCartHoldTimer(expiresAt: Date) {
  startUnifiedCartHoldTimerBase(
    expiresAt,
    () => handleUnifiedCartExpiry(),
    (exp) => {
      cart.value.forEach((item) => {
        if (item.hold) {
          item.hold.expiresAt = exp.toISOString();
        }
      });
    },
  );
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
  stopUnifiedCartHoldTimerBase();
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

function showMultiSlotHoldConfirmationDialog(): Promise<boolean> {
  const duration = studioStore.studio?.settings?.cart_hold_duration || 10;
  const slotsList = selectedSlots.value
    .map((s) => `<b>${s.start} - ${s.end}</b>`)
    .join("<br>");
  return showModal({
    title: t("reserveTheseSlots") || "Tempah slot-slot ini?",
    message: `${slotsList}\n\n${(
      t("reserveSlotsMessage") || t("reserveSlotMessage")
    ).replace("{duration}", `<b>${duration}</b>`)}`,
    type: "info",
    confirmText: t("yes"),
    cancelText: t("no"),
    showCancel: true,
  });
}

function showAddToCartConfirmationDialog(): Promise<boolean> {
  const themeName = selectedTheme.value?.name || "";

  // Determine which slots are being added
  const slotsToAdd =
    isMultipleSlotEnabled.value && selectedSlots.value.length > 0
      ? selectedSlots.value
      : selectedSlot.value
        ? [selectedSlot.value]
        : [];

  const pax = paxCount.value;
  const duration = studioStore.studio?.settings?.cart_hold_duration || 10;

  let slotDetails = "";
  if (slotsToAdd.length > 1) {
    // List all selected slots
    const slotTimes = slotsToAdd
      .map((s) => `• ${s.start} - ${s.end}`)
      .join("<br>");
    slotDetails = `<b>${slotsToAdd.length} ${t(
      "sessions",
    )}</b><br>${slotTimes}`;
  } else if (slotsToAdd.length === 1) {
    slotDetails = `<b>${slotsToAdd[0].start} - ${slotsToAdd[0].end}</b>`;
  }

  return showModal({
    title: t("addToCartConfirm"),
    message: `<b>${themeName}</b>\n${slotDetails}\n<b>${pax} ${t(
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
    let bookingDates: string[] = [];
    let items: { bookingDate: string; subtotal: number }[] | undefined;
    if (isCartModeEnabled.value && cart.value.length > 0) {
      subtotal = cart.value.reduce((sum, item) => sum + item.total, 0);
      bookingDates = cart.value.map((item) => item.date);
      // For partial apply (coupon with shoot date range), send per-item breakdown
      items = cart.value.map((item) => ({
        bookingDate: item.date,
        subtotal: item.total,
      }));
    } else {
      // Single mode: use full total (one slot or multiple slots) for validation
      subtotal = effectiveSingleModeTotal.value;
      if (selectedDate.value) bookingDates = [selectedDate.value];
    }

    const coupon = await api.validateCoupon(
      couponCode.value,
      subtotal,
      bookingDates.length > 0 ? bookingDates : undefined,
      items,
    );
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
        couponError.value = backendMessage;
      } else if (
        lowerMsg.includes("session date") ||
        lowerMsg.includes("select a slot first")
      ) {
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
  if (!selectedTheme.value || !selectedDate.value) return;

  // Determine which slots to add
  const slotsToAdd =
    isMultipleSlotEnabled.value && selectedSlots.value.length > 0
      ? selectedSlots.value
      : selectedSlot.value
        ? [selectedSlot.value]
        : [];

  if (slotsToAdd.length === 0) return;

  try {
    isCreatingHold.value = true;
    let lastHold: any = null;

    // Use batch hold for all slots to add
    const slotsData = slotsToAdd.map((slot) => ({
      themeId: selectedTheme.value!.id,
      date: selectedDate.value!,
      startTime: parseTime(slot.start),
      endTime: parseTime(slot.end),
    }));

    const batchHolds = await createBatchCartHold(slotsData);

    const applyAddonsToThisSlot =
      addonsApplyTo.value === "all" || slotsToAdd.length === 1;

    for (let i = 0; i < slotsToAdd.length; i++) {
      const slot = slotsToAdd[i];
      const hold = batchHolds[i];

      lastHold = hold;

      // Calculate item total with date price modifier
      const extraPax = Math.max(
        0,
        paxCount.value - (selectedTheme.value.base_pax || 0),
      );
      const extraPaxCost = extraPax * selectedTheme.value.extra_pax_price;

      const useAddonsForThisItem =
        applyAddonsToThisSlot ||
        (addonsApplyTo.value === "firstOnly" && i === 0);
      let addonsTotal = 0;
      const addonsForItem: Record<string, number> = useAddonsForThisItem
        ? { ...selectedAddons.value }
        : {};
      if (useAddonsForThisItem) {
        for (const [id, qty] of Object.entries(selectedAddons.value)) {
          const addon = studioStore.addons.find((a) => a.id === id);
          if (addon && qty > 0) {
            addonsTotal += addon.price * qty;
          }
        }
      }

      // Use the slot price (already includes special pricing from backend)
      let sessionPrice = slot?.price || selectedTheme.value.base_price;

      const itemTotal = sessionPrice + extraPaxCost + addonsTotal;

      const dateInfo = selectedDateInfo.value;

      const cartItem = {
        id: Date.now().toString() + "-" + slot.id,
        theme: selectedTheme.value,
        date: selectedDate.value,
        slot: slot,
        pax: paxCount.value,
        addons: addonsForItem,
        total: itemTotal,
        dateInfo: dateInfo,
        hold: hold,
        specialPricing:
          specialPricingAmount.value !== 0
            ? {
                message: specialPricingMessage.value || "",
                amount: specialPricingAmount.value,
              }
            : undefined,
      };

      cart.value.push(cartItem);
    }

    // UNIFIED CART HOLD: Start/reset the unified timer with the new expiry time
    if (lastHold) {
      startUnifiedCartHoldTimer(new Date(lastHold.expiresAt));
    }

    // Reset selection for next item
    selectedTheme.value = null;
    selectedDate.value = null;
    selectedSlot.value = null;
    selectedSlots.value = [];
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
  } finally {
    isCreatingHold.value = false;
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
    // Multi-slot mode: create holds for all selected slots
    if (isMultipleSlotEnabled.value) {
      if (selectedSlots.value.length === 0) return;

      const confirmed = await showMultiSlotHoldConfirmationDialog();
      if (confirmed) {
        try {
          isCreatingHold.value = true;

          // Use batch hold for all selected slots
          const slotsData = selectedSlots.value.map((slot) => ({
            themeId: selectedTheme.value!.id,
            date: selectedDate.value!,
            startTime: parseTime(slot.start),
            endTime: parseTime(slot.end),
          }));

          const batchHolds = await createBatchCartHold(slotsData);

          // Map back to slots with their specific hold data
          const holds = selectedSlots.value.map((slot, index) => ({
            ...slot,
            hold: batchHolds[index],
          }));

          confirmedSlots.value = holds;
          // Also set confirmedSlot to first for backward compat
          confirmedSlot.value = holds[0];
          holdExpiresAt.value = new Date(
            holds[holds.length - 1].hold.expiresAt,
          );

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
            // Release any holds that were already created
            // (confirmedSlots may have partial holds)
            // Refresh time slots
            if (
              selectedTheme.value &&
              studioStore.studio &&
              selectedDate.value
            ) {
              loadingSlots.value = true;
              try {
                const slots = await api.getAvailableTimeSlots(
                  studioStore.studio.id,
                  selectedTheme.value.id,
                  selectedDate.value,
                  getSessionId(),
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
            if (
              selectedTheme.value &&
              studioStore.studio &&
              selectedDate.value
            ) {
              loadingSlots.value = true;
              try {
                const slots = await api.getAvailableTimeSlots(
                  studioStore.studio.id,
                  selectedTheme.value.id,
                  selectedDate.value,
                  getSessionId(),
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

    // Single slot mode: existing logic
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
                getSessionId(),
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
                getSessionId(),
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
        // Calculate proportional discount for each cart item (supports partial apply by shoot date)
        const calculateProportionalDiscount = (itemIndex: number): number => {
          if (!validatedCoupon.value) return 0;

          const cartTotalAmount = cart.value.reduce(
            (sum, item) => sum + item.total,
            0,
          );
          if (
            validatedCoupon.value.min_spend &&
            cartTotalAmount < validatedCoupon.value.min_spend
          ) {
            return 0; // Min spend not met
          }

          // Partial apply: discount only on eligible items (by shoot date range)
          const eligibleIndices = validatedCoupon.value.eligible_indices;
          const eligibleSubtotal = validatedCoupon.value.eligible_subtotal;
          const totalDiscount = validatedCoupon.value.discount_amount ?? 0;

          if (
            eligibleIndices != null &&
            eligibleIndices.length > 0 &&
            eligibleSubtotal != null &&
            eligibleSubtotal > 0 &&
            totalDiscount > 0
          ) {
            if (!eligibleIndices.includes(itemIndex)) return 0;
            const pos = eligibleIndices.indexOf(itemIndex);
            const itemTotal = cart.value[itemIndex].total;
            // Last eligible item gets remainder so sum matches totalDiscount exactly
            if (pos === eligibleIndices.length - 1) {
              let assigned = 0;
              for (let i = 0; i < eligibleIndices.length - 1; i++) {
                const sub = cart.value[eligibleIndices[i]].total;
                assigned += Math.round(
                  (totalDiscount * sub) / eligibleSubtotal,
                );
              }
              return Math.max(0, totalDiscount - assigned);
            }
            const proportion = itemTotal / eligibleSubtotal;
            return Math.round(totalDiscount * proportion);
          }

          // No partial apply: distribute discount across full cart
          const itemTotal = cart.value[itemIndex].total;
          const proportion = itemTotal / cartTotalAmount;
          let discount = 0;
          if (validatedCoupon.value.type === "percentage") {
            discount = cartTotalAmount * (validatedCoupon.value.value / 100);
          } else {
            discount = validatedCoupon.value.value;
          }
          discount = Math.min(discount, cartTotalAmount);
          return Math.round(discount * proportion);
        };

        // Prepare batch booking request
        const batchRequest: BatchBookingRequest = {
          customer_name: customerInfo.value.name,
          customer_phone: customerInfo.value.phone,
          customer_email: customerInfo.value.email || "",
          customer_notes: customerInfo.value.notes || "",
          consent_tc: termsAccepted.value,
          consent_marketing: false,
          session_id: getSessionId(),
          items: cart.value.map((item, i) => {
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

            return {
              theme_id: item.theme.id,
              booking_date: item.date,
              start_time: startTime,
              end_time: endTime,
              pax_count: item.pax,
              selected_addons: selectedAddonsArray,
              coupon_code:
                validatedCoupon.value && itemDiscount > 0
                  ? validatedCoupon.value.code
                  : undefined,
              discount_amount: itemDiscount > 0 ? itemDiscount : undefined,
              subtotal: item.total,
              referral_code: getReferralCode(),
            };
          }),
        };


        const paymentType =
          studioStore.websiteSettings?.paymentType || "deposit";

        // Calculate total payment amount based on payment type
        let totalPaymentAmount = 0;
        for (let i = 0; i < cart.value.length; i++) {
          const item = cart.value[i];
          const itemDiscount = calculateProportionalDiscount(i);
          const itemTotal = item.total;

          if (paymentType === "deposit") {
            const rawDeposit =
              item.theme.deposit_amount !== null &&
              item.theme.deposit_amount !== undefined
                ? item.theme.deposit_amount
                : Math.round(
                    itemTotal *
                      ((studioStore.studio?.settings.deposit_percentage || 50) /
                        100),
                  );
            const itemBalance = itemTotal - rawDeposit;
            const remainingDiscount = Math.max(0, itemDiscount - itemBalance);
            const effectiveDeposit = Math.max(
              0,
              rawDeposit - remainingDiscount,
            );
            totalPaymentAmount += effectiveDeposit;
          } else {
            totalPaymentAmount += itemTotal - itemDiscount;
          }
        }

        const { result } = await submitPublicBookingCheckout({
          batchRequest,
          paymentType,
          amount: totalPaymentAmount,
          clearBookingState,
        });
        applyCheckoutResult(router, result);
        return;
      } catch (error: any) {
        console.error("Failed to create bookings:", error);

        if (isPaymentUnavailableError(error)) {
          router.push("/payment/failed?error=payment_unavailable");
          return;
        }

        const errorMessage = error.data?.message || error.message || "";
        if (isSlotUnavailableError(error)) {
          await showModal({
            title: t("slotNoLongerAvailable"),
            message: t("slotNoLongerAvailableMessage"),
            type: "warning",
            confirmText: t("ok"),
          });
          return;
        }

        await showModal({
          title: t("error") || "Error",
          message:
            errorMessage ||
            t("bookingFailed") ||
            "Failed to create booking. Please try again.",
          type: "error",
          confirmText: t("ok") || "OK",
        });

        isProcessingPayment.value = false;
      }
    } else {
      // Single mode: Create booking(s)
      if (!selectedTheme.value || !selectedDate.value) {
        return;
      }

      // Determine slots to book (multi-slot or single)
      const slotsToBook =
        isMultipleSlotEnabled.value && confirmedSlots.value.length > 0
          ? confirmedSlots.value
          : selectedSlot.value
            ? [confirmedSlot.value || selectedSlot.value]
            : [];

      if (slotsToBook.length === 0) return;

      isProcessingPayment.value = true;

      try {
        // Calculate proportional discount for each booking (if multiple slots)
        const calculateProportionalDiscount = (index: number): number => {
          if (!validatedCoupon.value || slotsToBook.length === 0) return 0;
          const totalDiscount = discountAmount.value;
          // In single mode, each slot has the same subtotal
          return Math.floor(totalDiscount / slotsToBook.length);
        };

        // Full addons array (used when apply to all or for first slot)
        const fullAddonsArray = Object.entries(selectedAddons.value)
          .filter(([_, qty]) => qty > 0)
          .map(([addonId, quantity]) => ({
            addon_id: addonId,
            quantity: quantity as number,
          }));

        // Prepare batch booking request
        const batchRequest: BatchBookingRequest = {
          customer_name: customerInfo.value.name,
          customer_phone: customerInfo.value.phone,
          customer_email: customerInfo.value.email || "",
          customer_notes: customerInfo.value.notes || "",
          consent_tc: termsAccepted.value,
          consent_marketing: false,
          session_id: getSessionId(),
          items: slotsToBook.map((slot, i) => {
            const useAddonsForThisSlot =
              addonsApplyTo.value === "all" ||
              (addonsApplyTo.value === "firstOnly" && i === 0);
            const selectedAddonsForItem = useAddonsForThisSlot
              ? fullAddonsArray
              : [];

            // Per-slot subtotal for backend coupon validation / distribution
            const slotSubtotal = useAddonsForThisSlot
              ? currentItemTotal.value
              : currentItemTotal.value - addonsTotal.value;

            // Parse time from slot
            const slotStart =
              slot?.originalSlot?.start || slot?.start || "09:00";
            const slotEnd = slot?.originalSlot?.end || slot?.end || "09:30";
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

            return {
              theme_id: selectedTheme.value.id,
              booking_date: selectedDate.value,
              start_time: startTime,
              end_time: endTime,
              pax_count: paxCount.value,
              selected_addons: selectedAddonsForItem,
              coupon_code: validatedCoupon.value?.code,
              discount_amount: itemDiscount > 0 ? itemDiscount : undefined,
              subtotal: slotSubtotal,
              referral_code: getReferralCode(),
            };
          }),
        };


        const paymentType =
          studioStore.websiteSettings?.paymentType || "deposit";
        const amountToSend =
          paymentAmount.value <= 0 ? 0 : paymentAmount.value;

        const { result } = await submitPublicBookingCheckout({
          batchRequest,
          paymentType,
          amount: amountToSend,
          clearBookingState,
        });
        applyCheckoutResult(router, result);
        return;
      } catch (error: any) {
        console.error("Failed to create booking:", error);

        if (isPaymentUnavailableError(error)) {
          router.push("/payment/failed?error=payment_unavailable");
          return;
        }

        const errorMessage = error.data?.message || error.message || "";
        if (isSlotUnavailableError(error)) {
          await showModal({
            title: t("slotNoLongerAvailable"),
            message: t("slotNoLongerAvailableMessage"),
            type: "warning",
            confirmText: t("ok"),
          });
          return;
        }

        await showModal({
          title: t("error") || "Error",
          message:
            errorMessage ||
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
      (confirmedSlot.value || confirmedSlots.value.length > 0)
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

      // Release all multi-slot holds
      if (confirmedSlots.value.length > 0) {
        for (const slot of confirmedSlots.value) {
          if (slot.hold?.holdId) {
            await releaseCartHold(slot.hold.holdId);
          }
        }
        confirmedSlots.value = [];
      }
      // Release single slot hold
      if (confirmedSlot.value?.hold?.holdId) {
        await releaseCartHold(confirmedSlot.value.hold.holdId);
      }
      confirmedSlot.value = null;
      holdExpiresAt.value = null;
      stopHoldCountdown();
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
  if (
    !isCartModeEnabled.value &&
    (confirmedSlot.value || confirmedSlots.value.length > 0)
  ) {
    const confirmChange = await showModal({
      title: t("goingBackWillRelease"),
      message: t("goingBackMessage"),
      type: "warning",
      confirmText: t("yes"),
      cancelText: t("no"),
      showCancel: true,
    });

    if (!confirmChange) return;

    // Release all multi-slot holds
    if (confirmedSlots.value.length > 0) {
      for (const slot of confirmedSlots.value) {
        if (slot.hold?.holdId) {
          await releaseCartHold(slot.hold.holdId);
        }
      }
      confirmedSlots.value = [];
    }
    // Release single slot hold
    if (confirmedSlot.value?.hold?.holdId) {
      await releaseCartHold(confirmedSlot.value.hold.holdId);
    }
    confirmedSlot.value = null;
    holdExpiresAt.value = null;
    stopHoldCountdown();
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
  let sessionPrice =
    selectedSlot.value?.price ?? selectedTheme.value.base_price;

  // Safeguard: when chip fee is absorbed, if slot price is exactly theme base + 100
  // (single slot, no addons, no extra pax), treat as theme base so we don't show
  // a spurious RM1 that isn't being charged (avoids RM49 theme showing RM50).
  const base = selectedTheme.value.base_price;
  const chipAbsorbed =
    studioStore.websiteSettings?.chipFeeMode != null &&
    String(studioStore.websiteSettings.chipFeeMode).toLowerCase() ===
      "absorbed";
  if (
    chipAbsorbed &&
    !isCartModeEnabled.value &&
    extraPaxCost.value === 0 &&
    addonsTotal.value === 0 &&
    selectedSlot.value?.price != null &&
    selectedSlot.value.price === base + 100
  ) {
    sessionPrice = base;
  }

  // Add extras and addons on top of the (possibly modified) session price
  return sessionPrice + extraPaxCost.value + addonsTotal.value;
});

/** Single mode: total for one or more slots, respecting addonsApplyTo (first slot only vs all). */
const effectiveSingleModeTotal = computed(() => {
  if (isCartModeEnabled.value) return 0;
  const slotCount = isMultipleSlotEnabled.value
    ? confirmedSlots.value.length > 0
      ? confirmedSlots.value.length
      : selectedSlots.value.length > 0
        ? selectedSlots.value.length
        : 1
    : 1;
  if (slotCount <= 1) return currentItemTotal.value;
  if (addonsApplyTo.value === "firstOnly") {
    return (
      (currentItemTotal.value - addonsTotal.value) * slotCount +
      addonsTotal.value
    );
  }
  return currentItemTotal.value * slotCount;
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
    if (cart.value.length === 0) return 0;
    targetTotal = cart.value.reduce((sum, item) => sum + item.total, 0);
  } else {
    targetTotal = effectiveSingleModeTotal.value;
  }

  // Min spend check (on full cart or single total)
  if (
    validatedCoupon.value.min_spend &&
    targetTotal < validatedCoupon.value.min_spend
  ) {
    return 0;
  }

  // Partial apply: use backend-computed total discount for eligible items only
  if (
    validatedCoupon.value.eligible_indices != null &&
    validatedCoupon.value.eligible_indices.length > 0 &&
    validatedCoupon.value.discount_amount != null
  ) {
    return validatedCoupon.value.discount_amount;
  }

  // Full apply: compute discount on target total
  let discount = 0;
  if (validatedCoupon.value.type === "percentage") {
    discount = targetTotal * (validatedCoupon.value.value / 100);
  } else {
    discount = validatedCoupon.value.value;
  }
  return Math.min(discount, targetTotal);
});

// Grand total (conditional based on mode)
const grandTotal = computed(() => {
  let total = 0;
  if (isCartModeEnabled.value) {
    // In cart mode: use cartTotal if items exist, otherwise use currentItemTotal (for steps 1-3)
    total = cart.value.length > 0 ? cartTotal.value : currentItemTotal.value;
  } else {
    // Single mode: one slot or multi-slot (respects addonsApplyTo for addons)
    total = effectiveSingleModeTotal.value;
  }
  return Math.max(0, total - discountAmount.value);
});

/** Subtotal before any discount (for transparent summary breakdown). */
const subtotalBeforeDiscount = computed(() => {
  if (isCartModeEnabled.value && cart.value.length > 0) {
    return cartTotal.value;
  }
  return effectiveSingleModeTotal.value;
});

/** Single mode: number of sessions when multi-slot (0 if not multi-slot). */
const singleModeSlotCount = computed(() => {
  if (isCartModeEnabled.value || !isMultipleSlotEnabled.value) return 0;
  return confirmedSlots.value.length > 0
    ? confirmedSlots.value.length
    : selectedSlots.value.length > 0
      ? selectedSlots.value.length
      : 0;
});

/** Single mode multi-slot: amount per session when addons apply to all. */
const singleModePerSessionAmount = computed(() => currentItemTotal.value);

/** Single mode multi-slot, addons first-only: amount for one session without addons. */
const singleModeSessionWithoutAddons = computed(
  () => currentItemTotal.value - addonsTotal.value,
);

const isSummaryStep = computed(() => {
  if (isCartModeEnabled.value) {
    return currentStep.value === 7;
  }
  return currentStep.value === 6;
});

const totalSteps = computed(() => steps.value.length);

const dockTotal = computed(() =>
  isSummaryStep.value ? amountToPayNow.value : grandTotal.value || 0,
);

const dockAmountPulse = ref(false);
let dockPulseTimer: ReturnType<typeof setTimeout> | null = null;

watch(dockTotal, (next, prev) => {
  if (next <= 0 || next === prev) return;
  dockAmountPulse.value = false;
  void nextTick(() => {
    dockAmountPulse.value = true;
    if (dockPulseTimer) clearTimeout(dockPulseTimer);
    dockPulseTimer = setTimeout(() => {
      dockAmountPulse.value = false;
    }, 420);
  });
});

onUnmounted(() => {
  if (dockPulseTimer) clearTimeout(dockPulseTimer);
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
  if (
    selectedTheme.value.deposit_amount !== null &&
    selectedTheme.value.deposit_amount !== undefined
  ) {
    return Math.round(
      (selectedTheme.value.deposit_amount / grandTotal.value) * 100,
    );
  }

  return studioStore.studio?.settings.deposit_percentage || 50;
});

// Single item deposit amount (scales with multi-slot count; respects addonsApplyTo)
const singleItemDepositAmount = computed(() => {
  if (!selectedTheme.value) return 0;

  const slotCount = isMultipleSlotEnabled.value
    ? confirmedSlots.value.length > 0
      ? confirmedSlots.value.length
      : selectedSlots.value.length > 0
        ? selectedSlots.value.length
        : 1
    : 1;

  // Use theme's deposit_amount if available (fixed deposit in sen)
  if (
    selectedTheme.value.deposit_amount !== null &&
    selectedTheme.value.deposit_amount !== undefined
  ) {
    return selectedTheme.value.deposit_amount * slotCount;
  }

  // Fallback: percentage of effective total (so addons first-only is correct)
  if (!effectiveSingleModeTotal.value) return 0;
  const percentage = studioStore.studio?.settings.deposit_percentage || 50;
  return effectiveSingleModeTotal.value * (percentage / 100);
});

// Per-item deposit (raw) for cart - so we can show breakdown
const cartDepositPerItem = computed(() => {
  if (!isCartModeEnabled.value || cart.value.length === 0) return [];
  const pct = (studioStore.studio?.settings.deposit_percentage ?? 50) / 100;
  return cart.value.map((item) => {
    if (
      item.theme.deposit_amount != null &&
      item.theme.deposit_amount !== undefined
    ) {
      return item.theme.deposit_amount;
    }
    return Math.round(item.total * pct);
  });
});

// Cart total deposit amount (sum of RAW deposits for all cart items - discount from balance first)
const cartDepositTotal = computed(() => {
  if (!isCartModeEnabled.value || cart.value.length === 0) return 0;
  return cartDepositPerItem.value.reduce((sum, d) => sum + d, 0);
});

// Per-slot deposit (raw) for single mode multi-slot - so we can show breakdown
const singleModeDepositPerSlot = computed(() => {
  if (!selectedTheme.value) return [];
  const theme = selectedTheme.value;
  const slotCount = isMultipleSlotEnabled.value
    ? confirmedSlots.value.length > 0
      ? confirmedSlots.value.length
      : selectedSlots.value.length > 0
        ? selectedSlots.value.length
        : 1
    : 1;
  if (slotCount <= 0) return [];
  if (theme.deposit_amount != null && theme.deposit_amount !== undefined) {
    return Array.from({ length: slotCount }, () => theme.deposit_amount!);
  }
  const totalDeposit = singleItemDepositAmount.value;
  const perSlot = Math.round(totalDeposit / slotCount);
  const remainder = totalDeposit - perSlot * slotCount;
  return Array.from({ length: slotCount }, (_, i) =>
    i < remainder ? perSlot + 1 : perSlot,
  );
});

// Combined deposit amount (works for both single and cart modes) - before discount
const depositAmount = computed(() => {
  if (isCartModeEnabled.value && cart.value.length > 0) {
    return cartDepositTotal.value;
  }
  return singleItemDepositAmount.value;
});

// Check if a cart item index is eligible for coupon discount (partial apply)
const isCartItemEligibleForCoupon = (index: number): boolean => {
  if (!validatedCoupon.value) return false;
  const eligibleIndices = validatedCoupon.value.eligible_indices;
  if (eligibleIndices == null || eligibleIndices.length === 0) {
    // No partial apply: all items eligible
    return true;
  }
  return eligibleIndices.includes(index);
};

// Check if a slot index (single mode multi-slot) is eligible for coupon discount
const isSlotEligibleForCoupon = (index: number): boolean => {
  if (!validatedCoupon.value) return false;
  const eligibleIndices = validatedCoupon.value.eligible_indices;
  if (eligibleIndices == null || eligibleIndices.length === 0) {
    // No partial apply: all slots eligible
    return true;
  }
  return eligibleIndices.includes(index);
};

// Calculate discount for a cart item (for display)
const getCartItemDiscount = (index: number): number => {
  if (!validatedCoupon.value || !isCartItemEligibleForCoupon(index)) return 0;

  const cartTotalAmount = cart.value.reduce((sum, item) => sum + item.total, 0);
  if (
    validatedCoupon.value.min_spend &&
    cartTotalAmount < validatedCoupon.value.min_spend
  ) {
    return 0; // Min spend not met
  }

  const eligibleIndices = validatedCoupon.value.eligible_indices;
  const eligibleSubtotal = validatedCoupon.value.eligible_subtotal;
  const totalDiscount = validatedCoupon.value.discount_amount ?? 0;

  if (
    eligibleIndices != null &&
    eligibleIndices.length > 0 &&
    eligibleSubtotal != null &&
    eligibleSubtotal > 0 &&
    totalDiscount > 0
  ) {
    const itemTotal = cart.value[index]?.total ?? 0;
    const pos = eligibleIndices.indexOf(index);
    if (pos === eligibleIndices.length - 1) {
      // Last eligible item gets remainder
      let assigned = 0;
      for (let i = 0; i < eligibleIndices.length - 1; i++) {
        const sub = cart.value[eligibleIndices[i]]?.total ?? 0;
        assigned += Math.round((totalDiscount * sub) / eligibleSubtotal);
      }
      return Math.max(0, totalDiscount - assigned);
    }
    const proportion = itemTotal / eligibleSubtotal;
    return Math.round(totalDiscount * proportion);
  }

  // Fallback: distribute proportionally across full cart
  const itemTotal = cart.value[index]?.total ?? 0;
  const proportion = itemTotal / cartTotalAmount;
  let discount = 0;
  if (validatedCoupon.value.type === "percentage") {
    discount = cartTotalAmount * (validatedCoupon.value.value / 100);
  } else {
    discount = validatedCoupon.value.value;
  }
  discount = Math.min(discount, cartTotalAmount);
  return Math.round(discount * proportion);
};

// Calculate the original balance (total - deposit) before any discount
const originalBalance = computed(() => {
  let total = 0;
  if (isCartModeEnabled.value && cart.value.length > 0) {
    total = cartTotal.value;
  } else {
    total = effectiveSingleModeTotal.value;
  }
  return total - depositAmount.value;
});

// Discount is applied to BALANCE first, then to deposit.
// Amount of discount that applies to balance (capped by balance).
// Note: originalBalance can be negative if deposit > total, so we clamp it to 0
const discountAppliedToBalance = computed(() => {
  const balance = Math.max(0, originalBalance.value);
  return Math.min(discountAmount.value, balance);
});

// Remaining discount after balance is zeroed (applied to deposit).
// Use clamped balance to prevent negative balance from inflating the remaining discount
const remainingDiscountAfterBalance = computed(() => {
  const balance = Math.max(0, originalBalance.value);
  return Math.max(0, discountAmount.value - balance);
});

// Effective balance - discount applied to balance first
// Example: Total RM150, Deposit RM50, Balance RM100, Coupon RM30 → Balance RM70
const effectiveBalance = computed(() => {
  const balance = Math.max(0, originalBalance.value);
  return Math.max(0, balance - discountAppliedToBalance.value);
});

// Effective deposit amount - remaining discount (after balance) applied to deposit
// Example: Total RM150, Deposit RM50, Balance RM100, Coupon RM120 → Balance RM0, Deposit RM30
const effectiveDepositAmount = computed(() => {
  return Math.max(0, depositAmount.value - remainingDiscountAfterBalance.value);
});

const paymentAmount = computed(() => {
  if (paymentType.value === "full") {
    // For full payment, amount to pay is always the discounted grand total.
    // Do not use deposit/balance split (theme deposit_amount is only for deposit mode).
    return grandTotal.value;
  }
  // For deposit payment, only pay the effective deposit (after discount applied)
  return effectiveDepositAmount.value;
});

/** Only add RM1 CHIP fee when backend explicitly returns chipFeeMode 'on_top'. When 'absorbed' or undefined, no fee. */
const chipFeeToAdd = computed(() => {
  const mode = studioStore.websiteSettings?.chipFeeMode;
  if (mode == null || String(mode).toLowerCase() !== "on_top") return 0;
  const amount =
    paymentType.value === "deposit"
      ? effectiveDepositAmount.value
      : effectiveDepositAmount.value + effectiveBalance.value;
  return amount > 0 ? 100 : 0;
});

/** Amount to pay now (payment amount + CHIP fee when on_top). Single source of truth for summary and pay button. */
const amountToPayNow = computed(() => paymentAmount.value + chipFeeToAdd.value);

// Explains how deposit was calculated (for display under "Deposit (pay now)")
const depositExplanation = computed(() => {
  const pct = studioStore.studio?.settings.deposit_percentage ?? 50;
  if (isCartModeEnabled.value && cart.value.length > 0) {
    const hasFixed = cart.value.some(
      (item) =>
        item.theme.deposit_amount != null &&
        item.theme.deposit_amount !== undefined,
    );
    if (hasFixed) {
      return { key: "depositSumPerSession" as const, params: {} };
    }
    return {
      key: "depositPercentOfTotal" as const,
      params: { percentage: pct },
    };
  }
  // Single mode
  if (!selectedTheme.value)
    return {
      key: "depositPercentOfTotal" as const,
      params: { percentage: pct },
    };
  const theme = selectedTheme.value;
  const slotCount = isMultipleSlotEnabled.value
    ? confirmedSlots.value.length > 0
      ? confirmedSlots.value.length
      : selectedSlots.value.length > 0
        ? selectedSlots.value.length
        : 1
    : 1;
  if (theme.deposit_amount != null && theme.deposit_amount !== undefined) {
    return {
      key: "depositFixedPerSession" as const,
      params: {
        amount: formatPriceWhole(theme.deposit_amount),
        count: slotCount,
      },
    };
  }
  return {
    key: "depositPercentOfTotal" as const,
    params: { percentage: depositPercentage.value },
  };
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
  if (!selectedDate.value || !timeSlots.value.length || !selectedTheme.value)
    return null;

  const basePrice = selectedTheme.value.base_price;

  // Group slots by pricing label and price
  const pricingMap = new Map<
    string,
    {
      label: string;
      slots: Array<{
        start: string;
        end: string;
        price: number;
        displayStart?: string;
        displayEnd?: string;
      }>;
      minPrice: number;
      maxPrice: number;
      basePrice: number;
    }
  >();

  timeSlots.value.forEach((slot) => {
    if (
      slot.isSpecialPricing &&
      slot.specialPricingLabel &&
      slot.originalSlot &&
      slot.originalSlot.start &&
      slot.originalSlot.end &&
      typeof slot.price === "number"
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
      const sortedSlots = [...info.slots].sort((a, b) =>
        a.start.localeCompare(b.start),
      );

      // Find overall time range (earliest start to latest end)
      // Use display format for showing to user
      const earliestStart =
        sortedSlots[0]?.displayStart || sortedSlots[0]?.start || "";

      // Find the latest end time by comparing all end times (in 24-hour format)
      const latestEndSlot = [...info.slots].sort((a, b) => {
        // Compare end times in 24-hour format for proper sorting
        return a.end.localeCompare(b.end);
      })[info.slots.length - 1];
      const latestEnd = latestEndSlot?.displayEnd || latestEndSlot?.end || "";

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
function groupTimeSlots(
  slots: Array<{
    start: string;
    end: string;
    price: number;
    displayStart?: string;
    displayEnd?: string;
  }>,
): Array<{ start: string; end: string; price: number }> {
  if (slots.length === 0) return [];

  const groups: Array<{ start: string; end: string; price: number }> = [];
  let currentGroup: { start: string; end: string; price: number } | null = null;

  for (const slot of slots) {
    if (!currentGroup) {
      // Start a new group - use display format if available
      currentGroup = {
        start: slot.displayStart || slot.start,
        end: slot.displayEnd || slot.end,
        price: slot.price,
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
          price: slot.price,
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
// Auto-Save Booking State (debounced)
// ============================================
watch(
  [
    selectedTheme,
    selectedDate,
    selectedSlot,
    selectedSlots,
    confirmedSlot,
    confirmedSlots,
    cart,
    customerInfo,
    currentStep,
    paxCount,
    selectedAddons,
    addonsApplyTo,
    termsAccepted,
  ],
  () => {
    if (!studioStore.studio) return;

    const hasMeaningfulProgress =
      selectedTheme.value ||
      currentStep.value > 1 ||
      (cart.value && cart.value.length > 0);

    if (!hasMeaningfulProgress) {
      scheduleSave(null);
      return;
    }

    scheduleSave({
      mode: isCartModeEnabled.value ? "cart" : "single",
      sessionId: getSessionId(),
      studioSlug: studioStore.studio.slug,
      selectedTheme: selectedTheme.value,
      selectedDate: selectedDate.value,
      selectedSlot: selectedSlot.value,
      selectedSlots: selectedSlots.value,
      confirmedSlot: confirmedSlot.value,
      confirmedSlots: confirmedSlots.value,
      paxCount: paxCount.value,
      selectedAddons: selectedAddons.value,
      addonsApplyTo: addonsApplyTo.value,
      cartItems: cart.value,
      customerInfo: customerInfo.value,
      currentStep: currentStep.value,
      termsAccepted: termsAccepted.value,
      savedAt: new Date().toISOString(),
    });
  },
  { deep: true },
);
</script>

<template>
  <div class="bk-page bk-page--sticky-cta-lg">
    <!-- Booking closed gate -->
    <div
      v-if="bookingClosed"
      class="bk-shell bk-shell--wide py-24 text-center"
    >
      <AlertCircle class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h1 class="mb-2 text-xl font-semibold text-gray-900">{{ t("bookingUnavailable") }}</h1>
      <p class="text-gray-600 mb-8">{{ t("bookingUnavailableDesc") }}</p>
      <button
        type="button"
        class="bk-cta-primary"
        @click="router.push('/')"
      >
        {{ t("backToHome") }}
      </button>
    </div>

    <!-- Content Wrapper -->
    <div
      v-else
      class="relative z-20 mx-auto flex w-full max-w-2xl flex-1 flex-col"
    >
      <!-- Header -->
      <header class="sticky top-0 z-40">
        <div class="bk-header-bar">
          <div class="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              class="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-gray-100"
              :aria-label="t('back')"
              :disabled="isProcessingPayment"
              @click="prevStep"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            <div class="min-w-0 flex-1">
              <h1 class="truncate text-base font-medium text-gray-900">
                {{ steps[currentStep - 1]?.title || t("booking") }}
              </h1>
            </div>
          </div>
          <div class="h-0.5 w-full bg-gray-100">
            <div
              class="h-full bg-gray-900 transition-[width] duration-500 ease-out"
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
            />
          </div>
        </div>

        <div
          v-if="
            currentStep > 1 &&
            currentStep <= (isCartModeEnabled ? 5 : 5) &&
            selectedTheme &&
            currentStep !== (isCartModeEnabled ? 7 : 6)
          "
          class="relative z-30 animate-fade-in border-b border-gray-100 bg-white"
        >
          <div class="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
              <img
                v-if="selectedTheme.images?.[0]"
                :src="selectedTheme.images[0]"
                :alt="selectedTheme.name"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-gray-300"
              >
                <ImageIcon class="h-4 w-4" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ selectedTheme.name }}
              </p>
              <p
                v-if="
                  selectedDate &&
                  (isMultipleSlotEnabled
                    ? selectedSlots.length > 0
                    : selectedSlot)
                "
                class="truncate text-xs text-gray-500"
              >
                {{ formatDate(selectedDate) }},
                <template
                  v-if="isMultipleSlotEnabled && selectedSlots.length > 0"
                >
                  {{
                    selectedSlots.map((s) => `${s.start}-${s.end}`).join(", ")
                  }}
                </template>
                <template v-else>
                  {{ selectedSlot.start }} - {{ selectedSlot.end }}
                </template>
              </p>
              <p v-else class="text-xs text-gray-400">
                {{ t("selectDateAndTime") }}
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 text-sm text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline"
              @click="handleChangeTheme"
            >
              {{ t("change") }}
            </button>
          </div>

          <button
            v-if="confirmedSlot && holdExpiresAt && !isCartModeEnabled"
            type="button"
            class="flex w-full items-center justify-center gap-2 border-t border-amber-100 bg-amber-50 py-2 text-xs font-medium text-amber-700"
            @click="prevStep"
          >
            <Clock class="h-3.5 w-3.5" />
            <span>
              {{ t("slotLocked") }} {{ holdCountdown }} · {{ t("change") }}
            </span>
          </button>
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
          class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/95"
          role="status"
          aria-live="polite"
        >
          <Loader2 class="h-8 w-8 animate-spin text-gray-900" />
          <div class="space-y-1 text-center">
            <p class="text-base font-medium text-gray-900">
              {{ t("processingPayment") }}
            </p>
            <p class="text-sm text-gray-500">{{ t("pleaseWait") }}</p>
          </div>
        </div>
      </Transition>

      <!-- Recovery Dialog -->

      <!-- Theme Overview (shown in steps 2-4) -->
      <main
        class="mx-auto w-full max-w-2xl flex-1 space-y-8 overflow-hidden px-4 pb-8 pt-6 sm:px-6 sm:pt-8"
      >
        <Transition :name="transitionName" mode="out-in">
          <!-- Step 1: Themes -->
          <div v-if="currentStep === 1" :key="1">
            <p class="mb-4 text-sm text-gray-500">
              {{ t("selectThemeDescription") }}
            </p>

            <!-- Loading Skeleton -->
            <ul
              v-if="loadingThemes"
              class="divide-y divide-gray-100 border-y border-gray-100"
            >
              <li
                v-for="i in 3"
                :key="`skeleton-${i}`"
                class="flex animate-pulse items-center gap-4 py-4"
              >
                <div class="h-16 w-16 shrink-0 rounded-lg bg-gray-100" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-1/3 rounded bg-gray-100" />
                  <div class="h-3 w-2/3 rounded bg-gray-100" />
                </div>
                <div class="h-4 w-12 rounded bg-gray-100" />
              </li>
            </ul>

            <!-- Themes List -->
            <ul
              v-else
              class="divide-y divide-gray-100 border-y border-gray-100"
              role="radiogroup"
              :aria-label="t('selectTheme')"
            >
              <li
                v-for="theme in studioStore.themes"
                :key="theme.id"
                role="radio"
                tabindex="0"
                :aria-checked="selectedTheme?.id === theme.id"
                class="-mx-3 flex cursor-pointer items-center gap-4 rounded-lg px-3 py-4 transition-colors"
                :class="
                  selectedTheme?.id === theme.id
                    ? 'bg-gray-50'
                    : 'hover:bg-gray-50'
                "
                @click="selectTheme(theme)"
                @keydown.enter.prevent="selectTheme(theme)"
                @keydown.space.prevent="selectTheme(theme)"
              >
                <button
                  type="button"
                  class="h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-lg bg-gray-100"
                  :aria-label="theme.name"
                  @click.stop="openGallery(theme)"
                >
                  <img
                    v-if="theme.images?.[0]"
                    :src="theme.images[0]"
                    :alt="theme.name"
                    class="h-full w-full object-cover"
                  />
                  <span
                    v-else
                    class="flex h-full w-full items-center justify-center text-gray-300"
                  >
                    <ImageIcon class="h-6 w-6" />
                  </span>
                </button>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline gap-x-2">
                    <h3 class="truncate text-base font-medium text-gray-900">
                      {{ theme.name }}
                    </h3>
                    <span
                      v-if="theme.popular"
                      class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium capitalize text-gray-600"
                    >
                      {{ t("popular") }}
                    </span>
                  </div>
                  <p
                    v-if="theme.description_short"
                    class="mt-0.5 line-clamp-1 text-sm text-gray-500"
                  >
                    {{ theme.description_short }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400">
                    {{ theme.duration_minutes }} {{ t("minutes") }} ·
                    {{ theme.base_pax }} {{ t("pax") }}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-3">
                  <span class="text-base font-medium tabular-nums text-gray-900">
                    RM{{ formatPriceWhole(theme.base_price) }}
                  </span>
                  <span
                    class="flex h-5 w-5 items-center justify-center rounded-full border transition-colors"
                    :class="
                      selectedTheme?.id === theme.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300'
                    "
                    aria-hidden="true"
                  >
                    <Check
                      v-if="selectedTheme?.id === theme.id"
                      class="h-3 w-3"
                    />
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <!-- Step 2: Date & Time -->
          <div v-else-if="currentStep === 2" :key="2" class="space-y-8">
            <section class="space-y-3">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-medium text-gray-900">
                  {{ t("date") }}
                </h2>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Scroll dates left"
                    @click="scrollDates('left')"
                  >
                    <ChevronLeft class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Scroll dates right"
                    @click="scrollDates('right')"
                  >
                    <ChevronRight class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                ref="dateScroller"
                class="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-smooth px-4 pb-1 scrollbar-hide sm:-mx-6 sm:px-6"
              >
                <template v-if="loadingDates">
                  <div
                    v-for="i in 7"
                    :key="`date-skeleton-${i}`"
                    class="h-[4.5rem] w-14 shrink-0 animate-pulse rounded-lg bg-gray-100"
                  />
                </template>

                <button
                  v-else
                  v-for="d in dates"
                  :key="d.date"
                  type="button"
                  :data-date="d.date"
                  :disabled="d.isBlackout"
                  :aria-pressed="selectedDate === d.date"
                  class="relative flex h-[4.5rem] w-14 shrink-0 snap-start flex-col items-center justify-center rounded-lg border transition-colors"
                  :class="
                    d.isBlackout
                      ? 'cursor-not-allowed border-transparent bg-gray-50 text-gray-300 line-through'
                      : selectedDate === d.date
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                  "
                  @click="!d.isBlackout && selectDate(d.date)"
                >
                  <span
                    class="text-[11px] capitalize"
                    :class="selectedDate === d.date ? 'text-white/70' : 'text-gray-500'"
                  >
                    {{ d.weekday }}
                  </span>
                  <span class="text-lg font-medium leading-tight tabular-nums">
                    {{ d.day }}
                  </span>
                  <span
                    class="text-[11px] capitalize"
                    :class="selectedDate === d.date ? 'text-white/70' : 'text-gray-500'"
                  >
                    {{ d.month }}
                  </span>
                  <span
                    v-if="d.isSpecial && !d.isBlackout"
                    class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                    :class="selectedDate === d.date ? 'bg-white' : 'bg-amber-500'"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <!-- Blackout Date Info -->
              <div
                v-if="isBlackoutDateSelected && selectedDateInfo?.blackoutReason"
                class="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <span class="font-medium">{{ t("blackoutDate") }}:</span>
                  {{ selectedDateInfo.blackoutReason }}
                </p>
              </div>

              <!-- Special Date Info -->
              <div
                v-if="isSpecialDateSelected && selectedDateInfo"
                class="space-y-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
              >
                <p class="font-medium">{{ t("specialDate") }}</p>

                <template v-if="datePricingInfo && datePricingInfo.length > 0">
                  <div
                    v-for="(info, idx) in datePricingInfo"
                    :key="idx"
                    class="space-y-0.5"
                  >
                    <div class="flex items-baseline justify-between gap-3">
                      <span>
                        {{ info.label }}
                        <span
                          v-if="!info.appliesToAllSlots && info.hasTimeRange"
                          class="text-amber-700"
                        >
                          · {{ info.earliestStart }} - {{ info.latestEnd }}
                        </span>
                      </span>
                      <span
                        v-if="info.appliesToAllSlots || info.hasTimeRange"
                        class="shrink-0 font-medium tabular-nums"
                      >
                        RM{{ formatPriceWhole(info.minPrice) }}
                        <template v-if="info.minPrice !== info.maxPrice">
                          - RM{{ formatPriceWhole(info.maxPrice) }}
                        </template>
                      </span>
                    </div>
                    <p
                      v-if="info.minDiff !== 0 || info.maxDiff !== 0"
                      class="text-xs text-amber-700"
                    >
                      {{ info.minDiff > 0 ? "+" : "-" }}RM{{
                        formatPriceWhole(Math.abs(info.minDiff))
                      }}
                      <template v-if="info.maxDiff !== info.minDiff">
                        to {{ info.maxDiff > 0 ? "+" : "-" }}RM{{
                          formatPriceWhole(Math.abs(info.maxDiff))
                        }}
                      </template>
                      {{
                        info.minDiff > 0
                          ? t("specialPriceSurcharge") || "surcharge"
                          : t("specialPriceDiscount") || "discount"
                      }}
                    </p>
                  </div>
                </template>

                <p v-else-if="specialPricingMessage" class="flex justify-between gap-3">
                  <span>{{ specialPricingMessage }}</span>
                  <span class="shrink-0 font-medium tabular-nums">
                    {{ specialPricingAmount > 0 ? "+" : "-" }}RM{{
                      formatPriceWhole(Math.abs(specialPricingAmount))
                    }}
                  </span>
                </p>
                <p v-else class="text-amber-700">
                  {{
                    t("specialPriceApply") ||
                    "Special pricing applies to this date"
                  }}
                </p>
              </div>
            </section>

            <!-- Time Slots -->
            <section
              data-time-section
              class="space-y-3 transition-opacity"
              :class="{ 'pointer-events-none opacity-40': !selectedDate }"
            >
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-medium text-gray-900">
                  {{ t("selectTime") }}
                </h2>
                <span v-if="selectedDate" class="text-xs text-gray-500">
                  {{
                    isMultipleSlotEnabled
                      ? selectedSlots.length > 0
                        ? `${selectedSlots.length} ${t("slotsSelected") || "slot dipilih"}`
                        : t("selectSlots") || t("selectOneSlot")
                      : selectedSlot
                        ? t("oneSlotSelected")
                        : t("selectOneSlot")
                  }}
                </span>
              </div>

              <div v-if="loadingSlots" class="flex justify-center py-8">
                <Loader2 class="h-5 w-5 animate-spin text-gray-400" />
              </div>

              <div
                v-else-if="timeSlots.length > 0"
                class="grid grid-cols-2 gap-2 sm:grid-cols-3"
              >
                <button
                  v-for="slot in timeSlots"
                  :key="slot.id"
                  type="button"
                  :disabled="!slot.available"
                  :aria-pressed="
                    isMultipleSlotEnabled
                      ? selectedSlots.some((s) => s.id === slot.id)
                      : selectedSlot?.id === slot.id
                  "
                  class="h-11 rounded-lg border text-sm font-medium tabular-nums transition-colors"
                  :class="
                    !slot.available
                      ? 'cursor-not-allowed border-transparent bg-gray-50 text-gray-300 line-through'
                      : (
                            isMultipleSlotEnabled
                              ? selectedSlots.some((s) => s.id === slot.id)
                              : selectedSlot?.id === slot.id
                          )
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                  "
                  @click="selectSlot(slot)"
                >
                  {{ slot.start }} - {{ slot.end }}
                </button>
              </div>

              <p
                v-else-if="selectedDate && !loadingSlots"
                class="py-8 text-center text-sm text-gray-500"
              >
                {{
                  t("noSlotsAvailable") ||
                  "Tiada slot tersedia untuk tarikh ini"
                }}
              </p>
            </section>
          </div>

          <!-- Step 3: Pax & Addons -->
          <div v-else-if="currentStep === 3" :key="3" class="space-y-8">
            <p class="text-sm text-gray-500">
              {{ t("paxAndAddonsDescription") }}
            </p>

            <!-- Multi-slot Pax/Addon Note -->
            <div
              v-if="
                isMultipleSlotEnabled &&
                (confirmedSlots.length > 1 || selectedSlots.length > 1)
              "
              class="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
            >
              <Info class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p>{{ t("multiSlotPaxAddonNote") }}</p>
            </div>

            <!-- Pax -->
            <section class="border-y border-gray-100">
              <div class="flex items-center justify-between gap-4 py-4">
                <div>
                  <h2 class="text-base font-medium text-gray-900">
                    {{ t("paxCount") }}
                  </h2>
                  <p class="text-sm text-gray-500">
                    {{ t("totalPaxPresent") }}
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-30"
                    :disabled="paxCount <= 1"
                    :aria-label="`${t('paxCount')} -1`"
                    @click="paxCount > 1 ? paxCount-- : null"
                  >
                    <Minus class="h-4 w-4" />
                  </button>
                  <span class="w-6 text-center text-lg font-medium tabular-nums">
                    {{ paxCount }}
                  </span>
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-30"
                    :disabled="paxCount >= maxPax"
                    :aria-label="`${t('paxCount')} +1`"
                    @click="paxCount < maxPax ? paxCount++ : null"
                  >
                    <Plus class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                v-if="extraPaxCost > 0"
                class="flex items-center justify-between border-t border-gray-100 py-3 text-sm"
              >
                <span class="text-gray-500">
                  {{ paxCount - (selectedTheme!.base_pax || 0) }}
                  {{ t("extraPaxLabel") }} · RM{{
                    formatPriceWhole(selectedTheme.extra_pax_price)
                  }}/pax
                </span>
                <span class="font-medium tabular-nums text-gray-900">
                  +RM{{ formatPriceWhole(extraPaxCost) }}
                </span>
              </div>
            </section>

            <!-- Addons -->
            <section class="space-y-3">
              <h2 class="text-base font-medium text-gray-900">
                {{ t("addOns") }}
                <span class="font-normal text-gray-400">· {{ t("optional") }}</span>
              </h2>

              <!-- Multi-slot: Addons apply to all or first slot only -->
              <div
                v-if="
                  isMultipleSlotEnabled &&
                  (confirmedSlots.length > 1 || selectedSlots.length > 1) &&
                  studioStore.addons &&
                  studioStore.addons.length > 0
                "
                class="space-y-2"
              >
                <p class="text-sm text-gray-500">
                  {{ t("addonsApplyToLabel") }}
                </p>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label
                    v-for="option in (['all', 'firstOnly'] as const)"
                    :key="option"
                    class="flex cursor-pointer select-none items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors"
                    :class="
                      addonsApplyTo === option
                        ? 'border-gray-900 text-gray-900'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    "
                  >
                    <input
                      v-model="addonsApplyTo"
                      type="radio"
                      :value="option"
                      class="sr-only"
                    />
                    <span
                      class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                      :class="
                        addonsApplyTo === option
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                      "
                    >
                      <span
                        v-if="addonsApplyTo === option"
                        class="h-1.5 w-1.5 rounded-full bg-white"
                      />
                    </span>
                    {{
                      option === "all"
                        ? t("addonsApplyToAllSlots")
                        : t("addonsApplyToFirstSlotOnly")
                    }}
                  </label>
                </div>
                <p class="text-xs text-gray-500">
                  {{ t("addonsApplyToFirstSlotOnlyHint") }}
                </p>
              </div>

              <p
                v-if="!studioStore.addons || studioStore.addons.length === 0"
                class="py-6 text-center text-sm text-gray-500"
              >
                {{ t("noAddonsAvailable") }}
              </p>

              <ul
                v-else
                class="divide-y divide-gray-100 border-y border-gray-100"
              >
                <li
                  v-for="addon in studioStore.addons"
                  :key="addon.id"
                  class="flex items-center gap-4 py-4"
                >
                  <button
                    type="button"
                    class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                    :class="addon.image ? 'cursor-zoom-in' : 'cursor-default'"
                    :aria-label="addon.name"
                    @click.stop="openAddonImage(addon)"
                  >
                    <img
                      v-if="addon.image"
                      :src="addon.image"
                      :alt="addon.name"
                      class="h-full w-full object-cover"
                    />
                    <span
                      v-else
                      class="flex h-full w-full items-center justify-center text-gray-300"
                    >
                      <ImageIcon class="h-5 w-5" />
                    </span>
                  </button>

                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900">
                      {{ addon.name }}
                    </p>
                    <p
                      v-if="addon.description"
                      class="mt-0.5 cursor-pointer text-xs text-gray-500"
                      :class="expandedAddonDesc[addon.id] ? '' : 'line-clamp-1'"
                      @click="
                        expandedAddonDesc[addon.id] =
                          !expandedAddonDesc[addon.id]
                      "
                    >
                      {{ addon.description }}
                    </p>
                    <p class="mt-1 text-sm tabular-nums text-gray-900">
                      RM{{ formatPriceWhole(addon.price) }}
                    </p>
                  </div>

                  <div class="shrink-0">
                    <button
                      v-if="!selectedAddons[addon.id]"
                      type="button"
                      class="flex h-9 items-center gap-1 rounded-full border border-gray-200 px-3 text-sm text-gray-900 transition-colors hover:border-gray-400"
                      @click="selectedAddons[addon.id] = 1"
                    >
                      <Plus class="h-3.5 w-3.5" /> {{ t("add") }}
                    </button>

                    <button
                      v-else-if="addon.addon_type === 'single'"
                      type="button"
                      class="flex h-9 items-center gap-1 rounded-full bg-gray-900 px-3 text-sm text-white"
                      @click="delete selectedAddons[addon.id]"
                    >
                      <Check class="h-3.5 w-3.5" /> {{ t("added") }}
                    </button>

                    <div
                      v-else
                      class="flex items-center gap-2 rounded-full border border-gray-200 px-1"
                    >
                      <button
                        type="button"
                        class="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                        @click="
                          selectedAddons[addon.id] > 0
                            ? selectedAddons[addon.id]--
                            : null;
                          if (selectedAddons[addon.id] === 0)
                            delete selectedAddons[addon.id];
                        "
                      >
                        <Minus class="h-3.5 w-3.5" />
                      </button>
                      <span class="w-4 text-center text-sm font-medium tabular-nums">
                        {{ selectedAddons[addon.id] }}
                      </span>
                      <button
                        type="button"
                        class="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                        :disabled="
                          !!addon.max_quantity &&
                          addon.max_quantity > 0 &&
                          selectedAddons[addon.id] >= addon.max_quantity
                        "
                        @click="selectedAddons[addon.id]++"
                      >
                        <Plus class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </section>
          </div>

          <!-- Step 4: Conditional - Cart Review (Cart Mode) or Customer Information (Single Mode) -->
          <!-- Cart Mode: Cart Review -->
          <div
            v-else-if="currentStep === 4 && isCartModeEnabled"
            :key="4.1"
            class="space-y-6"
          >
            <div
              v-if="cartItemCount === 0"
              class="space-y-4 py-10 text-center"
            >
              <p class="text-sm text-gray-500">{{ t("cartEmpty") }}</p>
              <button
                type="button"
                class="bk-cta-primary bk-cta-primary--inline"
                @click="addAnotherSession"
              >
                {{ t("addSession") }}
              </button>
            </div>

            <div
              v-if="unifiedCartHoldExpiresAt && cart.length > 0"
              class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
            >
              <span class="flex items-center gap-2">
                <Clock class="h-4 w-4" />
                {{ t("slotHeld") }}
              </span>
              <span class="font-medium tabular-nums">
                {{ unifiedCartHoldCountdown }}
              </span>
            </div>

            <ul
              v-if="cart && cart.length > 0"
              class="divide-y divide-gray-100 border-y border-gray-100"
            >
              <li v-for="(item, index) in cart" :key="item.id" class="py-4">
                <div class="flex items-start gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-base font-medium text-gray-900">
                      {{ item.theme.name }}
                    </p>
                    <p class="mt-0.5 text-sm text-gray-500">
                      {{ formatDate(item.date) }} · {{ item.slot.start }} –
                      {{ item.slot.end }}
                    </p>
                  </div>
                  <p class="text-base font-medium tabular-nums text-gray-900">
                    RM{{ formatPriceWhole(item.total) }}
                  </p>
                  <button
                    type="button"
                    class="-mr-2 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    :aria-label="`${t('removeFromCart')}: ${item.theme.name}`"
                    @click="removeCartItem(index)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  class="mt-2 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
                  :aria-expanded="expandedCartItems.has(item.id)"
                  @click="toggleCartItemExpansion(item.id)"
                >
                  {{
                    expandedCartItems.has(item.id)
                      ? t("hideDetails")
                      : t("viewBreakdown")
                  }}
                  <ChevronDown
                    class="h-4 w-4 transition-transform"
                    :class="expandedCartItems.has(item.id) ? 'rotate-180' : ''"
                  />
                </button>

                <dl
                  v-if="expandedCartItems.has(item.id)"
                  class="mt-3 space-y-1.5 rounded-lg bg-gray-50 px-3 py-3 text-sm"
                >
                  <div class="flex justify-between gap-4 text-gray-600">
                    <dt>{{ t("setPrice") }} ({{ item.theme.base_pax }} {{ t("pax") }})</dt>
                    <dd class="tabular-nums">
                      RM{{ formatPriceWhole(item.theme.base_price) }}
                    </dd>
                  </div>

                  <div
                    v-if="item.specialPricing"
                    class="flex justify-between gap-4"
                  >
                    <dt class="text-amber-700">{{ item.specialPricing.message }}</dt>
                    <dd
                      class="tabular-nums"
                      :class="
                        item.specialPricing.amount > 0
                          ? 'text-amber-700'
                          : 'text-green-600'
                      "
                    >
                      {{ item.specialPricing.amount > 0 ? "+" : "" }}RM{{
                        formatPriceWhole(item.specialPricing.amount)
                      }}
                    </dd>
                  </div>

                  <div
                    v-if="Math.max(0, item.pax - (item.theme.base_pax || 0)) > 0"
                    class="flex justify-between gap-4 text-gray-600"
                  >
                    <dt>
                      {{ t("extraPaxLabel") }} ×{{
                        Math.max(0, item.pax - (item.theme.base_pax || 0))
                      }}
                    </dt>
                    <dd class="tabular-nums">
                      +RM{{
                        formatPriceWhole(
                          Math.max(0, item.pax - (item.theme.base_pax || 0)) *
                            item.theme.extra_pax_price,
                        )
                      }}
                    </dd>
                  </div>

                  <template v-for="(qty, id) in item.addons" :key="id">
                    <div
                      v-if="
                        qty > 0 && studioStore.addons.find((a) => a.id === id)
                      "
                      class="flex justify-between gap-4 text-gray-600"
                    >
                      <dt class="truncate">
                        {{ studioStore.addons.find((a) => a.id === id).name }}
                        ×{{ qty }}
                      </dt>
                      <dd class="tabular-nums">
                        +RM{{
                          formatPriceWhole(
                            (studioStore.addons.find((a) => a.id === id)
                              .price || 0) * qty,
                          )
                        }}
                      </dd>
                    </div>
                  </template>
                </dl>
              </li>
            </ul>

            <button
              v-if="cartItemCount > 0"
              type="button"
              class="bk-cta-secondary w-full gap-2"
              @click="addAnotherSession"
            >
              <Plus class="h-4 w-4" />
              {{ t("addAnotherSession") }}
            </button>
          </div>

          <!-- Single Mode: Customer Information -->
          <div
            v-else-if="currentStep === 4 && !isCartModeEnabled"
            class="space-y-6"
          >
            <p class="text-sm text-gray-500">
              {{ t("fillDetailsNote") }}
            </p>

            <div class="space-y-5">
              <div class="space-y-1.5">
                <label for="name" class="bk-label">
                  {{ t("fullName") }}
                </label>
                <input
                  id="name"
                  v-model="customerInfo.name"
                  type="text"
                  required
                  autocomplete="name"
                  class="bk-input"
                  :class="{ 'bk-input--error': formErrors.name }"
                  :placeholder="t('enterFullName')"
                  @blur="validateName"
                  @input="formErrors.name = ''"
                />
                <p v-if="formErrors.name" class="text-xs text-red-600">
                  {{ formErrors.name }}
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
                          countryCodes.find(
                            (c) => c.code === selectedCountryCode,
                          )?.flag
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
                    :class="{ 'bk-input--error': formErrors.phone }"
                    :placeholder="t('enterPhone')"
                    @blur="validatePhone"
                    @input="formErrors.phone = ''"
                  />
                </div>
                <p v-if="formErrors.phone" class="text-xs text-red-600">
                  {{ formErrors.phone }}
                </p>
                <p v-else class="bk-hint">
                  {{ t("preferWhatsApp") }}
                </p>
              </div>

              <div class="space-y-1.5">
                <label for="email" class="bk-label">
                  {{ t("email") }}
                </label>
                <input
                  id="email"
                  v-model="customerInfo.email"
                  type="email"
                  required
                  autocomplete="email"
                  class="bk-input"
                  :class="{ 'bk-input--error': formErrors.email }"
                  :placeholder="t('enterEmail')"
                  @blur="validateEmail"
                  @input="formErrors.email = ''"
                />
                <p v-if="formErrors.email" class="text-xs text-red-600">
                  {{ formErrors.email }}
                </p>
                <p v-else class="bk-hint">
                  {{ t("emailConfirmationNote") }}
                </p>
              </div>
            </div>
          </div>

          <!-- Cart Mode: Customer Information -->
          <div
            v-else-if="currentStep === 5 && isCartModeEnabled"
            :key="5.1"
            class="space-y-6"
          >
            <p class="text-sm text-gray-500">
              {{ t("fillDetailsNote") }}
            </p>

            <div class="space-y-5">
              <div class="space-y-1.5">
                <label for="cart-name" class="bk-label">
                  {{ t("fullName") }}
                </label>
                <input
                  id="cart-name"
                  v-model="customerInfo.name"
                  type="text"
                  required
                  autocomplete="name"
                  class="bk-input"
                  :class="{ 'bk-input--error': formErrors.name }"
                  :placeholder="t('enterFullName')"
                  @blur="validateName"
                  @input="formErrors.name = ''"
                />
                <p v-if="formErrors.name" class="text-xs text-red-600">
                  {{ formErrors.name }}
                </p>
              </div>

              <div class="space-y-1.5">
                <label for="cart-phone" class="bk-label">
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
                          countryCodes.find(
                            (c) => c.code === selectedCountryCode,
                          )?.flag
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
                    id="cart-phone"
                    v-model="localPhone"
                    type="tel"
                    required
                    autocomplete="tel-national"
                    class="bk-input bk-input--flex"
                    :class="{ 'bk-input--error': formErrors.phone }"
                    :placeholder="t('enterPhone')"
                    @blur="validatePhone"
                    @input="formErrors.phone = ''"
                  />
                </div>
                <p v-if="formErrors.phone" class="text-xs text-red-600">
                  {{ formErrors.phone }}
                </p>
                <p v-else class="bk-hint">
                  {{ t("preferWhatsApp") }}
                </p>
              </div>

              <div class="space-y-1.5">
                <label for="cart-email" class="bk-label">
                  {{ t("email") }}
                </label>
                <input
                  id="cart-email"
                  v-model="customerInfo.email"
                  type="email"
                  required
                  autocomplete="email"
                  class="bk-input"
                  :class="{ 'bk-input--error': formErrors.email }"
                  :placeholder="t('enterEmail')"
                  @blur="validateEmail"
                  @input="formErrors.email = ''"
                />
                <p v-if="formErrors.email" class="text-xs text-red-600">
                  {{ formErrors.email }}
                </p>
                <p v-else class="bk-hint">
                  {{ t("emailConfirmationNote") }}
                </p>
              </div>
            </div>
          </div>

          <!-- Step 6: Conditional - Terms & Conditions (Cart Mode) or Summary (Single Mode) -->
          <!-- Cart Mode: Terms & Conditions -->
          <div
            v-else-if="currentStep === 6 && isCartModeEnabled"
            class="space-y-6"
          >
            <div v-if="loadingTerms" class="flex justify-center py-10">
              <Loader2 class="h-6 w-6 animate-spin text-gray-400" />
            </div>

            <div
              v-else-if="termsContent"
              class="prose prose-sm max-w-none text-gray-700 prose-headings:font-medium prose-headings:text-gray-900"
              v-html="sanitize(termsContentHtml)"
            />

            <p v-else class="py-10 text-center text-sm text-gray-500">
              {{
                t("noTermsConfigured") ||
                "Tiada terma dan syarat dikonfigurasi."
              }}
            </p>

            <label
              class="flex cursor-pointer select-none items-start gap-3 border-t border-gray-100 pt-5"
            >
              <input v-model="termsAccepted" type="checkbox" class="peer sr-only" />
              <span
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2"
                :class="
                  termsAccepted
                    ? 'border-gray-900 bg-gray-900'
                    : 'border-gray-300 bg-white'
                "
              >
                <Check v-if="termsAccepted" class="h-3.5 w-3.5 text-white" />
              </span>
              <span class="min-w-0">
                <span class="text-sm font-medium text-gray-900">
                  {{ t("agreeToTerms") }}
                </span>
                <span class="mt-0.5 block text-sm text-gray-500">
                  {{
                    t("termsAcceptanceNote") ||
                    "Saya telah membaca dan memahami semua terma dan syarat di atas."
                  }}
                </span>
              </span>
            </label>
          </div>

          <!-- Single Mode: Terms & Conditions -->
          <div
            v-else-if="currentStep === 5 && !isCartModeEnabled"
            class="space-y-6"
          >
            <div v-if="loadingTerms" class="flex justify-center py-10">
              <Loader2 class="h-6 w-6 animate-spin text-gray-400" />
            </div>

            <div
              v-else-if="termsContent"
              class="prose prose-sm max-w-none text-gray-700 prose-headings:font-medium prose-headings:text-gray-900"
              v-html="sanitize(termsContentHtml)"
            />

            <p v-else class="py-10 text-center text-sm text-gray-500">
              {{
                t("noTermsConfigured") ||
                "Tiada terma dan syarat dikonfigurasi."
              }}
            </p>

            <label
              class="flex cursor-pointer select-none items-start gap-3 border-t border-gray-100 pt-5"
            >
              <input v-model="termsAccepted" type="checkbox" class="peer sr-only" />
              <span
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2"
                :class="
                  termsAccepted
                    ? 'border-gray-900 bg-gray-900'
                    : 'border-gray-300 bg-white'
                "
              >
                <Check v-if="termsAccepted" class="h-3.5 w-3.5 text-white" />
              </span>
              <span class="min-w-0">
                <span class="text-sm font-medium text-gray-900">
                  {{ t("agreeToTerms") }}
                </span>
                <span class="mt-0.5 block text-sm text-gray-500">
                  {{
                    t("termsAcceptanceNote") ||
                    "Saya telah membaca dan memahami semua terma dan syarat di atas."
                  }}
                </span>
              </span>
            </label>
          </div>

          <!-- Step 7: Summary (Cart Mode) -->
          <div
            v-else-if="currentStep === 7 && isCartModeEnabled"
            class="space-y-6"
          >
            <p class="text-sm text-gray-500">
              {{ t("bookingSummaryDescription") }}
            </p>

            <!-- Unified Cart Hold Timer (Subtle Style) -->
            <div
              v-if="unifiedCartHoldExpiresAt && cart.length > 0"
              class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
            >
              <div
                class="flex items-center gap-2"
              >
                <Clock class="h-4 w-4" />
                <span>{{ t("slotHeld") }}</span>
              </div>
              <div class="font-medium tabular-nums">
                {{ unifiedCartHoldCountdown }}
              </div>
            </div>

            <!-- Booking Summary Card -->
            <div
              class="border-y border-gray-100"
            >
              <!-- Card Header: Customer Info (Matches Step 6) -->
              <div
                class="flex items-start justify-between gap-3 border-b border-gray-100 py-4"
              >
                <div>
                  <h3 class="text-base font-medium text-gray-900">
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
                  type="button"
                  :aria-label="t('customerInformation')"
                  class="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <Pencil class="h-4 w-4" />
                </button>
              </div>

              <!-- Cart Items Content -->
              <div class="py-5">
                <div class="space-y-8">
                  <!-- Iterate over cart items -->
                  <div
                    v-for="(item, index) in cart || []"
                    :key="item.id"
                    class="relative"
                  >
                    <!-- Item Header -->
                    <div class="flex justify-between items-start mb-1">
                      <div class="flex items-center gap-2">
                        <h4 class="text-base font-medium text-gray-900">
                          {{ item.theme.name }}
                        </h4>
                        <!-- Coupon Applied Badge -->
                        <span
                          v-if="
                            validatedCoupon &&
                            isCartItemEligibleForCoupon(index)
                          "
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"
                        >
                          <Ticket class="w-3 h-3" />
                          {{ validatedCoupon.code }}
                        </span>
                        <!-- Not Eligible Badge (partial apply) -->
                        <span
                          v-if="
                            validatedCoupon &&
                            !isCartItemEligibleForCoupon(index)
                          "
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium"
                        >
                          <X class="w-3 h-3" />
                          {{ t("notEligible") }}
                        </span>
                      </div>
                      <span class="text-base font-medium text-gray-900">
                        RM{{ formatPriceWhole(item.theme.base_price) }}
                      </span>
                    </div>

                    <!-- Date & Time -->
                    <div class="text-gray-500 text-sm flex items-center gap-2">
                      <span>{{ formatDate(item.date) }}</span>
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
                          class="font-medium"
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
                          >{{ t("extraPaxLabel") }} (x{{
                            Math.max(0, item.pax - (item.theme.base_pax || 0))
                          }})</span
                        >
                        <span class="font-medium text-gray-900">
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
                          <span class="font-medium text-gray-900">
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

                    <!-- Discount Applied to This Item (if eligible) -->
                    <div
                      v-if="
                        validatedCoupon &&
                        isCartItemEligibleForCoupon(index) &&
                        getCartItemDiscount(index) > 0
                      "
                      class="mt-3 pt-3 border-t border-green-100 flex justify-between items-center bg-green-50/50 -mx-2 px-2 py-2 rounded-lg"
                    >
                      <span
                        class="text-xs font-medium text-green-700 flex items-center gap-1"
                      >
                        <Ticket class="w-3 h-3" />
                        {{ t("discountApplied") }} ({{ validatedCoupon.code }})
                      </span>
                      <span class="font-medium text-green-600 text-sm"
                        >-RM{{
                          formatPriceWhole(getCartItemDiscount(index))
                        }}</span
                      >
                    </div>

                    <!-- Item Total Row -->
                    <div
                      class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center"
                    >
                      <span
                        class="text-sm text-gray-500"
                        >{{ t("total") || "Total" }}</span
                      >
                      <span class="font-medium text-gray-900"
                        >RM{{
                          formatPriceWhole(
                            item.total - getCartItemDiscount(index),
                          )
                        }}</span
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
                <div class="border-t border-gray-100 my-6"></div>

                <!-- Coupon Section (Matches Step 6) -->
                <div>
                  <div v-if="!validatedCoupon" class="flex gap-2">
                    <input
                      type="text"
                      v-model="couponCode"
                      :placeholder="t('haveCoupon')"
                      class="bk-input bk-input--flex"
                      @keydown.enter.prevent="handleApplyCoupon"
                    />
                    <button
                      @click="handleApplyCoupon"
                      :disabled="!couponCode.trim() || isValidatingCoupon"
                      type="button"
                      class="h-11 shrink-0 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
                    >
                      {{ isValidatingCoupon ? "..." : t("apply") || "Guna" }}
                    </button>
                  </div>

                  <p v-if="couponError" class="mt-2 text-xs text-red-600">
                    {{ couponError }}
                  </p>

                  <!-- Applied Coupon -->
                  <div
                    v-if="validatedCoupon"
                    class="space-y-2 rounded-lg bg-green-50 px-3 py-2.5"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Ticket class="w-4 h-4 text-green-700" />
                        <span class="font-medium text-green-700">{{
                          validatedCoupon.code
                        }}</span>
                        <span class="text-green-600 text-sm"
                          >(-RM{{ formatPriceWhole(discountAmount) }})</span
                        >
                      </div>
                      <button
                        @click="removeCoupon"
                        type="button"
                        :aria-label="validatedCoupon.code"
                        class="rounded-full p-1 text-green-700 transition-colors hover:bg-green-100"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                    <!-- Show which items are eligible (partial apply) -->
                    <div
                      v-if="
                        validatedCoupon.eligible_indices &&
                        validatedCoupon.eligible_indices.length > 0 &&
                        validatedCoupon.eligible_indices.length < cart.length
                      "
                      class="text-xs text-green-700"
                    >
                      <span class="font-medium">
                        {{ t("appliedToSessions") }}:
                      </span>
                      <span class="ml-1">
                        {{ validatedCoupon.eligible_indices.length }}
                        {{ t("of") }} {{ cart.length }} {{ t("sessions") }} ({{
                          validatedCoupon.eligible_indices
                            .map((i) => i + 1)
                            .join(", ")
                        }})
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Separator -->
                <div class="border-t border-gray-100 my-6"></div>

                <!-- Amount Summary (transparent breakdown) -->
                <div class="space-y-4">
                  <h4
                    class="text-sm font-medium text-gray-900"
                  >
                    {{ t("amountSummary") }}
                  </h4>

                  <!-- Multi-slot: sessions breakdown (cart mode) -->
                  <div
                    v-if="cart.length > 1"
                    class="space-y-2 rounded-lg bg-gray-50 px-3 py-3"
                  >
                    <p
                      class="text-xs font-medium text-gray-500"
                    >
                      {{ t("sessionsCalculation") }}
                    </p>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">
                        {{ cart.length }} {{ t("sessionsInCart") }}
                      </span>
                      <span class="font-medium text-gray-700">
                        RM{{ formatPriceWhole(subtotalBeforeDiscount) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500">
                      {{ t("sessionsSubtotal") }} ({{ cart.length }} ×
                      {{ t("session") }})
                    </p>
                  </div>

                  <!-- 1. Subtotal before discount (only when coupon applied) -->
                  <div
                    v-if="validatedCoupon"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-gray-600">{{
                      t("subtotalBeforeDiscount")
                    }}</span>
                    <span class="font-medium text-gray-900"
                      >RM{{ formatPriceWhole(subtotalBeforeDiscount) }}</span
                    >
                  </div>

                  <!-- 2. Discount (if coupon applied) -->
                  <div
                    v-if="validatedCoupon && discountAmount > 0"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-gray-600">
                      {{ t("discountApplied") }}
                      ({{ validatedCoupon.code }})
                    </span>
                    <span class="font-medium text-green-600"
                      >-RM{{ formatPriceWhole(discountAmount) }}</span
                    >
                  </div>

                  <!-- 3. Total after discount -->
                  <div class="flex justify-between text-sm font-medium">
                    <span class="text-gray-700">{{
                      t("totalAfterDiscount")
                    }}</span>
                    <span class="text-gray-900"
                      >RM{{ formatPriceWhole(grandTotal) }}</span
                    >
                  </div>

                  <!-- 4. Deposit mode: deposit (pay now) + balance (at studio) -->
                  <template v-if="paymentType === 'deposit'">
                    <!-- Per-session deposit breakdown (cart) -->
                    <div
                      v-if="cartDepositPerItem.length > 0"
                      class="space-y-1.5 rounded-lg bg-gray-50 px-3 py-3"
                    >
                      <p
                        class="text-xs font-medium text-gray-500"
                      >
                        {{ t("depositPerSessionBreakdown") }}
                      </p>
                      <div
                        v-for="(dep, idx) in cartDepositPerItem"
                        :key="idx"
                        class="flex justify-between text-sm"
                      >
                        <span class="text-gray-600">
                          {{ t("sessionNumber", { n: idx + 1 }) }}
                          <span class="text-gray-400 text-xs">
                            ({{ cart[idx].theme.name }},
                            {{ formatDate(cart[idx].date) }})
                          </span>
                        </span>
                        <span class="font-medium text-gray-700">
                          RM{{ formatPriceWhole(dep) }}
                        </span>
                      </div>
                      <div
                        class="flex justify-between text-sm pt-1.5 border-t border-gray-200 mt-1.5"
                      >
                        <span class="text-gray-600 font-medium">{{
                          t("depositPayNow")
                        }}</span>
                        <span class="font-medium text-gray-900">
                          RM{{ formatPriceWhole(effectiveDepositAmount) }}
                        </span>
                      </div>
                    </div>
                    <template v-else>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">{{
                          t("depositPayNow")
                        }}</span>
                        <span class="font-medium text-gray-900"
                          >RM{{
                            formatPriceWhole(effectiveDepositAmount)
                          }}</span
                        >
                      </div>
                    </template>
                    <p
                      class="text-xs text-gray-500 -mt-0.5 pl-0 pr-2 text-right"
                    >
                      {{ t(depositExplanation.key, depositExplanation.params) }}
                      <template
                        v-if="
                          depositAmount > 0 &&
                          effectiveDepositAmount < depositAmount
                        "
                      >
                        · {{ t("depositDiscountNote") }}
                      </template>
                    </p>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">{{
                        t("balancePayAtStudio")
                      }}</span>
                      <span class="font-medium text-gray-700"
                        >RM{{ formatPriceWhole(effectiveBalance) }}</span
                      >
                    </div>
                  </template>

                  <!-- 5. Transaction fee (on_top) -->
                  <div
                    v-if="chipFeeToAdd > 0"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-gray-600">{{ t("chipFee") }}</span>
                    <span class="font-medium text-gray-900">RM1.00</span>
                  </div>

                  <div class="border-t border-gray-200 pt-3 mt-1">
                    <!-- Amount to pay now - highlighted -->
                    <div>
                      <div class="flex justify-between items-center">
                        <span
                          class="text-base font-medium text-gray-900"
                        >
                          {{ t("amountToPay") }}
                        </span>
                        <span class="text-xl font-semibold tabular-nums text-gray-900">
                          RM{{ formatPriceWhole(amountToPayNow) }}
                        </span>
                      </div>
                      <p class="mt-1 text-xs leading-relaxed text-gray-500">
                        {{
                          paymentType === "deposit"
                            ? t("amountToPayExplanation")
                            : t("fullPaymentExplanation")
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Single Mode: Summary -->
          <div
            v-else-if="currentStep === 6 && !isCartModeEnabled"
            class="space-y-6"
          >
            <p class="text-sm text-gray-500">
              {{ t("bookingSummaryDescription") }}
            </p>
            <!-- Booking Summary Card -->
            <div
              class="border-y border-gray-100"
            >
              <div
                class="flex items-start justify-between gap-3 border-b border-gray-100 py-4"
              >
                <div>
                  <h3 class="text-base font-medium text-gray-900">
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
                  type="button"
                  :aria-label="t('customerInformation')"
                  class="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <Pencil class="h-4 w-4" />
                </button>
              </div>

              <!-- Hold Timer Banner -->
              <div
                v-if="confirmedSlot && holdExpiresAt"
                class="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
              >
                <Clock class="h-4 w-4" />
                <span> {{ t("slotLocked") }}: {{ holdCountdown }} </span>
              </div>

              <div class="py-5">
                <!-- 2. Main Booking Details -->
                <div class="space-y-6">
                  <!-- Theme Item -->
                  <div>
                    <div class="flex justify-between items-start mb-1">
                      <h4 class="text-base font-medium text-gray-900">
                        {{ selectedTheme?.name }}
                      </h4>
                      <span class="text-base font-medium text-gray-900"
                        >RM{{
                          formatPriceWhole(selectedTheme?.base_price || 0)
                        }}</span
                      >
                    </div>
                    <div class="mt-1 space-y-1.5">
                      <p class="text-gray-500 text-sm flex items-center gap-2">
                        <Calendar class="w-4 h-4 text-gray-400" />
                        {{ formatDate(selectedDate) }}
                      </p>
                      <div
                        v-if="
                          isMultipleSlotEnabled && confirmedSlots.length > 0
                        "
                        class="space-y-1"
                      >
                        <div
                          v-for="slot in confirmedSlots"
                          :key="slot.hold?.holdId || slot.id"
                          class="flex items-center gap-2 text-gray-600 font-medium text-sm pl-0.5"
                        >
                          <div
                            class="w-1.5 h-1.5 rounded-full bg-gray-300"
                          ></div>
                          {{ slot.start }} - {{ slot.end }}
                        </div>
                      </div>
                      <p
                        v-else
                        class="text-gray-600 text-sm font-medium flex items-center gap-2 pl-0.5"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"
                        ></span>
                        {{ selectedSlot?.start }} - {{ selectedSlot?.end }}
                      </p>
                    </div>

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
                          class="font-medium"
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
                          {{ t("extraPaxLabel") }} (x{{
                            paxCount - (selectedTheme!.base_pax || 0)
                          }})
                        </span>
                        <span class="font-medium text-gray-900"
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
                          <span class="font-medium text-gray-900">
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
                  <div class="border-t border-gray-100"></div>

                  <!-- 3. Coupon Section -->
                  <div>
                    <div v-if="!validatedCoupon" class="flex gap-2">
                      <input
                        type="text"
                        v-model="couponCode"
                        :placeholder="t('haveCoupon')"
                        class="bk-input bk-input--flex"
                        @keydown.enter.prevent="handleApplyCoupon"
                      />
                      <button
                        @click="handleApplyCoupon"
                        :disabled="!couponCode.trim() || isValidatingCoupon"
                        type="button"
                      class="h-11 shrink-0 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
                      >
                        {{ isValidatingCoupon ? "..." : t("apply") || "Guna" }}
                      </button>
                    </div>

                    <p
                      v-if="couponError"
                      class="mt-2 text-xs text-red-600"
                    >
                      {{ couponError }}
                    </p>

                    <!-- Applied Coupon -->
                    <div
                      v-if="validatedCoupon"
                      class="space-y-2 rounded-lg bg-green-50 px-3 py-2.5"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <Ticket class="w-4 h-4 text-green-700" />
                          <span class="font-medium text-green-700">{{
                            validatedCoupon.code
                          }}</span>
                          <span class="text-green-600 text-sm"
                            >(-RM{{ formatPriceWhole(discountAmount) }})</span
                          >
                        </div>
                        <button
                          @click="removeCoupon"
                          type="button"
                        :aria-label="validatedCoupon.code"
                        class="rounded-full p-1 text-green-700 transition-colors hover:bg-green-100"
                        >
                          <X class="w-4 h-4" />
                        </button>
                      </div>
                      <!-- Show which slots are eligible (single mode multi-slot - all slots share same date, so all or none) -->
                      <div
                        v-if="
                          !isCartModeEnabled &&
                          singleModeSlotCount > 1 &&
                          validatedCoupon &&
                          discountAmount > 0
                        "
                        class="text-xs text-green-700"
                      >
                        <span class="font-medium">
                          {{ t("appliedToAllSessions") }}
                          {{ singleModeSlotCount }} {{ t("sessions") }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Separator -->
                  <div class="border-t border-gray-100"></div>

                  <!-- Amount Summary (transparent breakdown) -->
                  <div class="space-y-4">
                    <h4
                      class="text-sm font-medium text-gray-900"
                    >
                      {{ t("amountSummary") }}
                    </h4>

                    <!-- Single mode multi-slot: sessions calculation breakdown -->
                    <div
                      v-if="singleModeSlotCount > 1"
                      class="space-y-2 rounded-lg bg-gray-50 px-3 py-3"
                    >
                      <p
                        class="text-xs font-medium text-gray-500"
                      >
                        {{ t("sessionsCalculation") }}
                      </p>
                      <!-- Show slots with coupon badges -->
                      <div
                        v-if="validatedCoupon && singleModeSlotCount > 1"
                        class="mb-2 pb-2 border-b border-gray-200"
                      >
                        <p class="text-xs text-gray-600 mb-1.5">
                          {{ t("sessions") }}:
                        </p>
                        <div class="flex flex-wrap gap-1.5">
                          <span
                            v-for="(slot, idx) in confirmedSlots.length > 0
                              ? confirmedSlots
                              : selectedSlots"
                            :key="idx"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                            :class="
                              validatedCoupon && discountAmount > 0
                                ? 'bg-green-100 text-green-700 font-medium'
                                : 'bg-gray-100 text-gray-600'
                            "
                          >
                            <span>{{ slot.start }} - {{ slot.end }}</span>
                            <Ticket
                              v-if="validatedCoupon && discountAmount > 0"
                              class="w-3 h-3"
                            />
                          </span>
                        </div>
                        <p
                          v-if="validatedCoupon && discountAmount > 0"
                          class="text-xs text-green-700 mt-1.5 flex items-center gap-1"
                        >
                          <Ticket class="w-3 h-3" />
                          {{ t("couponAppliedToAllSessions") }}
                        </p>
                      </div>
                      <template v-if="addonsApplyTo === 'all'">
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600">{{
                            t("perSessionWithAddons")
                          }}</span>
                          <span class="font-medium text-gray-700"
                            >RM{{
                              formatPriceWhole(singleModePerSessionAmount)
                            }}</span
                          >
                        </div>
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600">
                            × {{ singleModeSlotCount }} {{ t("sessions") }}
                          </span>
                          <span class="font-medium text-gray-900"
                            >RM{{
                              formatPriceWhole(
                                singleModePerSessionAmount *
                                  singleModeSlotCount,
                              )
                            }}</span
                          >
                        </div>
                      </template>
                      <template v-else>
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600">{{
                            t("firstSessionWithAddons")
                          }}</span>
                          <span class="font-medium text-gray-700"
                            >RM{{ formatPriceWhole(currentItemTotal) }}</span
                          >
                        </div>
                        <div
                          v-if="singleModeSlotCount > 1"
                          class="flex justify-between text-sm"
                        >
                          <span class="text-gray-600">
                            {{ t("additionalSessionsNoAddons") }}
                            <br />
                            ({{ singleModeSlotCount - 1 }} × RM{{
                              formatPriceWhole(singleModeSessionWithoutAddons)
                            }})
                          </span>
                          <span class="font-medium text-gray-700"
                            >RM{{
                              formatPriceWhole(
                                singleModeSessionWithoutAddons *
                                  (singleModeSlotCount - 1),
                              )
                            }}</span
                          >
                        </div>
                        <div
                          class="flex justify-between text-sm pt-1 border-t border-gray-100"
                        >
                          <span class="text-gray-600 font-medium">{{
                            t("sessionsSubtotal")
                          }}</span>
                          <span class="font-medium text-gray-900"
                            >RM{{
                              formatPriceWhole(subtotalBeforeDiscount)
                            }}</span
                          >
                        </div>
                      </template>
                      <!-- Discount per slot breakdown (if coupon applied) -->
                      <div
                        v-if="
                          validatedCoupon &&
                          discountAmount > 0 &&
                          singleModeSlotCount > 1
                        "
                        class="pt-2 mt-2 border-t border-gray-200"
                      >
                        <div
                          class="flex justify-between text-sm text-green-700"
                        >
                          <span class="flex items-center gap-1">
                            <Ticket class="w-3 h-3" />
                            {{ t("discountPerSession") }}
                          </span>
                          <span class="font-medium">
                            -RM{{
                              formatPriceWhole(
                                Math.floor(
                                  discountAmount / singleModeSlotCount,
                                ),
                              )
                            }}
                          </span>
                        </div>
                        <div
                          class="flex justify-between text-sm text-green-700 font-medium mt-1"
                        >
                          <span>{{ t("totalDiscount") }}</span>
                          <span>-RM{{ formatPriceWhole(discountAmount) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 1. Subtotal before discount (only when coupon applied) -->
                    <div
                      v-if="validatedCoupon"
                      class="flex justify-between text-sm"
                    >
                      <span class="text-gray-600">{{
                        t("subtotalBeforeDiscount")
                      }}</span>
                      <span class="font-medium text-gray-900"
                        >RM{{ formatPriceWhole(subtotalBeforeDiscount) }}</span
                      >
                    </div>

                    <!-- 2. Discount (if coupon applied) -->
                    <div
                      v-if="validatedCoupon && discountAmount > 0"
                      class="flex justify-between text-sm"
                    >
                      <span class="text-gray-600">
                        {{ t("discountApplied") }}
                        ({{ validatedCoupon.code }})
                      </span>
                      <span class="font-medium text-green-600"
                        >-RM{{ formatPriceWhole(discountAmount) }}</span
                      >
                    </div>

                    <!-- 3. Total after discount -->
                    <div class="flex justify-between text-sm font-medium">
                      <span class="text-gray-700">{{
                        t("totalAfterDiscount")
                      }}</span>
                      <span class="text-gray-900"
                        >RM{{ formatPriceWhole(grandTotal) }}</span
                      >
                    </div>

                    <!-- 4. Deposit mode: deposit (pay now) + balance (at studio) -->
                    <template v-if="paymentType === 'deposit'">
                      <!-- Per-slot deposit breakdown (single mode multi-slot) -->
                      <div
                        v-if="singleModeDepositPerSlot.length > 1"
                        class="space-y-1.5 rounded-lg bg-gray-50 px-3 py-3"
                      >
                        <p
                          class="text-xs font-medium text-gray-500"
                        >
                          {{ t("depositPerSessionBreakdown") }}
                        </p>
                        <div
                          v-for="(dep, idx) in singleModeDepositPerSlot"
                          :key="idx"
                          class="flex justify-between text-sm"
                        >
                          <span class="text-gray-600">
                            {{ t("sessionNumber", { n: idx + 1 }) }}
                            <span class="text-gray-400 text-xs">
                              ({{
                                (confirmedSlots.length > 0
                                  ? confirmedSlots
                                  : selectedSlots)[idx]?.start
                              }}-{{
                                (confirmedSlots.length > 0
                                  ? confirmedSlots
                                  : selectedSlots)[idx]?.end
                              }})
                            </span>
                          </span>
                          <span class="font-medium text-gray-700">
                            RM{{ formatPriceWhole(dep) }}
                          </span>
                        </div>
                        <div
                          class="flex justify-between text-sm pt-1.5 border-t border-gray-200 mt-1.5"
                        >
                          <span class="text-gray-600 font-medium">{{
                            t("depositPayNow")
                          }}</span>
                          <span class="font-medium text-gray-900">
                            RM{{ formatPriceWhole(effectiveDepositAmount) }}
                          </span>
                        </div>
                      </div>
                      <template v-else>
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600">{{
                            t("depositPayNow")
                          }}</span>
                          <span class="font-medium text-gray-900"
                            >RM{{
                              formatPriceWhole(effectiveDepositAmount)
                            }}</span
                          >
                        </div>
                      </template>
                      <p
                        class="text-xs text-gray-500 -mt-0.5 pl-0 pr-2 text-right"
                      >
                        {{
                          t(depositExplanation.key, depositExplanation.params)
                        }}
                        <template
                          v-if="
                            depositAmount > 0 &&
                            effectiveDepositAmount < depositAmount
                          "
                        >
                          · {{ t("depositDiscountNote") }}
                        </template>
                      </p>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">{{
                          t("balancePayAtStudio")
                        }}</span>
                        <span class="font-medium text-gray-700"
                          >RM{{ formatPriceWhole(effectiveBalance) }}</span
                        >
                      </div>
                    </template>

                    <!-- 5. Transaction fee (on_top) -->
                    <div
                      v-if="chipFeeToAdd > 0"
                      class="flex justify-between text-sm"
                    >
                      <span class="text-gray-600">{{ t("chipFee") }}</span>
                      <span class="font-medium text-gray-900">RM1.00</span>
                    </div>

                    <div class="border-t border-gray-200 pt-3 mt-1">
                      <!-- Amount to pay now - highlighted -->
                      <div>
                        <div class="flex justify-between items-center">
                          <span
                            class="text-base font-medium text-gray-900"
                          >
                            {{ t("amountToPay") }}
                          </span>
                          <span class="text-xl font-semibold tabular-nums text-gray-900">
                            RM{{ formatPriceWhole(amountToPayNow) }}
                          </span>
                        </div>
                        <p class="mt-1 text-xs leading-relaxed text-gray-500">
                          {{
                            paymentType === "deposit"
                              ? t("amountToPayExplanation")
                              : t("fullPaymentExplanation")
                          }}
                        </p>
                      </div>
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
    <div v-if="!bookingClosed" class="bk-sticky-bar">
      <div class="bk-sticky-bar-inner bk-sticky-bar-inner--wide">
          <div v-if="dockTotal > 0" class="flex min-w-0 flex-col">
            <span class="text-xs text-gray-500">
              {{
                isSummaryStep
                  ? t("amountToPay")
                  : isCartModeEnabled && currentStep === 4
                    ? t("cartTotal") || "Cart Total"
                    : t("estimatedTotal")
              }}
            </span>
            <span
              class="origin-left text-lg font-semibold tabular-nums text-gray-900"
              :class="{ 'bk-dock-amount-pulse': dockAmountPulse }"
            >
              RM{{ formatPriceWhole(dockTotal) }}
            </span>
          </div>

          <div
            class="flex items-center gap-2"
            :class="dockTotal > 0 ? 'shrink-0' : 'flex-1'"
          >
            <!-- Cart Indicator (Bottom Bar) -->
            <div
              v-if="isCartModeEnabled && cartItemCount > 0"
              @click="currentStep = 4"
              class="bk-cta-secondary relative cursor-pointer"
            >
              <ShoppingBag class="h-5 w-5" />
              <span
                class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--bk-card)] bg-[var(--bk-primary)] text-[10px] font-bold text-[var(--bk-primary-fg)]"
                >{{ cartItemCount }}</span
              >
            </div>

            <button
              @click="nextStep"
              :disabled="
                (currentStep === 1 && !selectedTheme) ||
                (currentStep === 2 &&
                  (isMultipleSlotEnabled
                    ? selectedSlots.length === 0
                    : !selectedSlot)) ||
                (isCartModeEnabled &&
                  currentStep === 3 &&
                  (!selectedTheme ||
                    !selectedDate ||
                    (isMultipleSlotEnabled
                      ? selectedSlots.length === 0
                      : !selectedSlot))) ||
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
                  (!selectedTheme ||
                    !selectedDate ||
                    (isMultipleSlotEnabled
                      ? selectedSlots.length === 0
                      : !selectedSlot))) ||
                isProcessingPayment ||
                isCreatingHold
              "
              class="bk-cta-primary"
              :class="dockTotal > 0 ? 'bk-cta-primary--inline' : 'flex-1'"
            >
              <span v-if="isProcessingPayment">{{
                t("processingPayment")
              }}</span>
              <span v-else-if="isCreatingHold">
                {{ t("processing") || "Sila tunggu..." }}
              </span>
              <span v-else-if="isCartModeEnabled && currentStep === 3">{{
                t("addToCart") || "Add to Cart"
              }}</span>
              <span v-else-if="isCartModeEnabled && currentStep === 7">
                {{ t("pay") || "Bayar" }} RM{{
                  formatPriceWhole(amountToPayNow)
                }}
              </span>
              <span v-else-if="!isCartModeEnabled && currentStep === 6">
                {{ t("pay") || "Bayar" }} RM{{
                  formatPriceWhole(amountToPayNow)
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
        class="fixed inset-0 z-[99] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      >
        <div
          class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
        >
          <h3 class="text-lg font-semibold text-gray-900">
            {{ t("restoreYourBooking") }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ t("restoreBookingMessage") }}
          </p>

          <div
            class="my-5 max-h-60 space-y-2 overflow-y-auto rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-700"
          >
            <!-- Cart Items Recovery -->
            <template
              v-if="
                recoveryState.cartItems && recoveryState.cartItems.length > 0
              "
            >
              <div class="mb-2 border-b border-gray-200 pb-2 font-medium text-gray-900">
                {{ t("cartItems") }} ({{ recoveryState.cartItems.length }})
              </div>
              <div
                v-for="(item, idx) in recoveryState.cartItems"
                :key="idx"
                class="mb-2 border-b border-gray-100 pb-2 last:mb-0 last:border-0 last:pb-0"
              >
                <div class="font-medium text-gray-900">
                  {{ item.theme.name }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ formatDate(item.date) }} • {{ item.slot.start }} -
                  {{ item.slot.end }}
                </div>
              </div>
            </template>

            <!-- Single Session Recovery -->
            <template v-else>
              <div v-if="recoveryState.selectedTheme">
                <span class="text-gray-500">{{ t("theme") }}:</span>
                {{ recoveryState.selectedTheme.name }}
              </div>
              <div v-if="recoveryState.selectedDate">
                <span class="text-gray-500">{{ t("date") }}:</span>
                {{ formatDate(recoveryState.selectedDate) }}
              </div>
              <div
                v-if="
                  recoveryState.selectedSlots &&
                  recoveryState.selectedSlots.length > 0
                "
              >
                <span class="text-gray-500">{{ t("time") }}:</span>
                {{
                  recoveryState.selectedSlots
                    .map((s) => `${s.start} - ${s.end}`)
                    .join(", ")
                }}
              </div>
              <div
                v-else-if="
                  recoveryState.confirmedSlots &&
                  recoveryState.confirmedSlots.length > 0
                "
              >
                <span class="text-gray-500">{{ t("time") }}:</span>
                {{
                  recoveryState.confirmedSlots
                    .map((s) => `${s.start} - ${s.end}`)
                    .join(", ")
                }}
              </div>
              <div v-else-if="recoveryState.selectedSlot">
                <span class="text-gray-500">{{ t("time") }}:</span>
                {{ recoveryState.selectedSlot.start }} -
                {{ recoveryState.selectedSlot.end }}
              </div>
            </template>
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              @click="restoreBookingState(recoveryState)"
              :disabled="isRecovering"
              class="bk-cta-primary flex-1 gap-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Loader2 v-if="isRecovering" class="w-4 h-4 animate-spin" />
              {{
                isRecovering ? t("restoring") : `${t("yes")}, ${t("continue")}`
              }}
            </button>
            <button
              @click="dismissRecoveryDialog"
              class="bk-cta-secondary flex-1"
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
      :title="galleryState.title"
      :description="galleryState.description"
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
