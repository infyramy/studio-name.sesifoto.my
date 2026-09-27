import { ref } from "vue";
import { api } from "@/services/api";
import type { CartHold } from "./types";

export function useBookingHolds(options: {
  getSessionId: () => string;
  getStudioId: () => string;
}) {
  const { getSessionId, getStudioId } = options;

  const holdExpiresAt = ref<Date | null>(null);
  const holdCountdown = ref("10:00");
  const unifiedCartHoldExpiresAt = ref<Date | null>(null);
  const unifiedCartHoldCountdown = ref("");

  let holdCountdownInterval: ReturnType<typeof setInterval> | null = null;
  let unifiedCartHoldTimer: ReturnType<typeof setInterval> | null = null;

  async function createCartHold(slotData: {
    themeId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<CartHold> {
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
        studioId: getStudioId(),
        themeId: response.themeId,
        date: response.date,
        startTime: response.startTime,
        endTime: response.endTime,
        expiresAt: response.expiresAt,
        createdAt: response.createdAt,
      };
    } catch (error: any) {
      if (
        error?.data?.message === "SLOT_NO_LONGER_AVAILABLE" ||
        error?.message === "SLOT_NO_LONGER_AVAILABLE" ||
        error?.statusCode === 400
      ) {
        throw new Error("SLOT_NO_LONGER_AVAILABLE");
      }
      if (
        error?.data?.message === "SLOT_TIME_HAS_PASSED" ||
        error?.message === "SLOT_TIME_HAS_PASSED"
      ) {
        throw new Error("SLOT_TIME_HAS_PASSED");
      }
      throw error;
    }
  }

  async function createBatchCartHold(
    slotsData: Array<{
      themeId: string;
      date: string;
      startTime: string;
      endTime: string;
    }>,
  ): Promise<CartHold[]> {
    try {
      const responses = await api.createBatchSlotHold(
        slotsData.map((s) => ({
          themeId: s.themeId,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        getSessionId(),
      );

      return responses.map((response) => ({
        holdId: response.holdId,
        sessionId: response.sessionId,
        studioId: getStudioId(),
        themeId: response.themeId,
        date: response.date,
        startTime: response.startTime,
        endTime: response.endTime,
        expiresAt: response.expiresAt,
        createdAt: response.createdAt,
      }));
    } catch (error: any) {
      if (
        error?.data?.message === "SLOT_NO_LONGER_AVAILABLE" ||
        error?.message === "SLOT_NO_LONGER_AVAILABLE" ||
        error?.statusCode === 400
      ) {
        throw new Error("SLOT_NO_LONGER_AVAILABLE");
      }
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
    }
  }

  async function getActiveHolds(): Promise<CartHold[]> {
    try {
      const holds = await api.getSessionHolds(getSessionId());
      return holds.map((h) => ({
        holdId: h.holdId,
        sessionId: h.sessionId,
        studioId: getStudioId(),
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

  function stopHoldCountdown() {
    if (holdCountdownInterval) {
      clearInterval(holdCountdownInterval);
      holdCountdownInterval = null;
    }
  }

  function startHoldCountdown(onExpire: () => void | Promise<void>) {
    stopHoldCountdown();

    holdCountdownInterval = setInterval(() => {
      if (!holdExpiresAt.value) {
        stopHoldCountdown();
        return;
      }

      const now = new Date();
      const timeLeft = holdExpiresAt.value.getTime() - now.getTime();

      if (timeLeft <= 0) {
        stopHoldCountdown();
        void onExpire();
      } else {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        holdCountdown.value = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      }
    }, 1000);
  }

  function stopUnifiedCartHoldTimer() {
    if (unifiedCartHoldTimer) {
      clearInterval(unifiedCartHoldTimer);
      unifiedCartHoldTimer = null;
    }
  }

  function startUnifiedCartHoldTimer(
    expiresAt: Date,
    onExpire: () => void | Promise<void>,
    onTick?: (expiresAt: Date) => void,
  ) {
    stopUnifiedCartHoldTimer();
    unifiedCartHoldExpiresAt.value = expiresAt;

    unifiedCartHoldTimer = setInterval(() => {
      if (!unifiedCartHoldExpiresAt.value) {
        stopUnifiedCartHoldTimer();
        return;
      }

      const now = new Date();
      const timeLeft = unifiedCartHoldExpiresAt.value.getTime() - now.getTime();

      if (timeLeft <= 0) {
        stopUnifiedCartHoldTimer();
        void onExpire();
      } else {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        unifiedCartHoldCountdown.value = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
        onTick?.(unifiedCartHoldExpiresAt.value);
      }
    }, 1000);
  }

  function disposeHoldTimers() {
    stopHoldCountdown();
    stopUnifiedCartHoldTimer();
  }

  return {
    holdExpiresAt,
    holdCountdown,
    unifiedCartHoldExpiresAt,
    unifiedCartHoldCountdown,
    createCartHold,
    createBatchCartHold,
    releaseCartHold,
    getActiveHolds,
    startHoldCountdown,
    stopHoldCountdown,
    startUnifiedCartHoldTimer,
    stopUnifiedCartHoldTimer,
    disposeHoldTimers,
  };
}
