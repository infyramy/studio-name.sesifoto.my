import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CartItem, SelectedAddon, Booking } from '@/types';

export const useBookingStore = defineStore('booking', () => {
  // State
  const currentBooking = ref<CartItem | null>(null);
  const completedBooking = ref<Booking | null>(null);
  const cartHoldExpiresAt = ref<Date | null>(null);

  // Cart state (for cart mode)
  const cartItems = ref<CartItem[]>([]);
  const cartModeEnabled = ref(false);

  // Computed
  const cartCount = computed(() => cartItems.value.length);

  const cartTotal = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.total_amount, 0);
  });

  const cartDepositTotal = computed(() => {
    return Math.round(cartTotal.value * 0.5);
  });

  // Actions
  function startBooking(item: CartItem) {
    currentBooking.value = item;
    // Set cart hold expiry (10 minutes from now)
    cartHoldExpiresAt.value = new Date(Date.now() + 10 * 60 * 1000);
  }

  function updatePax(paxCount: number) {
    if (!currentBooking.value) return;
    currentBooking.value.pax_count = paxCount;
    // Recalculate pricing
    recalculatePricing();
  }

  function toggleAddon(addon: SelectedAddon) {
    if (!currentBooking.value) return;

    const existingIndex = currentBooking.value.selected_addons.findIndex(
      (a) => a.addon_id === addon.addon_id
    );

    if (existingIndex >= 0) {
      // Remove addon
      currentBooking.value.selected_addons.splice(existingIndex, 1);
    } else {
      // Add addon
      currentBooking.value.selected_addons.push(addon);
    }

    recalculatePricing();
  }

  function recalculatePricing() {
    if (!currentBooking.value) return;

    // Calculate extra pax fee
    const theme = currentBooking.value.theme;
    const extraPax = Math.max(0, currentBooking.value.pax_count - theme.base_pax);
    currentBooking.value.extra_pax_fee = extraPax * theme.extra_pax_price;

    // Calculate addons total (would need to fetch addon prices from store)
    // For now, simplified
    currentBooking.value.addons_total = 0;

    // Calculate total
    currentBooking.value.total_amount =
      currentBooking.value.base_price +
      currentBooking.value.extra_pax_fee +
      currentBooking.value.addons_total +
      currentBooking.value.special_pricing_applied;
  }

  function setCompletedBooking(booking: Booking) {
    completedBooking.value = booking;
  }

  function clearBooking() {
    currentBooking.value = null;
    cartHoldExpiresAt.value = null;
  }

  function clearCompletedBooking() {
    completedBooking.value = null;
  }

  // Cart functions
  function enableCartMode(enabled: boolean) {
    cartModeEnabled.value = enabled;
  }

  function addToCart(item: CartItem) {
    cartItems.value.push({ ...item });
  }

  function removeFromCart(index: number) {
    if (index >= 0 && index < cartItems.value.length) {
      cartItems.value.splice(index, 1);
    }
  }

  function updateCartItem(index: number, item: CartItem) {
    if (index >= 0 && index < cartItems.value.length) {
      cartItems.value[index] = { ...item };
    }
  }

  function clearCart() {
    cartItems.value = [];
  }

  function getCartItem(index: number): CartItem | null {
    return cartItems.value[index] || null;
  }

  return {
    // State
    currentBooking,
    completedBooking,
    cartHoldExpiresAt,
    cartItems,
    cartModeEnabled,

    // Computed
    cartCount,
    cartTotal,
    cartDepositTotal,

    // Actions
    startBooking,
    updatePax,
    toggleAddon,
    setCompletedBooking,
    clearBooking,
    clearCompletedBooking,

    // Cart actions
    enableCartMode,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartItem,
  };
});
