# StudyTodo メジャーアップデート計画
> 作成日: 2026-03-21
> コンセプト: **「完全1人用の手帳アプリ」** — 自己研鑽に特化した、紙の質感を持つTodo & ジャーナルアプリ

---

## 0. アプリ方針の転換

### 新しいポジショニング
StudyTodoは **完全1人用のTodo & ジャーナルアプリ** とする。
SNSシェア・ソーシャル要素を全て削除し、ユーザーの自己研鑽を静かにサポートする「自分だけの手帳」に集中する。

### 削除対象: Share機能

| 削除対象 | ファイル |
|---------|----------|
| **Web: ShareTab** | `apps/web/src/components/activity/ShareTab.tsx` |
| **Web: ShareCard** | `apps/web/src/components/activity/ShareCard.tsx` |
| **Web: 画像生成** | `apps/web/src/lib/share-image.ts` |
| **Mobile: ShareCard** | `apps/mobile/src/components/activity/ShareCard.tsx` |
| **i18n: shareセクション** | 全19言語の `share.*` キーを削除 |
| **i18n: activity内share関連** | `activity.shareTitle`, `activity.shareSocial`, `activity.shareSocialDesc`, `activity.downloadOnly` 等 |

### 変更対象

| 変更対象 | 内容 |
|---------|------|
| **Web: ActivityModal** | `share` タブを削除。`analytics` / `history` の2タブ構成に |
| **Mobile: ActivityModal** | `share` タブを削除。2タブ構成に |
| **Web: InterstitialAd** | 24h広告非表示リワード（`adFreeUntil`）のロジック削除 |
| **依存パッケージ** | `html-to-image` が不要になる可能性あり（他で使用していなければ削除） |

### 停止対象: モバイル版クラウド同期・認証

Pro機能リリースまで、モバイル版の Supabase 認証・クラウド同期を一時停止する。
モバイル版は SQLite によるローカル完結で動作するため、DB接続なしで問題ない。
**同期済みデータはローカル（SQLite）に残る。** データ喪失は発生しない。

| 対象 | 内容 |
|------|------|
| **Mobile: AuthProvider** | 認証機能を無効化（UIからログイン導線を非表示に） |
| **Mobile: RealtimeSync** | Supabase リアルタイム同期を停止 |
| **Mobile: SettingsModal** | 「クラウド同期」セクションを「Proプランで提供予定」表示に変更 |
| **Mobile: AuthModal** | 非表示化 |

**維持するもの:**
- モバイル版の SQLite によるローカルデータ管理（完全オフライン動作）
- 同期済みデータはそのままローカルに保持
- Web版の Supabase 認証・クラウド同期（引き続き有効）

**Pro機能リリース時の復活計画:**
- モバイル版のクラウド同期を Pro プラン限定機能として復活
- Web↔Mobile 間のデータ同期は Pro ユーザーのみ利用可能に
- 詳細は [PRO_PLAN.md](./PRO_PLAN.md) を参照

### オンボーディング画面の更新（モバイル版）

モバイル版のオンボーディングを以下の内容に更新する:

1. **アプリ紹介**: 自己研鑽に特化したTodo & ジャーナル手帳アプリ
2. **基本機能の説明**: タスク管理、ポモドーロタイマー、SRS（間隔反復）
3. **ジャーナル機能の紹介**: 1人SNSとして学びや気づきを記録できる（設定でオン/オフ可能）
4. **オフライン完結の説明**: データはすべて端末内に保存。インターネット接続不要
5. **Proプランの予告**: 将来のアップデートで、クラウド同期（Web↔Mobile間）やプレミアム機能を提供予定
6. **テーマ選択**: ペーパーテーマを含む配色の選択

### 削除しないもの
- 広告表示（AdSense / AdMob）自体は維持
- Web版クラウド同期（引き続き有効）

### 今回のアップデート対象

> **変更はモバイル版（apps/mobile）のみ。Web版は後回しとする。**
>
> Web版の変更（Share削除、ペーパーテーマ、ジャーナル等）は別フェーズで実施。

---

## 1. 紙質感テーマ（ペーパーテーマ）

### コンセプト
StudyTodoを「デジタルツール」から「手帳アプリ」へ。背景・カードに紙の質感を持たせ、手帳を開いているような体験を提供する。

