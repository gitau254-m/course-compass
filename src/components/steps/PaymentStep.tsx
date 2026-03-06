// ============================================================
// FILE: src/components/steps/PaymentStep.tsx  <- REPLACE
// ============================================================
// Uses IntaSend for STK push instead of Daraja/M-Pesa direct.
// DEV_MODE = true  -> skips payment, goes straight to results
// DEV_MODE = false -> triggers real IntaSend STK push
// ============================================================

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEV_MODE, PAYMENT_AMOUNT, isPaymentConfirmed } from '@/lib/paymentConfig';
import { initiateSTKPush, pollPaymentStatus } from '@/lib/intasend';

type Status = 'idle' | 'loading' | 'waiting' | 'confirmed' | 'failed';

export function PaymentStep() {
  const { user, setPayment, setCurrentStep } = useApp();

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // DEV MODE: skip payment entirely - go straight to results
  useEffect(() => {
    if (DEV_MODE) {
      console.log('[PaymentStep] DEV_MODE=true, skipping payment');
      setCurrentStep(6);
    }
  }, []);

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/\s/g, '');
    const valid = /^(?:0[17]\d{8}|254[17]\d{8}|\+254[17]\d{8})$/.test(cleaned);
    setPhoneError(valid ? '' : 'Enter a valid Safaricom number e.g. 0712 345 678');
    return valid;
  };

  const handlePay = async () => {
    if (!validatePhone(phone)) return;
    if (!user?.id) {
      setError('Session expired. Please go back to step 1.');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // Step 1: Send STK push via IntaSend
      console.log('[PaymentStep] Starting IntaSend STK push...');
      const result = await initiateSTKPush(phone.trim(), PAYMENT_AMOUNT, user.id);
      console.log('[PaymentStep] STK sent. PaymentID:', result.paymentId);

      // Step 2: Show "waiting for PIN" UI
      setStatus('waiting');

      // Step 3: Poll database until payment confirmed or failed
      const confirmed = await pollPaymentStatus(
        result.paymentId,
        (s) => console.log('[PaymentStep] Status update:', s)
      );

      if (confirmed) {
        // Step 4a: Payment confirmed - fetch full payment record then go to results
        console.log('[PaymentStep] Payment confirmed!');
        const { data: paymentRow } = await (await import('@/integrations/supabase/client'))
          .supabase
          .from('payments')
          .select('*')
          .eq('id', result.paymentId)
          .maybeSingle();

        setPayment(paymentRow);
        setStatus('confirmed');
      } else {
        // Step 4b: Payment failed
        console.log('[PaymentStep] Payment failed');
        setStatus('failed');
        setError('Payment was not completed. Please try again.');
      }

    } catch (err: any) {
      console.error('[PaymentStep] Error:', err);
      setStatus('failed');
      setError(err.message ?? 'Something went wrong. Please try again.');
    }
  };

  // ── Payment confirmed screen ──────────────────────────────
  if (status === 'confirmed') {
    return (
      <div className="fade-in max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Confirmed!</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          KES {PAYMENT_AMOUNT} received via M-Pesa. Your results are ready.
        </p>
        <Button
          onClick={() => setCurrentStep(6)}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          View My Results
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-md mx-auto px-4 py-6">
      <div className="bg-card rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">M</span>
          </div>
          <h2 className="text-2xl font-bold">Unlock Your Results</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Pay KES {PAYMENT_AMOUNT} via M-Pesa for your personalised course recommendations
          </p>
        </div>

        {/* What user gets */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 mb-6 text-sm space-y-1.5 text-blue-700 dark:text-blue-300">
          <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">You will unlock:</p>
          <p>All eligible degree programmes</p>
          <p>University cut-off comparison (2024 data)</p>
          <p>Personalised interest-matched recommendations</p>
        </div>

        {/* Form: idle or failed */}
        {(status === 'idle' || status === 'failed') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  if (phoneError) validatePhone(e.target.value);
                }}
                placeholder="e.g. 0712 345 678"
                className={cn(
                  'w-full border rounded-xl px-4 py-3 text-sm bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  phoneError ? 'border-destructive' : 'border-border'
                )}
              />
              {phoneError && (
                <p className="text-destructive text-xs mt-1">{phoneError}</p>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between bg-muted rounded-xl p-3 text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold">KES {PAYMENT_AMOUNT}</span>
            </div>

            <Button
              onClick={handlePay}
              disabled={!phone}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
            >
              Pay with M-Pesa
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You will receive an M-Pesa PIN prompt on your phone. Enter your PIN to confirm.
            </p>
          </div>
        )}

        {/* Loading: sending STK */}
        {status === 'loading' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-semibold">Sending M-Pesa prompt...</p>
            <p className="text-muted-foreground text-sm">Please wait</p>
          </div>
        )}

        {/* Waiting: STK sent, waiting for PIN */}
        {status === 'waiting' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-semibold text-lg">Check Your Phone</p>
            <p className="text-muted-foreground text-sm">
              M-Pesa PIN prompt sent to <strong>{phone}</strong>.<br />
              Enter your PIN to complete payment.
            </p>
            <p className="text-xs text-muted-foreground">
              This page updates automatically once confirmed.
            </p>
            <button
              onClick={() => { setStatus('idle'); setError(null); }}
              className="text-sm text-destructive underline"
            >
              Cancel / use a different number
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(4)}
          className="w-full"
          disabled={status === 'loading' || status === 'waiting'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cluster Summary
        </Button>
      </div>
    </div>
  );
}
