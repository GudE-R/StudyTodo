# StudyTodo 実装の記録 (Implementation)

- Web版ドメインを `studytodo.vercel.app` に変更
- App Store提出用のリリースノート、キーワード、サポート情報の整備
- App Store Connect APIキーとApp IDの登録手順のドキュメント化
- Web版ルート (/) にストア申請用・サポート向けのプロダクトランディングページを構築およびデザイン改善
- AdSenseの `adsbygoogle.push()` 重複呼び出しエラーの修正 (Ref-based check)

現在の実装状況と、これまでの変更履歴を記録するドキュメントです。

## 1. 現在の実装状況 (Specs)

### プロジェクト概要
**StudyTodo** は、タスク管理、スケジュール管理、学習記録、そしてポモドーロタイマーを統合したWebアプリケーションです。

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
*   **セッション記録**: タイマー終了後、学習時間を自動的に記録。未保存の記録がある場合は戻り時に警告。
*   **記録ログ**: ヘッダーの「...」ボタンからタスクの過去の記録一覧と合計時間を確認可能。
*   **タスク完了ボタン**: 「タスク完了」ボタンで記録保存＋タスク完了＋ホームへ戻る操作を一括実行。
*   **手動記録**: 過去の学習を手動で追加可能。
*   **画面常時点灯**: タイマー動作中は画面が消えないように制御 (expo-keep-awake)。

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
*   **Developer Tools**:
    *   **Gemini CLI**: CLI based AI agent for codebase understanding and automation.
    *   **Claude Code**: Anthropic's official CLI tool for coding assistance and file manipulation.

---

## 2. 変更履歴 (History)

これまでの主要な変更履歴です。

### [Revenue Prediction & Improvement Analysis] - 2026-02-25
#### 追加 (Docs)
- **REVENUE_PREDICTION.md**: アプリの収益予測（広告・Proプラン）と改善提案（リワード広告、ゲーミフィケーション等）をまとめたレポートを作成。
- **目的**: 中長期的な収益化戦略の策定と、ユーザー継続率向上のための施策を整理するため。

### [Component Refactoring] - 2026-02-28
#### リファクタリング (Refactoring)
- **巨大コンポーネント4ファイルのカスタムフック抽出**:
    - `TodoDetailModal`(1088行→590行): `useTodoDetailForm.ts` にstate/handlers/computed抽出
    - `TodoCreateModal`(1022行→500行): `useTodoCreateForm.ts` にstate/helpers/handlers抽出
    - `MobileTimerView`(717行→250行): `useMobileTimer.ts` にタイマーエンジン全体抽出
    - `SettingsModal`(713行→640行): `useSettingsForm.ts` にリマインダー設定ロジック抽出
    - 合計: 約3540行→約1980行（**44%削減**）、ロジックとUIの責務分離を実現

### [Legacy Storage Migration] - 2026-02-28
#### 修正 (Migration)
- **`pomarc` → `studytodo` マイグレーション**:
    - `migrateLegacyStorage.ts` を新規作成。AsyncStorageキー4箇所とSQLite DB名（`pomarc.db` → `studytodo.db`）の移行処理を実装。
    - `App.tsx` で Provider 構築前にマイグレーションを実行し、既存ユーザーのデータ消失を防止。
    - WAL/SHM ジャーナルファイルの移行にも対応。二重実行防止フラグ付き。
    - 対象: `ThemeProvider.tsx`, `LayoutProvider.tsx`, `SettingsModal.tsx`, `SQLiteRepository.ts`, `OfflineQueueRepository.ts`

### [Test Coverage Improvement] - 2026-02-28
#### 追加 (Testing)
- **テストカバレッジの大幅強化**:
    - テスト総数: 172 → 188件（+16件）
    - **Mobile (`apps/mobile`)**:
        - `SQLiteRepository.test.ts`: init、シリアライズ（toDB/fromDB）、全CRUD操作（Todo/Category/SRS/Session）、onDataChangeリスナーの包括的テスト（28件）を新規作成。
        - `OfflineQueueRepository.test.ts`: add、getAll、remove、clear、incrementRetryの全メソッドテスト（10件）を新規作成。
    - **Web (`apps/web`)**:
        - `statistics.test.ts`: `calculateStreak`のストリーク計算テスト（9件）を新規作成。
        - `utils.test.ts`: `cn`（クラスマージ）、`generateId`（UUID生成）、`buildCategoryTree`（ツリー構築）のテスト（12件）を新規作成。
    - **テスト基盤修正**:
        - `vitest-setup.ts` に React Native の `__DEV__` グローバル変数定義を追加。
    - **目的**: リポジトリ層とユーティリティ関数のリグレッション防止。

