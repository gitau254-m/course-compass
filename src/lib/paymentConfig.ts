/**
 * Payment Configuration
 * Handles dev/prod mode switching for M-Pesa payments
 */

export type PaymentMode = 'development' | 'production';

export interface PaymentConfig {
  mode: PaymentMode;
  isDevelopment: boolean;
  isProduction: boolean;
  mockPayment: {
    amount: number;
    receipt: string;
    status: 'confirmed';
  };
}

// Get payment mode from environment variable
export function getPaymentMode(): PaymentMode {
  const mode = import.meta.env.VITE_PAYMENT_MODE;
  if (mode === 'production') {
    return 'production';
  }
  // Default to development for safety
  return 'development';
}

export function getPaymentConfig(): PaymentConfig {
  const mode = getPaymentMode();
  
  return {
    mode,
    isDevelopment: mode === 'development',
    isProduction: mode === 'production',
    mockPayment: {
      amount: 70,
      receipt: `DEV-MOCK-${Date.now().toString(36).toUpperCase()}`,
      status: 'confirmed',
    },
  };
}

// Check if we should use mock payments
export function shouldUseMockPayment(): boolean {
  return getPaymentMode() === 'development';
}

// Validate that payment is confirmed before showing results
export function isPaymentConfirmed(status: string | undefined): boolean {
  return status === 'confirmed';
}
