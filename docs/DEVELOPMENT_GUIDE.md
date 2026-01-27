# StudyTodo 開発ガイドライン

このドキュメントは、StudyTodoの開発における共通ルールとベストプラクティスを定義します。

## 1. プロジェクト構造

```
StudyTodo/
├── apps/
│   ├── web/        # Next.js (Dexie.js)
│   └── mobile/     # Expo React Native (SQLite)
└── packages/
    └── shared/     # 共有コード
```

## 2. 共有コードのルール

### 2.1 共有すべきコード

| カテゴリ | 例 |
|---------|-----|
| **型定義** | `Todo`, `Category`, `Session`, `SRSProfile` |
| **ビジネスロジック** | 同期処理、マージロジック、SRS計算 |
| **ユーティリティ** | 日付変換、ID生成、バリデーション |
| **データ変換** | `mapper` (camelCase ⇔ snake_case) |

### 2.2 共有しないコード

| カテゴリ | 理由 |
|---------|------|
| **UIコンポーネント** | プラットフォーム固有のスタイルが必要 |
| **DB操作** | Dexie.js (Web) vs SQLite (Mobile) |
| **認証処理** | ストレージ方式が異なる |

### 2.3 新しい共有コードの追加手順

1. `packages/shared/src/` に実装
2. `packages/shared/src/index.ts` にエクスポートを追加
3. `npm run build -w @studytodo/shared` でビルド
4. 各アプリから `@studytodo/shared` としてインポート

## 3. 日付/時間の扱い方

### 3.1 基本ルール

- **保存**: ISO 8601 文字列（`"2025-01-01T10:00:00.000Z"`）
- **操作**: `Date` オブジェクトに変換して操作
- **表示**: `date-fns` を使用してフォーマット

### 3.2 ユーティリティ関数

```typescript
import { parseDate, toISOString, compareDates } from '@studytodo/shared';

// パース（無効な値は undefined）
const date = parseDate(todo.dueDate);

// ISO文字列に変換
const isoString = toISOString(new Date());

// 比較（cloud > local なら正の値）
const diff = compareDates(cloudItem.updatedAt, localItem.updatedAt);
if (diff > 0) {
    // クラウドが新しい
}
```

### 3.3 アンチパターン

```typescript
// ❌ 避けるべき
new Date(value || 0).getTime()  // 無効な値の処理が曖昧

// ✅ 推奨
compareDates(cloudValue, localValue)  // 共通ユーティリティを使用
```

## 4. テスト作成ガイドライン

### 4.1 テストフレームワーク

| ワークスペース | フレームワーク | 備考 |
|---------------|---------------|------|
| `packages/shared` | Vitest | 全テスト実行可能 |
| `apps/web` | Vitest | コンポーネントテスト対応 |
| `apps/mobile` | Vitest | 純粋なロジックテストのみ |

### 4.2 テスト配置

```
src/
├── utils/
│   ├── date.ts
│   └── __tests__/
│       └── date.test.ts  # ユニットテスト
└── hooks/
    ├── useSync.ts
    └── __tests__/
        └── useSync.test.ts  # フックテスト
```

### 4.3 テスト実行

```bash
# 全テスト
npm test

# 個別実行
npm test -w @studytodo/shared
npm test -w @studytodo/web
npm test -w mobile
```

### 4.4 何をテストするか

| 優先度 | 対象 | 例 |
|-------|------|-----|
| 🔴 高 | 共有ロジック | `mapper`, `syncCore`, `date utils` |
| 🔴 高 | ビジネスロジック | SRS計算、スケジュール範囲計算 |
| 🟡 中 | データフック | `useMobileTodos`, `useSync` |
| 🟢 低 | UIコンポーネント | 静的な表示のみ |

## 5. PRチェックリスト

### 共有コード変更時

- [ ] `packages/shared` の変更は両プラットフォームでビルド確認した
- [ ] `npm run build -w @studytodo/shared` が通る
- [ ] 既存のテストがすべてパスする（`npm test`）
- [ ] 新規ロジックに対するテストを追加した

### プラットフォーム固有の変更時

- [ ] 同等の変更が他プラットフォームにも必要か検討した
- [ ] 共有可能なロジックは `packages/shared` に移動した

### 日付/時間の処理

- [ ] `Date` オブジェクトを直接保存していない（ISO文字列を使用）
- [ ] 無効な日付値のエラーハンドリングがある
- [ ] `@studytodo/shared` の日付ユーティリティを使用している

### 同期処理

- [ ] `mapper.toSupabase` / `mapper.fromSupabase` を使用している
- [ ] `allowedFieldsMap` を参照してフィールドをフィルタリングしている
- [ ] オフライン時の処理を考慮している

## 6. 命名規則

### ファイル名

| 種類 | 規則 | 例 |
|-----|------|-----|
| コンポーネント | PascalCase | `TodoList.tsx`, `MobileTimerView.tsx` |
| フック | camelCase（useプレフィックス） | `useMobileTodos.ts`, `useSync.ts` |
| ユーティリティ | camelCase | `date.ts`, `mapper.ts` |
| テスト | 元ファイル名 + `.test` | `date.test.ts`, `mapper.test.ts` |

### 変数名

| 種類 | 規則 | 例 |
|-----|------|-----|
| ローカル変数 | camelCase | `cloudItem`, `localTodos` |
| 定数 | UPPER_SNAKE_CASE または camelCase | `MAX_RETRIES`, `allowedFieldsMap` |
| 型/インターフェース | PascalCase | `Todo`, `SyncHandlers` |

## 7. エラーハンドリング

### 同期エラー

```typescript
try {
    await processTableSync(...);
} catch (error) {
    console.error('[Sync Error]:', error);
    // オフラインキューに追加
    await offlineQueue.add({ ... });
}
```

### 日付パースエラー

```typescript
const date = parseDate(value);
if (!date) {
    // 無効な日付として処理
    return undefined;
}
```

## 8. 関連ドキュメント

- [03_IMPLEMENTATION.md](./03_IMPLEMENTATION.md) - 実装状況と変更履歴
- [04_FUTURE.md](./04_FUTURE.md) - 将来の計画
- [ANDROID_TEST_SETUP.md](./ANDROID_TEST_SETUP.md) - Androidエミュレータでのテスト手順
