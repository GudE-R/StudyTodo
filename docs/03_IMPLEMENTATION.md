# PomArc 実装の記録 (Implementation)

現在の実装状況と、これまでの変更履歴を記録するドキュメントです。

## 1. 現在の実装状況 (Specs)

### プロジェクト概要
**PomArc** は、タスク管理、スケジュール管理、学習記録、そしてポモドーロタイマーを統合したWebアプリケーションです。

### 実装済み機能

#### タスク管理 (ToDo)
*   **タスク作成**: タイトル、期限（日付・時間）、カテゴリ、優先度、メモを設定可能。
*   **タスク一覧**: 日付ごとにフィルタリングされたタスク表示。
*   **ドラッグ&ドロップ**: タスクの並び替え機能。
*   **詳細表示**: タスクの詳細確認、削除、即時開始が可能。
*   **完了管理**: チェックボックスによる完了・未完了の切り替え。

#### スケジュール & カレンダー
*   **カレンダービュー**: 月ごとの活動ヒートマップ表示。日付選択によるビュー切り替え。
*   **デイリースケジュール**: 時間軸（バーチカル）でのタスク表示。
*   **直感的な操作**:
    *   カレンダーの日付長押しで「キープ」機能（タスク作成時の日付固定）。
    *   スケジュールの時間長押しで、その時間を指定してタスク作成。

#### タイマー & 記録
*   **3つのモード**:
    1.  **ポモドーロ**: 25分集中 + 5分休憩のサイクル。
    2.  **カウントダウン**: 任意の時間を設定。
    3.  **ストップウォッチ**: 経過時間を計測。
*   **セッション記録**: タイマー終了後、学習時間を自動的に記録。
*   **手動記録**: 過去の学習を手動で追加可能。

#### テンプレート & 設定 (構造化データ)
*   **カテゴリ管理**: 大分類 > 中分類 > 小分類 の3階層構造。アイコン設定（IconPicker）が可能。
*   **SRS (間隔反復) プロファイル**: 学習サイクルのカスタマイズ（例: 1日後、3日後、7日後...）。
*   **データ構造**: Dexie.js (IndexedDB) を使用し、ブラウザ内にデータを永続化。

#### 分析 (Activity)
*   **統計ダッシュボード**:
    *   総学習時間、完了タスク数。
    *   期間別（週・月・年）の学習時間推移グラフ。
    *   カテゴリごとのフィルタリング。
*   **履歴一覧**: 過去のタスク完了履歴と学習セッションログ。

#### UI / UX
*   **PCダッシュボード**: 情報を一覧できる3カラム構成のフルスクリーンレイアウト。
*   **ダークモード**: OS設定または手動設定によるライト/ダークテーマ切り替え。
*   **モーダル設計**: 設定（テーマ・ガイド）とテンプレート（カテゴリ・SRS）を分離し、アクセス性を向上。
*   **Todo入力の簡素化**: タイトル・範囲・メモを1つの記述欄に統合。1行目をタイトル、2行目以降をメモとしてパースし、カテゴリ選択時はタイトル自動補完を行う仕組みを導入。 (2026-01-01)
*   **Todo詳細画面の高度化**: 詳細確認モーダルに編集機能を統合。作成モーダルと同等の入力フォームを備え、シームレスな情報の修正・保存が可能に。 (2026-01-01)
*   **カレンダーの視認性向上**: カレンダーセル内にタスク量を示すドット（完了/未完了）を追加。実績のヒートマップと予定を同時に確認できるよう改善。 (2026-01-01)

#### 広告基盤
*   **Web広告**: 画面上部等にバナー広告枠を実装。
*   **モバイル広告**: モバイル版リリース時に同様に実装を検討。

#### 多言語対応 (Internationalization)
*   **対応言語**: 日本語、英語、ドイツ語、フランス語、スペイン語の5言語に対応。
*   **共有リソース**: `packages/shared` 内に JSON 形式で翻訳データを集約し、Web/Mobile間での再利用性を確保。
*   **Web 実装**: `next-intl` を導入。ロケールベースのルーティング（例: `/ja`, `/en`）と動的なメッセージロードを実現。
*   **日付対応**: `date-fns` と連携し、ロケールに応じた日付表示形式とカレンダーの週始まりを制御。

#### Pro版 (有料プラン) ※将来計画
*   **概要**: モバイル版リリース後の安定性を確認した後に導入を検討。
*   **予定機能**: 広告非表示、SRS・カテゴリ作成上限の開放、詳細な統計分析。
*   **ステータス管理**: Supabaseの `profiles` テーブルに `is_pro` フラグなどの拡張余地を確保済み。

#### 使い方ガイド
*   アプリ内で閲覧可能なヘルプ機能。

### ファイル構成 (主なコンポーネント)
(詳細は以前のSPECSファイルを参照、ここでは割愛)

### 技術スタック
*   **Framework**: Next.js 16 (App Router), Expo (React Native)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4 (Web), StyleSheet (Mobile)
*   **Database**: Dexie.js (Web), expo-sqlite (Mobile) - Abstracted via Repository Pattern
*   **Architecture**: Monorepo (pnpm workspaces)
*   **Testing**: Vitest (全ワークスペース)
    *   **Note**: 全ワークスペースで Vitest を使用。Mobile版のReact Nativeコンポーネントテストは環境制約から除外し、純粋なロジックテストのみ実行。実機がない場合のテスト手順は [ANDROID_TEST_SETUP.md](./ANDROID_TEST_SETUP.md) を参照。
