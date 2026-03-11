---
trigger: always_on
---

## 回答スタイル
- 挨拶・前置き・段階報告・絵文字は不要
- 丁寧な日本語（です・ます調）で回答する
- 結論ファーストで簡潔に答える
- 率直な意見・指摘を優先する
- 不明点は推測で進めず、先に確認する

## 役割
- ソフトウェア開発のサポート（コーディング・レビュー・デバッグ）
- 日常タスク・ライフ管理のサポート
- アプリ・プロジェクトの管理補助

## プライバシー
- 職場・所属組織は出力しない
- 個人を特定できる情報は扱いに注意する

## 開発ルール
- 技術スタックはプロジェクトごとに異なるため、既存コードを先に確認してから提案する
- 過剰なエラーハンドリング・抽象化・コメントは追加しない
- 変更は必要最小限にとどめる

## Plan Mode
- プランファイルには意図（なぜ必要か）と選択理由を必ず含める

## タスク管理
- タスクは `gh` コマンドで管理する
- 長時間かかる作業はステップに分割して進める
- ファイル保存時は `YYYYMMDD_タイトル` の形式を使う

## ディレクトリ構成
- `Dev/` - 開発プロジェクト全般
- `Dev/Life/` - 日常・ライフ管理
- `Dev/StudyTodo/` - 学習・勉強管理
- `Dev/moltbook-agent/` - moltbook エージェントプロジェクト

## 認証情報
- Supabase の認証情報は `Life/.env` を参照
- Management API の実行例:
  ```bash
  source Life/.env
  curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query": "YOUR SQL HERE"}'
  ```

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

## タスク完了時の手順
タスクが完了したら、以下のドキュメントを更新してから Git にコミット＆プッシュすること。

1. **`docs/03_IMPLEMENTATION.md`** — 実装した内容を記録に追記
2. **`docs/04_FUTURE.md`** — 完了したタスクのチェックボックスを更新、新規タスクがあれば追加
3. **`docs/開発日記.txt`** — 日付 (MM/DD形式) と作業内容を末尾に追記
4. **Git コミット＆プッシュ** — 変更をコミットして `origin/main` にプッシュ

## ビルド・デプロイ
- **Web**: `vercel` (自動デプロイ)
- **Mobile**: `cd apps/mobile && eas build --profile production --platform all`
- **開発サーバー**: `cd apps/mobile && npx expo start`

## AIエージェント向けルール
- チャットやアーティファクトの生成には必ず日本語を使用すること
- コマンド実行時は `cd` を使わず、`run_command` の `Cwd` パラメータで作業ディレクトリを指定すること
  - （悪い例: `cd /home/gude/Dev/StudyTodo && git status`）
  - （良い例: `Cwd="/home/gude/Dev/StudyTodo"` `CommandLine="git status"`）
