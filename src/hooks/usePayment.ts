import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPaymentConfig, shouldUseMockPayment } from '@/lib/paymentConfig';
import { toast } from 'sonner';

interface PaymentResult {
  id: string;
  user_id: string;
  phone: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  mpesa_receipt: string | null;
  created_at: string;
}

interface UsePaymentReturn {
  initiatePayment: (userId: string, phone: string) => Promise<PaymentResult | null>;
  pollPaymentStatus: (paymentId: string) => Promise<PaymentResult | null>;
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
}

export function usePayment(): UsePaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(async (userId: string, phone: string): Promise<PaymentResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getPaymentConfig();

      // Development mode: Create mock payment directly
      if (shouldUseMockPayment()) {
        console.log('[Payment] Development mode - creating mock payment');
        
        const { data: mockPayment, error: mockError } = await supabase
          .from('payments')
          .insert({
            user_id: userId,
            phone: phone || '254712345678',
            amount: config.mockPayment.amount,
            status: config.mockPayment.status,
            mpesa_receipt: config.mockPayment.receipt,
          })
          .select()
          .single();

        if (mockError) {
          console.error('[Payment] Mock payment error:', mockError);
          throw mockError;
        }

        toast.success('Development mode: Payment auto-confirmed');
        
        return {
          ...mockPayment,
          status: mockPayment.status as 'pending' | 'confirmed' | 'failed',
        };
      }

      // Production mode: Call M-Pesa STK Push edge function
      console.log('[Payment] Production mode - initiating M-Pesa STK Push');

      // First create pending payment record
      const { data: pendingPayment, error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          phone: phone,
          amount: 70,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setIsPending(true);

      // Call the M-Pesa STK Push edge function
      const { data: stkResponse, error: stkError } = await supabase.functions.invoke('mpesa-stk', {
        body: {
          paymentId: pendingPayment.id,
          phone: phone,
          amount: 70,
        },
      });

      if (stkError) {
        console.error('[Payment] STK Push error:', stkError);
        // Update payment status to failed
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', pendingPayment.id);
        
        throw new Error('Failed to initiate M-Pesa payment');
      }

      toast.info('STK Push sent to your phone. Please enter your M-Pesa PIN.');
      
      return {
        ...pendingPayment,
        status: pendingPayment.status as 'pending' | 'confirmed' | 'failed',
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollPaymentStatus = useCallback(async (paymentId: string): Promise<PaymentResult | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      if (data.status === 'confirmed') {
        setIsPending(false);
        toast.success('Payment confirmed! Loading your results...');
      } else if (data.status === 'failed') {
        setIsPending(false);
        toast.error('Payment failed. Please try again.');
      }

      return {
        ...data,
        status: data.status as 'pending' | 'confirmed' | 'failed',
      };
    } catch (err) {
      console.error('[Payment] Poll error:', err);
      return null;
    }
  }, []);

  return {
    initiatePayment,
    pollPaymentStatus,
    isLoading,
    isPending,
    error,
  };
}
