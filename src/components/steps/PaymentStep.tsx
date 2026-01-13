import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Phone, Loader2, Shield, CheckCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { shouldUseMockPayment, getPaymentMode } from '@/lib/paymentConfig';
import { Badge } from '@/components/ui/badge';

export function PaymentStep() {
  const { user, setCurrentStep, setPayment } = useApp();
  const [phone, setPhone] = useState(user?.phone || '');
  const { initiatePayment, pollPaymentStatus, isLoading, isPending } = usePayment();
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const isDevelopment = shouldUseMockPayment();

  const formatPhone = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    
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

  // Poll for payment status in production mode
  useEffect(() => {
    if (!isPending || !currentPaymentId || isDevelopment) return;

    const interval = setInterval(async () => {
      const result = await pollPaymentStatus(currentPaymentId);
      
      if (result && result.status === 'confirmed') {
        setPayment({
          ...result,
          status: result.status,
        });
        setCurrentStep(6);
        clearInterval(interval);
      } else if (result && result.status === 'failed') {
        setCurrentPaymentId(null);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPending, currentPaymentId, isDevelopment, pollPaymentStatus, setPayment, setCurrentStep]);

  const handlePayment = async () => {
    const fullPhone = getFullPhone();
    
    if (!fullPhone && !isDevelopment) {
      return;
    }

    const result = await initiatePayment(user!.id, fullPhone || '254712345678');
    
    if (result) {
      if (result.status === 'confirmed') {
        // Development mode - instant confirmation
        setPayment({
          ...result,
          status: result.status,
        });
        setCurrentStep(6);
      } else {
        // Production mode - wait for callback
        setCurrentPaymentId(result.id);
      }
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
        
        {isDevelopment && (
          <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-600 border-amber-500/30">
            Development Mode - Payments Auto-Confirmed
          </Badge>
        )}
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
                    disabled={isDevelopment}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isDevelopment 
                    ? 'Phone number not required in development mode'
                    : 'Enter the number registered with M-Pesa'}
                </p>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isLoading || (!getFullPhone() && !isDevelopment)}
                className="w-full h-12 bg-success hover:bg-success/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isDevelopment ? 'Processing...' : 'Initiating...'}
                  </>
                ) : (
                  <>
                    {isDevelopment ? 'Continue (Dev Mode)' : 'Pay with M-Pesa'}
                    {isDevelopment ? <CheckCircle className="w-4 h-4 ml-2" /> : <Phone className="w-4 h-4 ml-2" />}
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
          onClick={() => setCurrentStep(4)}
          disabled={isPending}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Payment mode indicator for debugging */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Payment Mode: <span className="font-mono">{getPaymentMode()}</span>
        </p>
      </div>
    </div>
  );
}