### [Gemini CLI Setup] - 2026-02-28
#### 追加 (Tools)
- **Gemini CLI の導入**:
    - ターミナルから Gemini 3 モデル（Flash/Pro）を利用可能な `@google/gemini-cli` をグローバルインストール。
    - コード解析、自動化スクリプト生成、トラブルシューティングなどの開発支援ツールとして活用。
    - **目的**: 開発効率の向上と、AI エージェントによるワークフローの自動化。

### [Claude Code CLI Setup] - 2026-02-28
#### 追加 (Tools)
- **Claude Code の導入**:
    - Anthropic 公式の CLI ツール `@anthropic-ai/claude-code` をグローバルインストール。
    - Claude 3.5 Sonnet 等の強力なモデルをターミナルから直接利用可能。
    - **目的**: Gemini と並行して、最新の Claude モデルによる高度な推論とコード生成を活用するため。

### [Production Build v1.0.1] - 2026-02-26
#### 追加 (Mobile)
- **本番用ビルドの再作成**:
    - AdMobの初期化修正を反映した最新の本番ビルド（Android/iOS）を実行。
    - **Version**: 1.0.1
    - **Android**: .aab ファイルの生成 (`eas build --platform android --profile production`)
    - **iOS**: .ipa ファイルの生成 (`eas build --platform ios --profile production`)
    - **目的**: 審査提出およびTestFlightでの最終確認用。

### [AdMob Fix for TestFlight] - 2026-02-26
#### 修正 (Mobile)
- **AdMobの初期化処理の追加**:
    - `AdBanner.tsx` にて `mobileAds().initialize()` を明示的に呼び出すように修正。これにより、本番ビルド（TestFlight等）で広告モジュールが正しく初期化されない問題を解決。
    - **環境変数の警告**: EAS Buildにおいて環境変数が未設定の場合のデバッグログを追加し、設定漏れを検知しやすく改善。

### [iOS Release Screenshot Strategy Update] - 2026-02-26
#### 追加/修正 (Docs)
- **スクリーンショット撮影方針の変更**:
    - Web / Mobile 間のレイアウト差異を考慮し、ブラウザエミュレーション案から「クラウド Mac による iOS シミュレータ撮影」へ方針を転換。
    - **SCREENSHOT_PLAN.md**: クラウド Mac 環境での撮影手順（Xcode シミュレータの起動、解像度設定、画像転送）を追記し、最新の App Store 要件（6.5"/6.7", 13"）を明確化。
    - **eas.json**: クラウド Mac での即時シミュレータ実行を支援するため、`development_simulator` プロファイルを追加。
    - **目的**: 審査を確実に通すための、100% 正確なモバイル版 UI スクリーンショットを効率的に準備するため。

### [Development Build] - 2026-02-22
#### 追加 (Mobile)
- **開発用ビルド（Development Build）の作成**:
    - AndroidおよびiOS（シミュレータ用）の開発用ビルドを作成。
    - `expo-dev-client` をインストールし、`eas build --profile development` でビルドを実行。
    - iOSについてはLinux環境での利便性を考慮し、シミュレータ用のプロファイル `development_simulator` を `eas.json` に追加して実行。
- **環境整備**:
    - `eas.json` にシミュレータビルド用の設定を追加。

### [Android Production Build] - 2026-02-22
#### 追加 (Mobile)
- **プロダクション用ビルド（.aab）の作成**:
    - クローズドテスト向けに Android 用の .aab ファイルを生成。
    - **Version**: 1.0.1
    - **Version Code**: 12
    - `eas build --platform android --profile production` を実行。

### [Android Production Build] - 2026-02-22 (2回目)
#### 追加 (Mobile)
- **再ビルド（v13）による衝突回避**:
    - Google Play Console での「バージョンコード 12 重複」を解消するため再ビルド。
    - **Version**: 1.0.1
    - **Version Code**: 13

### [Store Metadata Update] - 2026-02-19
#### ドキュメント更新
- **STORE_METADATA.md**:
    - **機能説明の追加**: カレンダーとスケジュールの連携による直感的なタスク作成（長押しでの日時指定）についての記述を追加。
    - **多言語対応**: ストア掲載情報の英語版を追加。Google Play StoreおよびApp Store向けのタイトル、説明文、キーワードを翻訳し、海外ユーザーへの訴求力を強化。
    - **文字数調整**: 英語版のShort Description (80文字以内) と Keywords (100文字以内) が制限を超えていたため、表現を簡潔に修正。
    - **Webページ修正**: プライバシーポリシーのページ（Web版）が404エラーになる問題を修正。`middleware.ts`を作成し、多言語ルーティング（`[locale]`）が正しく機能するように設定。また、コンテンツを最新のポリシー（AdMob/Supabase対応）に合わせて更新し、日/英の表示切り替えに対応。
    - **目的**: ユーザーに「効率的な計画作成」というメリットを訴求するため、およびGoogle Play Consoleの審査要件を満たすため。
