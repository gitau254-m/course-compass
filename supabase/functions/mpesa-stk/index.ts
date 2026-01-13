import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface STKPushRequest {
  paymentId: string;
  phone: string;
  amount: number;
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

    const { paymentId, phone, amount } = await req.json() as STKPushRequest;

    console.log(`[M-Pesa STK] Initiating payment - ID: ${paymentId}, Phone: ${phone}, Amount: ${amount}`);

    // Validate inputs
    if (!paymentId || !phone || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: paymentId, phone, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (ensure it starts with 254)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Check if we're in mock mode (for development without real M-Pesa credentials)
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      console.log('[M-Pesa STK] No M-Pesa credentials found - using mock mode');
      
      // Simulate STK push delay then auto-confirm
      setTimeout(async () => {
        const mockReceipt = `MOCK${Date.now().toString(36).toUpperCase()}`;
        
        await supabase
          .from('payments')
          .update({ 
            status: 'confirmed',
            mpesa_receipt: mockReceipt,
          })
          .eq('id', paymentId);
        
        console.log(`[M-Pesa STK] Mock payment confirmed - Receipt: ${mockReceipt}`);
      }, 3000);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'STK Push initiated (mock mode)',
          paymentId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Production M-Pesa Integration
    // Step 1: Get OAuth token
    const authUrl = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const authHeader = btoa(`${consumerKey}:${consumerSecret}`);

    const tokenResponse = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
    });

    if (!tokenResponse.ok) {
      console.error('[M-Pesa STK] Failed to get OAuth token');
      throw new Error('Failed to authenticate with M-Pesa');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Initiate STK Push
    const shortCode = Deno.env.get('MPESA_SHORTCODE') ?? '';
    const passkey = Deno.env.get('MPESA_PASSKEY') ?? '';
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL') ?? '';

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = btoa(`${shortCode}${passkey}${timestamp}`);

    const stkPushPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: paymentId.substring(0, 12),
      TransactionDesc: 'KCSE Course Checker Payment',
    };

    console.log('[M-Pesa STK] Sending STK Push request');

    const stkResponse = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode !== '0') {
      console.error('[M-Pesa STK] STK Push failed:', stkData);
      
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);
      
      throw new Error(stkData.errorMessage || 'STK Push failed');
    }

    console.log('[M-Pesa STK] STK Push successful:', stkData.CheckoutRequestID);

    // Store the CheckoutRequestID for later verification
    await supabase
      .from('payments')
      .update({ 
        mpesa_receipt: stkData.CheckoutRequestID,
      })
      .eq('id', paymentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'STK Push initiated successfully',
        checkoutRequestId: stkData.CheckoutRequestID,
        paymentId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[M-Pesa STK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