*   **UI Library**: `lucide-react`, `recharts`, `@hello-pangea/dnd`, `date-fns`

---

## 2. 変更履歴 (History)

これまでの主要な変更履歴です。

### [Android Emulator Setup] - 2026-01-27
#### 追加/変更 (Doc & Env)
- **Androidエミュレータ環境の構築**:
    - 実機レスでの開発・テスト環境を整備。
    - `ANDROID_TEST_SETUP.md` にトラブルシューティング（SDKパス問題、実行ディレクトリ）を追記。
    - シンボリックリンクによる `adb` パス解決を実施。

### [Refactoring & Maintenance] - 2026-01-23
#### リファクタリング (Shared/Web/Mobile)
- **共通ロジックの統合**:
    - Web版とMobile版で重複していた `TodoDetailModal` のテキスト解析ロジック (`parseContent`) を共通化。
    - `packages/shared/src/domain/todo.ts` に `parseTodoContent` 関数を実装し、単体テストを追加。
    - 両アプリからこの共通関数を呼び出すように変更し、保守性と堅牢性を向上。
- **テストカバレッジの拡充**:
    - **Web**: `TodoDetailModal` (コンポーネント), `offlineQueue` (同期), `export` (バックアップ) のテストを追加。
    - **Mobile**: `categoryUtils` (ロジック) のテストを追加。
    - **Shared**: `statistics` (ストリーク計算) のテストを追加。

### [Category Tree View] - 2026-01-22
#### 追加/変更 (Mobile)
- **カテゴリ選択のツリー化**:
    - `TodoCreateModal`, `TodoDetailModal` のカテゴリ選択画面をリニューアル。
    - `CategoryEditor` のロジックを流用し、親子関係を持つツリー表示を実装。
    - デフォルトで全ノードを展開し、アクセス性を確保。
- **カテゴリアイコン機能**:
    - Web版と同様にカテゴリにアイコンを設定可能に。
    - `IconPickerModal` を実装し、 `lucide-react-native` アイコンを選択可能に。
    - `SQLiteRepository` に `icon` カラムの保存処理を追加。
    - 作成・詳細モーダルでのアイコン表示に対応。
- **コード効率化リファクタリング**:
    - `buildCategoryTree` を `lib/categoryUtils.ts` に抽出（3箇所の重複解消）。
    - `CategoryTreePicker` 共通コンポーネントを作成（約150行のコード統合）。
- **カスタム画像アイコン機能**:
    - `expo-image-picker` を導入し、カメラ/ライブラリからアイコン画像を選択可能に。
    - 選択した画像はアプリのドキュメントディレクトリに保存。
    - `CategoryIcon` コンポーネントでLucideアイコンとカスタム画像の両方を表示。
- **TodoDetailModal の Web 移植・SRS強化 (Rebuild)**:
    - モバイル版の実装を刷新し、Web版の `TodoDetailModal` と完全に同等のUI/ロジックに再構築。
    - **完全なWeb互換性**:
        - タイトル/メモの統合入力フィールド (`parseContent` ロジック同期)。
        - カテゴリ、日時、SRS設定のグリッドレイアウト。
        - 学習実績ボックスのデザイン統一。
        - 「記録」「開始」「Postpone」アクションボタンの意匠統一。
    - **SRS/ロジック強化**:
        - SRS設定変更時の再生成ダイアログ（Web同等の挙動）。
        - 子タスク一括削除（カスケード削除）のSQLite実装。
        - `useMobileTodos` へのSRS/ルーティーン生成ロジック統合。

### [Mobile Share Feature] - 2026-01-19: モバイル版の多言語化対応 (ActivityModal, ShareCard)
- 2026-01-19: モバイル版シェア機能の実装 (ActivityModal -> ShareCard)
- 2026-01-19: モバイル版フィードバック機能の実装 (Header -> FeedbackModal, SQLite保存)
- 2026-01-19: モバイル版コンパイルエラーの修正 (MainLayoutのインポートパス修正)
- 2026-01-19: モバイル版使用ガイドの移植 (Web UsageGuideModal -> Mobile UsageGuideModal)
- 2026-01-19: モバイル版デイスケジュールUI調整 (日付ヘッダー縮小, スロット高さ調整)
- 2026-01-20: モバイル版スケジュール・カレンダー連携バグ修正 (月跨ぎ同期, 範囲拡張)
- 2026-01-20: モバイル版デイスケジュール全面リライト (SectionList → FlatList, パフォーマンス改善):
    - **ShareCard**: 学習の成果（ストリーク、総時間、完了数、ヒートマップ、円グラフ）を1枚のカード画像として生成するコンポーネントを作成。
    - **技術構成**: `react-native-view-shot` でキャプチャし、`expo-sharing` でSNS共有。
    - **UI統合**: ActivityModalに「Share」タブを追加。
    - **共通ロジック**: Web版と重複するストリーク計算ロジック (`calculateStreak`) を `packages/shared` に移動して共通化。

### [Simple Layout] - 2026-01-21
#### 追加/変更 (Mobile)
- **Simpleレイアウトの実装**:
    - **LayoutProvider**: レイアウトモード（Default/Simple）をAsyncStorageで永続管理。
    - **MainLayoutSimple**: 新レイアウトコンポーネント。ヘッダー削除、カレンダー上部配置。
    - **MainLayoutSelector**: レイアウトモードに応じてDefaultまたはSimpleを切替表示。