- **iOSリリース準備**:
    - `APPLE_RELEASE_GUIDE.md`: Apple Developer Program への登録および API キー発行の手順書を作成。
    - `SCREENSHOT_PLAN.md`: クラウドMacを使用したiOS用スクリーンショット撮影の計画書を作成。
    - `app.config.ts`: iOS 用の `bundleIdentifier` と `buildNumber` ("1.0.1") を設定。
    - `eas.json`: iOS 用の `submit` 設定（プレースホルダ）を追加。Linux からの自動アップロードの準備を完了。
- **オンボーディングのレスポンシブ化**:
    - タブレット端末や画面回転時のレイアウト崩れを修正。
    - `useWindowDimensions` を導入し、画面サイズ変更に即座に追従するように改善。
    - コンテンツに `maxWidth: 500` を設定し、大画面でも読みやすいレイアウトを維持。
    - `FlatList` に `getItemLayout` を追加し、回転時のスクロール位置の安定性を向上。

### [Privacy Policy Update] - 2026-02-19
#### ドキュメント更新
- **プライバシーポリシーの改訂**:
    - **収集データの明確化**: ユーザーアカウント作成時のEmail収集と、AdMobによるデバイスID/広告データ収集を明記。
    - **第三者サービス**: Supabase（認証・DB）とGoogle AdMobの使用を明示し、それぞれの役割とデータ保護について追記。
    - **目的**: Google Play Consoleのデータセーフティ要件およびAdMobポリシーへの準拠。

### [Web App Renaming & Privacy Policy Fix] - 2026-02-19
#### 変更 (Web)
- **Webアプリの名称変更 (StudyTodo -> StudyTodo)**:
    - リブランディングに伴い、アプリ内の「StudyTodo」表記を「StudyTodo」に変更。
    - `robots.ts`, `sitemap.ts`: ベースURLの更新。
    - `ActivityModal.tsx`: シェアカードのタイトルを `StudyTodo Share` に変更。
    - `share-image.ts`: ダウンロードファイル名を `studytodo-stats.png` に変更。
    - `export.ts`: エクスポートファイル名のプレフィックスを `studytodo` に変更。
    - `ThemeContext.tsx`: LocalStorageキーを `studytodo-theme` に変更。
- **プライバシーポリシーの修正**:
    - `docs/PRIVACY_POLICY.md` および `apps/web/src/app/[locale]/privacy/page.tsx` 内の連絡先メールアドレスを `studytodoapp@gmail.com` に更新。
- **ビルド・デプロイ調整**:
    - `middleware.ts` と `proxy.ts` の競合を解消するため、`middleware.ts` を削除。
    - Vercelデプロイ安定化のため、Node.jsバージョンを 20 に固定し、`vercel.json` を追加。
- **状況報告**:
    - ローカルビルド (`npm run build`) は正常完了を確認。
    - Vercelデプロイ (`https://studytodo.vercel.app`) にて「**StudyTodo**」への名称変更およびプライバシーポリシーのメールアドレス更新が反映されていることを確認。
    - `/privacy` からの自動リダイレクト設定を行い、審査用URLのアクセシビリティを改善。


### [Feedback Enhancement] - 2026-02-19
#### 追加/修正 (Mobile)
- **未ログインユーザーのフィードバック送信**:
    - `FeedbackModal` を修正し、未ログインユーザーの場合でも `supabase` に直接フィードバックを挿入するようにロジックを追加。
    - ログインユーザーは既存の同期システム (`useMobileRealtimeSync`) を使用し、未ログインユーザーはモーダルから直接 `insert` を実行することで、全てのユーザーからのフィードバックを確実に収集できるようにした。
- **RLSポリシー修正 (Database)**:
    - `feedbacks` テーブルの `user_id` をNullableに変更。
    - 未認証ユーザー (`auth.uid() IS NULL`) からのINSERTを許可するポリシー `Allow anonymous feedback insert` を追加。

### [AdMob Integration] - 2026-02-19
#### 追加 (Mobile)
- **AdMobの導入**:
    - `react-native-google-mobile-ads` をインストールし、`app.json` にプラグイン設定を追加。
    - 開発用としてGoogle提供のテストApp ID (`ca-app-pub-3940256099942544~3347511713`) を設定。
