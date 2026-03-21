# 日記機能 仕様書
> 作成日: 2026-03-21
> 親ドキュメント: [20260321_major_update_plan.md](./20260321_major_update_plan.md)

---

## コンセプト

手帳アプリとしての核機能。毎日の振り返り・メモを記録できるシンプルな日記。
タスク管理と連動し、その日に完了したタスクを自動表示しつつ、自由記述ができる。

---

## 1. データモデル

### 型定義 (`packages/shared/src/types.ts`)

```typescript
interface DiaryEntry {
  id: string;
  date: string;           // YYYY-MM-DD（1日1エントリ）
  content: string;         // 日記本文（プレーンテキスト）
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  tags?: string[];
  completedTodoIds?: string[];  // その日完了したTodoのID（自動記録）
  createdAt: string;
  updatedAt: string;
}
```

### 設計判断
- **1日1エントリ**: `date` をユニークキーとし、同日の記録は上書き更新
- **気分(mood)**: 任意。5段階で日々の調子を記録
- **タグ**: 任意。日記をカテゴリ分けする柔軟な手段
- **completedTodoIds**: 日記保存時にその日のcompletedなTodoを自動取得・記録

---

## 2. DBスキーマ

### Web版 (Dexie.js)

`apps/web/src/lib/db.ts` — version(5) に追加:
```typescript
diaryEntries: 'id, date, createdAt, updatedAt'
```

### モバイル版 (SQLite)

`apps/mobile/src/repositories/SQLiteRepository.ts` — init() に追加:
```sql
CREATE TABLE IF NOT EXISTS diaryEntries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  mood TEXT,
  tags TEXT,            -- JSON配列
  completedTodoIds TEXT, -- JSON配列
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diaryEntries(date);
```

### Supabase

```sql
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  mood TEXT CHECK (mood IN ('great','good','neutral','bad','terrible')),
  tags JSONB DEFAULT '[]',
  completed_todo_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own diary entries"
  ON diary_entries FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_diary_entries_user_date ON diary_entries(user_id, date);
```

---

## 3. StorageInterface 拡張

`packages/shared/src/storage/interface.ts` に追加:

```typescript
// 日記
getDiaryEntry(date: string): Promise<DiaryEntry | undefined>;
getDiaryEntries(startDate: string, endDate: string): Promise<DiaryEntry[]>;
saveDiaryEntry(entry: DiaryEntry): Promise<void>;
deleteDiaryEntry(id: string): Promise<void>;
getDiaryDatesWithEntries(month: string): Promise<string[]>; // YYYY-MM → 記入済み日付一覧
```

---

## 4. UI設計

### 4-1. 日記エントリ画面

カレンダーから日付をタップ → 日記エディタが開く。

```
┌───────────────────────────────────┐
│ ← 2026年3月21日（土）          保存 │  ヘッダー
├───────────────────────────────────┤
│                                   │
│ 気分:  😊  😀  😐  😟  😢         │  気分セレクタ（任意）
│        最高 良い 普通 悪い 最悪     │
│                                   │
├───────────────────────────────────┤
│                                   │
│  今日の記録をここに書く...          │  テキストエリア
│                                   │
│                                   │
│                                   │
│                                   │
│                                   │
├───────────────────────────────────┤
│ タグ: [学習] [振り返り] [+追加]     │  タグ（任意）
├───────────────────────────────────┤
│ ▼ 今日完了したタスク (3件)          │  自動表示（折りたたみ可）
│   ✅ 数学の復習                     │
│   ✅ 英語リーディング               │
│   ✅ レポート提出                   │
└───────────────────────────────────┘
```

### 4-2. カレンダー上の表示

既存の `CalendarPane` に日記ドットマークを追加:
- 記入済みの日 → 日付の下に小さなドット（●）
- 気分付きの場合 → ドットの色を気分に対応（great=緑, good=青, neutral=灰, bad=橙, terrible=赤）

### 4-3. 日記一覧（月表示）

アクティビティタブに「日記」タブを追加、または独立したビューとして:

```
┌───────────────────────────────────┐
│ 2026年3月の日記          月表示 ▾  │
├───────────────────────────────────┤
│ 3/21（土） 😊                      │
│ 今日は数学の復習を集中的にやった。   │
│ 理解度が上がってきた感じがする...    │
├───────────────────────────────────┤
│ 3/20（金） 😀                      │
│ 英語のリーディングが思ったより...    │
├───────────────────────────────────┤
│ 3/18（水） 😐                      │
│ あまり集中できなかった。明日は...    │
└───────────────────────────────────┘
```

### 4-4. 手帳感の演出
- 日記編集エリアは罫線付きの紙テクスチャ背景（ペーパーテーマ連動）
- テキストエリアの行間を広めに設定（`line-height: 1.8`）
- 日付ヘッダーはスタンプ風のデザイン（角丸のインセットボーダー）
- 保存時に軽いアニメーション（ペンを置くような感覚）

---

## 5. 実装ファイル一覧

### 共通 (packages/shared)

