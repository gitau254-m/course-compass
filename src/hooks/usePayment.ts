// ============================================================
// FILE: src/hooks/usePayment.ts
// PASTE THIS ENTIRE FILE — replaces any existing usePayment
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Adjust to your supabase client import if you have one ──
// import { supabase } from "@/lib/supabase";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

export type PaymentStatus = "idle" | "pending" | "completed" | "failed";

export interface UsePaymentReturn {
  status: PaymentStatus;
  paymentId: string | null;
  error: string | null;
  initiatePayment: (phone: string, amount: number, userId: string) => Promise<void>;
  reset: () => void;
}

export function usePayment(): UsePaymentReturn {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Stop polling helper ────────────────────────────────────
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // ── Start polling: checks payments table every 3 seconds ───
  const startPolling = (pId: string) => {
    stopPolling();
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 3 min timeout (60 × 3s)

    pollRef.current = setInterval(async () => {
      attempts++;

      try {
        const { data } = await supabase
          .from("payments")
          .select("status")
          .eq("id", pId)
          .single();

        if (data?.status === "completed") {
          setStatus("completed");
          stopPolling();
        } else if (data?.status === "failed") {
          setStatus("failed");
          setError("Payment was cancelled or failed. Please try again.");
          stopPolling();
        } else if (attempts >= MAX_ATTEMPTS) {
          setStatus("failed");
          setError("Payment timed out after 3 minutes. Please try again.");
          stopPolling();
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Keep polling — network hiccup
      }
    }, 3000);
  };

  // ── Main function: trigger STK Push ────────────────────────
  const initiatePayment = async (
    phone: string,
    amount: number,
    userId: string
  ) => {
    setStatus("pending");
    setError(null);
    setPaymentId(null);

    try {
      // Get the user's Supabase auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setStatus("failed");
        setError("You must be logged in to make a payment.");
        return;
      }

      // Call the mpesa-stk edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ phone, amount, userId }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        setStatus("failed");
        setError(result.error || "Failed to initiate M-Pesa payment. Please try again.");
        return;
      }

      // Store paymentId and start polling
      setPaymentId(result.paymentId);
      startPolling(result.paymentId);
    } catch (err: any) {
      setStatus("failed");
      setError("Network error. Please check your connection and try again.");
      console.error("Payment initiation error:", err);
    }
  };

  const reset = () => {
    stopPolling();
    setStatus("idle");
    setPaymentId(null);
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  return { status, paymentId, error, initiatePayment, reset };
}// ============================================================
// FILE: src/hooks/usePayment.ts   ← REPLACE your existing file
// ============================================================

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase"; // shared client

export type PaymentStatus = "idle" | "pending" | "completed" | "failed";

export interface UsePaymentReturn {
  status: PaymentStatus;
  paymentId: string | null;
  error: string | null;
  initiatePayment: (phone: string, amount: number, userId: string) => Promise<void>;
  reset: () => void;
}

export function usePayment(): UsePaymentReturn {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (pId: string) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from("payments").select("status").eq("id", pId).single();
        if (data?.status === "completed") { setStatus("completed"); stopPolling(); }
        else if (data?.status === "failed") { setStatus("failed"); setError("Payment failed. Please try again."); stopPolling(); }
        else if (attempts >= 60) { setStatus("failed"); setError("Payment timed out. Please try again."); stopPolling(); }
      } catch { /* keep polling on network error */ }
    }, 3000);
  };

  const initiatePayment = async (phone: string, amount: number, userId: string) => {
    setStatus("pending"); setError(null); setPaymentId(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setStatus("failed"); setError("Not logged in."); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ phone, amount, userId }),
        }
      );

      const result = await res.json();
      if (!res.ok || result.error) { setStatus("failed"); setError(result.error ?? "Payment failed"); return; }

      setPaymentId(result.paymentId);
      startPolling(result.paymentId);
    } catch (err: any) {
      setStatus("failed");
      setError("Network error. Check your connection.");
    }
  };

  const reset = () => { stopPolling(); setStatus("idle"); setPaymentId(null); setError(null); };

  useEffect(() => () => stopPolling(), []);

  return { status, paymentId, error, initiatePayment, reset };
}