- **バナー広告の実装**:
    - `AdBanner` コンポーネントを再実装。`BannerAd` を使用してアンカーアダプティブバナーを表示。
    - エラーハンドリングを追加し、ロード失敗時には非表示またはエラーメッセージを表示するように配慮。

### [Shared Package Recovery] - 2026-02-19
#### 復旧 (Shared)
- **パッケージ整合性の確認**:
    - `packages/shared` 内のファイルが破損している疑いがあったため、コミット `d7eedfb` との比較検証を実施。
    - 結果として、現在のHEAD (`e810d47`) は既に正しいファイルを含んでおり、破損はないことが確認された。
- **テスト検証**:
    - `packages/shared` で `npm test` を実行し、全93テストが通過することを確認。機能的な整合性も保証された。

### [Repository Revert] - 2026-02-18
#### リポジトリの状態復元
- **リセット実行**: モバイル版の実装方針見直しのため、2026年2月16日 11:08 (Commit: `cfa1f55`) の状態へハードリセットを実行。
- **目的**: 複雑化したコードベースを整理し、安定した地点から再スタートするため。
- **影響**: 2026-02-16 11:08以降の変更（技術的負債のクリーンアップの一部など）は破棄されたが、必要なものは再度適用予定。

### [Technical Debt Cleanup] - 2026-02-16
#### リファクタリング (Mobile)
- **`console.log` の `__DEV__` ガード化**:
    - 本番ビルドで不要なログ出力を抑制するため、Mobile版の全 `console.log` (17件) を `if (__DEV__)` ガードで囲んだ。
    - 対象ファイル: `useMobileRealtimeSync.ts`, `useMobileSync.ts`, `useMobileTodos.ts`, `useMobileCategories.ts`, `OfflineQueueRepository.ts`, `HomeCalendar.tsx`
- **デッドコードの削除**:
    - 未使用ファイル10件を削除し、コードベースを整理。
    - 削除ファイル: `MobileTodoCreateModal.tsx` (旧版), `LayoutV2.tsx`, `ExpandablePane.tsx`, `TimerModal.tsx`, `widgets/` ディレクトリ全体 (6ファイル)
- **不要ファイルの削除**: `test_schedule.js` (ルート), `plan.txt` (Mobile) を削除。
- **型安全性の向上**:
    - `@ts-ignore` / `as any` 17箇所をすべて型安全なコードに置き換え。
    - Mobile: `CategoryEditor`(5箇所), `CategoryTreePicker`(2箇所), `TodoCreateModal`(1箇所), `IconPickerModal`(1箇所), `i18n/index.ts`(1箇所)
    - Web: `useRealtimeSync`(3箇所), `AdBanner`(1箇所), `request.ts`(1箇所), `layout.tsx`(1箇所)
    - 主な手法: 不要キャスト削除、`LanguageDetectorAsyncModule`型付与、Dexie `Table`型ヘルパー、`window.adsbygoogle`型宣言、`readonly string[]`キャスト
- **テストカバレッジの向上**:
    - テスト総数: 84 → 120件（+36件）
    - ビジネスロジックの純粋関数化:
        - `generateRoutineTodos`: ルーティンTodo生成ロジックを`useMobileTodos`から`packages/shared/src/domain/routineTodos.ts`へ切り出し (テスト9件)
        - `calculateSrsDateShifts`: SRS日付シフトロジックを`useMobileTodos`から`packages/shared/src/domain/srsDateShift.ts`へ切り出し (テスト7件)
    - エッジケーステスト追加:
        - `syncCore.test.ts`: ハンドラーエラー伝播、大量アイテム処理 (+3件)
        - `srs.test.ts`: 空intervals、dueDate未指定、srsProfileId/srsInterval除外 (+4件)
    - `useMobileTodos.ts`: 共有純粋関数への置き換えでコード量30行以上削減

### [Mobile Onboarding] - 2026-02-15
#### 追加 (Mobile)
- **オンボーディングフローの実装**:
    - アプリ初回起動時に表示されるオンボーディング画面 (`OnboardingScreen`) を実装。
    - **機能概要**:
        - アプリの主要機能（タスク管理、タイマー、SRS、分析）をスライド形式で紹介。
        - **UIコンポーネント**: `OnboardingSlide` (各スライド), `Paginator` (ドットインジケータ)。
        - **状態管理**: `OnboardingProvider` で完了状態を `AsyncStorage` に永続化。
        - **条件付きレンダリング**: `MainLayoutSelector` で未完了ユーザーにはオンボーディングを強制表示。
    - **デザイン**:
        - アイコンとテキストを中心としたシンプルでわかりやすいデザイン。
        - テーマカラー（`AppTheme`）に連動し、ライト/ダークモードに対応。
    - **多言語対応 (i18n)**:
        - `ja.json` と `en.json` に `onboarding` セクションを追加。
        - `useTranslation` フックを使用してハードコードされたテキストを翻訳キーに置換。
        - ユーザーのフィードバックに基づき、日本語の説明文を簡潔に修正（"タスクを作成しましょう。"）。