| ファイル | 変更内容 |
|---------|----------|
| `src/types.ts` | `DiaryEntry` 型追加 |
| `src/storage/interface.ts` | 日記CRUD メソッド追加 |
| `src/i18n/locales/*.json` (×19) | `diary.*` セクション追加 |

### Web版 (apps/web)

| ファイル | 種別 | 内容 |
|---------|------|------|
| `src/lib/db.ts` | 変更 | Dexie v5 スキーマ + `diaryEntries` テーブル |
| `src/hooks/useDiary.ts` | 新規 | 日記CRUD操作フック |
| `src/components/diary/DiaryEditor.tsx` | 新規 | 日記編集コンポーネント |
| `src/components/diary/DiaryListView.tsx` | 新規 | 月別日記一覧 |
| `src/components/diary/MoodSelector.tsx` | 新規 | 気分選択UI |
| `src/components/diary/CompletedTodosList.tsx` | 新規 | 完了タスク自動表示 |
| `src/components/home/CalendarPane.tsx` | 変更 | 日記ドット表示の統合 |
| `src/services/diary-sync.ts` | 新規 | Supabase 日記同期 |

### モバイル版 (apps/mobile)

| ファイル | 種別 | 内容 |
|---------|------|------|
| `src/repositories/SQLiteRepository.ts` | 変更 | `diaryEntries` テーブル + CRUD |
| `src/hooks/useDiary.ts` | 新規 | 日記操作フック |
| `src/components/diary/DiaryEditorModal.tsx` | 新規 | 日記編集モーダル |
| `src/components/diary/MoodSelector.tsx` | 新規 | 気分選択UI |
| `src/components/diary/CompletedTodosList.tsx` | 新規 | 完了タスク表示 |

---

## 6. i18nキー

全19言語に追加するキー:

```json
{
  "diary": {
    "title": "日記",
    "newEntry": "日記を書く",
    "editEntry": "日記を編集",
    "placeholder": "今日の記録をここに書く...",
    "save": "保存",
    "saved": "保存しました",
    "delete": "この日記を削除",
    "deleteConfirm": "この日記を削除しますか？",
    "completedTodos": "今日完了したタスク",
    "noCompletedTodos": "完了したタスクはありません",
    "mood": "気分",
    "moodGreat": "最高",
    "moodGood": "良い",
    "moodNeutral": "普通",
    "moodBad": "悪い",
    "moodTerrible": "最悪",
    "noEntry": "この日の記録はありません",
    "todayEntry": "今日の日記",
    "viewAll": "すべての日記",
    "monthView": "月表示",
    "tags": "タグ",
    "addTag": "タグを追加",
    "entries": "件の日記",
    "streak": "連続記入",
    "streakDays": "日",
    "writePrompt": "今日はどんな一日でしたか？"
  }
}
```

### 英語版 (en.json)

```json
{
  "diary": {
    "title": "Diary",
    "newEntry": "Write diary",
    "editEntry": "Edit diary",
    "placeholder": "Write about your day...",
    "save": "Save",
    "saved": "Saved",
    "delete": "Delete this entry",
    "deleteConfirm": "Delete this diary entry?",
    "completedTodos": "Completed tasks today",
    "noCompletedTodos": "No tasks completed",
    "mood": "Mood",
    "moodGreat": "Great",
    "moodGood": "Good",
    "moodNeutral": "Okay",
    "moodBad": "Bad",
    "moodTerrible": "Terrible",
    "noEntry": "No entry for this day",
    "todayEntry": "Today's diary",
    "viewAll": "All entries",
    "monthView": "Month view",
    "tags": "Tags",
    "addTag": "Add tag",
    "entries": "entries",
    "streak": "Writing streak",
    "streakDays": "days",
    "writePrompt": "How was your day?"
  }
}
```

---

## 7. 同期仕様

### 同期対象フィールド
全フィールドを同期対象とする（`id`, `date`, `content`, `mood`, `tags`, `completedTodoIds`, `createdAt`, `updatedAt`）。

### 競合解決
- `updatedAt` が新しい方を優先（既存の Todo 同期と同じ方式）
- 同じ日付のエントリが競合した場合、最新の `updatedAt` を持つ方で上書き

### リアルタイム同期
- Supabase Realtime の `diary_entries` テーブルを購読
- INSERT/UPDATE/DELETE をリアルタイムで反映

---

## 8. アクセスポイント

ユーザーが日記にアクセスする導線:

1. **カレンダーペインの日付タップ** → 日記エディタを開く（メイン導線）
2. **ボトムアクション or サイドメニュー** → 「日記」ボタン → 今日の日記エディタ
3. **アクティビティ画面** → 「日記」タブ → 月別一覧表示
4. **モバイル**: メニュー or カレンダータップ → DiaryEditorModal

---

## 9. 将来の拡張（今回は実装しない）

- 日記のMarkdown対応（太字・リスト等）
- 画像添付（Supabase Storage連携）
- 日記の検索機能
- 日記の統計（記入率、気分の推移グラフ）
- 日記テンプレート（振り返り用の定型フォーム）
- AI要約（週間・月間の振り返り自動生成）
