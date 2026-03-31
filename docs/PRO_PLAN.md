# StudyTodo プロプラン計画書

最終更新: 2026-03-29
ステータス: **ドラフト（v2）**

---

## 1. 概要

StudyTodoの無料版はすでにリリース済み（Web・iOS・Android）。
次の収益化ステップとして **Proプラン（有料サブスクリプション）** を導入する。
本ドキュメントはその全体計画である。

### 基本方針
- 無料版の基本体験（Todo / タイマー / SRS / スケジュール / 学習履歴 / 多端末同期）は **制限しすぎない**
- Pro は **広告非表示・作成上限の開放** で差別化
- まず **Web版** で実装・検証 → **モバイル版** に展開（既存の開発方針ポリシーに準拠）
- **クロスプラットフォーム課金の重複を防止** する設計を前提とする

---

## 2. 価格設定

| プラン | 価格 | 月あたり | 備考 |
|--------|------|----------|------|
| 月額 | ¥300/月 | ¥300 | |
| 年額 | ¥2,400/年 | ¥200 | 月額比33%オフ |

### 決済手段
- **iOS**: App Store IAP（サブスクリプション）
- **Android**: Google Play Billing（サブスクリプション）
- **Web**: Stripe

---

## 3. Pro特典一覧（候補）

### 3.1 確定機能（優先度: 高）

| # | 機能 | 無料版 | Pro版 | 概要 |
|---|------|--------|-------|------|
| 1 | **広告非表示** | バナー広告あり | 広告なし | AdMobバナーの非表示 |
| 2 | **作成上限の開放** | SRS 3個 / カテゴリ制限あり | 無制限 | SRSプロファイル・カテゴリの作成上限を撤廃 |

### 3.2 無料機能

| # | 機能 | 概要 | 備考 |
|---|------|------|------|
| 3 | **多端末同期** | 既存のSupabase同期を活用 | ログインユーザーは全員利用可能（すでに実装済み） |

### 3.3 保留中機能

以下の機能は将来的に検討する可能性があるが、**現時点では保留**とする。

| # | 機能 | 概要 | 備考 |
|---|------|------|------|
| 4 | **詳細分析** | 週/月/年の詳細分析、時間帯別・科目別の効率指標 | 保留 |
| 5 | **エクスポート無制限** | CSV/JSONフルエクスポート | 保留 |
| 6 | **リワード広告によるPro体験** | 動画広告視聴で一時的にPro機能を解放 | 保留 |
| 7 | **AI学習分析** | パーソナライズされた学習フィードバック | 保留 |
| 8 | **テーマ拡張** | 追加テーマ・カスタムカラー | 保留 |
| 9 | **ゲーミフィケーション** | バッジ・レベル・ストリーク | → [GAMIFICATION_PLAN.md](./GAMIFICATION_PLAN.md) で別途計画 |
| 10 | **フォーカスBGM** | タイマー中の環境音再生 | 保留（ライセンスコスト要確認） |

---

## 4. 無料版の制限設計

Proへの転換を促しつつ、無料ユーザーの体験を損なわないバランスが重要。

### 制限の方針
- **ハードリミット**: 超えたら作成不可（SRS、カテゴリ上限など）
- **制限なし**: Todo作成・タイマー・基本スケジュール管理・**多端末同期**

### 具体的な制限値（案）

| 項目 | 無料版 | Pro版 |
|------|--------|-------|
| SRSプロファイル数 | 3個まで | 無制限 |
| カテゴリ（大） | 5個まで | 無制限 |
| カテゴリ（中・小） | 各10個まで | 無制限 |
| 広告 | バナー広告あり | 広告なし |

---

## 5. 技術実装の概要

### 5.1 DB設計

#### Subscriptions テーブル（新規追加）

Proユーザーのみレコードを作成する。レコードが存在しない＝無料ユーザー。

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'cancelled', 'expired', 'past_due', 'incomplete', 'paused')),
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'manual')),
  trial_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  renewed_at TIMESTAMPTZ,
  receipt_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### `receipt_data` の構造

プラットフォーム別に保存する内容：

| プラットフォーム | 保存内容 |
|------------------|----------|
| iOS | `original_transaction_id`, `product_id`, `environment` |
| Android | `purchase_token`, `product_id`, `order_id` |
| Web (Stripe) | `customer_id`, `subscription_id`, `price_id` |

#### RLSポリシー

```sql
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のサブスクリプションのみ参照可能
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE はサーバーサイド（service_role）のみ
-- クライアントからの直接変更は禁止（不正防止）
```

### 5.2 クライアント側の設計

```
ユーザーログイン
  → Subscriptionテーブルを参照
  → isPro フラグをグローバルステートに保持
  → 各機能で isPro をチェックして表示/制限を切替
    ※広告非表示等の判定は、既存のSNS共有状態と統合して扱う（例: `isPro || adFreeUntil > now()`）
```

#### オフライン時の isPro 判定

- ログイン時にサブスクリプション状態をローカル（AsyncStorage / IndexedDB）にキャッシュ
- キャッシュの有効期限: `expires_at` の値をそのまま利用
- オフライン時はキャッシュを参照し、`expires_at` が過去ならFreeに降格
- オンライン復帰時にサーバーから最新状態を再取得

