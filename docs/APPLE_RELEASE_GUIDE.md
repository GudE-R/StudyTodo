# Apple Developer Program 登録ガイド

iOSアプリを App Store で公開するには、Apple Developer Program への登録（有料）が必要です。

## 1. 登録の手順

1.  **Apple ID の準備**:
    - [Apple ID 登録ページ](https://appleid.apple.com/)で作成するか、既存のものを使用します。
    - 2ファクタ認証が有効になっている必要があります。

2.  **登録の開始**:
    - Apple Developer アプリ（iOS/iPad/Mac用）をダウンロードして登録するか、[ブラウザ](https://developer.apple.com/programs/)から手続きを行います。
    - **個人**として登録する場合、身分証明書の提示が求められることがあります。
    - 年会費: **99米ドル**（約15,000円前後、年更新）

    > [!NOTE]
    > **Macは必須ではありません**: 2026年現在、Expo EAS (Build/Submit) を使用することで、LinuxやWindows環境からでも iOSアプリのビルドと App Store への提出が完結できます。物理的なMacが必要になるのは、ネイティブコードの深いデバッグや、Xcode固有の機能を使用する場合に限られます。

3.  **確認待ち**:
    - 支払いが完了した後、登録が承認されるまで数時間〜数日かかる場合があります。

## 2. App Store Connect API キーの発行 (EAS Build/Submit 用)

EAS（Expo）を使って Linux やサーバから自動的にビルド・提出を行うために、API キーを発行しておくと非常にスムーズです。これにより、Apple ID の 2段階認証を毎回手動で行う必要がなくなります。

1.  [App Store Connect](https://appstoreconnect.apple.com/) にログインします。
2.  **「ユーザとアクセス」** (Users and Access) を選択します。
3.  **「統合」** (Integrations) タブを選択します。
    - 以前の「キー」タブはこの中に移動されました。
4.  左側のメニューから **「App Store Connect API」** を選択します。
5.  **「キーを生成」** または **「＋」** をクリックします。
    - 名前: `EAS API Key` など任意
    - アクセス権: **「管理者」** または **「アプリ管理」** を推奨
6.  生成された **Issuer ID** と **キーID** をメモし、**キーファイル (.p8)** をダウンロードします。
    > [!WARNING]
    > キーファイルは一度しかダウンロードできません。大切に保管してください。

## 3. App ID (Identifier) の登録

App Store Connect で「新規 App」を作成する前に、Apple Developer Program のポータルで **App ID** を登録する必要があります。

1.  [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) にアクセスします。
2.  **「Identifiers」** の横の **「＋」** ボタンをクリックします。
3.  **「App IDs」** を選択して 「Continue」 をクリック。
4.  タイプは **「App」** を選択して 「Continue」。
5.  詳細を入力：
    - **Description**: `StudyTodo` （管理上の名前です。ストアには表示されないので短くてOKです）
    - **Bundle ID**: **「Explicit」** を選択し、`com.studytodo.app` と入力。（`app.config.ts` の `bundleIdentifier` と一致させる）
6.  **「Continue」** -> **「Register」** をクリックして完了です。

> [!NOTE]
> **「機能 (Capabilities)」の選択について**
> 登録時に「Push Notifications」などの機能を有効にするか選ぶ項目がありますが、これらは**後からいつでも変更可能**です。最初はデフォルトのままでも問題ありません。何か特定の機能（ iCloud や Apple でサインインなど）が必要になった際に追加設定できます。

> [!TIP]
> **EAS による自動登録**: `npx eas credentials` や `npx eas build` を実行した際に、まだ App ID が登録されていない場合、EAS が自動的に作成するか聞いてくれることがあります。その場合は、ポータルでの手動操作は不要です。

## 4. アプリの作成

App Store Connect の「マイ App」から、新しいアプリを登録します。
- **名称**: StudyTodo
- **プライマリ言語**: **English (U.S.)** を推奨
    > [!TIP]
    > グローバル展開を考えている場合、プライマリ言語を English (U.S.) に設定しておくと、他の言語が用意されていない地域（北欧や中東など）でデフォルトの言語として英語が表示されるため、より多くのユーザーに内容を理解してもらえます。日本語の内容は「ローカライズ」として別途追加できます。
- **バンドルID**: `com.studytodo.app` (app.config.ts と一致させる必要があります)
- **SKU**: `studytodo-ios-v1` などの一意のID
- **キーワード**: 最大 100 文字
    > [!TIP]
    > **キーワードの書き方ルール**:
    > - 単語を **カンマ (`,`)** で区切って並べます。
    > - スペースは文字数を消費するため、入れないのが一般的です（例: `Todo,Timer,SRS,Study`）。
    > - 重複する単語やアプリ名自体を入れる必要はありません。

- **サポートURL**: `https://studytodo.vercel.app/ja` (または `.../en`)
    - ※以前、プライバシーポリシーに記載されていた連絡先は `studytodoapp@gmail.com` でした。

## 5. 多言語対応（ローカライズ）の設定

プライマリ言語を英語に設定した場合でも、以下の手順で「日本語」を追加することで、日本のユーザーには日本語の紹介文やスクリーンショットを見せることができます。

1.  App Store Connect のアプリ詳細画面で、左メニューの **「App 情報」** を選択します。
2.  右上の言語選択ドロップダウン（デフォルトは English (U.S.)）の横にある **「＋」** ボタンをクリックします。
3.  **「日本語」** を選択して追加します。
4.  追加された「日本語」のページで、日本語のアプリ名、説明文、キーワードを入力します。
5.  **「表示順序」** セクションで、日本語用のスクリーンショットをアップロードします。

> [!IMPORTANT]
> **キーワードの相乗効果**: 日本の App Store では、日本語のキーワードに加えて **English (U.S.) のキーワードも検索対象になります**。両方の言語で異なるキーワードを設定することで、検索で見つけてもらえる可能性（インデックス数）を実質 2倍に増やすことができます。
