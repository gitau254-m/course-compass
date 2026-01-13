import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MPesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const callback = await req.json() as MPesaCallback;
    const stkCallback = callback.Body.stkCallback;

    console.log('[M-Pesa Callback] Received callback:', JSON.stringify(stkCallback));

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // Find the payment by CheckoutRequestID (stored in mpesa_receipt during STK push)
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('mpesa_receipt', checkoutRequestId)
      .single();

    if (findError || !payment) {
      console.error('[M-Pesa Callback] Payment not found for CheckoutRequestID:', checkoutRequestId);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the result
    if (resultCode === 0) {
      // Payment successful
      let mpesaReceipt = '';
      
      if (stkCallback.CallbackMetadata?.Item) {
        const receiptItem = stkCallback.CallbackMetadata.Item.find(
          item => item.Name === 'MpesaReceiptNumber'
        );
        if (receiptItem) {
          mpesaReceipt = String(receiptItem.Value);
        }
      }

      console.log('[M-Pesa Callback] Payment successful - Receipt:', mpesaReceipt);

      await supabase
        .from('payments')
        .update({ 
          status: 'confirmed',
          mpesa_receipt: mpesaReceipt || checkoutRequestId,
        })
        .eq('id', payment.id);

    } else {
      // Payment failed
      console.log('[M-Pesa Callback] Payment failed:', resultDesc);

      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
        })
        .eq('id', payment.id);
    }

    // Always respond with success to M-Pesa
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[M-Pesa Callback] Error:', error);
    
    // Still respond with success to prevent M-Pesa retries
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
