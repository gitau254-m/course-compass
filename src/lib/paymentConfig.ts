// ============================================================
// FILE: src/lib/paymentConfig.ts
// ============================================================
//
// DEV_MODE = true  → Payment is SKIPPED, auto-confirmed (for testing)
// DEV_MODE = false → Real IntaSend M-Pesa STK Push (live payments)
//
// Change this ONE line when going live:
// ============================================================

export const DEV_MODE = true; // ← true = test mode | false = live payments

export const PAYMENT_AMOUNT = 99; // KES

export const PAYMENT_PROVIDER = 'intasend';

// ── These are used by usePayment.ts and PaymentStep.tsx ──────────────────

/** Returns true when in dev/test mode (no real payment) */
export function shouldUseMockPayment(): boolean {
  return DEV_MODE;
}

/** Returns 'development' or 'production' string */
export function getPaymentMode(): string {
  return DEV_MODE ? 'development' : 'production';
}

/** Full payment config object used by usePayment hook */
export function getPaymentConfig() {
  return {
    amount: PAYMENT_AMOUNT,
    currency: 'KES',
    description: 'KCSE Course Checker – Unlock Results',
    mockPayment: {
      amount: PAYMENT_AMOUNT,
      status: 'confirmed' as const,
      receipt: 'DEV' + Date.now().toString(36).toUpperCase(),
    },
  };
}

/** Check if a payment status string means "paid" */
export function isPaymentConfirmed(status: string | undefined | null): boolean {
  if (!status) return false;
  return ['completed', 'confirmed', 'paid', 'success'].includes(status.toLowerCase());
}