### [Environment Migration] - 2026-02-09
#### 変更 (Environment)
- **開発環境の移行**:
    - 以前のデュアルブート（SSD分割）構成から、Windowsホスト上のVirtualBoxでの運用へ移行完了。
    - Linux Mint環境を仮想マシンとして構築・起動可能にした。

### [Marketing Materials] - 2026-01-27
#### 追加 (Doc)
- **マーケティング資料の作成 (`docs/07_MARKETING.md`)**:
    - アプリのキャッチコピー（日/英）、サブタイトル、ASOキーワードを策定。
    - "Record, Measure, Plan - All in one" をメインメッセージとして定義。
    - `welcome.subtitle` (ja/en) を新コピーに更新。

### [Project Renaming] - 2026-01-27
#### 変更 (All)
- **プロジェクト名の変更 (StudyTodo -> StudyTodo)**:
    - ユーザー要望によりプロジェクト名、パッケージスコープ、DB名、設定ファイルを一括変更。
    - `@pomarc/shared` -> `@studytodo/shared`
    - `apps/web`, `apps/mobile` の全インポートパスを置換。
    - `supabase/config.toml` の `project_id` を更新。

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
    - `MainLayoutSimple.tsx`: スケジュールペインの `PanResponder` 生成を `useRef` に移動し、再レンダリングごとの生成コストを削減。
- **カレンダースワイプの不具合修正**:
    - `MainLayoutSimple.tsx`: `PanResponder` 内での State 参照不具合 (Stale Closure) を修正。
    - `calendarMode` を `useRef` で追跡することで、月表示モード時のスワイプ操作が正しく月移動として判定されるようになった。
- **週表示のアニメーション改善**:
    - `MainLayoutSimple.tsx`: コンテナごと移動させる旧アニメーション（空白が見える原因）を廃止。
    - `HomeCalendar.tsx`: コンポーネント内部で `fadeAnim` と `slideAnim` を実装し、日付変更時にコンテンツがクロスフェード・スライドするなめらかな演出を追加。
    - また、同週・同月内での日付選択時にはアニメーションしないように判定ロジック (`isSameWeek`/`isSameMonth`) を追加し、操作感を向上。



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

### [Mobile Onboarding Responsive Fix] - 2026-02-20
#### 修正 (Mobile)
- **オンボーディング画面のレスポンシブ対応**:
    - タブレット端末でオンボーディング画面を開いた際にレイアウトが崩れる問題を修正した。
    - 原因は `Dimensions.get('window')` による静的な幅計算が画面回転や異なるデバイスサイズに追従していなかったこと、およびコンテンツが横に伸びすぎていたこと。
    - **修正内容**:
        1. `useWindowDimensions` フックを使用して、画面回転時などに動的にレイアウトが再計算されるように変更。
        2. スライドコンテンツに `innerContainer` を導入し、`maxWidth: 500` を設定。これにより、iPad などの大画面でもコンテンツが中央に美しく配置されるようになった。
        3. `FlatList` に `getItemLayout` を実装。回転時に現在のスライドがズレる問題を防止し、安定したページング動作を実現。
    - これで、スマホとタブレットの両方で最適なユーザー体験を提供できるようになった。

- **スケジュール画面の座標ずれ修正**:
    - きーぷ状態でタスクを作成した際に、ラベルが指定した位置（線）を中心に配置されるように見えていたバグを修正。
    - 原因は、時間の線がスロットの中央に描画されていたのに対し、タスクがスロットの上端から描画されていたことによる15分（半スロット）のずれ。
    - 時間の線をスロットの境界（上端）に移動し、全ての描画座標を線に合わせるよう調整した。
- **スケジュール画面の時間表記消失の修正**:
    - 前回の修正で `height: 0` のコンテナを使用したことにより、一部の環境で時間の数字（08:00など）が非表示になっていた問題を修正。
    - 絶対配置と適切なコンテナ高さを設定することで、表示の復旧と正確な位置合わせを両立。
    - タブレット端末や画面回転時のレイアウト崩れを修正。
    - `useWindowDimensions` を導入し、大画面向けに `maxWidth: 500` を設定。
