// ============================================================
// FILE: src/components/PaymentButton.tsx
// ============================================================
// Reusable payment button that can be dropped anywhere.
// Used by PaymentStep but can also be used on its own.
//
// Usage:
//   <PaymentButton
//     phone="0712345678"
//     amount={99}
//     userId={user.id}
//     onConfirmed={() => navigate('/results')}
//     onFailed={(msg) => toast.error(msg)}
//   />
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DEV_MODE, PAYMENT_AMOUNT } from '@/lib/paymentConfig';
import { initiateSTKPush, pollPaymentStatus } from '@/lib/intasend';

interface PaymentButtonProps {
  phone: string;
  amount?: number;
  userId: string;
  onConfirmed: () => void;
  onFailed?: (message: string) => void;
  className?: string;
}

type BtnState = 'idle' | 'loading' | 'waiting' | 'confirmed' | 'failed';

export function PaymentButton({
  phone,
  amount = PAYMENT_AMOUNT,
  userId,
  onConfirmed,
  onFailed,
  className = '',
}: PaymentButtonProps) {
  const [state, setState] = useState<BtnState>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleClick = async () => {
    if (!phone || !userId) return;

    // DEV MODE: skip payment
    if (DEV_MODE) {
      console.log('[PaymentButton] DEV_MODE: skipping payment');
      onConfirmed();
      return;
    }

    setState('loading');
    setErrMsg('');

    try {
      console.log('[PaymentButton] Initiating payment...');
      const result = await initiateSTKPush(phone, amount, userId);
      setState('waiting');

      const confirmed = await pollPaymentStatus(result.paymentId);

      if (confirmed) {
        setState('confirmed');
        console.log('[PaymentButton] Confirmed! Calling onConfirmed...');
        onConfirmed();
      } else {
        const msg = 'Payment was not completed. Please try again.';
        setState('failed');
        setErrMsg(msg);
        onFailed?.(msg);
      }
    } catch (err: any) {
      const msg = err.message ?? 'Payment failed. Please try again.';
      setState('failed');
      setErrMsg(msg);
      onFailed?.(msg);
    }
  };

  const labels: Record<BtnState, string> = {
    idle: `Pay KES ${amount} with M-Pesa`,
    loading: 'Sending prompt...',
    waiting: 'Waiting for PIN...',
    confirmed: 'Payment Confirmed!',
    failed: 'Try Again',
  };

  return (
    <div className={className}>
      <Button
        onClick={handleClick}
        disabled={state === 'loading' || state === 'waiting' || state === 'confirmed'}
        className={`w-full font-semibold py-3 ${state === 'confirmed'
          ? 'bg-green-600 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
      >
        {(state === 'loading' || state === 'waiting') && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
        )}
        {labels[state]}
      </Button>

      {state === 'waiting' && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Check your phone — enter your M-Pesa PIN to confirm
        </p>
      )}

      {state === 'failed' && errMsg && (
        <p className="text-xs text-center text-destructive mt-2">{errMsg}</p>
      )}
    </div>
  );
}
