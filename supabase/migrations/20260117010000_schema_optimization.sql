-- ============================================================
-- StudyTodo Schema Optimization
-- Date: 2026-01-17
-- ============================================================

-- ============================================================
-- 1. Add DEFAULT to feedbacks.id (fallback if app doesn't provide ID)
-- ============================================================
ALTER TABLE public.feedbacks 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================================
-- 2. Create updated_at auto-update trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Apply trigger to all tables with updated_at column
-- ============================================================

-- Categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SRS Profiles
DROP TRIGGER IF EXISTS update_srs_profiles_updated_at ON public.srs_profiles;
CREATE TRIGGER update_srs_profiles_updated_at
  BEFORE UPDATE ON public.srs_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Todos
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Feedbacks
DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON public.feedbacks;
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Done!
-- ============================================================