- **スケジュール表示の座標ずれ修正**:
    - 描画位置の基準をスロット中央から境界（上端）に変更し、タスクの開始位置が時間の線と完全に一致するように修正。
    - 修正に伴う時間表記（数字）の消失バグも、絶対配置の最適化により解決。
- **安定性向上のためのテスト導入**:
    - 座標計算ロジックを `src/lib/scheduleUtils.ts` に抽出し、単体テストを追加。
    - 複雑なレイアウト調整時のデグレードを自動的に検知できる体制を構築。

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
  - Removed "StudyTodo Concept" from the introduction
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
    - **追加言語**: 韓国語 (ko), 中国語 (簡体: zh-CN, 繁体: zh-TW), ポルトガル語 (pt-BR), イタリア語 (it), ロシア語 (ru),
- **多言語対応 (i18n):**
  - **ライブラリ:** `i18next`, `react-i18next`, `expo-localization` を使用し、英語・日本語に対応。
  - **設定:** `apps/mobile/src/i18n/index.ts` で設定。端末の言語設定を自動検知し、未対応言語の場合は英語にフォールバック。
  - **Localeファイル:** `packages/shared/src/i18n/locales/` に `ja.json` と `en.json` を配置。
  - **オンボーディング:** スライド内容（タイトル、説明文）を全て多言語化。ユーザーフィードバックに基づき、「カレンダー連携（拡大機能）」「フィードバック機能」「タイマー3種」などの説明を精緻化。

- **オンボーディング機能:**
  - **構成:** 全7スライド（Welcome, Manage, Calendar, Focus, Automate, Scale, Feedback）。
  - **UI:** `OnboardingScreen` (カルーセル), `Paginator` (ドットインジケーター), `OnboardingSlide` (スライドコンポーネント)。
  - **永続化:** `AsyncStorage` を使用して完了状態を保存し、次回起動時はスキップ。
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
### [Layout Refactoring] - 2026-02-13
*   **レイアウト名称変更**:
    *   Simple Layout -> **レイアウト1** (デフォルト)
    *   Default Layout -> **レイアウト2**
    *   設定画面での表示順序を「レイアウト1」「レイアウト2」の順に変更。
*   **デフォルト設定変更**:
    *   新規ユーザーおよび設定未保存時のデフォルトレイアウトを「レイアウト1」に変更。

### [Routine Feature Fix & Enhancement] - 2026-02-13
*   **不具合修正**:
    *   Todo作成時にルーティーン（繰り返し）設定が反映されない問題を修正。
    *   `TodoCreateModal` と `useMobileTodos` の連携不備を解消し、指定した曜日に基づいて向こう30日分のタスクを一括生成するように実装。
*   **機能追加**:
    *   **ルーティーン編集機能**:
        *   Todo詳細画面からルーティーン設定（曜日）を変更可能に。
        *   変更時、既存の同グループタスクを一括削除し、新しい設定で再生成するロジックを実装。
        *   `SQLiteRepository` に `deleteTodosByGroupId` メソッドを追加。
    *   **UI改善**:
        *   詳細画面のSRS/ルーティーン設定ボタンのレイアウトを作成画面と統一（SRSボタンをメイン、ルーティーンはアイコンのみのサブボタン化）。
*   **仕様確認**:
    *   SRSとルーティーンの同時利用について：現状はルーティーン生成が優先され、SRS復習タスクの自動生成は行われない仕様であることを確認。

### [Todo Detail Refactoring] - 2026-02-13
*   **レイアウト変更**:
    *   `TodoDetailModal` のUIを `TodoCreateModal` に合わせる形でリファクタリング。
    *   グリッドレイアウトを修正し、終了時刻（End Time）と、記録時間（Duration）の入力欄を追加。
*   **機能統合**:
    *   フッターの「記録」ボタンを廃止し、「保存」ボタンに機能を統合。
    *   **仕様変更**:
        *   時間（分）を入力して保存 → 学習セッション（実績）を記録し、Todoを更新。
        *   時間を入力せずに保存 → 実績は記録せず、Todoの内容（完了状態など）のみ更新。

