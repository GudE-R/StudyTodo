# StudyTodo メジャーアップデート計画
> 作成日: 2026-03-21
> コンセプト: **「アプリで動く手帳」** — 紙の質感を持つ、書き心地の良いデジタル手帳

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

### 実装方針
- テーマ選択UIに「ペーパーテーマ」セクションを追加（Light/Dark/System に加え、Paper Classic/Washi/Planner）
- CSS変数の切り替えで実装（既存のThemeContext拡張）
- `data-theme` 属性をHTML要素に付与
- モバイル版は `ThemeProvider` の `Colors` に対応パレットを追加

---

## 2. i18n 未対応箇所の完全対応

### 2-A. ハードコードされた日本語文字列

以下のファイルに日本語がハードコードされており、i18nキーに置き換える必要がある。

| ファイル | 行 | ハードコード文字列 | 追加キー |
|---------|----|--------------------|----------|
| `apps/web/src/components/todo/TodoDetailModal.tsx` | ~132 | `"SRSプロファイルが設定・変更されました。\n復習スケジュール(タスク)を生成しますか？"` | `srs.profileChangedConfirm` |
| `apps/web/src/components/ui/DatePicker.tsx` | ~20 | `"日付を選択"` | `common.selectDate` |
| `apps/web/src/components/ui/DatePicker.tsx` | ~61 | `["日","月","火","水","木","金","土"]` | `common.weekdaysShort` |
| `apps/web/src/components/ui/DatePicker.tsx` | ~80,92 | `"yyyy年 M月d日(E)"`, `"yyyy年 M月"` | `common.dateFormatFull`, `common.dateFormatMonth` |
| `apps/web/src/components/ui/TimePicker.tsx` | ~21 | `"時間を選択"` | `common.selectTime` |
| `apps/web/src/components/ui/IconPicker.tsx` | ~72 | `"アイコンを検索..."` | `common.searchIcon` |
| `apps/web/src/components/activity/ShareTab.tsx` | ~99 | `"画像の生成に失敗しました。"` | `share.imageGenerationFailed` |
| `apps/web/src/components/activity/ShareTab.tsx` | ~134 | `"エラーが発生しました。"` | `common.errorOccurred` |
| `apps/web/src/components/ads/InterstitialAd.tsx` | ~83 | `"広告"` | `common.advertisement` |
| `apps/web/src/components/timer/TimerView.tsx` | ~113-132 | タイマー通知文字列（集中終了、休憩開始等） | `timer.focusEnd`, `timer.breakStart` 等 |

### 2-B. 翻訳キー欠落（言語ファイル間の差分）

以下のセクションが多数の言語で欠落または英語のまま残っている。

| セクション | 欠落している言語 | 対応内容 |
|-----------|------------------|----------|
| `activity.*` | de, fr, es, it, pt-BR, nl, sv, no, da, fi | アクティビティ・分析画面の翻訳追加 |
| `share.*` | de, fr, es, it, pt-BR, nl, sv, no, da, fi | SNSシェア機能の翻訳追加 |
| `guide.*` (一部) | de, fr, es, it, pt-BR, ru, tr, nl | ガイドカテゴリ名・説明の翻訳 |
| `srs.*` (バリデーション) | it, ru | SRS設定のエラーメッセージ翻訳 |
| `category.deleteConfirm` 等 | de, it | カテゴリ削除確認の翻訳 |

### 2-C. 新機能（日記）用の翻訳キー追加

日記機能用のキーを全19言語に追加する（セクション3参照）。

---

## 3. 日記機能（Diary / Journal）

→ **詳細仕様は [20260321_diary_feature_spec.md](./20260321_diary_feature_spec.md) を参照**

手帳アプリの核機能として、毎日の振り返り・メモを記録できる日記機能を追加する。
- 1日1エントリ（日付ユニーク）
- 気分（5段階）・タグ・完了タスク自動記録
- カレンダーから直接アクセス
- Supabase同期対応

---

## 4. 実装順序

### Step 1: データモデル・DB（基盤）
1. `packages/shared/src/types.ts` に `DiaryEntry` 型追加
2. `packages/shared/src/storage/interface.ts` に日記メソッド追加
3. Web版 Dexie スキーマ更新
4. モバイル版 SQLite テーブル追加
5. Supabase テーブル作成

### Step 2: i18n完全対応
1. ハードコード日本語の i18n キー化（2-A）
2. 欠落翻訳の補完（2-B）
3. 日記機能用キーの全19言語追加（2-C）
4. ペーパーテーマ用キーの追加

### Step 3: ペーパーテーマ実装
1. CSS変数・テクスチャの定義
2. ThemeContext/ThemeProvider の拡張
3. テーマ選択UIの更新
4. 全画面での表示確認・調整

### Step 4: 日記機能実装
1. Web版: DiaryEditor, CalendarView, MoodSelector
2. Web版: useDiary フック、カレンダー統合
3. モバイル版: DiaryEditorModal, MoodSelector
4. モバイル版: useDiary フック
5. Supabase 同期対応

### Step 5: テスト・仕上げ
1. 全テーマ × 全画面の表示確認
2. ダークモード対応確認
3. 多言語表示確認（特にレイアウト崩れ）
4. 日記のCRUD動作確認
5. 同期動作確認

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

## 6. 影響範囲まとめ

| 領域 | 変更ファイル数 | 新規ファイル数 |
|------|---------------|---------------|
| 共通 (packages/shared) | ~21 (i18n 19 + types + interface) | 0 |
| Web (apps/web) | ~12 | ~5 (diary コンポーネント + フック) |
| Mobile (apps/mobile) | ~5 | ~4 (diary コンポーネント + フック) |
| Supabase | 1 (SQL) | 0 |
| CSS/テーマ | ~3 | ~1 (テクスチャCSS) |
| **合計** | **~42** | **~10** |