### 提案A: クラシックノート風
- **背景**: クリーム色 (`#FAF8F0`) に薄い罫線テクスチャ（CSS repeating-linear-gradient）
- **カード**: ホワイト (`#FFFEF7`) にごく薄いドロップシャドウ + 微細な紙粒テクスチャ（CSS noise filter）
- **アクセント**: インクブルー (`#2C5282`)
- **ボーダー**: 薄いセピア (`#E8E0D0`)
- **フォント感**: 通常フォントのまま、letter-spacingを少し広げて手帳的な余白感
- **ダークモード時**: ダークブラウン (`#2D2319`) ベースの「革手帳」風

```css
/* 提案A: クラシックノート */
:root[data-theme="paper-classic"] {
  --background: #FAF8F0;
  --foreground: #3D3529;
  --card-bg: #FFFEF7;
  --accent-primary: #2C5282;
  --border-color: #E8E0D0;
  --surface: #F5F0E6;
}
.dark[data-theme="paper-classic"] {
  --background: #2D2319;
  --foreground: #E8DFD0;
  --card-bg: #3A2E22;
  --accent-primary: #7CB3E0;
  --border-color: #4A3F33;
  --surface: #342A1F;
}
```

### 提案B: 和紙風（ミニマル）
- **背景**: 和紙のような温かみのあるオフホワイト (`#F7F3EC`) + 微細なノイズテクスチャ
- **カード**: 漉いたような柔らかい白 (`#FDFBF5`) + 繊維を模した極薄ライン
- **アクセント**: 墨色 (`#2D3436`) と朱色 (`#C0392B`) のツートーン
- **ボーダー**: 和紙の端のような柔らかいグレー (`#D5CDC0`)
- **特徴**: 余白を多めに取り、「間」を大切にしたレイアウト
- **ダークモード時**: 深い藍色 (`#1A1F3A`) ベースの「藍染和紙」風

```css
/* 提案B: 和紙ミニマル */
:root[data-theme="paper-washi"] {
  --background: #F7F3EC;
  --foreground: #2D3436;
  --card-bg: #FDFBF5;
  --accent-primary: #C0392B;
  --accent-secondary: #2D3436;
  --border-color: #D5CDC0;
  --surface: #EDE8DF;
}
.dark[data-theme="paper-washi"] {
  --background: #1A1F3A;
  --foreground: #E0DCD4;
  --card-bg: #242A4A;
  --accent-primary: #E07B6B;
  --accent-secondary: #B0A899;
  --border-color: #3A4060;
  --surface: #1F254A;
}
```

### 提案C: システム手帳風（リッチ）
- **背景**: レザー調の薄いベージュ (`#F2EDE4`) + ステッチ風のボーダー装飾
- **カード**: リフィル用紙風の純白 (`#FFFFFE`) + 左端に縦ライン（バインダー穴風）
- **アクセント**: ゴールドブラウン (`#8B6914`)
- **ボーダー**: レザー色 (`#C4B59B`)
- **特徴**: カードの左端に装飾ライン、セクション区切りにタブ風のUI
- **ダークモード時**: ダークレザー (`#1C1814`) + ゴールドアクセント

```css
/* 提案C: システム手帳 */
:root[data-theme="paper-planner"] {
  --background: #F2EDE4;
  --foreground: #2C2418;
  --card-bg: #FFFFFE;
  --accent-primary: #8B6914;
  --border-color: #C4B59B;
  --surface: #EAE3D6;
  --card-line: #E8E0D0; /* バインダー穴風ライン */
}
.dark[data-theme="paper-planner"] {
  --background: #1C1814;
  --foreground: #E0D8C8;
  --card-bg: #2A2420;
  --accent-primary: #D4A843;
  --border-color: #4A4035;
  --surface: #241E1A;
  --card-line: #3A3228;
}
```

### 共通CSS: 紙テクスチャ

```css
/* 紙のノイズテクスチャ (SVGフィルタ) */
.paper-texture {
  position: relative;
}
.paper-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* ノイズSVG */
  pointer-events: none;
  z-index: 0;
}

/* 罫線テクスチャ（提案A用） */
.lined-paper {
  background-image: repeating-linear-gradient(
    transparent,
    transparent 27px,
    #E8E0D0 27px,
    #E8E0D0 28px
  );
}

/* カードの紙質感シャドウ */
.paper-card {
  box-shadow:
    0 1px 3px rgba(0,0,0,0.04),
    0 1px 2px rgba(0,0,0,0.06);
  border-radius: 2px; /* 紙は角丸少なめ */
}
```

### テーマ構成

Systemモードを廃止し、掛け合わせではなく**加算方式**で5テーマを提供する。
各テーマはライト/ダーク両方の配色を内包する（端末設定やトグルで切替）。

