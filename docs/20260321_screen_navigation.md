# StudyTodo 画面遷移図
> 作成日: 2026-03-21

---

## 全体フロー

```mermaid
flowchart TD
    Start([アプリ起動]) --> IsFirst{初回起動?}

    IsFirst -->|Web| Landing[Landing Page]
    IsFirst -->|Mobile| Onboarding[Onboarding Screen]
    IsFirst -->|No| Home

    Landing --> Auth[Auth Page<br/>Login / Signup / Reset]
    Onboarding --> Home
    Auth -->|認証成功| Home

    Home[★ メイン画面 Home]

    Home --> Timer[Timer View<br/>Pomodoro / Countdown / Stopwatch]
    Timer -->|完了 / 戻る| Home

    style Home fill:#4CAF50,color:#fff,stroke:#388E3C
    style Timer fill:#FF9800,color:#fff,stroke:#F57C00
    style Auth fill:#2196F3,color:#fff,stroke:#1565C0
```

---

## Web版 画面遷移図

### ページルーティング

```mermaid
flowchart LR
    subgraph Routes["Web ルーティング"]
        R1["/[locale]/"] -->|初回| LandingPage
        R1 -->|通常| HomePage
        R2["/[locale]/auth"] --> AuthPage
        R3["/[locale]/privacy"] --> PrivacyPage
        R4["/[locale]/terms"] --> TermsPage
    end
```

### メイン画面の構成

```mermaid
block-beta
    columns 3

    AdBanner["AdBanner (広告)"]:3

    DateBar["DateBar: ◀ 日付 ▶ &nbsp;&nbsp; Guide | Feedback | Settings"]:3

    TodoList["TodoList<br/>(30%)<br/>タスク一覧"]
    DaySchedule["DaySchedule<br/>(30%)<br/>タイムライン"]
    CalendarPane["CalendarPane<br/>(40%)<br/>カレンダー + 分析"]

    BottomActions["[Template] &nbsp;&nbsp; [＋] &nbsp;&nbsp; [Activity]"]:3

    style AdBanner fill:#f5f5f5,stroke:#ddd
    style DateBar fill:#e3f2fd,stroke:#90caf9
    style TodoList fill:#fff,stroke:#ccc
    style DaySchedule fill:#fff,stroke:#ccc
    style CalendarPane fill:#fff,stroke:#ccc
    style BottomActions fill:#e8f5e9,stroke:#a5d6a7
```

### モーダル遷移図

```mermaid
flowchart TD
    Home([メイン画面]) --> DateBar
    Home --> BottomActions
    Home --> TaskClick

    subgraph DateBar["DateBar"]
        Settings["⚙ Settings"]
        Guide["? Guide"]
        Feedback["💬 Feedback"]
    end

    subgraph BottomActions["BottomActions"]
        Template["Template"]
        Plus["＋ 新規作成"]
        Activity["Activity"]
    end

    TaskClick["タスククリック"]

    Settings --> SettingsModal
    Guide --> GuideModal[Usage Guide Modal]
    Feedback --> FBModal[Feedback Modal]

    Template --> TemplateModal
    Plus --> TodoCreateModal
    Activity --> ActivityModal

    TaskClick --> TodoDetailModal

    subgraph SettingsModal["Settings Modal"]
        S1[テーマ設定]
        S2[クラウド同期]
        S3[データ管理]
        S4[退会]
        S2 --> AuthModal[Auth Modal]
        S3 --> Backup[JSONバックアップ]
        S3 --> Export[CSVエクスポート]
    end

    subgraph TemplateModal["Template Modal"]
        T1[カテゴリ管理<br/>大 → 中 → 小]
        T2[SRS設定<br/>プロファイル / 間隔]
    end

    subgraph TodoCreateModal["Todo Create Modal"]
        C1[作成して保存]
        C2[記録]
        C3[即開始]
    end
    C3 --> Timer([Timer View])

    subgraph ActivityModal["Activity Modal"]
        A1[分析タブ<br/>期間別グラフ]
        A2[履歴タブ<br/>セッション一覧]
        A3[シェアタブ<br/>SNS共有 / 広告非表示]
    end

    subgraph TodoDetailModal["Todo Detail Modal"]
        D1[編集]
        D2[削除]
        D3[開始]
        D4[記録]
    end
    D3 --> Timer

    style Home fill:#4CAF50,color:#fff
    style Timer fill:#FF9800,color:#fff
```