- **カレンダー拡張**:
    - **HomeCalendar**: `viewMode` propを追加し、週表示/月表示の切替に対応。
    - **週表示時**: ヘッダー（年月）を非表示。左右スワイプで週移動。
    - **月表示時**: ヘッダー表示、ナビゲーションボタンあり。
    - **アニメーション**: `Animated.spring` による高さ変化、スライドアニメーション。
- **MenuModal**: 設定・ガイド・フィードバックへのアクセスを集約する新モーダル。
- **Footer**: Menuボタンを追加（Simpleレイアウト用）。
    - **記録入力の直感化 (Drum Roll/Spinner)**:
    - `TodoDetailModal` の記録入力をテキストボックスからドラムロール（スピナー）形式に変更。
    - iOSの標準的なタイマーピッカー（countdownモード）を採用し、直感的な時間選択を実現。


### [Learning Materials] - 2026-01-21
#### 追加 (Doc)
- **コード解説コメントの追加**:
    - `SettingsModal.tsx` に詳細な学習用コメントを追加。Hooksの動作原理や条件分岐の意図を解説。
    - `learning/SettingsModal_Explained.md` を作成。

### [Mobile Internationalization] - 2026-01-18
#### 追加/変更 (Mobile)
- **多言語対応 (i18n) 完了**:
    - **Modals対応**: `TodoCreateModal`, `TodoDetailModal`, `SettingsModal`, `ActivityModal`, `CategoryEditor`, `SRSEditor`, `TemplateModal` の全文字列を翻訳キーに置換。
    - **ロケールファイル拡充**: `ja.json`, `en.json` に不足していた翻訳キー（同期ステータス、アクティビティ、設定など）を網羅的に追加。
    - **日付フォーマット**: `date-fns` のロケール (`ja`, `en-US`) をユーザー言語設定に応じて動的適用。

### [Mobile Feature Parity] - 2026-01-18
#### 追加/変更 (Mobile)
- **ActivityModalの機能強化**:
    - **円グラフ実装**: `react-native-svg`を使用し、学習時間のカテゴリ分布を表示する円グラフを追加（Analyticsタブ）。
    - **カテゴリフィルタ**: AnalyticsとHistoryの両方で、カテゴリによる絞り込み機能を追加。
    - **履歴グルーピング**: SRSやルーティンで一括生成されたタスクをグループ化して表示する機能を実装（アコーディオンUI）。
    - **ステータスフィルタ**: 履歴タブに完了/未完了のステータスフィルタを追加。
- **CategoryEditorの色選択機能**:
    - カテゴリ作成・編集時に9色から色を選択できるUIを追加。
    - Web版と同等のカラーパレットを採用。
- **UIラベルの統一**:
    - Footerの「Report」を「Activity」に変更。
    - TemplateModalのタイトルを「Templates」に変更し、Web版との用語統一を図った。
- **Todo機能の改善**:
    - `TodoDetailModal.tsx`を新規作成し、モバイル版でのタスク詳細確認・編集を可能に（Web版相当）。
    - `useMobileSync.ts`の型定義エラーを修正し、`TodoCreateModal`との連携を強化。

### [Mobile Dark Mode & Bug Fixes] - 2026-01-18
#### 修正 (Mobile)
- **日付切り替えバグ修正**: カレンダーとヘッダーで2日以上先の日付に移動できない問題を修正。
    - `HomeCalendar.tsx`: 月表示を強制リセットするuseEffectを削除。
    - `HomeDaySchedule.tsx`: スクロール起因の日付変更と外部からの日付変更を区別するフラグを追加。
- **ダークモード基盤実装**: ThemeProviderを新規作成し、Light/Dark/Systemの3モード切り替えを実装。
    - AsyncStorageでテーマ設定を永続化。
    - 主要コンポーネント（Header, Footer, HomeCalendar, HomeDaySchedule, HomeTodoList, MainLayout, SettingsModal）をダークモード対応に更新。
    - 依存パッケージ: `@react-native-async-storage/async-storage`を追加。

### [Mobile Feature Parity] - 2026-01-18
#### 追加/変更 (Mobile)
- **ActivityModalの機能強化**:
    - **円グラフ実装**: `react-native-svg`を使用し、学習時間のカテゴリ分布を表示する円グラフを追加（Analyticsタブ）。
    - **カテゴリフィルタ**: AnalyticsとHistoryの両方で、カテゴリによる絞り込み機能を追加。
    - **履歴グルーピング**: SRSやルーティンで一括生成されたタスクをグループ化して表示する機能を実装（アコーディオンUI）。
    - **ステータスフィルタ**: 履歴タブに完了/未完了のステータスフィルタを追加。
- **CategoryEditorの色選択機能**:
    - カテゴリ作成・編集時に9色から色を選択できるUIを追加。
    - Web版と同等のカラーパレットを採用。
- **UIラベルの統一**:
    - Footerの「Report」を「Activity」に変更。
    - TemplateModalのタイトルを「Templates」に変更し、Web版との用語統一を図った。
- **Todo機能の改善**:
    - `TodoDetailModal.tsx`を新規作成し、モバイル版でのタスク詳細確認・編集を可能に（Web版相当）。
    - `useMobileSync.ts`の型定義エラーを修正し、`TodoCreateModal`との連携を強化。

### [Mobile Dark Mode] - 2026-01-18
#### 追加/変更 (Mobile)
- **Modalのダークモード対応**:
    - `SRSEditor`, `CategoryEditor`, `TemplateModal`, `ActivityModal` を `useTheme` フックに対応。
    - チャート（SVG）もテーマカラー（`colors.primary`, `colors.surface` 等）を使用するように改修。
    - **統一感**: アプリ全体の配色をWeb版のパレットに準拠させ、モード切り替え時の違和感を排除。


