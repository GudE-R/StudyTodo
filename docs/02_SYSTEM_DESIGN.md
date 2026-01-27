# StudyTodo システム設計書 v0.1.1
最終更新: 2025-12-11 (統合・整理版)

## 1. システム概要
### アーキテクチャ
*   **プラットフォーム**: Web (Next.js 16 App Router) / [将来] native app via Capacitor or Expo
*   **レンダリング**: Client-Side Rendering (CSR) with Hydration。ローカルデータ依存のためクライアント主導。
*   **言語**: TypeScript

### データ層設計
*   **ストレージ**: IndexedDB (Dexie.js ラッパーを使用)
    *   **Local First**: サーバーと通信せず、ブラウザ内に全データを保持。
*   **スキーマ概要**:
    *   `todos`: タスク本体。期限、完了状態、カテゴリIDなどを保持。
    *   `sessions`: 学習記録（ログ）。タスクID、実行時間、モードを保持。
    *   `categories`: 階層構造を持つマスタデータ。`parentId`による隣接リストモデル。
    *   `srsProfiles`: 復習間隔の設定プロファイル。

## 2. コンポーネント設計
### ディレクトリ構造
*   `src/app`: ページルーティング (App Router)
*   `src/components`: 機能別コンポーネント
    *   `/home`: メイン画面構成要素 (List, Schedule, Calendar)
    *   `/todo`: タスク関連モーダル
    *   `/template`: マスタデータ管理 (Category, SRSEditor)
    *   `/settings`: アプリ設定
    *   `/activity`: 分析・履歴
    *   `/ui`: 汎用パーツ (IconPicker, DatePicker)
*   `src/lib`: ユーティリティ、DB設定
*   `src/contexts`: React Context (Theme等)

### 状態管理戦略
*   **永続化データ**: Dexie LiveQuery (`useLiveQuery`) により、DBの変更をリアルタイムにUIへ反映。
*   **アプリケーション状態**: Reactローカルステート (`useState`) でUIの開閉や選択状態を管理。
*   **グローバル設定**: Context API (`ThemeContext` 等) でアプリ全体の設定を共有。

## 3. UI/UX 設計指針
*   **モバイルファースト**: タッチ操作、スワイプ、長押し等のジェスチャを考慮。
*   **モーダル中心**: 多階層ページ遷移を避け、モーダルによるコンテキスト維持。
*   **ダークモード対応**: CSS変数とTailwind CSS (`dark:` プレフィックス) による完全対応。

## 4. 将来の拡張計画 (Pro機能)
*   **データ同期**: Supabase等を用いたクラウド同期。
*   **高度な分析**: 長期間の傾向分析、エクスポート機能。
*   **認証**: 同期機能に伴うユーザーアカウント管理。

---

# StudyTodo システム設計書 v0.1（オリジナル詳細版）

最終更新: 2025-10-28（JST） / 参照: StudyTodo_機能要件サマリ_v0.1.txt

## 目的と範囲
- 本書は機能要件サマリに基づき、実装のためのシステム構成・データ設計・モジュール設計を示す。
- 対象プラットフォーム: Web（Next.js）/ モバイル（Expo React Native）
- プラン差分: 無料=ローカル履歴中心 / [Pro]=多端末同期・詳細統計・広告削除 など

## 全体アーキテクチャ
- クライアント
  - Web: Next.js（App Router/RSC、i18n、CSR+SSRのハイブリッド）
  - Mobile: Expo React Native（iOS/Android、同一コードベース）
- データ層
  - ローカル永続化: Web=IndexedDB (Dexie.js)、Mobile=SQLite（ローカルFirst）
    - テーブル構成: todos, sessions, categories, srs_profiles
    - ID戦略: UUID v4（クライアント生成、同期時の衝突回避）
  - 同期（[Pro]）: Supabase Postgres + Row Level Security、差分同期（フィールド単位の最新更新優先）
- バックエンド
  - Supabase: 認証、DB、ストレージ、エッジ関数（定期ジョブ、簡易RPC）
- 外部サービス
  - 広告: AdMob（上部固定バナー、ファミリー向け設定、CMP/ATT連携）
  - 決済: App Store/Google Play IAP、Web=Stripe（予定）

## UIコンポーネント設計（ホーム）
- AppShell（共通）
  - TopBannerAd: 画面最上部の広告バナー
  - DateBar: 日付表示 / 左端プロフィール / 右端設定（同一行で並列）
  - MainDashboard (3-Column Grid):
    - LeftColumn: TodoList (タスク一覧)
    - CenterColumn: DaySchedule (タイムライン)
    - RightColumn: CalendarPane (カレンダー & 分析)
  - BottomActions: テンプレ作成 / Todo作成 / レポート

