// ============================================================
// FILE: src/lib/intasend.ts
// ============================================================
// This file handles all communication with our Supabase
// edge function (intasend-stk) which then calls IntaSend API.
//
// HOW IT WORKS:
// 1. User enters phone number and clicks Pay
// 2. We call our edge function -> IntaSend -> sends STK push to phone
// 3. User sees M-Pesa PIN prompt on their phone
// 4. User enters PIN -> IntaSend confirms -> webhook updates our DB
// 5. We poll the DB every 3 seconds to detect the confirmation
// ============================================================

import { supabase } from '@/integrations/supabase/client';

export interface IntaSendPaymentResult {
  paymentId: string;    // our DB row id
  invoiceId: string;    // IntaSend's invoice id
  message: string;
}

// ── Initiate STK Push ─────────────────────────────────────────
// Calls our Supabase edge function which calls IntaSend API
export async function initiateSTKPush(
  phone: string,
  amount: number,
  userId: string
): Promise<IntaSendPaymentResult> {
  console.log('[intasend] Initiating STK push:', { phone, amount, userId });

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intasend-stk`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ phone, amount, userId }),
    }
  );

  const data = await res.json();
  console.log('[intasend] STK response:', data);

  if (!res.ok || data.error) {
    throw new Error(data.error ?? 'Failed to send M-Pesa prompt. Please try again.');
  }

  return {
    paymentId: data.paymentId,
    invoiceId: data.invoiceId,
    message: data.message,
  };
}

// ── Poll DB for payment confirmation ─────────────────────────
// Checks our payments table every 3 seconds
// Returns true when status = 'completed'
// Returns false when status = 'failed'
// Throws after timeout
export async function pollPaymentStatus(
  paymentId: string,
  onStatusChange?: (status: string) => void,
  timeoutMs = 180000   // 3 minutes
): Promise<boolean> {
  console.log('[intasend] Polling payment:', paymentId);

  const startTime = Date.now();
  const intervalMs = 3000;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        // Check if timed out
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          console.warn('[intasend] Payment polling timed out');
          reject(new Error('Payment timed out after 3 minutes. If you paid, contact support.'));
          return;
        }

        // Query our payments table
        const { data, error } = await supabase
          .from('payments')
          .select('status, mpesa_receipt, intasend_state')
          .eq('id', paymentId)
          .maybeSingle();

        if (error) {
          console.error('[intasend] Polling error:', error);
          return; // keep polling
        }

        const status = data?.status ?? 'pending';
        console.log('[intasend] Poll result:', status, '| IntaSend state:', data?.intasend_state);

        onStatusChange?.(status);

        if (['completed', 'confirmed', 'paid', 'success'].includes(status)) {
          clearInterval(interval);
          console.log('[intasend] Payment confirmed! Receipt:', data?.mpesa_receipt);
          resolve(true);
        } else if (status === 'failed') {
          clearInterval(interval);
          console.log('[intasend] Payment failed');
          resolve(false);
        }
        // else: still pending, keep polling

      } catch (err) {
        console.error('[intasend] Polling exception:', err);
        // don't stop polling on network errors
      }
    }, intervalMs);
  });
}