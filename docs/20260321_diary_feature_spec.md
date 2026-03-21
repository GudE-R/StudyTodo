# ジャーナル機能 仕様書
> 作成日: 2026-03-21
> 親ドキュメント: [20260321_major_update_plan.md](./20260321_major_update_plan.md)

---

## コンセプト

**「1人SNS」** — 自分だけに向けたタイムライン。

従来の日記（1日1エントリ）ではなく、SNSのように思い立ったときに気軽に投稿できる形式。
学んだこと、気づき、気分、完了タスクの振り返りなどを、タイムラインとして記録していく。
誰にも見せない、自分の成長記録。

### 日記との違い

| 観点 | 従来の日記 | 1人SNS（ジャーナル） |
|------|----------|---------------------|
| 投稿頻度 | 1日1回 | 1日何回でも |
| 投稿の粒度 | まとまった振り返り | 一言メモ〜長文まで自由 |
| 心理的ハードル | 「今日一日を書かなきゃ」 | 「ふと思ったことを残す」 |
| 表示形式 | 日付ごとのページ | タイムライン（SNS風） |
| タスク連動 | 1日の完了まとめ | 完了直後に自動投稿（任意） |

### 設定によるオン/オフ
- 設定画面でジャーナル機能のオン/オフを切り替え可能
- **オフ（デフォルト）**: ジャーナル関連のUIは一切表示されない
- **オン**: BottomActions / Footer に日記ボタンが出現（＋ボタンの横）

---

## 1. データモデル

### 型定義 (`packages/shared/src/types.ts`)

```typescript
interface JournalPost {
  id: string;
  content: string;           // 投稿本文
  type: 'note' | 'learning' | 'reflection' | 'milestone';
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  tags?: string[];
  linkedTodoId?: string;      // 関連タスク（完了時の自動投稿用）
  linkedTodoTitle?: string;   // 関連タスクのタイトル（スナップショット）
  createdAt: string;          // 投稿日時（これがタイムラインの軸）
  updatedAt: string;
}
```

### 投稿タイプ

| type | 用途 | アイコン例 |
|------|------|----------|
| `note` | 自由メモ・つぶやき | メモアイコン |
| `learning` | 学んだこと・気づき | 電球アイコン |
| `reflection` | 振り返り・内省 | 鏡アイコン |
| `milestone` | 達成・マイルストーン | 旗アイコン |

### 設計判断
- **1日複数投稿可能**: `date` ではなく `createdAt` をタイムラインの軸にする
- **気分(mood)**: 任意。投稿時点の気分を記録
- **タグ**: 任意。投稿を横断的に整理する手段
- **linkedTodoId**: タスク完了時に「この完了を記録する？」と促し、自動投稿を生成
- **type**: 投稿の種類を分類。フィルタリングやアイコン表示に使用

---

## 2. ジャーナル設定

### 設定項目

```typescript
interface JournalSettings {
  enabled: boolean;             // ジャーナル機能オン/オフ（デフォルト: false）
  autoPromptOnComplete: boolean; // タスク完了時に投稿を促す（デフォルト: true）
}
```

### 保存先
- Web: localStorage (`studytodo-journal-settings`)
- Mobile: AsyncStorage (`@studytodo_journal_settings`)

### UI上の反映

**オフ時**: 通常通りのBottomActions / Footer
```
[Template]    [＋]    [Activity]
```

**オン時**: ＋ボタンの右隣にジャーナルボタン出現
```
[Template]    [＋]  [📓]    [Activity]
```

---

## 3. DBスキーマ

### Web版 (Dexie.js)

`apps/web/src/lib/db.ts` — version(5) に追加:
```typescript
journalPosts: 'id, type, createdAt, updatedAt, linkedTodoId'
```

### モバイル版 (SQLite)

`apps/mobile/src/repositories/SQLiteRepository.ts` — init() に追加:
```sql
CREATE TABLE IF NOT EXISTS journalPosts (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'note',
  mood TEXT,
  tags TEXT,              -- JSON配列
  linkedTodoId TEXT,
  linkedTodoTitle TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journalPosts(createdAt);
CREATE INDEX IF NOT EXISTS idx_journal_type ON journalPosts(type);
CREATE INDEX IF NOT EXISTS idx_journal_todo ON journalPosts(linkedTodoId);
```

### Supabase