### [Offline Queue Error Fix] - 2026-01-17
#### 修正 (Web)
- **オフラインキューのエラーログ改善**:
    - `offlineQueue.ts`: エラーオブジェクトが`{}`と表示されていた問題を修正。Supabaseエラーの`message`, `code`, `details`, `hint`を明示的に展開してログ出力。
    - 認証セッションチェックを追加し、セッション切れの状態でキュー処理をスキップする安全策を導入。
- **クラウド削除のエラーログ改善**:
    - `dataService.ts`: `JSON.stringify`を使用してエラーオブジェクト全体を詳細に表示するよう変更。

### [Production Verification] - 2026-01-16
#### 検証
- **Web版本番ビルド検証**:
    - `.env.production` の作成と環境変数設定。
    - `npm run build:web` によるビルド成功確認。
    - ローカルでの本番サーバー起動 (`next start`) とブラウザ検証。
    - ログインページ、ホーム画面の正常動作を確認。

### [Quality Improvement] - 2026-01-11
  - Removed all console.log statements from production code (14 instances)
  - Created reusable EmptyState component for empty list/data views
  - Created **Terms of Service** and **Privacy Policy** pages with premium design
  - Updated `sitemap.ts` and `auth/page.tsx` for legal pages localization
  - Refined legal pages for **personal development** (changed 'Team' to 'Admin')
  - Fixed 'Back' button in legal pages using localized `Link` to home
### [Activity Analytics Fix] - 2026-01-11
  - Fixed type error in ActivityModal.tsx (Tooltip formatter value type)
### [Usage Guide Update] - 2026-01-10
  - Removed "PomArc Concept" from the introduction
  - Added "Feedback Request" to encourage user engagement
  - Updated icons and translations for the guide
### [Activity Analytics] - 2026-01-10
  - Implemented Pie Chart for category distribution in Analytics tab
  - Added Donut Chart in Share Card preview for visual breakdown
  - Expanded activity track in Share Card to cover the last 14 days
### [Todo Postpone] - 2026-01-10
  - Added "Move to Tomorrow" button in TodoDetailModal
  - Implemented logic to increment dueDate by 1 day
  - Handled SRS and Routine tasks by shifting individual instances
#### 追加/変更 (Shared & Web)
- **カテゴリ色設定機能**:
    - **UI**: カテゴリ編集画面 (`CategoryEditor`) で9色のパレットから色を選択可能に。
    - **反映**: 色設定を全てのビューに適用。
        - **Todoリスト**: カテゴリ名の横にカラーインジケーターを表示。
        - **DaySchedule**: タスクバーの枠線と背景色（透過）にカテゴリ色を適用。
        - **CalendarPane**: ヒートマップを「枠のみ」のスタイルに変更し、日付セル内のタスクドットにカテゴリ色を反映。
    - **視認性改善**: CalendarPaneの日付テキスト色を固定化し、ダーク/ライトモードでの視認性を確保。

### [Usage Guide Update] - 2026-01-10
#### 追加/変更 (Doc & Web)
- **使用ガイド拡充**:
    - `UsageGuideModal.tsx` に以下の項目を追加。
    - **キープ機能 (Keep)**: カレンダー/スケジュールの長押しによる日時指定機能の説明を追加。
    - **カテゴリ色分け**: カテゴリごとの色設定による視覚効果の説明を追加。
    - **多言語対応**: `ja.json` に翻訳データを追加。

### [Todo SRS & UI Polish] - 2026-01-10
#### 追加/変更 (Web)
- **SRS後付け機能**:
    - 既存TodoにSRSプロファイルを設定し、復習スケジュール（子タスク）を一括生成するロジックを `dataService.ts` に実装。
    - 詳細画面での変更検知と確認ダイアログを通じて実行。
- **履歴遷移**: Activity画面のタスク履歴からTodo詳細へジャンプ可能に改善 (`onOpenTodoDetail`)。
- **UI調整**:
    - Todo詳細画面から優先度(Priority)項目を削除。
    - 詳細画面の「開始」ボタンデザインを作成画面と統一。
- **バグ修正**:
    - ActivityModal.tsx: `onBulkDelete` の型定義重複修正。
    - TodoDetailModal.tsx: 保存時の変数宣言漏れ・JSX閉じタグ不整合の修正。
    - page.tsx: `handleUpdateTodo` におけるSRS生成ロジックの呼び出し漏れを修正。

### [Sync Logic Robustness] - 2026-01-09
#### 修正/変更 (Web)
- **db.ts リファクタリング**:
    - `@ts-ignore` を全て除去し、`ExtendedTransaction` インターフェースによる型安全な実装に変更。
    - `setTimeout` を `queueMicrotask` に置き換え、より信頼性の高い非同期実行を実現。
    - 同期ロジックを `pushToCloud` メソッドに集約し、エラーハンドリングを統一。
- **offlineQueue.ts バグ修正**: `incrementRetry` の演算子優先順位バグを修正。
- **useSync.ts**: `@ts-ignore` を除去し、適切な型アサーションに変更。

### [Comprehensive Improvements] - 2026-01-09
#### 追加/変更 (Web)
- **環境設定**: `.env.local.example` テンプレートを追加し、Supabase設定の手順を明確化。
- **ESLint設定修正**: ESLint 9 flat config形式に対応した新しい設定ファイルを作成。TypeScriptパーサーとReactプラグインを適切に設定。
- **ErrorBoundary実装**: `ErrorBoundary.tsx` コンポーネントを追加し、Reactエラーのグレースフルなハンドリングを実現。開発モードではスタックトレースを表示。

