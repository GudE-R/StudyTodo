-- ============================================================
-- Add UPDATE policy for feedbacks table
-- The upsert operation requires UPDATE permission as well as INSERT
-- ============================================================

CREATE POLICY "Users can update their own feedbacks" ON public.feedbacks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