## 主要ユースフロー
- Todo作成
  - 起点: BottomActionsの「Todo作成」
  - フィールド: タイトル(必須) / 開始日 / 時間 / カテゴリ / SRS / 範囲 / メモ
  - プレフィル: カレンダー日付/Day空き枠の長押しから日時を事前選択
  - 作成→TodoListへ反映 / 「今すぐ開始」→タイマーへ遷移
- Todo/Day/カレンダーの連動
  - 同一データソースを参照、片方の操作は他へ即時反映
- レポート（学習履歴・統計）
  - 無料: 当日/過去の履歴一覧
  - [Pro]: 当日/週/月の詳細統計・推移グラフ・ランキング

## タイマー設計
- 種別: ポモドーロ / カウントダウン / ストップウォッチ
- ポモドーロ: 25+5 または 50+10 をプリセット
- カウントダウン: 任意時間を設定可能 / 一時停止・再開・リセット
- ストップウォッチ: 経過計測 / 一時停止・再開・リセット（任意時間の設定は不可）
- 記録: セッション保存→レポートへ反映（[Pro]は詳細統計にも反映）

## ドメインモデル（概略）
- users
  - id, plan(tier), locale, created_at, updated_at
- tasks (todos)
  - id (UUID), user_id, title, category_id, start_at (dueDate), due_time, end_time, srs_interval, range_note, memo, priority, status (completed), created_at, updated_at
- categories
  - id (UUID), user_id, name, level, parent_id, order_index, created_at, updated_at
- srs_profiles
  - id (UUID), user_id, name, intervals (int[]), is_default, created_at, updated_at
- sessions
  - id (UUID), user_id, task_id, task_title, duration, mode, created_at

索引・制約（例）
- tasks: (user_id, status, start_at), (user_id, updated_at desc)
- reviews: (user_id, next_due_at), (user_id, subject)
- sessions: (user_id, start_at), (user_id, created_at desc)
- categories: (user_id, path_ltree) で階層参照

## 同期・オフライン
- ローカルFirst: すべての操作はオフラインで成立（ローカルDB反映）
- [Pro]差分同期: 再接続時に変更セットをアップロード/ダウンロード
  - コンフリクト: フィールド単位で updated_at の新しい方を採用（項目別マージ）
  - フィルタ: plan=tierで同期可否を制御（無料はローカルのみ）

## 広告・課金
- 広告: TopBannerのみ、タイマー中のレイアウト固定、全画面広告なし
- 同意: CMP/ATTとAdMobの連携、ファミリー向け設定
- 課金: [Pro]で広告削除/同期/詳細統計/SRSカスタム/エクスポート無制限

## レポート/エクスポート
- レポート: 履歴一覧（無料） / 詳細統計（[Pro]）
- エクスポート: CSV（tasks/sessions/reviews）。レート制御と署名URL配布

## i18n/設定
- 言語: 日本語/英語（段階的に拡張）
- テーマ: ライト/ダーク/自動
- タイマー: プリセット（25/5・50/10）とカスタム（カウントダウン）

## セキュリティ/プライバシー
- Supabase RLSで user_id による行レベル制御
- 最小権限のAPIキー、クライアントは認証トークンでRLS適用

## ロギング/計測
- 行動イベント: 主要操作にschema_ver付与で記録（例: task_create, timer_start, report_view）
- 例外/診断: クライアント側で非PIIの範囲で収集

## 品質と運用
- パフォーマンス: バンドルを小さく、遅延ロード徹底、軽量チャート採用
- 回復性: 楽観UI＋リトライ、冪等処理
- 配布: ストア配信/段階ロールアウト、環境分離（dev/stg/prod）

## 実装マッピング（要点）
- UI
  - TopBannerAd / DateBar / TodoList / DaySchedule / CalendarPane / BottomActions
- 状態管理
  - グローバル: plan, user, dateContext
  - ストレージ: repository層（local <-> remote）
- 同期
  - feature flagで[Pro]のみ有効、バックグラウンド同期タスク
- SRS
  - テンプレ管理 + 日次キュー生成（ローカル演算、同期は[Pro]）

## 図版（参照）
- docs/diagrams/01_ui_wireframe.md: ホーム画面のブロック構成
- docs/diagrams/02_interaction_map.md: 主要なインタラクション（長押しプレフィル/日付同期/スワイプ）
- docs/diagrams/03_er_diagram.md: ER図（主要テーブルと関係）
- docs/diagrams/04_sequence_todo_to_timer.md: Todo作成からタイマー開始までの遷移
- docs/diagrams/05_architecture.md: クライアント/ローカル/バックエンドの全体構成
- docs/diagrams/06_srs_flow.md: SRS復習キュー生成のフロー
- docs/diagrams/07_report_pipeline.md: セッション→集計→表示のパイプライン
- docs/diagrams/08_consent_ads_export.md: 同意/広告配信、CSVエクスポートのフロー
