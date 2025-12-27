# Native App Implementation Plan

本ドキュメントは、PomArc のネイティブアプリ化（Expo/React Native）およびモノレポ構成への移行計画をまとめたものです。

## 1. 目的と方針
*   **技術スタック**: Expo (React Native) + TypeScript
*   **データ永続化 (Local First)**:
    *   **Web**: IndexedDB (Dexie.js) - 既存
    *   **Mobile**: SQLite (expo-sqlite) - 新規
*   **コード共有**: モノレポ構成により、ビジネスロジック（Hooks, Utils, Types）を Web/Mobile 間で共有する。

## 2. ユーザー体験 (UI/UX)
*   **Mobile Layout V1 (Tap-to-Expand)**:
    *   PC版の3カラム構成（Todo, Schedule, Calendar）を、モバイルでは「縦積みウィジェット」として配置。
    *   各ウィジェットをタップすると全画面に展開される UI (`ExpandablePane`) を採用。
    *   既存のWeb版レスポンシブ対応ではなく、モバイル専用の最適化されたビューを提供する。

## 3. リポジトリ構成 (Monorepo)
プロジェクトを以下のディレクトリ構造に再編します。

```text
/
├── apps/
│   ├── web/     (現在の Next.js アプリケーション)
│   └── mobile/  (新規 Expo アプリケーション)
├── packages/
│   └── shared/  (共通ロジック: Types, Utils, Hooks, DB Interfaces)
└── package.json (Workspaces 設定)
```

## 4. データベース設計 (抽象化レイヤー)
Platform 固有の DB 実装を隠蔽するため、リポジトリパターンを導入します。

*   **Interface**: `StorageRepository` (共通)
*   **Implementations**:
    *   `DexieRepository` (for Web)
    *   `SQLiteRepository` (for Mobile)

## 5. ロードマップ

### Phase 1: 環境構築とリファクタリング
1.  **モノレポ移行**: 既存コードを `apps/web` へ移動し、ワークスペース設定を行う。
2.  **共通ロジック切り出し**: `src/lib`, `src/types` 等を `packages/shared` へ移動。
3.  **DB抽象化**: Web版の直接的な Dexie 依存を排除し、リポジトリ経由に変更。

### Phase 2: モバイルアプリ実装
1.  **Expo プロジェクト作成**: `apps/mobile` のセットアップ。
2.  **SQLite 実装**: `SQLiteRepository` の実装。
3.  **UI 実装**: `MOBILE_LAYOUT_V1` に基づく画面作成。

### Phase 3: 検証とリリース
1.  **データ同期検証**: Web/Mobile で同一のロジックが動作することの確認。
2.  **UI/UX 検証**: 実機での動作確認。