```sql
CREATE TABLE journal_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'note'
    CHECK (type IN ('note','learning','reflection','milestone')),
  mood TEXT CHECK (mood IN ('great','good','neutral','bad','terrible')),
  tags JSONB DEFAULT '[]',
  linked_todo_id UUID,
  linked_todo_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE journal_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journal posts"
  ON journal_posts FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_journal_user_created ON journal_posts(user_id, created_at DESC);
CREATE INDEX idx_journal_user_type ON journal_posts(user_id, type);
```

---

## 4. StorageInterface 拡張

`packages/shared/src/storage/interface.ts` に追加:

```typescript
// ジャーナル
getJournalPosts(startDate: string, endDate: string): Promise<JournalPost[]>;
getJournalPostsByType(type: JournalPost['type']): Promise<JournalPost[]>;
saveJournalPost(post: JournalPost): Promise<void>;
updateJournalPost(post: JournalPost): Promise<void>;
deleteJournalPost(id: string): Promise<void>;
getJournalDatesWithPosts(month: string): Promise<string[]>; // YYYY-MM → 投稿がある日付一覧
getJournalPostCount(): Promise<number>;
```

---

## 5. UI設計

### 5-1. BottomActions / Footer の変更

ジャーナル機能がオンの場合のみ、＋ボタンの右横にジャーナルボタンを表示。

**Web版 BottomActions:**
```
┌──────────────────────────────────────────────┐
│   [Template]    [＋]  [📓]    [Activity]      │
└──────────────────────────────────────────────┘
                         ↑ ジャーナルボタン（オン時のみ）
```

**Mobile版 Footer:**
```
┌──────────────────────────────────────────────┐
│  [Template]   [＋]  [📓]   [Activity]   [≡]  │
└──────────────────────────────────────────────┘
                       ↑ ジャーナルボタン（オン時のみ）
```

### 5-2. タイムライン画面（メインビュー）

📓ボタンをタップ → ジャーナルモーダルが開く。

```
┌───────────────────────────────────────┐
│ 📓 マイジャーナル           [＋投稿]    │
├───────────────────────────────────────┤
│ フィルタ: [全て] [メモ] [学び] [振返り] [達成]│
├───────────────────────────────────────┤
│                                       │
│ ── 今日 ──────────────────────────     │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 💡 学び            15:32        │   │
│ │                                 │   │
│ │ TypeScriptのジェネリクスの使い方 │   │
│ │ がやっと腑に落ちた。constraintを │   │
│ │ 使えば型安全なまま柔軟にできる。 │   │
│ │                                 │   │
│ │ #TypeScript  #学習              │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 🏁 達成            12:05        │   │
│ │                                 │   │
│ │ ✅ 数学の復習 を完了！           │   │
│ │ 3日連続でSRS復習できてる。      │   │
│ │ この調子で続けたい。             │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 📝 メモ  😊         09:15       │   │
│ │                                 │   │
│ │ 今日は集中できそうな気分。       │   │
│ │ 午前中にタスクを片付けたい。     │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ── 昨日 ──────────────────────────     │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 🪞 振り返り          22:30      │   │
│ │                                 │   │
│ │ 今日はあまり集中できなかった。   │   │
│ │ 睡眠時間が短かったのが原因かも。 │   │
│ │ 明日は早めに寝る。               │   │
│ │                                 │   │
│ │ #振り返り                        │   │
│ └─────────────────────────────────┘   │
│                                       │
└───────────────────────────────────────┘
```

### 5-3. 投稿エディタ

タイムライン上部の「＋投稿」 or タスク完了時のプロンプトで開く。

```
┌───────────────────────────────────────┐
│ 新しい投稿                      投稿   │
├───────────────────────────────────────┤
│                                       │
│ タイプ: [📝メモ] [💡学び] [🪞振返り] [🏁達成]│
│                                       │
│ 気分:   😊  😀  😐  😟  😢  (任意)    │
│                                       │
├───────────────────────────────────────┤
│                                       │
│  何を記録しますか？                    │
│                                       │
│                                       │
│                                       │
│                                       │
├───────────────────────────────────────┤
│ タグ: [+追加]                          │
│                                       │
│ 📎 タスク完了: 数学の復習 (自動リンク)  │ ← タスク完了時のみ表示
└───────────────────────────────────────┘
```

### 5-4. カレンダー上の表示