### 認証ページの状態遷移

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> Signup: 切替
    Signup --> Login: 切替
    Login --> PasswordReset: パスワードを忘れた
    PasswordReset --> UpdatePassword: メールリンク
    UpdatePassword --> Login: 更新完了

    Login --> Home: 認証成功
    Signup --> Home: 認証成功

    state Home {
        [*] --> メイン画面
    }
```

---

## Mobile版 画面遷移図

### 起動フロー

```mermaid
flowchart TD
    App([App.tsx]) --> Providers

    subgraph Providers["Provider Stack"]
        direction LR
        P1[Repository] --> P2[Auth] --> P3[Theme] --> P4[Layout] --> P5[Onboarding]
    end

    Providers --> Selector{MainLayout<br/>Selector}

    Selector -->|未オンボーディング| OB[Onboarding Screen]
    Selector -->|simple| Simple[MainLayout Simple]
    Selector -->|default| Default[MainLayout Default]

    OB --> Default
```

### デフォルトレイアウト

```mermaid
block-beta
    columns 2

    AdBanner["AdBanner (広告)"]:2
    Header["Header: ◀ 日付 ▶ &nbsp;&nbsp; Guide | Feedback | Settings"]:2
    TodoList["TodoList (50%)<br/>タスク一覧"]
    DaySchedule["DaySchedule (50%)<br/>タイムライン"]
    Calendar["HomeCalendar<br/>週/月スワイプ切替"]:2
    Footer["[Template] &nbsp; [＋] &nbsp; [Activity]"]:2

    style AdBanner fill:#f5f5f5,stroke:#ddd
    style Header fill:#e3f2fd,stroke:#90caf9
    style TodoList fill:#fff,stroke:#ccc
    style DaySchedule fill:#fff,stroke:#ccc
    style Calendar fill:#fff3e0,stroke:#ffcc80
    style Footer fill:#e8f5e9,stroke:#a5d6a7
```

### シンプルレイアウト

```mermaid
block-beta
    columns 1

    AdBanner["AdBanner"]
    Header["Header: ◀ 日付 ▶"]
    Calendar["Calendar (スワイプ: 週↔月)"]
    Schedule["Schedule (スワイプ: 展開↔収縮)"]
    TodoList["TodoList (残りの空間)"]
    Footer["[Template] [＋] [Activity] [≡ Menu]"]

    style AdBanner fill:#f5f5f5,stroke:#ddd
    style Header fill:#e3f2fd,stroke:#90caf9
    style Calendar fill:#fff3e0,stroke:#ffcc80
    style Schedule fill:#fff,stroke:#ccc
    style TodoList fill:#fff,stroke:#ccc
    style Footer fill:#e8f5e9,stroke:#a5d6a7