### [Bug Prevention & Code Quality] - 2026-01-01
#### 追加/変更 (Shared)
- **共有コードの拡充**:
    - `packages/shared/src/sync/mapper.ts`: Web/Mobile間で重複していた `mapper.ts` を統合。無効な日付の処理や `estimated_time → estimatedDuration` の特殊マッピングを含む。
    - `packages/shared/src/sync/syncCore.ts`: 同期コアロジック (`processTableSync`) を共通化。`allowedFieldsMap` と `supabaseTableMap` も共有。
    - `packages/shared/src/utils/date.ts`: 日付ユーティリティ (`parseDate`, `toISOString`, `compareDates`) を追加。
- **テストカバレッジ向上**: 共有コードに対するユニットテストを追加（計54件）。
- **旧コードの削除**: 各アプリの `lib/mapper.ts` を削除し、共有パッケージからインポートするよう変更。

#### 追加/変更 (Testing)
- **Vitest統一**: Mobile版のテストフレームワークをJestからVitestに移行。
    - `apps/mobile/vitest.config.ts`: 新規作成
    - `apps/mobile/vitest-setup.ts`: ネイティブモジュールのモック設定
    - React Nativeコンポーネントテストは除外（Expo環境が必要なため）

#### ドキュメント
- **開発ガイドライン**: `docs/DEVELOPMENT_GUIDE.md` を新規作成。共有コードのルール、日付処理、テストガイドライン、PRチェックリストを記載。
### [Internationalization Expansion] - 2026-01-01
#### 追加/変更 (Web)
- **15言語対応完了**:
    - 初期5言語 (日本語, 英語, ドイツ語, フランス語, スペイン語) に加え、新たに10言語を追加。
    - **追加言語**: 韓国語 (ko), 中国語 (簡体: zh-CN, 繁体: zh-TW), ポルトガル語 (pt-BR), イタリア語 (it), ロシア語 (ru), ベトナム語 (vi), インドネシア語 (id), トルコ語 (tr), オランダ語 (nl)。
- **設定最適化**:
    - `apps/web/src/middleware.ts` のマッチャー正規表現を全15言語に対応するよう更新。
    - `packages/shared/src/i18n/locales/*.json` に翻訳ファイルを追加・整備。
    - `apps/web/src/lib/date-fns-locales.ts` に全言語分の `date-fns` ロケールマッピングを追加。
- **バグ修正**:
    - 新規言語が日本語にフォールバックされる問題を、サーバーキャッシュクリア (開発サーバーの再起動) と設定ファイルの整合性確認により解決。

### [Nordic Languages Support] - 2026-01-02
#### 追加/変更 (Web)
- **北欧4言語対応**:
    - **追加言語**: スウェーデン語 (sv), ノルウェー語 (no), デンマーク語 (da), フィンランド語 (fi)。
    - これにより合計19言語に対応。
    - `packages/shared` に翻訳ファイルを追加し、`routing.ts`, `middleware.ts`, `date-fns-locales.ts` を更新。

### [Web UI Parity] - 2025-12-XX
#### 修正/変更 (Web)
- **Mobile版との同等性向上 (Layout & UX)**:
    - **DateBar**: Mobile版に合わせてUserアイコンを削除し、日付フォントサイズを拡大。
    - **BottomActions**: テンプレートアイコンを `LayoutTemplate` から `FolderTree` (Mobile版と同等の意匠) に変更。
    - **TodoCreateModal**: タイトル入力のフォントサイズをMobile版に合わせて拡大 (20px)。
- **バグ修正**:
    - **Supabase**: 環境変数の欠落によるコンソールエラーを修正（`.env.local`作成）。
- **リファクタリング (Tech Debt)**:
    - **Sharedパッケージ導入**: Web版独自の型定義 (`apps/web/src/types/index.ts`) を廃止し、`@pomarc/shared` を導入してデータモデルをMobile版と統一。
    - **型安全性向上**: Dexie.js のテーブル定義を更新し、再帰的型定義 (`Category`) による循環参照エラーを回避。
- **機能追加 (Web Auth)**:
    - **AuthContext**: アプリケーション全体で認証状態を管理するContextを実装。
    - **AuthModal**: `useAuth` フックを利用するようにリファクタリングし、ログイン/サインアップ処理を共通化。
    - **SettingsModal**: ログイン状態に応じたUI切り替え（ユーザー情報表示、ログアウト）を実装。
    - **Calendar visibility enhancement**: Added task volume indicators (dots) and detailed tooltips to the calendar. (2026-01-01)
- **Feedback system**: Implemented an in-app feedback modal integrated with Dexie and Supabase for offline-aware data collection. (2026-01-01)
- **Web Ad Integration**: Created `AdBanner` component (Google AdSense compatible) and integrated it into `AppShell`. Set up environment-variable-driven script injection in `RootLayout`. (2026-01-01)
    - **Cloud Sync**: `useSync` フックと `mapper.ts` を強化し、Dexie.js (Web) と Supabase (Cloud) の双方向同期（Pull/Push, Merge）を実装。