### フェーズ 4: モバイルアプリ最適化 (継続中)
*   **Todo Recording UI Revert & Alignment (2026-02-13)**:
    *   `TodoDetailModal`: ユーザー要望により、記録機能を以前の「フッターでのモード切り替え」方式に戻した。Duration入力欄をメイングリッドから削除し、記録ボタン押下時にフッターに表示されるように変更。
    *   `TodoCreateModal`: 上記に合わせてUIを統一。Duration入力をグリッドから削除し、フッターの記録ボタン（チェックマーク）で記録モードを切り替える仕様に変更。作成と同時に学習記録も保存されるように実装。
    *   **Refinements**:
        *   記録モード時のフッターボタン配置を `[保存] [時間] [キャンセル]` の順に変更 (使いやすさ向上)。
        *   時間が「0」または空欄の場合は、セッション履歴を作成せずにタスクの更新（完了化）のみを行うようにロジックを修正。
        *   **Layout Alignment**:
            *   `TodoCreateModal` と `TodoDetailModal` の日時入力レイアウトを変更。
            *   左側に日付（縦いっぱい）、右側に開始時間・終了時間を縦並びに配置し、視認性を向上。

### [Git Configuration Fix] - 2026-02-13
*   **Git設定の修正**:
    *   `user.email` が誤って設定されていたため、Githubのヒートマップに反映されない問題を修正。
    *   正しいメールアドレス (`gude1228@outlook.jp`) に変更。
    *   `git filter-branch` を使用して、過去のコミット（21件）のAuthor情報も修正し、履歴を整合させた。

### [Schedule Color Rendering Fix] - 2026-02-13
*   **不具合修正**:
    *   `HomeDaySchedule` コンポーネントで、時間指定されたタスクが表示されない（および色が反映されない）問題を修正。
    *   タスクデータ (`todos`) とカテゴリ (`categories`) を取得し、タイムライン上に色付きのブロックとしてレンダリングする処理を実装。
    *   `dueTime` に基づく配置と、`endTime` (またはデフォルト長) に基づく高さ計算を追加。

### [SRS Logic Update] - 2026-02-14
*   **SRS Date Shift Logic (Refined)**:
    *   **Problem**: SRSタスクの日付を変更すると、既存のスケジュールが残ったまま新規スケジュールが追加され、重複してしまう（または単にずれない）。
    *   **Solution**: `useMobileTodos` の `updateTodo` を修正。
        *   日付 (`dueDate`) が変更される場合、そのタスクが SRS グループに属していれば、**そのタスクの元々の日付より未来にあるタスクのみ**を、同じ日数分だけずらす (`Shift`)。
        *   例: 4回目の予定を2日遅らせた場合、5回目以降の予定も2日遅れるが、完了済みの1〜3回目は変更されない。
        *   これにより、過去の履歴を維持しつつ、未来のスケジュールの整合性を保つ。

### [Testing Documentation] - 2026-02-14
*   **テスト手順書の作成**:
    *   Login, Sync (Upload/Download), Realtime Sync の手動テスト手順を `docs/TESTING_PROCEDURES.md` に策定した。

### [SRS History Grouping & Date Fix] - 2026-02-13
*   **SRS履歴のグルーピングと日付表示修正**:
    *   **Problem**: SRSタスクが履歴画面でバラバラに表示され、日付も作成日 (`createdAt`) が表示されていたため、学習計画と実績の確認が困難だった。
    *   **Solution**:
        *   `TodoCreateModal`: SRSタスク作成時に `srsGroupId` を生成・付与するように変更。これにより、初回作成時からグループIDを持つようになり、履歴画面でまとめられる。
        *   **Bug Fix**: SRS選択時に `addSRSTodos` を使用するように修正し、復習用のタスクが一括作成されるようにした。
        *   `ActivityModal`: 履歴リスト（アコーディオン内）の日付表示を `createdAt` から `dueDate` に変更。フォーマットも `MM/dd (EEE)` とし、時間表示を削除。

### [Git Author Standardization] - 2026-02-14
*   **Git Author/Committer 統一**:
    *   Githubヒートマップ反映問題の追加対応として、Author名とCommitter名を全て `GudE-R` に、メールアドレスを `gude1228@outlook.jp` に統一。
    *   表記揺れ（`Gude` vs `GudE-R`, `Gude1228` vs `gude1228`）を解消し、Githubの集計漏れを防ぐ。

### [Layout Selection Improvement] - 2026-02-15
- **目的**: 誤操作によるレイアウト変更を防ぎ、明確なプレビューを提供する。
- **変更点**:
  - `SettingsModal` におけるレイアウト選択を「適用前に確認」するフローに変更。
  - プレビュー用に一時的な `selectedLayout` ステートを追加。
  - レイアウト変更を確定するための「保存」ボタンをモーダルヘッダーに追加。
  - レイアウトプレビュー画像を実際のスクリーンショットに更新。
- **検証**: レイアウト切り替えとUI更新の手動テストを実施し確認。