既存の `CalendarPane` にジャーナル投稿マークを追加:
- 投稿がある日 → 日付の下に小さなドット（●）
- 複数投稿がある日 → ドットの数（最大3個）で投稿量を示す

### 5-5. タスク完了時の自動プロンプト

設定で `autoPromptOnComplete: true` の場合:

```
┌───────────────────────────────────┐
│ ✅ 「数学の復習」を完了しました！   │
│                                   │
│  記録を残しますか？                │
│                                   │
│  [記録する]        [スキップ]      │
└───────────────────────────────────┘
```

「記録する」→ 投稿エディタが開く（`type: 'milestone'`, `linkedTodoId` 自動設定）

### 5-6. 手帳感の演出
- タイムラインは罫線付きの紙テクスチャ背景（ペーパーテーマ連動）
- 投稿カードは付箋やメモ用紙のような質感
- テキストエリアの行間を広めに設定（`line-height: 1.8`）
- 日付区切りはスタンプ風のデザイン
- 投稿時に軽いアニメーション（メモを貼る感覚）

### 5-7. 設定画面

Settings Modal 内にジャーナルセクションを追加:

```
┌ ジャーナル ───────────────────────┐
│ ジャーナル機能    [オン / オフ]    │
│ タスク完了時に                    │
│  記録を促す       [オン / オフ]    │
└───────────────────────────────────┘
```

---

## 6. 実装ファイル一覧

### 共通 (packages/shared)

| ファイル | 変更内容 |
|---------|----------|
| `src/types.ts` | `JournalPost`, `JournalSettings` 型追加 |
| `src/storage/interface.ts` | ジャーナルCRUD メソッド追加 |
| `src/i18n/locales/*.json` (×35) | `journal.*` セクション追加 |

### Web版 (apps/web)

| ファイル | 種別 | 内容 |
|---------|------|------|
| `src/lib/db.ts` | 変更 | Dexie v5 スキーマ + `journalPosts` テーブル |
| `src/hooks/useJournal.ts` | 新規 | ジャーナルCRUD操作フック |
| `src/hooks/useJournalSettings.ts` | 新規 | ジャーナル設定管理フック |
| `src/components/journal/JournalModal.tsx` | 新規 | タイムライン表示モーダル |
| `src/components/journal/JournalTimeline.tsx` | 新規 | タイムラインコンポーネント |
| `src/components/journal/PostEditor.tsx` | 新規 | 投稿作成・編集 |
| `src/components/journal/PostCard.tsx` | 新規 | 個別投稿カード |
| `src/components/journal/PostTypeSelector.tsx` | 新規 | 投稿タイプ選択 |
| `src/components/journal/MoodSelector.tsx` | 新規 | 気分選択UI |
| `src/components/journal/CompletionPrompt.tsx` | 新規 | タスク完了時プロンプト |
| `src/components/home/BottomActions.tsx` | 変更 | ジャーナルボタン追加（設定オン時） |
| `src/components/home/CalendarPane.tsx` | 変更 | 投稿ドット表示の統合 |
| `src/components/settings/SettingsModal.tsx` | 変更 | ジャーナル設定セクション追加 |
| `src/services/journal-sync.ts` | 新規 | Supabase ジャーナル同期 |

### モバイル版 (apps/mobile)

| ファイル | 種別 | 内容 |
|---------|------|------|
| `src/repositories/SQLiteRepository.ts` | 変更 | `journalPosts` テーブル + CRUD |
| `src/hooks/useJournal.ts` | 新規 | ジャーナル操作フック |
| `src/hooks/useJournalSettings.ts` | 新規 | ジャーナル設定管理フック |
| `src/components/journal/JournalModal.tsx` | 新規 | タイムラインモーダル |
| `src/components/journal/PostEditor.tsx` | 新規 | 投稿作成・編集 |
| `src/components/journal/PostCard.tsx` | 新規 | 投稿カード |
| `src/components/journal/MoodSelector.tsx` | 新規 | 気分選択UI |
| `src/components/journal/CompletionPrompt.tsx` | 新規 | タスク完了時プロンプト |
| `src/components/layout/Footer.tsx` | 変更 | ジャーナルボタン追加 |
| `src/components/modals/SettingsModal.tsx` | 変更 | ジャーナル設定追加 |

---

## 7. i18nキー

