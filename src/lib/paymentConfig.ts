// ============================================================
// FILE: src/lib/paymentConfig.ts  <- REPLACE ENTIRE FILE
// ============================================================
//
// DEV_MODE SWITCH (for you as the developer):
//
//   DEV_MODE = true
//     -> Payment step is SKIPPED completely
//     -> You go straight to results (for testing the app)
//
//   DEV_MODE = false
//     -> Real IntaSend STK push is triggered
//     -> User must pay KES 99 before seeing results
//
// Change this ONE line to switch between modes.
// ============================================================

export const DEV_MODE = true;

export const PAYMENT_AMOUNT = 99; // KES

export const PAYMENT_PROVIDER = 'intasend';

export function isPaymentConfirmed(status: string | undefined | null): boolean {
  if (!status) return false;
  return ['completed', 'confirmed', 'paid', 'success'].includes(status);
}