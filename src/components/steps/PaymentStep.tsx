import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Phone, CheckCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function PaymentStep() {
  const { user, setCurrentStep, setPayment } = useApp();
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const formatPhone = (value: string) => {
    // Remove non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Handle Kenyan phone formats
    if (cleaned.startsWith('254')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned.substring(0, 9);
  };

  const getFullPhone = () => {
    const cleaned = formatPhone(phone);
    if (cleaned.length === 9) {
      return `254${cleaned}`;
    }
    return null;
  };

  const handlePayment = async () => {
    const fullPhone = getFullPhone();
    
    if (!fullPhone) {
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Create pending payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user!.id,
          phone: fullPhone,
          amount: 70,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      setIsPending(true);
      toast.info('STK Push sent to your phone. Please enter your M-Pesa PIN.');

      // Simulate STK push - in production, this would call an edge function
      // that integrates with M-Pesa Daraja API
      setTimeout(async () => {
        try {
          // Simulate payment confirmation
          const { data: confirmedPayment, error: updateError } = await supabase
            .from('payments')
            .update({ 
              status: 'confirmed' as const,
              mpesa_receipt: `QK${Date.now().toString(36).toUpperCase()}`,
            })
            .eq('id', paymentData.id)
            .select()
            .single();

          if (confirmedPayment) {
            setPayment({ ...confirmedPayment, status: confirmedPayment.status as 'pending' | 'confirmed' | 'failed' });

          if (updateError) throw updateError;

          toast.success('Payment confirmed! Loading your results...');
          setCurrentStep(5);
        } catch (error) {
          console.error('Payment confirmation error:', error);
          toast.error('Payment verification failed. Please try again.');
          setIsPending(false);
        }
      }, 3000);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPayment = async () => {
    // For demo purposes - remove in production
    try {
      const { data: paymentData, error } = await supabase
        .from('payments')
        .insert({
          user_id: user!.id,
          phone: '254712345678',
          amount: 70,
          status: 'confirmed',
          mpesa_receipt: `DEMO${Date.now().toString(36).toUpperCase()}`,
        })
        .select()
        .single();

      if (error) throw error;

      setPayment(paymentData);
      toast.success('Demo mode: Proceeding to results...');
      setCurrentStep(5);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="fade-in max-w-md mx-auto px-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <CreditCard className="w-7 h-7 text-success" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Unlock Your Results
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Pay KSH 70 via M-Pesa to view your course matches
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        {!isPending ? (
          <>
            <div className="bg-gradient-primary rounded-xl p-4 text-primary-foreground mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">Amount to Pay</span>
                <span className="text-2xl font-bold">KSH 70</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mpesa-phone" className="text-sm font-medium">
                  M-Pesa Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="mpesa-phone"
                    type="tel"
                    placeholder="0712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the number registered with M-Pesa
                </p>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isLoading || !getFullPhone()}
                className="w-full h-12 bg-success hover:bg-success/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    Pay with M-Pesa
                    <Phone className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-gentle">
              <Loader2 className="w-10 h-10 text-success animate-spin" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Waiting for Payment</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Check your phone and enter your M-Pesa PIN to complete payment
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              Secure M-Pesa Transaction
            </div>
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
        <Shield className="w-4 h-4" />
        Your payment is secure and encrypted
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(3)}
          disabled={isPending}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Demo skip button - remove in production */}
      <div className="mt-6 text-center">
        <button
          onClick={handleSkipPayment}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Demo: Skip payment
        </button>
      </div>
    </div>
  );
}