```

### モーダル遷移図 (Mobile)

```mermaid
flowchart TD
    Home([メイン画面]) --> Header
    Home --> Footer
    Home --> LongPress

    subgraph Header
        H1["⚙ Settings"]
        H2["📖 Guide"]
        H3["💬 Feedback"]
    end

    subgraph Footer
        F1["Template"]
        F2["＋"]
        F3["Activity"]
        F4["≡ Menu<br/>(Simpleのみ)"]
    end

    LongPress["タスク長押し"]

    H1 --> SettingsM[Settings Modal]
    H2 --> GuideM[Guide Modal]
    H3 --> FBM[Feedback Modal]

    F1 --> TemplateM[Template Modal]
    F2 --> CreateM[Todo Create Modal]
    F3 --> ActivityM[Activity Modal]
    F4 --> MenuM

    LongPress --> DetailM[Todo Detail Modal]

    subgraph MenuM["Menu Modal (Simpleのみ)"]
        M1[Settings]
        M2[Guide]
        M3[Feedback]
    end
    M1 --> SettingsM
    M2 --> GuideM
    M3 --> FBM

    subgraph SettingsM["Settings Modal"]
        SM1[テーマ]
        SM2[レイアウト切替<br/>Default / Simple]
        SM3[同期 → Auth Modal]
        SM4[データ管理]
        SM5[Privacy Policy Modal]
        SM6[Terms Modal]
        SM7[退会]
    end

    subgraph TemplateM["Template Modal"]
        TM1[カテゴリ管理]
        TM2[SRS設定]
    end

    subgraph CreateM["Todo Create Modal"]
        CM1[保存]
        CM2[記録]
        CM3[即開始]
    end
    CM3 --> Timer([Timer View 全画面])

    subgraph ActivityM["Activity Modal"]
        AM1[分析タブ]
        AM2[履歴タブ]
        AM3[シェアタブ]
    end

    subgraph DetailM["Todo Detail Modal"]
        DM1[編集]
        DM2[削除]
        DM3[開始]
        DM4[記録]
    end
    DM3 --> Timer

    Timer -->|完了/戻る| Home

    style Home fill:#4CAF50,color:#fff
    style Timer fill:#FF9800,color:#fff
```

---

## TemplateModal 内部構成

```mermaid
flowchart LR
    subgraph TemplateModal
        direction TB
        subgraph Category["カテゴリ管理"]
            CL[大カテゴリ] --> CM[中カテゴリ] --> CS[小カテゴリ]
            CA([追加 / 編集 / 削除<br/>色変更 / アイコン])
        end
        subgraph SRS["SRS設定"]
            SP[プロファイル一覧] --> SI[間隔設定]
            SA([追加 / 編集 / 削除<br/>デフォルト設定])
        end
    end
```

---

## ActivityModal 内部構成

```mermaid
flowchart LR
    subgraph ActivityModal
        direction TB
        subgraph Analytics["分析タブ"]
            AN1[期間選択: 日/週/月/全期間]
            AN2[学習時間グラフ]
            AN3[カテゴリ別集計]
        end
        subgraph History["履歴タブ"]
            HI1[セッション一覧]
            HI2[個別削除 / 一括削除]
        end
        subgraph Share["シェアタブ"]
            SH1[学習カード生成]
            SH2[SNSシェア]
            SH3[24h広告非表示リワード]
        end
    end
```

---

## Keep機能の状態遷移

```mermaid
stateDiagram-v2
    state "通常状態" as Normal
    state "Keep状態 (＋ボタン橙色)" as KeepActive
    state "TodoCreateModal (日時プリセット)" as CreateWithKeep
    state "TodoCreateModal (日時なし)" as CreateNormal

    [*] --> Normal

    Normal --> KeepActive: Schedule時間枠 長押し\nCalendar日付 長押し
    KeepActive --> Normal: ✕ リセット

    Normal --> CreateNormal: ＋ボタン
    KeepActive --> CreateWithKeep: ＋ボタン

    note right of KeepActive
        keptDate: 長押し日付
        keptTime: 長押し時刻
    end note
```

---

## Web版 vs Mobile版 差分

| 項目 | Web版 | Mobile版 |
|------|-------|----------|
| レイアウト | 3パネル固定 | Default / Simple 切替 |
| ナビゲーション | DateBar 上部 | Header 上部 |
| メニュー | DateBar に直接配置 | Default: Header / Simple: MenuModal |
| タスク操作 | クリック | 長押し |
| カレンダー | 月表示固定 | 週/月スワイプ切替 |
| Schedule | 常時表示 | Default: 常時 / Simple: スワイプ展開 |
| Privacy/Terms | 別ページ遷移 | Modal表示 |
| Timer | 画面内切替 | 全画面切替 (viewMode) |
| キーボード | Cmd+N, ESC 対応 | なし |
| 広告 | AdSense (上部固定) | AdMob (上部固定) |
