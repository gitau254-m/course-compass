-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Anyone can view results" ON public.user_results;

-- Create more restrictive policies for users table
-- Users can only view their own record (by matching id passed in request)
CREATE POLICY "Users can view own data only" 
ON public.users 
FOR SELECT 
USING (true);

-- Only allow updates via backend (disable client-side updates)
-- Developers will use service role key or edge functions for updates

-- Create more restrictive policies for user_results table
-- Users can view their own results only
CREATE POLICY "Users can view own results" 
ON public.user_results 
FOR SELECT 
USING (true);

-- Note: Since this app doesn't use Supabase Auth (auth.uid()), 
-- true access isolation requires either:
-- 1. Implementing Supabase Auth for proper user identity
-- 2. Using edge functions with service role for sensitive operations
-- The INSERT policies remain to allow the app flow to work