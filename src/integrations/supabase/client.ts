// ============================================================
// FILE: src/integrations/supabase/client.ts
// REPLACE your entire existing file with this
//
// THE FIX: Your project was using a wrong/old API key.
// This file now has the correct key for your course-checker project.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ljojsgvbukluptjrxmjo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2pzZ3ZidWtsdXB0anJ4bWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjI5OTIsImV4cCI6MjA4MzUzODk5Mn0.XiMu24g80uY_d3jotmrtv74RMVSqLIiOZudJAEwHSpk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // The app does not use Supabase Auth login
    // Users are stored in the public.users table directly
    persistSession: false,
    autoRefreshToken: false,
  }
});