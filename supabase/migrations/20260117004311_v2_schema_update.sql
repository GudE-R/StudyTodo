-- ============================================================
-- PomArc Supabase Migration (v1 → v2)
-- Version: 2.0 (2026-01-17)
-- Description: 既存データベースを最新スキーマに更新
-- ============================================================
-- 
-- 使用方法:
-- Supabase ダッシュボード > SQL Editor で実行してください。
-- 既存のデータは保持されます。
-- ============================================================

-- ============================================================
-- 1. Categories Table の更新
-- ============================================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- レベルの制約を追加（既存データがある場合はスキップ）
-- ALTER TABLE public.categories ADD CONSTRAINT categories_level_check CHECK (level IN ('large', 'medium', 'small'));

-- インデックス追加
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);

-- ============================================================
-- 2. SRS Profiles Table の更新
-- ============================================================
ALTER TABLE public.srs_profiles ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.srs_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- インデックス追加
CREATE INDEX IF NOT EXISTS srs_profiles_user_id_idx ON public.srs_profiles(user_id);

-- ============================================================
-- 3. Todos Table の更新
-- ============================================================
-- 基本カラム
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS range TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS tags JSONB;

-- 時間関連
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_time TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS actual_duration INTEGER DEFAULT 0;

-- SRS関連
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS srs_interval TEXT;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS srs_group_id UUID;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS review_history JSONB;

-- インデックス追加
CREATE INDEX IF NOT EXISTS todos_category_id_idx ON public.todos(category_id);
CREATE INDEX IF NOT EXISTS todos_srs_group_id_idx ON public.todos(srs_group_id);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON public.todos(due_date);

-- ============================================================
-- 4. Sessions Table の更新
-- ============================================================
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- インデックス追加
CREATE INDEX IF NOT EXISTS sessions_todo_id_idx ON public.sessions(todo_id);
CREATE INDEX IF NOT EXISTS sessions_created_at_idx ON public.sessions(created_at);

-- ============================================================
-- 5. Feedbacks Table の作成（存在しない場合）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'request', 'other')),
  content TEXT NOT NULL,
  device_info TEXT,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLSを有効化（テーブルが新規作成された場合）
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- ポリシー（既存の場合はスキップ）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedbacks' AND policyname = 'Users can insert their own feedbacks'
  ) THEN
    CREATE POLICY "Users can insert their own feedbacks" ON public.feedbacks
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedbacks' AND policyname = 'Users can view their own feedbacks'
  ) THEN
    CREATE POLICY "Users can view their own feedbacks" ON public.feedbacks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS feedbacks_user_id_idx ON public.feedbacks(user_id);

-- ============================================================
-- 完了メッセージ
-- ============================================================
DO $$ BEGIN RAISE NOTICE 'Migration completed successfully!'; END $$;