| # | テーマ名 | ライト時 | ダーク時 |
|---|---------|---------|---------|
| 1 | **ライト** | 現行のライトモード | — |
| 2 | **ダーク** | — | 現行のダークモード |
| 3 | **クラシックノート** | クリーム + 罫線 | 革手帳風ダークブラウン |
| 4 | **和紙** | オフホワイト + ノイズ | 藍染風ダークネイビー |
| 5 | **システム手帳** | ベージュ + ステッチ | ダークレザー + ゴールド |

- テーマ3〜5は時間帯やシステム設定に応じてライト/ダークが自動切替
- テーマ選択UIはシンプルな一覧（5択のラジオボタン or カード選択）

### 実装方針
- CSS変数の切り替えで実装（既存のThemeContext拡張）
- `data-theme` 属性をHTML要素に付与
- モバイル版は `ThemeProvider` の `Colors` に対応パレットを追加
- Systemモード（`prefers-color-scheme` 自動検出）は廃止

---

## 2. i18n 未対応箇所の完全対応

### 2-A. 新規16言語の追加（19 → 35言語）

現在の19言語に加え、ユーザー獲得ポテンシャルの高い16言語を追加する。

#### 追加言語一覧

| 優先度 | 言語 | コード | 話者数 | 書字方向 | 主な市場 |
|-------|------|--------|--------|---------|---------|
| S | ヒンディー語 | `hi` | 6億+ | LTR | インド |
| S | アラビア語 | `ar` | 4億+ | **RTL** | 中東・北アフリカ |
| A | ベンガル語 | `bn` | 2.7億+ | LTR | バングラデシュ・インド |
| A | ウルドゥー語 | `ur` | 2.3億+ | **RTL** | パキスタン・インド |
| A | タイ語 | `th` | 7,000万+ | LTR | タイ |
| A | ポーランド語 | `pl` | 4,500万+ | LTR | ポーランド |
| B | タガログ語 | `tl` | 1億+ | LTR | フィリピン |
| B | ペルシア語 | `fa` | 1.1億+ | **RTL** | イラン・アフガニスタン |
| B | マレー語 | `ms` | 3,000万+ | LTR | マレーシア |
| B | ルーマニア語 | `ro` | 2,500万+ | LTR | ルーマニア |
| B | チェコ語 | `cs` | 1,000万+ | LTR | チェコ |
| B | ギリシャ語 | `el` | 1,300万+ | LTR | ギリシャ・キプロス |
| C | ハンガリー語 | `hu` | 1,300万+ | LTR | ハンガリー |
| C | ウクライナ語 | `uk` | 4,000万+ | LTR | ウクライナ |
| C | ヘブライ語 | `he` | 900万+ | **RTL** | イスラエル |
| C | スワヒリ語 | `sw` | 1億+ | LTR | 東アフリカ |

> 追加後の合計: **35言語**（LTR 31 + RTL 4）

#### RTL対応（ar, ur, fa, he）

RTL言語のために以下の対応が必要:

**Web版:**
- `<html dir="rtl">` の動的切り替え（ロケールに応じて）
- CSS を Logical Properties に置き換え（`margin-left` → `margin-inline-start` 等）
- Flexbox / Grid の方向反転（`flex-direction` はそのまま、`text-align` の調整）
- アイコン（矢印等）のミラーリング
- カレンダー・タイムラインの方向確認
- `apps/web/src/i18n/routing.ts` に RTL ロケールリストを追加

```typescript
// RTL判定用
export const rtlLocales = ['ar', 'ur', 'fa', 'he'] as const;
export const isRtl = (locale: string) => rtlLocales.includes(locale as any);
```

**Mobile版:**
- React Native は `I18nManager.forceRTL(true)` で対応
- `apps/mobile/src/i18n/` で RTL ロケール検出 → `I18nManager` 設定
- レイアウトの `flexDirection: 'row'` は自動反転される
- アイコンの `transform: [{ scaleX: -1 }]` でミラーリング

**共通CSSガイドライン:**
```css
/* Before (LTR only) */
margin-left: 8px;
padding-right: 16px;
text-align: left;
border-left: 2px solid;

/* After (LTR + RTL) */
margin-inline-start: 8px;
padding-inline-end: 16px;
text-align: start;
border-inline-start: 2px solid;
```

#### i18nルーティング更新