### [SEO Optimization] - 2026-01-06
#### 追加/変更 (Web)
- **SEO基盤の完全実装**:
    - **robots.ts**: 動的robots.txt生成。クロール許可設定とサイトマップ参照を定義。
    - **sitemap.ts**: 19言語分のサイトマップを動的生成。全言語ページのURLを検索エンジンに提供。
    - **多言語メタデータ**: `generateMetadata`関数により、各ロケールに最適化されたタイトル・説明文を動的生成。
    - **hreflangタグ**: 全19言語間の代替言語リンクを自動設定。検索エンジンが適切な言語ページを表示可能に。
    - **Open Graph / Twitterカード**: SNSシェア時のリッチプレビュー対応。タイトル、説明、画像を含む。
    - **構造化データ (JSON-LD)**: Schema.org準拠のWebApplicationスキーマを追加。リッチスニペット対応。
    - **動的OGP画像**: `opengraph-image.tsx`により、各言語に対応したスタイリッシュなOGP画像を自動生成。
    - **canonical URL**: 重複コンテンツ対策のための正規URL設定。
    
### [Statistics & Viral Features] - 2026-01-05
#### 追加/変更 (Web)
- **統計機能の強化**:
    - **Streak (連続達成)**: `lib/statistics.ts` にロジックを実装し、継続的な学習を可視化。
    - **Growth Track**: 過去12日間の活動状況をヒートマップで表示するUIコンポーネントを実装。
- **バイラル・シェア機能**:
    - **ShareCard**: ユーザーの成果（時間、タスク数、ストリーク、カテゴリ分布）をリッチな画像として生成するコンポーネントを作成 (`html-to-image` 利用)。
    - **SNS連携**: X (Twitter), Facebook, Reddit, Discord, Instagram へのシェアボタンを実装。クロスオリジン/ポップアップブロック対策済み。
- **リワードシステム**:
    - **広告非表示**: SNSシェアを行うと、24時間限定で広告が非表示になるインセンティブ機能を実装 (`localStorage` 管理)。
- **Mobile Sync**:
    - **Mobile版**: `useMobileSync.ts` による双方向同期、`mapper.ts` でデータ変換、設定画面に「Sync Now」ボタン追加
    - **Supabaseスキーマ更新**: `migration_add_missing_columns.sql` で不足カラムを追加
    - **ID生成**: Mobile版で`expo-crypto`を使用したUUID生成に統一
    - **Mobile Auth**: Mobile版 (`apps/mobile`) に `expo-secure-store` と `Supabase` を導入し、認証機能 (`AuthProvider`, `AuthModal`, `SettingsModal`) を実装。
- **Realtime Sync (Automatic Bidirectional Sync)**:
    - **Web版**: `useRealtimeSync.ts` 実装。Dexie の `hook('creating/updating/deleting')` を利用してローカルの変更を即座にクラウドへPush。Supabase Realtimeによる即時Pull。
    - **Mobile版**: `SQLiteRepository` に `onDataChange` 監視を追加。`useMobileRealtimeSync.ts` フックにより即時双方向同期を実現。
    - **ループ防止**: `trans.source === 'sync'` (Web) や `isProcessingCloudChange` フラグ (Mobile) を導入し、同期による変更の再送信を防止。
    - **Supabaseスキーマ修正**: アプリ側のデータモデルに合わせて `estimated_duration`, `notes`, `due_time`, `end_time` カラムを `todos` テーブルへ追加。
    - **型不整合の解決**: `packages/shared` の `StorageInterface` を拡張し、モノレポ内での型定義不整合を解消（ビルドとキャストによる対応）。
- **Offline Queue (オフラインキュー堅牢化)**:
    - **共通**: `packages/shared` に `SyncQueueItem`, `SyncQueueInterface` 型定義を追加。
    - **Web版**: `offlineQueue.ts` 実装。Dexie別DBでキュー管理、`navigator.onLine` でネットワーク検出、Hook失敗時に自動キュー追加。
    - **Mobile版**: `OfflineQueueRepository.ts` 実装。SQLite `sync_queue` テーブルでキュー管理、`expo-network` でネットワーク検出。
    - [x] **自動リトライ**: アプリ起動時およびネットワーク復帰時にキューを処理。3回失敗で自動削除。
### [UI & History Refinement] - 2026-01-05
#### 追加/変更 (Web)
- **ルーティーンUIの改善**:
    - **Todo作成モーダル**: 曜日指定UIをデフォルトで非表示にし、カレンダーアイコンタップで展開する方式に変更。視覚的なノイズを軽減。
    - **クリア機能**: 選択した曜日を一括でリセットする「クリア」ボタンを追加。
- **アクティビティ履歴のグループ化**:
    - **概要**: SRSやルーティーンで作成された連続タスクをアコーディオン形式でグループ化して表示。
    - **一括操作**: グループ単位での一括削除機能、展開・折りたたみ機能を実装。
- **デザインの洗練**:
    - **Todo詳細**: 「開始」ボタンの色をオレンジ（`bg-orange-500`）に変更し、作成モーダルと統一。
    - **シェアカード**: ヒートマップの色をカレンダーと統一感のあるグリーン基調に変更。
- **技術的改善**:
    - **React Hook Order修正**: `ActivityModal.tsx` での早期リターン後にフックが呼ばれる問題を解消。
    - **i18n標準化**: アクティビティモーダルの多言語対応を標準化し、全ラベルを翻訳キーに置き換え。
    - **時間未指定バグ修正**: Todo作成時に時間が未指定の場合、`dueTime` に `undefined` ではなく明示的に `null` を送信するように変更し、DB側のDEFAULT値による「0:00」への自動設定を防止。
- **使用ガイドの拡充**:
    - **コンテンツ追加**: 「コンセプト」「ルーティーン」「クラウド同期」「リワード」など、新機能や重要概念を網羅。
    - **カテゴリ化**: ガイドを「はじめに」「基本」「効率化」「振り返り」「その他」に分類し、目的の情報にアクセスしやすく改善。

