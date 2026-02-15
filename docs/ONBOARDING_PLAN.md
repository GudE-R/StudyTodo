# Mobile Onboarding Implementation Plan

## 1. 概要
モバイルアプリ（Expo/React Native）の初回起動時に、アプリの機能紹介と初期設定を行う「オンボーディングフロー」を実装します。Web版の `WelcomeScreen` の内容を踏襲しつつ、モバイルに最適化されたUXを提供します。

## 2. 目的
- 新規ユーザーにアプリの価値（Todo, Timer, SRS, Analytics）を簡潔に伝える。
- スムーズに利用開始（またはログイン）へ誘導する。
- ローカルストレージ（AsyncStorage）を使用して、初回のみ表示されるように制御する。

## 3. 画面遷移設計 (Flow)

```mermaid
graph TD
    Start[アプリ起動] --> Check{オンボーディング完了済み?}
    Check -- Yes --> Main[メイン画面]
    Check -- No --> Onboarding[オンボーディング画面]
    
    subgraph Onboarding Flow
        Slide1[1. Welcome] --> Slide2[2. Manage Tasks]
        Slide2 --> Slide3[3. Calendar Integration]
        Slide3 --> Slide4[4. Timer & Focus]
        Slide4 --> Slide5[5. Automate (SRS/Routine)]
        Slide5 --> Slide6[6. Analytics]
        Slide6 --> Slide7[7. Feedback]
        Slide7 --> Complete[完了/ログイン]
    end
    
    Complete --> SetFlag[完了フラグ保存]
    SetFlag --> Main
```

## 4. 技術スタック & ライブラリ
- **State Management**: React Context (`OnboardingProvider`)
- **Persistence**: `@react-native-async-storage/async-storage`
- **Animations**: `react-native-reanimated` (既存導入済み)
- **Internationalization**: `i18next` / `react-i18next` (日/英対応)
- **UI Components**:
    - `FlatList` (pagingEnabled) を使用してカルーセルを実装。
    - `lucide-react-native` アイコンを使用。

## 5. 実装詳細

### 5.1 ディレクトリ構造
`apps/mobile/src/`
```
components/
  onboarding/
    OnboardingScreen.tsx  # メインコンテナ
    OnboardingSlide.tsx   # 各スライドのコンポーネント
    Paginator.tsx         # ドットインジケーター
providers/
  OnboardingProvider.tsx  # 完了状態の管理と永続化
```

### 5.2 コンポーネント仕様

#### `OnboardingProvider`
- **State**: `hasCompletedOnboarding` (boolean), `isLoading` (boolean)
- **Actions**: `completeOnboarding()`
- **Logic**:
    - 初期化時に `AsyncStorage.getItem('HAS_COMPLETED_ONBOARDING')` をチェック。
    - `completeOnboarding` 呼び出し時に `AsyncStorage.setItem` を実行し、Stateを更新。

#### `OnboardingScreen`
- **UI**:
    - 全画面のカルーセル（スワイプ可能）。
    - 下部にナビゲーションボタン（「次へ」「スキップ」「はじめる」）。
    - ページインジケーター。
    - **多言語対応**: `useTranslation` フックを使用し、端末設定に合わせて言語を切り替え。
- **Slides**:
    1.  **Welcome**: アプリの概要。
    2.  **Manage**: タスク作成、カテゴリ整理（優先度なし）。
    3.  **Calendar**: カレンダー・スケジュール連携、キープ機能。
    4.  **Focus**: 3種類のタイマー（ポモドーロ、カウントダウン、ストップウォッチ）。
    5.  **Automate**: SRS（間隔反復）とルーティーン機能による学習計画の自動化。
    6.  **Visualize**: 分析機能。
    7.  **Feedback**: フィードバックの送付依頼。

#### 統合
- `App.tsx` または `MainLayoutSelector.tsx` を修正。
- `OnboardingProvider` でアプリ全体をラップする。
- 完了していない場合、`MainLayout` の代わりに `OnboardingScreen` をレンダリングする。

## 6. タスクリスト

- [x] **Step 1: Provider Implementation**
    - [x] `apps/mobile/src/providers/OnboardingProvider.tsx` を作成。
    - [x] `App.tsx` に Provider を追加。

- [x] **Step 2: UI Components Implementation**
    - [x] `apps/mobile/src/components/onboarding/` ディレクトリ作成。
    - [x] `OnboardingSlide.tsx` (レイアウトとデザイン) 作成。
    - [x] `Paginator.tsx` (インジケーター) 作成。
    - [x] `OnboardingScreen.tsx` (統合ロジック) 作成。

- [x] **Step 3: Integration & I18n**
    - [x] `MainLayoutSelector` (または `AppContent`) に分岐ロジックを追加。
    - [x] スタイリング調整 (Dark mode 対応)。
    - [x] 多言語対応 (日本語/英語) の実装。

- [x] **Step 4: Verification & Refinement**
    - [x] 初期起動でオンボーディングが表示されるか確認。
    - [x] 「完了」後にメイン画面へ遷移するか確認。
    - [x] 再起動時にオンボーディングが表示されないことを確認。
    - [x] ユーザーフィードバックに基づく修正（文言変更、スライド追加）。
