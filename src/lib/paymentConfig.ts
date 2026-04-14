/**
 * Payment configuration
 * DEV_MODE = true  → skip payment, go straight to results (for testing)
 * DEV_MODE = false → real IntaSend STK push at KES 139
 */

// Set to false in production
export const DEV_MODE = false;

// Amount in KES — updated to 139
export const PAYMENT_AMOUNT = 139;

export function isPaymentConfirmed(status: string | undefined): boolean {
  return status === 'confirmed' || status === 'completed';
}