### [UI Fixes & Productivity Features] - 2026-01-05
#### 追加/変更 (Web)
- **曜日指定ルーティーン機能**:
    - **WeekdayPicker**: 曜日を選択するための共有UIコンポーネントを実装。
    - **自動生成ロジック**: `dataService.addRoutineTodos` を実装。選択した曜日（月〜日）に基づいて、今後30日分のタスクをワンクリックで一括生成する機能を導入。
    - **グループ管理**: ルーティーンで生成されたタスクは `srsGroupId` で紐付けられ、一括削除等が可能。
- **Todo作成モーダルの改善**:
    - **所要時間入力の最適化**: 「記録」モード選択時のみ所要時間入力フィールドを表示し、UIをクリーンに保つよう変更。入力なしでの記録も可能。
    - **バリデーション強化**: タイトルまたはカテゴリのいずれか入力がない場合、作成をブロックするよう修正。
    - **バグ修正**: 日付のみ指定して作成した際、意図せず 0:00 (スケジュール上部) に配置される問題を解決。
- **UIコンポーネントの刷新**:
    - **テンプレート設定**: ヘッダーを「設定」から「テンプレート」に修正し、役割を明確化。
    - **シェアカード**: 配色をホワイト基調の清潔感あるデザインに刷新。SNSシェア時の見切れ問題を修正し、タグ表示を廃止してシンプル化。
    - **スケジュールビュー**: タイムライン上のタスクブロックから開始・終了時間のテキスト表示を削除し、タイトルのみのミニマルな表示に変更。
- **初期データの最適化**:
    - **カテゴリ定義**: 新規ユーザー向け初期カテゴリを「大カテゴリサンプル > 中カテゴリサンプル > 小カテゴリサンプル」の階層構造に刷新。
    - **SRS設定**: デフォルト設定を「忘却曲線」のみにシンプル化。

#### 国際化 (i18n)
- **翻訳データの拡充**: ルーティーンラベル、バリデーションメッセージ、記録モード等の欠落していたキーを全19言語に追加。

### [Documentation Update] - 2026-01-05
#### 変更
- **ロードマップ整理**: `docs/04_FUTURE.md` を更新し、完了したフェーズの整理と細かな改善だが、アプリの手触りが良くなっていると感じる。
Web版リリースに向けて、こうした「使い勝手」の部分を詰め切っていきたい。

**2026-01-10 (夜):**
ビルドエラーとSRS連携が動かない問題に対処した。
`replace_file_content` のミスで `TodoDetailModal.tsx` の構文が崩れていたのを修正。
また、`page.tsx` の `handleUpdateTodo` で `onUpdate` の引数追加に対応できていなかったのを修正。
これで既存TodoへのSRS後付け適用が完全に動作するようになった。
開発効率を上げるために、一度の修正範囲を適切に管理することの重要性を再認識。

### [Day Schedule Improvement] - 2025-12-30
#### 修正/変更 (Web & Mobile)
    - 1時間ごとのラベル表示を維持しつつ、30分枠を点線で表現。
- **実線と破線の重複排除とロジック修正**:
    - Web版: ボーダーを `border-b` から `border-t` に変更。`slot HH:00` の上端を実線、`slot HH:30` の上端を破線にすることで、3:00（実線）と3:30（破線）が正しく表示されるように修正。
    - モバイル版: `hourSlot` の共通ボーダーを削除し、`hourLine` で実線・破線を排他的に描画。実線（`#bbb`）と破線（`#d0d0d0`, `dashed`）で視認性を差別化。
- **モバイル版日付ヘッダーのスティッキー化**:
    - `FlatList` から `SectionList` に移行し、日付ヘッダーをスティッキー（上部固定）表示に変更。
    - 日付の境界（23:00〜0:00）での操作性を改善し、タイムラインの連続性を確保。
    - **バグ修正**: オフスクリーンの日付へのスクロール時に発生していた `Invariant Violation` (scrollToIndex error) を、`getItemLayout` の実装により解決。
        - [x] エラー原因の特定 (scrollToIndex)
        - [x] `MobileDaySchedule.tsx` の修正
            - [x] 不要なプロップの削除、または `getItemLayout` の再実装
            - [x] `scrollToLocation` の呼び出し内容の確認
        - [x] 動作確認
        - [x] Gitコミット＆プッシュ
- **破線の視認性向上**:
    - Web版の30分ラインの色を濃く調整 (`border-gray-100` だが見やすい位置へ)。実線を `gray-300` に強化。
    - モバイル版の30分ラインを `borderStyle: 'dashed'` を用いた破線表示に修正。

### [Testing] - 2025-12-30
#### 追加
- **自動テスト環境の導入**:
    - **Shared/Web**: Vitest を導入。高速なユニットテストとコンポーネントテスト (`React Testing Library`) を実現。
    - **Mobile**: Jest (`jest-expo`) を導入。React Native 19 / Expo 54 環境に対応した `react-test-renderer` の整合性問題を解決。
    - **一括実行**: ルートディレクトリの `npm test` で全ワークスペースのテストを実行可能に整備。
- **モバイル版テスト環境の修正**:
    - **Shared ESM 互換性調整**: `@pomarc/shared` の ESM 化を試行したが、Metro Bundler との互換性のため CommonJS に戻しつつ、Vitest 設定でパス制限を行うことで整合性を確保。
    - **Testable Architecture**: `RepositoryProvider` を `useMemo` と `try-catch` を用いて堅牢化し、テスト時にモックを注入可能に改善。
    - **Native Mocking**: `jest-setup.js` に `expo-sqlite`, `expo-crypto`, `expo-secure-store` のモック設定を追加。
    - **接続エラーの解決**: IPv6 環境およびネットワーク制限に対応するため `@expo/ngrok` を導入。
    - **ユニットテスト追加**: `useMobileTodos` の基本的なフックテストを追加。

