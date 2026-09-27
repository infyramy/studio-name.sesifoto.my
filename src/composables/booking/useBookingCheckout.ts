import type { Router } from "vue-router";
import { api } from "@/services/api";
import type { BatchBookingRequest, Booking } from "@/types";

export type CheckoutPaymentType = "full" | "deposit";

export type CheckoutResult =
  | { status: "chip"; checkoutUrl: string }
  | { status: "skipped"; bookingNumbers: string }
  | { status: "unavailable" }
  | { status: "error"; error: unknown };

/**
 * Unified public checkout: always batch-create, then initiate payment.
 * Replaces duplicated cart / single / multi-slot submit paths.
 */
export async function submitPublicBookingCheckout(options: {
  batchRequest: BatchBookingRequest;
  paymentType: CheckoutPaymentType;
  /** Optional tamper-check amount in sen (server still computes charge). */
  amount?: number;
  clearBookingState: () => void;
}): Promise<{
  result: CheckoutResult;
  createdBookings: Booking[];
}> {
  const { batchRequest, paymentType, amount, clearBookingState } = options;

  const createdBookings = await api.createBatchBooking(batchRequest);
  if (!createdBookings.length) {
    throw new Error("No bookings created");
  }

  const primaryBookingId = createdBookings[0].id;
  const additionalBookingIds = createdBookings.slice(1).map((b) => b.id);

  const paymentResult = await api.initiatePayment(
    primaryBookingId,
    paymentType,
    additionalBookingIds.length > 0 ? additionalBookingIds : undefined,
    amount,
  );

  clearBookingState();

  if (paymentResult.paymentSkipped) {
    const bookingNumbers = createdBookings
      .map((b) => b.booking_number)
      .join(",");
    return {
      createdBookings,
      result: { status: "skipped", bookingNumbers },
    };
  }

  if (paymentResult.checkoutUrl) {
    return {
      createdBookings,
      result: { status: "chip", checkoutUrl: paymentResult.checkoutUrl },
    };
  }

  return {
    createdBookings,
    result: { status: "unavailable" },
  };
}

export function applyCheckoutResult(
  router: Router,
  result: CheckoutResult,
): void {
  if (result.status === "skipped") {
    router.push(`/success/${result.bookingNumbers}`);
    return;
  }
  if (result.status === "chip") {
    window.location.href = result.checkoutUrl;
    return;
  }
  router.push("/payment/failed?error=payment_unavailable");
}

export function isPaymentUnavailableError(error: any): boolean {
  return (
    error?.message?.includes("Cannot proceed with payment") ||
    error?.data?.message?.includes("Cannot proceed with payment")
  );
}

export function isSlotUnavailableError(error: any): boolean {
  const errorMessage = error?.data?.message || error?.message || "";
  return (
    errorMessage.includes("Selected time slot is not available") ||
    errorMessage.includes("Slot not available") ||
    errorMessage.includes("no longer available")
  );
}