### 5.3 課金フロー

```
[ペイウォール表示]
  → [プラン選択 (月額/年額)]
  → [各プラットフォームの課金API呼び出し]
    - iOS: StoreKit 2
    - Android: Google Play Billing Library
    - Web: Stripe Checkout
  → [レシート検証 (Supabase Edge Function)]
  → [Subscriptionテーブル更新]
  → [isPro フラグ反映]
```

### 5.4 サーバーサイド検証（Supabase Edge Functions）

課金の信頼性を担保するため、以下のEdge Functionを実装する。

#### 必要なEdge Functions

| 関数名 | 用途 | トリガー |
|--------|------|----------|
| `verify-receipt` | 初回購入時のレシート検証 | クライアントから呼び出し |
| `stripe-webhook` | Stripe イベント処理 | Stripe Webhook |
| `app-store-notification` | App Store Server Notifications V2 | Apple サーバー |
| `play-billing-notification` | Google Play RTDN | Google サーバー |

#### 処理すべきイベント

| イベント | 処理内容 |
|----------|----------|
| 購入完了 | `subscriptions` レコード作成、`status = 'active'` |
| 更新成功 | `renewed_at` と `expires_at` を更新 |
| 支払い失敗 | `status = 'past_due'` に変更 |
| 解約（期間終了時） | `status = 'cancelled'`、`expires_at` 到来後に `'expired'` |
| 返金 | `status = 'expired'`、即時Pro解除 |
| トライアル開始 | `status = 'trialing'`、`trial_ends_at` を設定 |
| その他（Stripe固有等）| `incomplete`, `paused` などのステータスも適宜マッピング・追加して管理 |

#### 定期的なステータス確認

- 日次バッチ（Supabase Cron or Edge Function）で `expires_at < NOW()` かつ `status = 'active'` のレコードを `'expired'` に更新
- Webhook漏れに対するセーフティネット

### 5.5 クロスプラットフォーム課金の重複防止

iOSで課金したユーザーがWeb版で重複して課金することを防ぐ仕組み。

#### 原則
- **Subscriptionテーブルが唯一の真実の情報源（Single Source of Truth）**
- 課金前に必ず既存のアクティブなサブスクリプションを確認する

#### フロー
```
[ペイウォール表示の前]
  → Subscriptionテーブルを確認
  → アクティブなサブスクリプションが存在する場合:
    → 「すでに {platform} で課金済みです」と表示
    → ペイウォールの課金ボタンを無効化
    → 管理は元のプラットフォームで行うよう案内
  → サブスクリプションが無い場合:
    → 通常のペイウォールを表示
```

#### 実装ポイント
- `subscriptions.platform` カラムで課金元プラットフォームを記録
- ペイウォール表示時にサーバー側で `status IN ('active', 'trialing')` のレコードをチェック
- 既にアクティブな場合は課金ボタンを非表示 or 無効化し、管理先を案内
- サブスクリプション管理リンクをプラットフォームに応じて動的に表示
  - iOS → 設定 > サブスクリプション
  - Android → Google Play > 定期購入
  - Web → Stripe Customer Portal

---

## 6. 実装フェーズ（ロードマップ）

### Phase 1: 基盤構築 + Pro特典
- [ ] Subscription テーブルの作成・トリガー・RLS設定
- [ ] `isPro` 判定ロジックの実装（shared パッケージ）
- [ ] オフライン時の isPro キャッシュロジック
- [ ] 無料版の制限ロジック実装（SRS・カテゴリ上限など）
- [ ] 広告非表示機能（isPro による切替）
- [ ] 作成上限の開放ロジック（isPro による切替）
- [ ] ペイウォールUI（モーダル）のデザイン・実装
- [ ] クロスプラットフォーム課金重複防止ロジックの実装

> **Note**: Phase 1のペイウォールUIは「モック（近日公開等）」とするか、またはPhase 1とPhase 2をセットで1つのリリースにまとめる前提で進める。

### Phase 2: Web版課金（Stripe）
- [ ] Stripe アカウントセットアップ
- [ ] Stripe Checkout / Customer Portal 連携
- [ ] `stripe-webhook` Edge Function の実装
- [ ] Web版の課金フロー E2E テスト

### Phase 3: モバイル版課金
- [ ] iOS: StoreKit 2 連携（Expo IAP）
- [ ] Android: Google Play Billing 連携（Expo IAP）
- [ ] `verify-receipt` Edge Function の実装
- [ ] `app-store-notification` Edge Function の実装
- [ ] `play-billing-notification` Edge Function の実装
- [ ] 日次バッチ（expires_at チェック）の実装
- [ ] モバイル版の課金フロー E2E テスト

> **Note**: 保留中機能（セクション3.3）は優先度が上がった時点でフェーズを追加する。

---

## 7. ペイウォール戦略

### 表示タイミング
- 制限に到達した時（SRS作成上限など）
- 設定画面の「Proプラン」セクションから
- 分析画面で「詳細を見る」をタップした時
- **初回表示は使い始めて3日後**（価値を体験してからの提示）

