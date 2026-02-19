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

3.  **確認待ち**:
    - 支払いが完了した後、登録が承認されるまで数時間〜数日かかる場合があります。

## 2. App Store Connect API キーの発行 (EAS Build/Submit 用)

EAS（Expo）を使って Linux やサーバから自動的にビルド・提出を行うために、API キーを発行しておくと非常にスムーズです。

1.  [App Store Connect](https://appstoreconnect.apple.com/) にログインします。
2.  **「ユーザとアクセス」** を選択します。
3.  **「キー」** タブ（または「APIキー」）をクリックします。
4.  **「キーを生成」** をクリックします。
    - 名前: `EAS API Key` など任意
    - アクセス権: **「管理者」** または **「アプリ管理」** を推奨
5.  生成された **Issuer ID** と **キーID** をメモし、**キーファイル (.p8)** をダウンロードします。
    > [!WARNING]
    > キーファイルは一度しかダウンロードできません。大切に保管してください。

## 3. アプリの作成

App Store Connect の「マイ App」から、新しいアプリを登録します。
- **名称**: StudyTodo
- **プライマリ言語**: 日本語
- **バンドルID**: `com.studytodo.app` (app.config.ts と一致させる必要があります)
- **SKU**: `studytodo-ios-v1` などの一意のID
