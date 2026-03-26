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
- プッシュ後にCI/CDテストが失敗した場合は、通過するまで修正すること（`gh run list` で確認し、失敗時は原因を特定して修正→再プッシュ）

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

## AIエージェント向けルール
- チャットやアーティファクトの生成には必ず日本語を使用すること
- コマンド実行時は `cd` を使わず、`run_command` の `Cwd` パラメータで作業ディレクトリを指定すること
  - （悪い例: `cd /home/gude/Dev/StudyTodo && git status`）
  - （良い例: `Cwd="/home/gude/Dev/StudyTodo"` `CommandLine="git status"`）
- **GitHub CLI (`gh`) の活用**:
  - CIの状況確認だけでなく、AIエージェントによる自動的なIssueの確認・作成 (`gh issue`) やPull Requestの作成 (`gh pr`) を適宜実施すること。