`apps/web/src/i18n/routing.ts`:
```typescript
export const routing = defineRouting({
    locales: [
      // 既存19言語
      'ja','en','de','fr','es','it','pt-BR','ru',
      'zh-CN','zh-TW','ko','vi','id','tr','nl','sv','no','da','fi',
      // 新規16言語
      'hi','ar','bn','ur','th','pl','tl','fa',
      'ms','ro','cs','el','hu','uk','he','sw'
    ],
    defaultLocale: 'ja'
});
```

### 2-B. ハードコードされた日本語文字列

以下のファイルに日本語がハードコードされており、i18nキーに置き換える必要がある。

| ファイル | 行 | ハードコード文字列 | 追加キー |
|---------|----|--------------------|----------|
| `apps/web/src/components/todo/TodoDetailModal.tsx` | ~132 | `"SRSプロファイルが設定・変更されました。\n復習スケジュール(タスク)を生成しますか？"` | `srs.profileChangedConfirm` |
| `apps/web/src/components/ui/DatePicker.tsx` | ~20 | `"日付を選択"` | `common.selectDate` |
| `apps/web/src/components/ui/DatePicker.tsx` | ~61 | `["日","月","火","水","木","金","土"]` | `common.weekdaysShort` |
| `apps/web/src/components/ui/DatePicker.tsx` | ~80,92 | `"yyyy年 M月d日(E)"`, `"yyyy年 M月"` | `common.dateFormatFull`, `common.dateFormatMonth` |
| `apps/web/src/components/ui/TimePicker.tsx` | ~21 | `"時間を選択"` | `common.selectTime` |
| `apps/web/src/components/ui/IconPicker.tsx` | ~72 | `"アイコンを検索..."` | `common.searchIcon` |
| `apps/web/src/components/ads/InterstitialAd.tsx` | ~83 | `"広告"` | `common.advertisement` |
| `apps/web/src/components/timer/TimerView.tsx` | ~113-132 | タイマー通知文字列（集中終了、休憩開始等） | `timer.focusEnd`, `timer.breakStart` 等 |

> **注**: ShareTab.tsx のハードコード文字列は、Share機能削除により対応不要。

### 2-C. 翻訳キー欠落（既存言語ファイル間の差分）

以下のセクションが多数の言語で欠落または英語のまま残っている。

| セクション | 欠落している言語 | 対応内容 |
|-----------|------------------|----------|
| `activity.*` | de, fr, es, it, pt-BR, nl, sv, no, da, fi | アクティビティ・分析画面の翻訳追加 |
| `guide.*` (一部) | de, fr, es, it, pt-BR, ru, tr, nl | ガイドカテゴリ名・説明の翻訳 |
| `srs.*` (バリデーション) | it, ru | SRS設定のエラーメッセージ翻訳 |
| `category.deleteConfirm` 等 | de, it | カテゴリ削除確認の翻訳 |

> **注**: `share.*` セクションは機能削除に伴い、翻訳補完ではなく全言語から削除する。

### 2-D. 新機能用の翻訳キー追加

ジャーナル機能用 + ペーパーテーマ用のキーを全35言語に追加する。

---

## 3. ジャーナル機能（1人SNS）

→ **詳細仕様は [20260321_diary_feature_spec.md](./20260321_diary_feature_spec.md) を参照**

日記 + ジャーナル + 1人SNSを融合した自己記録機能。
- 1日複数投稿可能（タイムライン形式）
- 気分・学びメモ・写真（将来）を自由に投稿
- 完了タスクの自動記録
- 振り返り（週間・月間サマリー）
- 全てが自分だけの非公開空間

---

## 4. 実装順序

> **今回のアップデートはモバイル版（apps/mobile）のみ対象。**
> Web版の対応は別フェーズで実施する。
>
> **各Stepの実装時に `/security-review` スキルを使用してセキュリティレビューを実施すること。**
> 特にDB操作、ユーザー入力処理、設定値の保存・読み込みに注意。

### Step 1: モバイル版 — Share削除 + 同期停止 + オンボーディング更新
1. Mobile: ShareCard を削除
2. Mobile: ActivityModal を2タブ構成（analytics / history）に変更
3. Mobile: AuthProvider・RealtimeSync を無効化（コード削除ではなく無効化。Pro復活時に再有効化）
4. Mobile: SettingsModal の「クラウド同期」を「Proプランで提供予定」表示に変更、AuthModal 導線を非表示に
5. Mobile: Systemテーマモードを廃止
6. Mobile: オンボーディング画面を更新（ジャーナル紹介、オフライン説明、Pro予告）
7. i18n: 全言語から `share.*` キーと activity内のshare関連キーを削除

