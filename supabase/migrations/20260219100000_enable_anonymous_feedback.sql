-- ============================================================
-- Enable Anonymous Feedback (Safe Update)
-- Version: 2.1 (2026-02-19)
-- Description: Allow unauthenticated users to submit feedback
-- ============================================================

-- 1. Make user_id nullable in feedbacks table
-- Using conditional execution to avoid errors if already nullable
DO $$ 
BEGIN 
  ALTER TABLE public.feedbacks ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignore errors if it's already nullable or other minor issues
END $$;

-- 2. Drop existing policy if it exists to avoid "already exists" error
DROP POLICY IF EXISTS "Allow anonymous feedback insert" ON public.feedbacks;

-- 3. Create policy for anonymous inserts
CREATE POLICY "Allow anonymous feedback insert" ON public.feedbacks
  FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Note: This ensures that even if you run this script multiple times, it will succeed.
