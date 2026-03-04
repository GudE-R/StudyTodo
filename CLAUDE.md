# CLAUDE.md — StudyTodo

## プロジェクト概要
タスク管理・スケジュール管理・学習記録・ポモドーロタイマーを統合したアプリ。
Web版 (React + Vite) とモバイル版 (React Native + Expo) のモノレポ構成。

## ディレクトリ構成
- `apps/web/` — Web版 (React, Vite, Dexie.js)
- `apps/mobile/` — モバイル版 (React Native, Expo)
- `packages/shared/` — 共通ロジック
- `docs/` — 設計書・開発日記・リリース関連ドキュメント

## 技術スタック
- **Web**: React, TypeScript, Vite, Dexie.js (IndexedDB), Vercel
- **Mobile**: React Native, Expo, EAS Build
- **共通**: Supabase (認証・同期), i18n (19言語対応)
- **広告**: Web=AdSense, Mobile=react-native-google-mobile-ads

## 開発ルール
- 既存コードを確認してから変更する
- 過剰なエラーハンドリング・抽象化・コメントは追加しない
- 変更は必要最小限にとどめる

## タスク完了時の手順
タスクが完了したら、以下のドキュメントを更新してから Git にコミット＆プッシュすること。

1. **`docs/03_IMPLEMENTATION.md`** — 実装した内容を記録に追記
2. **`docs/04_FUTURE.md`** — 完了したタスクのチェックボックスを更新、新規タスクがあれば追加
3. **`docs/開発日記.txt`** — 日付 (MM/DD形式) と作業内容を末尾に追記
4. **Git コミット＆プッシュ** — 変更をコミットして `origin/main` にプッシュ

## 認証情報
- Supabase の認証情報は `~/Dev/Life/.env` を参照
- Management API の実行例:
  ```bash
  source ~/Dev/Life/.env
  curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query": "YOUR SQL HERE"}'
  ```

## ビルド・デプロイ
- **Web**: `vercel` (自動デプロイ)
- **Mobile**: `cd apps/mobile && eas build --profile production --platform all`
- **開発サーバー**: `cd apps/mobile && npx expo start`