### ペイウォールの構成
```
┌─────────────────────────────┐
│     StudyTodo Pro ✨         │
│                             │
│  ● 広告なしで集中           │
│  ● 無制限のSRS・カテゴリ    │
│                             │
│  ┌─────────┐ ┌─────────┐   │
│  │ 月額    │ │ 年額    │   │
│  │ ¥300/月 │ │¥2,400/年│   │
│  │         │ │ 33%OFF! │   │
│  └─────────┘ └─────────┘   │
│                             │
│  [ Proにアップグレード ]      │
│  [ あとで ]                  │
└─────────────────────────────┘
```

> ⚠️ App Store / Google Play の審査要件として、年額プランでは実際の請求額（¥2,400/年）を明示すること。「月あたり¥200」は補足として表示可。

> ⚠️ すでに別プラットフォームで課金済みの場合、ペイウォールの代わりに「{platform}で課金済みです」メッセージを表示する。

### 無料トライアル

#### 基本設計
- **期間**: 7日間
- **対象**: 新規ユーザーのみ（1アカウントにつき1回）
- **内容**: Pro全機能を体験可能（広告非表示 + 作成上限開放）
- **トライアル終了後**: 自動的に無料版に降格（自動課金なし）

#### SNS共有との差別化
| | SNS共有 | 無料トライアル |
|--|---------|----------------|
| 広告非表示 | ✅（24時間） | ✅（7日間） |
| 作成上限開放 | ❌ | ✅ |
| 回数 | 何度でも | 1回のみ |

#### フロー
```
[初回ログインから3日後]
  → ペイウォール表示（トライアル付き）
  → 「7日間無料で試す」ボタン
  → Subscriptionレコード作成:
    status = 'trialing'
    trial_ends_at = NOW() + 7 days
    expires_at = NOW() + 7 days
  → 7日後に自動で status = 'expired' に遷移
  → トライアル終了時にプッシュ通知 or アプリ内通知で課金を案内
```

#### ストア別の注意点
- **iOS**: App Store Connect でトライアル期間を設定。StoreKit 2 が自動管理
- **Android**: Google Play Console でトライアルを設定。Billing Library が自動管理
- **Web**: Stripe の `trial_period_days` パラメータで設定

---

## 8. SNS共有による広告OFF（既存機能との連携）

> すでに実装済みの「SNS共有→期間限定広告OFF」機能をProへの導線として活用。

- 共有1回 → 24時間広告OFF（既存）
- Pro版 → 永続的に広告OFF
- 共有で体験 → Proへのアップグレード促進

---

## 9. KPI（成功指標）

| 指標 | 目標値 | 計測方法 |
|------|--------|----------|
| Pro転換率 | ≥ 1.5%（ローンチ+90日） | サブスクリプション数 / MAU |
| 課金継続率（M2） | ≥ 75% | 2ヶ月目の継続率 |
| ARPU | ≥ ¥5/MAU | 総収益 / MAU |
| ペイウォール→課金率 | ≥ 5% | 課金完了数 / ペイウォール表示数 |
| 解約率（月次） | ≤ 10% | 月間解約数 / 月初アクティブ課金数 |

---

## 10. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| ストア審査での課金トラブル | リリース遅延 | IAP ガイドライン事前チェック |
| 低い転換率 | 収益不足 | ペイウォールの A/B テスト、価格調整 |
| 無料版の制限がきつすぎる | ユーザー離れ | 制限値の段階的な調整、フィードバック収集 |
| レシート偽造・不正利用 | 収益損失 | サーバーサイドでのレシート検証必須 |
| Web/Mobile間のサブスク状態不整合 | UX低下 | Subscriptionテーブルをsingle source of truth に |
| Webhook配信漏れ | 課金状態の不整合 | 日次バッチによるexpires_atチェック（セーフティネット） |
| オフライン時の端末の時計操作 | 意図しないProの延長 | エッジケースとしてある程度許容する。オンライン復帰時にサーバーと再同期して最新状態へ上書きする。 |

---

## 11. 未決定事項

1. 無料版の制限値の最終調整（ユーザーテスト後に確定）
2. 学生割引・教育機関向けプランの検討

### 解決済み
- ~~Web課金プロバイダの最終決定~~ → Stripe に決定
- ~~クロスプラットフォーム課金の統合方法~~ → セクション 5.5 で設計済み
- ~~多端末同期の扱い~~ → 無料機能として提供
- ~~詳細分析・エクスポート~~ → 保留（セクション 3.3）
- ~~ゲーミフィケーション~~ → [GAMIFICATION_PLAN.md](./GAMIFICATION_PLAN.md) で別途計画
- ~~サーバーサイド検証の設計~~ → セクション 5.4 で設計済み
- ~~RLSポリシー~~ → セクション 5.1 で定義済み
- ~~オフライン時のisPro判定~~ → セクション 5.2 で設計済み
- ~~無料トライアル期間~~ → 7日間に決定（セクション 7「無料トライアル」）
