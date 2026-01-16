-- ============================================================
-- PomArc Supabase Schema (Complete)
-- Version: 2.0 (2026-01-17)
-- Description: 完全なデータベーススキーマ定義
-- ============================================================

-- Enable UUID extension

-- ============================================================
-- 1. Categories Table (カテゴリ管理)
-- ============================================================
-- 大・中・小カテゴリの階層構造を持つタスク分類
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('large', 'medium', 'small')),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon TEXT,                          -- Lucide icon name (e.g., 'Book', 'Code')
  color TEXT,                         -- HEX color (e.g., '#3b82f6')
  "order" INTEGER DEFAULT 0,          -- 表示順序
  is_default BOOLEAN DEFAULT false,   -- デフォルトカテゴリフラグ
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
-- 忘却曲線に基づく復習スケジュールの設定
CREATE TABLE public.srs_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  intervals JSONB NOT NULL,           -- Array of days [1, 3, 7, 14, 30]
  is_default BOOLEAN DEFAULT false,   -- デフォルトプロファイルフラグ
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
-- メインのタスクテーブル。SRS、ルーティーン機能を含む
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- 基本情報
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  
  -- 日時情報
  due_date TIMESTAMPTZ,               -- 期限日時
  due_time TEXT,                      -- 開始時間 (HH:mm format)
  end_time TEXT,                      -- 終了時間 (HH:mm format)
  
  -- 所要時間
  estimated_duration INTEGER,         -- 見積もり時間 (分)
  actual_duration INTEGER DEFAULT 0,  -- 実績時間 (分)
  
  -- カテゴリ・メモ
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  notes TEXT,                         -- メモ/詳細
  tags JSONB,                         -- タグ配列 ["tag1", "tag2"]
  
  -- SRS (間隔反復) 関連
  srs_profile_id UUID REFERENCES public.srs_profiles(id) ON DELETE SET NULL,
  srs_level INTEGER DEFAULT 0,        -- 現在のSRSレベル
  srs_interval TEXT,                  -- SRSプロファイル名のキャッシュ
  srs_group_id UUID,                  -- SRS/ルーティーングループのルートID
  next_review_date TIMESTAMPTZ,       -- 次回復習日
  review_history JSONB,               -- 復習履歴 [{date, correct}]
  
  -- レガシーフィールド（Web互換）
  memo TEXT,                          -- メモ（notes と統合予定）
  range TEXT,                         -- 範囲指定
  
  -- タイムスタンプ
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
-- ポモドーロ/カウントダウン/ストップウォッチの記録
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  todo_id UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  todo_title TEXT,                    -- タイトルのスナップショット
  duration INTEGER NOT NULL,          -- 学習時間 (秒)
  mode TEXT DEFAULT 'pomodoro' CHECK (mode IN ('pomodoro', 'countdown', 'stopwatch')),
  start_time TIMESTAMPTZ,             -- 開始時刻
  end_time TIMESTAMPTZ,               -- 終了時刻
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
-- ユーザーからのバグ報告・機能要望
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'request', 'other')),
  content TEXT NOT NULL,
  device_info TEXT,                   -- デバイス情報
  version TEXT,                       -- アプリバージョン
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
-- Note: このスキーマは新規プロジェクトのセットアップ用です。
-- 既存のデータベースを更新する場合は migration_v2.sql を使用してください。
-- ============================================================
