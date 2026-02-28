-- ============================================================
-- Migration: Add Communications and External Reviews
-- Description: AIによる分析・自律成長パイプラインのための外部入力保存テーブル
-- ============================================================

-- ============================================================
-- 1. Communications Table (外部からの連絡・メール等)
-- ============================================================
-- サポート宛のメールや、問い合わせフォームからの連絡を保存します
CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users, -- 既存ユーザーと紐付けられる場合は保存
  type TEXT NOT NULL CHECK (type IN ('email', 'contact_form', 'other')),
  sender_address TEXT,                -- 送信元メールアドレス等
  subject TEXT,                       -- 件名
  content TEXT NOT NULL,              -- 本文
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'analyzed', 'replied', 'ignored')), -- AIの処理状態
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
-- 基本的にシステム（Webhook等）からのInsertと、管理者（AIバッチ含む）からのSelectを想定
CREATE POLICY "Allow service role full access to communications" ON public.communications
  FOR ALL USING (true) WITH CHECK (true); -- ※実際の運用ではService Roleのみに制限するか、適切なRLSを設定

CREATE INDEX communications_status_idx ON public.communications(status);
CREATE INDEX communications_received_at_idx ON public.communications(received_at);

-- ============================================================
-- 2. External Reviews Table (ストアレビューやSNSの評判)
-- ============================================================
-- App Store, Google Playのレビューや、X(Twitter)等の言及を保存します
CREATE TABLE public.external_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('app_store', 'google_play', 'x_twitter', 'other')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1〜5の星評価（SNSの場合はNULL可）
  content TEXT NOT NULL,                              -- レビューや投稿の本文
  author_name TEXT,                                   -- 投稿者名
  source_url TEXT,                                    -- 元の投稿・レビューへのリンク
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'analyzed', 'ignored')), -- AIの処理状態
  posted_at TIMESTAMPTZ NOT NULL,                     -- 実際に投稿された日時
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.external_reviews ENABLE ROW LEVEL SECURITY;
-- システム（定期バッチ等）からのInsertを想定
CREATE POLICY "Allow service role full access to external_reviews" ON public.external_reviews
  FOR ALL USING (true) WITH CHECK (true); -- ※実際の運用ではService Roleのみに制限

CREATE INDEX external_reviews_status_idx ON public.external_reviews(status);
CREATE INDEX external_reviews_source_idx ON public.external_reviews(source);
CREATE INDEX external_reviews_posted_at_idx ON public.external_reviews(posted_at);
