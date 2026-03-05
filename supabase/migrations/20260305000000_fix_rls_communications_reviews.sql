-- ============================================================
-- Migration: Fix RLS policies for communications and external_reviews
-- Description: 全許可ポリシーを削除し、service_roleのみアクセス可能に制限
-- ============================================================

-- 1. Communications: 全許可ポリシーを削除し、service_roleのみに制限
DROP POLICY IF EXISTS "Allow service role full access to communications" ON public.communications;
CREATE POLICY "Allow service role full access to communications" ON public.communications
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 2. External Reviews: 同様に修正
DROP POLICY IF EXISTS "Allow service role full access to external_reviews" ON public.external_reviews;
CREATE POLICY "Allow service role full access to external_reviews" ON public.external_reviews
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