### [Environment] - 2025-12-28
#### 変更
- **Node.js バージョンアップ**: Next.js 15 の要件を満たすため、Node.js を v18 から v20 (LTS) にアップグレード (via NVM)。

### [バージョン混在復元] - 2025-12-15
- **Webアプリの復元**: Webアプリ (`apps/web`) を 2025-12-14 07:02 (Commit: `3c0a8d0`) の状態に復元。
- **機能同期**: Mobileアプリや共有コードは最新 (2025-12-15 08:02) の状態を維持。

### [Cleanup] - 2025-12-15
#### 削除
- **不要ファイル削除**: ルートディレクトリのゴミファイル、誤コピーされた `apps/web` 内のディレクトリ (`docs`, `packages`) を削除。

### [v0.2.2] - 2025-12-16
#### 追加/変更 (Mobile)
- **テンプレート管理機能 (Template)**:
    - **カテゴリ管理**: 階層構造（大・中・小）を持つカテゴリの作成、表示（ツリー形式）、削除。
    - **SRS管理**: 忘却曲線に基づく復習プロファイルの作成、一覧表示、削除。
    - **Todo作成連携**: 作成したカテゴリやSRSプロファイルを、Todo作成モーダルから選択可能に。
- **アクティビティ機能 (Activity)**:
    - **統計**: 学習時間、完了数、チャート表示 (`react-native-svg`)。週/月/年フィルター。
    - **履歴**: 履歴一覧表示、複数選択による一括削除。
- **キープ機能 (Keep)**:
    - カレンダー/スケジュール長押しで日時を保持し、Todo作成時に自動入力。
    - フッターのUI改善（キープ中は「＋」ボタン強調＆リセットボタン表示）。

### [未リリース]
#### 追加
- **ドキュメント**: ドキュメントを `docs/` ディレクトリに統合・整理。

### [v0.2.1-beta] - 2025-12-15
#### 追加/変更 (Mobile)
- **Todo作成モーダル (Web Parity)**: Web版と同等の高機能な作成フォームを実装。
    - カテゴリ、SRSプロファイル、日時、所要時間、範囲、メモの設定が可能。
    - 「記録」「開始」「作成」の3つのアクションに対応。
- **データ層強化**: SQLiteスキーマに `memo`, `range`, `srsInterval` を追加。

### [v0.2.3] - 2025-12-22
#### 追加/変更 (Mobile)
- **タイマー機能 (Focus)**:
    - **MobileTimerView**: ポモドーロ、カウントダウン、ストップウォッチモードを実装。
    - 円形プログレスバー (`react-native-svg`) による残り時間表示。
- **Todo作成モーダル (Web Parity)**:
    - **開始連携**: 「開始」ボタンからタイマー画面へ即座に遷移可能に。
    - **UI修正**: iOS/Androidにおける日付・時間ピッカー（`DateTimePicker`）の挙動とレイアウトを最適化。
    - **UX向上**: 開始時間選択時に日付を自動補完するWeb同等のロジックを追加。


### [v0.2.0] - 2025-12-14
#### 追加
- **Nativeアプリ (Mobile)**: Expo + SQLite によるモバイルアプリ初期実装。
- **リポジトリ構成**: `apps/web`, `apps/mobile`, `packages/shared` のモノレポ構成に移行。
- **DB抽象化**: Web(Dexie) と Mobile(SQLite) でロジックを共有するための `RepositoryProvider` と `StorageInterface` の実装。

### [v0.1.2] - 2025-12-12
#### 追加/変更
- **PCフルスクリーンレイアウト**: モバイル向け制限を撤廃し、Todo/Schedule/Calendarを3カラムで一覧表示するダッシュボード形式に刷新。
- **キーボードショートカット**: `N` (新規Todo), `P`/`Space` (タイマー再生/停止), `Esc` (閉じる) を実装。

### [v0.1.1] - 2025-12-11
#### 追加
- **ドキュメント**: ドキュメントを `docs/` ディレクトリに統合・整理。
- **モーダル分離**: テンプレート設定（カテゴリ/SRS）とアプリ設定（テーマ/ガイド）を別々のモーダルに分割。
- **ダークモード**: 全コンポーネントでのダークモード完全対応。
- **アクティビティ**: 学習時間とタスク完了履歴を確認できる分析ダッシュボード。
- **タッチ操作**: カレンダー/スケジュール長押しでの日時指定タスク作成。
- **アイコンピッカー**: カテゴリ用アイコンのカスタム設定。
- **ドラッグ&ドロップ**: Todoリスト内のタスク並び替え。

#### 修正
- **モーダルZ-Index**: モーダルがクリックできない、または他の要素の裏に隠れる問題を修正。
- **Hookエラー**: ActivityModal での React Hook 呼び出し順序違反を修正。
- **型安全性**: IconPicker での TypeScript エラーを解決。
- **リファクタリング**: コードベース全体で20件以上のLintエラー（`setState`の不正使用、未使用変数など）を解消。
- **UX改善**: Todo作成モーダルの時間入力フィールドにアイコンを追加し、順序を最適化。
- **機能改善**: Todoリストの「再生」ボタンをクリックした際、完了ではなくタイマー画面へ遷移するように変更。
