---
description: 開発環境のセットアップ（データ移行後やクローン後に使用）
---

# 開発環境セットアップ手順

新しいPCへのデータ移行後、またはリポジトリをクローンした後に実行する手順です。

## 0. 環境変数の設定（初回のみ）

`.env.local` ファイルは `.gitignore` に含まれているため、手動で設定が必要です。

1. Supabaseダッシュボード（https://supabase.com/dashboard）にログイン
2. プロジェクトを選択 → Settings → API
3. 以下の値を取得：
   - Project URL
   - Project API keys → anon public

4. ファイルを作成：

```bash
cat << 'EOF' > apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=ここにProject URLを貼り付け
NEXT_PUBLIC_SUPABASE_ANON_KEY=ここにanon publicキーを貼り付け
EOF
```

## 1. 依存関係のインストール

// turbo
```bash
npm install
```

## 2. sharedパッケージのビルド

`@studytodo/shared` は `dist` フォルダを参照しているため、ビルドが必要です。

// turbo
```bash
npm run build -w @studytodo/shared
```

## 3. 開発サーバーの起動

### Webアプリ

```bash
npm run dev:web
```

### モバイルアプリ

```bash
npm run dev:mobile
```

## 4. テストの実行（オプション）

// turbo
```bash
npm run test
```

## トラブルシューティング

### `Module not found: Can't resolve '@studytodo/shared'`

sharedパッケージがビルドされていません。手順2を実行してください。

### `node_modules not found` 関連エラー

依存関係がインストールされていません。手順1を実行してください。

### Gitリモートとの同期

最新のコードを取得する場合：

```bash
git pull origin main
npm install
npm run build -w @studytodo/shared
```
