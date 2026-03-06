// ============================================================
// FILE: src/lib/supabase.ts
// PASTE THIS — create this file if it doesn't exist
// ALL other files import supabase from here
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "❌ Missing Supabase env vars!\n" +
    "Make sure .env.local exists in your project root with:\n" +
    "VITE_SUPABASE_URL=...\n" +
    "VITE_SUPABASE_ANON_KEY=..."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);