### [Signup Improvements] - 2026-02-15
- **目的**: パスワード確認機能を追加し、サインアップ時のユーザーエラーを防止する。
- **変更点**:
  - `AuthModal` を更新し、サインアップモードに「パスワード確認」フィールドを追加。
  - 送信前にパスワードが一致することを確認するバリデーションロジックを追加。
  - セキュリティのため、ログイン/サインアップモード切り替え時にパスワードフィールドをクリアするように変更。
- **検証**: TypeScriptチェックとユーザーによる動作確認を実施。

### [Activity Logic Update] - 2026-02-14
- **目的**: アクティビティ画面において、サブカテゴリの時間を親カテゴリの集計に含める。
- **変更点**:
  - `getAllChildCategoryIds` と `getCategoryHierarchy` を含む `categoryUtils.ts` を作成。
  - `ActivityModal` を更新し、`stats`, `history`, `chart`, `heatmap` のフィルタリングに `getAllChildCategoryIds` を使用するように変更。
  - `categoryUtils.test.ts` にユニットテストを追加。
- **検証**: 再帰的なカテゴリマッチングロジックを確認するユニットテストを実行。

### [Timer UI Redesign] - 2026-02-15
- **目的**: タイマーの視認性を最大化し、気が散る要素を最小限にする。
- **変更点**:
  - `MobileTimerView` を更新し、タイマーサークルのサイズ（幅80%）とフォントサイズを拡大。
  - ヘッダー/フッターのパディングを削減し、画面幅を最大限に使用するように変更。
  - 再生/一時停止ボタンのサイズを64pxに縮小。
  - **改善**: レイアウトを調整し、タスク情報をより上部に配置、タイマーサイズを幅88%にさらに拡大。
### [Mobile Notifications] - 2026-02-16
#### 追加 (Mobile)
- **ローカル通知機能の実装**:
    - `expo-notifications` を導入し、アプリ内およびバックグラウンドでの通知を可能にした。
    - **機能**:
        - **タイマー完了通知**: ポモドーロやタイマーの終了時に音と振動で通知。
        - **デイリーリマインダー**: 設定した時間に毎日学習を促す通知を送信。
    - **実装詳細**:
        - `useNotification` フックを作成し、権限リクエスト、スケジュール、キャンセル処理を集約。
        - `useTimer` フックと統合し、タイマー開始時に通知を予約、停止/終了時にキャンセルするロジックを実装。
        - `SettingsModal` にリマインダー設定（ON/OFF、時間設定）を追加。Android/iOSのUI差異（DateTimePicker）を吸収。
        - **永続化**: リマインダー設定は `AsyncStorage` に保存し、アプリ再起動後も設定を維持。
    - **多言語化**: 通知タイトル・本文および設定画面のテキストを日/英対応。

### [Activity Modal Refactoring] - 2026-02-16
#### リファクタリング (Mobile)
- **目的**: 巨大化した `ActivityModal.tsx` (約1000行) の保守性向上と関心の分離。
- **変更点**:
    - **フック抽出**: 
        - `useActivityAnalytics`: グラフデータ計算、期間フィルタリング、集計ロジック。
        - `useActivityHistory`: 履歴リストの生成、フィルタ、グループ化、選択・削除ロジック。
    - **コンポーネント分割**:
        - `ActivityCharts`: 棒グラフ・円グラフの表示。
        - `ActivitySummary`: 集中時間・完了数のカード表示。
        - `ActivityHistory`: 履歴リスト表示と操作UI。
    - **成果**: 
        - `ActivityModal.tsx` を約250行まで削減。
        - 各コンポーネントの責務が明確化され、テストと保守が容易に。
        - ロジックの再利用性が向上（Web版への移植も視野）。

### [Android Build Fix] - 2026-02-18
#### 修正 (Android)
- **ビルドエラーの解消**:
    - Androidビルド時に発生していた  エラーを特定。
    - 原因はGradleキャッシュまたはロックファイルの破損。
    -  ディレクトリを削除し、Gradleキャッシュをリセットすることで解決を図った。
- Vercelリダイレクト設定の追加: `/privacy` -> `/ja/privacy` ([vercel.json](file:///home/gude/Dev/StudyTodo/vercel.json))
- Next.jsミドルウェア設定の修正: `proxy.ts` のマッチャーに `/privacy` を追加し、Next.js v15+ の規約に準拠
- ストアメタデータのリファレンスURLを検証済みURLに更新 ([STORE_METADATA.md](file:///home/gude/Dev/StudyTodo/docs/STORE_METADATA.md))
