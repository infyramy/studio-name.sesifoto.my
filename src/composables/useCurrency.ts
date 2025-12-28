/**
 * Currency formatting utility for converting cents to display format
 * Backend returns all prices in cents, this converts to RM format
 */

/**
 * Format cents to RM display string
 * @param cents - Amount in cents from backend
 * @returns Formatted price string (e.g., "150.00")
 */
export const formatPrice = (cents: number): string => {
  if (typeof cents !== "number" || isNaN(cents)) {
    return "0.00";
  }
  const amount = cents / 100;
  return amount.toFixed(2);
};

/**
 * Format cents to RM display string without decimal places (for whole numbers)
 * @param cents - Amount in cents from backend
 * @returns Formatted price string (e.g., "150")
 */
export const formatPriceWhole = (cents: number): string => {
  if (typeof cents !== "number" || isNaN(cents)) {
    return "0";
  }
  const amount = cents / 100;
  // Only show decimals if needed
  return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
};

/**
 * Convert cents to number for calculations
 * @param cents - Amount in cents from backend
 * @returns Amount as decimal number
 */
export const centsToAmount = (cents: number): number => {
  if (typeof cents !== "number" || isNaN(cents)) {
    return 0;
  }
  return cents / 100;
};

/**
 * Vue composable for currency formatting
 */
export const useCurrency = () => {
  return {
    formatPrice,
    formatPriceWhole,
    centsToAmount,
  };
};