### Step 2: モバイル版 — データモデル・DB（基盤）
1. `packages/shared/src/types.ts` に `JournalPost`, `JournalSettings` 型追加
2. `packages/shared/src/storage/interface.ts` にジャーナルメソッド追加
3. モバイル版 SQLite テーブル追加（`journalPosts`）
4. SQLiteRepository にジャーナル CRUD 実装

### Step 3: モバイル版 — i18n対応（LTR言語）
1. 新規12言語（LTR）の翻訳ファイル作成: hi, bn, th, pl, tl, ms, ro, cs, el, hu, uk, sw
2. モバイル版のハードコード文字列の i18n キー化
3. 既存言語の欠落翻訳の補完
4. ジャーナル機能用 + ペーパーテーマ用キーの全31言語（LTR）追加

### Step 4: モバイル版 — RTL対応（独立Step）
1. 新規4言語（RTL）の翻訳ファイル作成: ar, ur, fa, he
2. `I18nManager.forceRTL(true)` の動的切り替え実装
3. 全コンポーネントのRTLレイアウト検証・修正
   - `flexDirection: 'row'` の自動反転確認
   - アイコン（矢印等）のミラーリング（`transform: [{ scaleX: -1 }]`）
   - カレンダーの方向・曜日順序
   - タイマーの円形プログレスバー
   - ドラッグ&ドロップの方向制御
4. RTL 4言語での全画面レイアウト検証

### Step 5: モバイル版 — ペーパーテーマ実装
1. ThemeProvider の拡張（5テーマ: Light / Dark / Classic / Washi / Planner）
2. 各テーマの Colors パレット定義（ライト/ダーク両対応）
3. テーマ選択UIの更新（5択のカード選択）
4. オンボーディングのテーマ選択ステップ更新
5. 全画面での表示確認・調整

### Step 6: モバイル版 — ジャーナル機能実装
1. ジャーナル設定フック（useJournalSettings）
2. SettingsModal にジャーナル設定セクション追加
3. JournalModal（タイムライン表示）
4. PostEditor（投稿作成・編集）
5. PostCard, MoodSelector, PostTypeSelector
6. CompletionPrompt（タスク完了時の記録プロンプト）
7. Footer にジャーナルボタン追加（設定オン時のみ）
8. カレンダーに投稿ドット表示を統合

### Step 7: モバイル版 — テスト・仕上げ

→ **詳細は [20260321_test_plan.md](./20260321_test_plan.md) を参照**

1. 各Stepごとの自動テスト + 手動テスト実施
2. クロスカット確認（テーマ × RTL × ジャーナル × 言語の組み合わせ）
3. デバイステスト（iOS/Android 各画面サイズ）
4. 旧バージョン(1.0.2)からのアップデートテスト
5. EAS Build (preview) → 内部テスト配布
6. 不具合修正 → EAS Build (production) → ストア提出

### 将来フェーズ: Web版対応
- Web版の Share 削除、ペーパーテーマ、ジャーナル機能、i18n拡張は別フェーズで実施
- モバイル版で確定した仕様をWeb版に移植する流れ

---

## 5. ペーパーテーマ用 i18n キー

```json
{
  "theme": {
    "paperClassic": "クラシックノート",
    "paperClassicDesc": "罫線入りノートのような温かみのあるテーマ",
    "paperWashi": "和紙",
    "paperWashiDesc": "和紙の質感を持つミニマルなテーマ",
    "paperPlanner": "システム手帳",
    "paperPlannerDesc": "レザーバインダーのような高級感のあるテーマ"
  }
}
```

---

## 6. 影響範囲まとめ（今回: モバイル版のみ）

| 領域 | 変更ファイル数 | 新規ファイル数 | 削除ファイル数 |
|------|---------------|---------------|---------------|
| 共通 (packages/shared) | ~21 (既存i18n 19 + types + interface) | 16 (新規言語ファイル) | 0 |
| Mobile (apps/mobile) | ~10 (RTL + テーマ + 同期停止 + オンボーディング) | ~10 (journal コンポーネント + フック + 設定) | 1 (ShareCard) |
| **合計** | **~31** | **~26** | **1** |

### 今回対象外（将来フェーズ）

| 領域 | 内容 |
|------|------|
| Web (apps/web) | Share削除、ペーパーテーマ、ジャーナル、RTL対応、i18n拡張 |
| Supabase | journal_posts テーブル作成（Web版ジャーナル実装時） |
