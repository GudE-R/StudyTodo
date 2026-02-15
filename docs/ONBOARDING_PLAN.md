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
        Slide2 --> Slide3[3. Timer & Focus]
        Slide3 --> Slide4[4. SRS (忘却曲線)]
        Slide4 --> Slide5[5. Analytics & Sync]
        Slide5 --> Complete[完了/ログイン]
    end
    
    Complete --> SetFlag[完了フラグ保存]
    SetFlag --> Main
```

## 4. 技術スタック & ライブラリ
- **State Management**: React Context (`OnboardingProvider`)
- **Persistence**: `@react-native-async-storage/async-storage`
- **Animations**: `react-native-reanimated` (既存導入済み)
- **UI Components**:
    - `FlatList` (pagingEnabled) または `Animated.ScrollView` を使用してカルーセルを実装。
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
- **Slides**:
    1.  **Welcome**: ロゴ、アプリ名、キャッチコピー。
    2.  **Manage**: Todo作成
    3.  **Focus**: タイマー機能の紹介。
    4.  **Memory**: SRS（忘却曲線）の紹介。
    5.  **Visualize**: 分析と同期機能の紹介。

#### 統合
- `App.tsx` または `MainLayoutSelector.tsx` を修正。
- `OnboardingProvider` でアプリ全体をラップする。
- 完了していない場合、`MainLayout` の代わりに `OnboardingScreen` をレンダリングする。

## 6. タスクリスト

- [ ] **Step 1: Provider Implementation**
    - [ ] `apps/mobile/src/providers/OnboardingProvider.tsx` を作成。
    - [ ] `App.tsx` に Provider を追加。

- [ ] **Step 2: UI Components Implementation**
    - [ ] `apps/mobile/src/components/onboarding/` ディレクトリ作成。
    - [ ] `OnboardingSlide.tsx` (レイアウトとデザイン) 作成。
    - [ ] `Paginator.tsx` (インジケーター) 作成。
    - [ ] `OnboardingScreen.tsx` (統合ロジック) 作成。

- [ ] **Step 3: Integration**
    - [ ] `MainLayoutSelector` (または `AppContent`) に分岐ロジックを追加。
    - [ ] スタイリング調整 (Dark mode 対応)。

- [ ] **Step 4: Verification**
    - [ ] 初期起動でオンボーディングが表示されるか確認。
    - [ ] 「完了」後にメイン画面へ遷移するか確認。
    - [ ] 再起動時にオンボーディングが表示されないことを確認。
