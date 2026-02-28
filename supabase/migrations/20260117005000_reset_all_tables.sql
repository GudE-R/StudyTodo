-- ============================================================
-- StudyTodo Database Reset
-- WARNING: This will DELETE ALL DATA!
-- ============================================================

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.feedbacks CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.srs_profiles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ============================================================
-- Recreate all tables from scratch
-- ============================================================

-- Enable UUID extension

-- ============================================================
-- 1. Categories Table (カテゴリ管理)
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('large', 'medium', 'small')),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon TEXT,
  color TEXT,
  "order" INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX categories_user_id_idx ON public.categories(user_id);
CREATE INDEX categories_parent_id_idx ON public.categories(parent_id);

-- ============================================================
-- 2. SRS Profiles Table (間隔反復プロファイル)
-- ============================================================
CREATE TABLE public.srs_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  intervals JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.srs_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own SRS profiles" ON public.srs_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX srs_profiles_user_id_idx ON public.srs_profiles(user_id);

-- ============================================================
-- 3. Todos Table (タスク管理)
-- ============================================================
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date TIMESTAMPTZ,
  due_time TEXT,
  end_time TEXT,
  estimated_duration INTEGER,
  actual_duration INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  notes TEXT,
  tags JSONB,
  srs_profile_id UUID REFERENCES public.srs_profiles(id) ON DELETE SET NULL,
  srs_level INTEGER DEFAULT 0,
  srs_interval TEXT,
  srs_group_id UUID,
  next_review_date TIMESTAMPTZ,
  review_history JSONB,
  memo TEXT,
  range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX todos_user_id_idx ON public.todos(user_id);
CREATE INDEX todos_category_id_idx ON public.todos(category_id);
CREATE INDEX todos_srs_group_id_idx ON public.todos(srs_group_id);
CREATE INDEX todos_due_date_idx ON public.todos(due_date);

-- ============================================================
-- 4. Sessions Table (学習セッション記録)
-- ============================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  todo_id UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  todo_title TEXT,
  duration INTEGER NOT NULL,
  mode TEXT DEFAULT 'pomodoro' CHECK (mode IN ('pomodoro', 'countdown', 'stopwatch')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX sessions_todo_id_idx ON public.sessions(todo_id);
CREATE INDEX sessions_created_at_idx ON public.sessions(created_at);

-- ============================================================
-- 5. Feedbacks Table (フィードバック収集)
-- ============================================================
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'request', 'other')),
  content TEXT NOT NULL,
  device_info TEXT,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own feedbacks" ON public.feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own feedbacks" ON public.feedbacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX feedbacks_user_id_idx ON public.feedbacks(user_id);

-- ============================================================
-- Done!
-- ============================================================
