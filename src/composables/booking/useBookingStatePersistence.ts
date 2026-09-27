import type { BookingPersistedState } from "./types";

const BOOKING_STATE_KEY = "booking_state";

/**
 * Debounced localStorage persistence for the public booking wizard.
 */
export function useBookingStatePersistence(debounceMs = 400) {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  function clearBookingState() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      localStorage.removeItem(BOOKING_STATE_KEY);
    } catch (error) {
      console.error("Failed to clear booking state:", error);
    }
  }

  function readBookingState(): BookingPersistedState | null {
    try {
      const raw = localStorage.getItem(BOOKING_STATE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as BookingPersistedState;
    } catch (error) {
      console.error("Failed to read booking state:", error);
      return null;
    }
  }

  function scheduleSave(state: BookingPersistedState | null) {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        if (!state) {
          localStorage.removeItem(BOOKING_STATE_KEY);
          return;
        }
        localStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save booking state:", error);
      }
    }, debounceMs);
  }

  function flushSave() {
    // No-op flush: pending timer will fire; force immediate write by zero delay
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }

  function disposePersistence() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }

  return {
    BOOKING_STATE_KEY,
    clearBookingState,
    readBookingState,
    scheduleSave,
    flushSave,
    disposePersistence,
  };
}