全35言語に追加するキー:

```json
{
  "journal": {
    "title": "マイジャーナル",
    "newPost": "新しい投稿",
    "editPost": "投稿を編集",
    "post": "投稿",
    "posted": "投稿しました",
    "delete": "この投稿を削除",
    "deleteConfirm": "この投稿を削除しますか？",
    "placeholder": "何を記録しますか？",
    "typeNote": "メモ",
    "typeLearning": "学び",
    "typeReflection": "振り返り",
    "typeMilestone": "達成",
    "mood": "気分",
    "moodGreat": "最高",
    "moodGood": "良い",
    "moodNeutral": "普通",
    "moodBad": "悪い",
    "moodTerrible": "最悪",
    "today": "今日",
    "yesterday": "昨日",
    "daysAgo": "{{count}}日前",
    "filterAll": "全て",
    "noPostsYet": "まだ投稿がありません",
    "firstPostPrompt": "最初の投稿を書いてみましょう",
    "tags": "タグ",
    "addTag": "タグを追加",
    "linkedTask": "関連タスク",
    "completionPrompt": "記録を残しますか？",
    "completionTitle": "「{{title}}」を完了しました！",
    "record": "記録する",
    "skip": "スキップ",
    "posts": "件の投稿",
    "streak": "連続記録",
    "streakDays": "日",
    "settings": "ジャーナル設定",
    "enabled": "ジャーナル機能",
    "autoPrompt": "タスク完了時に記録を促す"
  }
}
```

### 英語版 (en.json)

```json
{
  "journal": {
    "title": "My Journal",
    "newPost": "New post",
    "editPost": "Edit post",
    "post": "Post",
    "posted": "Posted",
    "delete": "Delete this post",
    "deleteConfirm": "Delete this post?",
    "placeholder": "What would you like to record?",
    "typeNote": "Note",
    "typeLearning": "Learning",
    "typeReflection": "Reflection",
    "typeMilestone": "Milestone",
    "mood": "Mood",
    "moodGreat": "Great",
    "moodGood": "Good",
    "moodNeutral": "Okay",
    "moodBad": "Bad",
    "moodTerrible": "Terrible",
    "today": "Today",
    "yesterday": "Yesterday",
    "daysAgo": "{{count}} days ago",
    "filterAll": "All",
    "noPostsYet": "No posts yet",
    "firstPostPrompt": "Write your first post",
    "tags": "Tags",
    "addTag": "Add tag",
    "linkedTask": "Linked task",
    "completionPrompt": "Would you like to record this?",
    "completionTitle": "Completed \"{{title}}\"!",
    "record": "Record",
    "skip": "Skip",
    "posts": "posts",
    "streak": "Recording streak",
    "streakDays": "days",
    "settings": "Journal settings",
    "enabled": "Journal feature",
    "autoPrompt": "Prompt to record on task completion"
  }
}
```

---

## 8. 同期仕様

### 現フェーズ（モバイル版）
- **同期なし**。モバイル版はSQLiteによるローカル完結。
- モバイル版の同期はProプランで提供予定。

### 将来フェーズ（Web版 + Pro同期）
- 同期対象: 全フィールド
- 競合解決: `updatedAt` が新しい方を優先（既存の Todo 同期と同じ方式）
- Supabase Realtime の `journal_posts` テーブルを購読
- INSERT/UPDATE/DELETE をリアルタイムで反映

---

## 9. アクセスポイント

ユーザーがジャーナルにアクセスする導線（ジャーナル機能オン時のみ）:

1. **BottomActions / Footer の📓ボタン** → ジャーナルモーダル（メイン導線）
2. **タスク完了時の自動プロンプト** → 投稿エディタ（`autoPromptOnComplete` オン時）
3. **カレンダーペインの投稿ドット** → その日のジャーナルを表示

---

## 10. 将来の拡張（今回は実装しない）

- 画像添付（Supabase Storage連携）
- ジャーナルの全文検索
- 統計ダッシュボード（投稿頻度、気分の推移グラフ、よく使うタグ）
- 週間・月間の自動振り返りサマリー
- 投稿テンプレート（学習ログ、KPT振り返り等の定型フォーム）
- AI要約（期間ごとの成長まとめ自動生成）
- Markdown対応（太字・リスト等）
- ピン留め投稿（重要な投稿を上部固定）
