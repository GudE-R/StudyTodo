# Windows環境での本番ビルドガイド (EAS Build)

このガイドでは、Windows環境を使用してAndroid/iOSアプリの本番ビルド（aab/ipaファイル）を作成する手順を説明します。
ビルド自体はExpoのクラウドサーバー上で行われますが、コマンドの実行はローカル（Windows）から行います。

## 1. 事前準備

WindowsのコマンドプロンプトまたはPowerShellで以下のコマンドを実行し、ツールがインストールされているか確認してください。

### 1-1. Node.jsの確認
```powershell
node -v
npm -v
```
バージョンが表示されればOKです。

### 1-2. EAS CLIのインストール
Expo Application Services (EAS) のコマンドラインツールをインストールします。
```powershell
npm install -g eas-cli
```

### 1-3. Expoアカウントへのログイン
```powershell
eas login
```
ブラウザが開くか、プロンプトが表示されるので、Expoアカウントの認証情報を入力してログインします。

## 2. 最新コードの取得

プロジェクトのディレクトリに移動し、Linux環境でプッシュされた最新の変更を取り込みます。

```powershell
cd path\to\PomArc
git pull origin feature/mobile-development
```

## 3. ビルドの実行

### Android (Play Store用)
```powershell
cd apps/mobile
eas build --platform android --profile production
```

### iOS (App Store用)
※Apple Developer Programへの登録が必要です。
```powershell
cd apps/mobile
eas build --platform ios --profile production
```

## 4. ビルド中の対話 (初回のみ)

初めてビルドする場合、EAS CLIはいくつかの質問をしてきます。基本的にはそのままEnter（Yes）で進めて問題ありません。

- **Generate a new keystore?** (Android): `Y` (Yes) を選択してください。署名鍵が自動生成され、Expoのサーバーに安全に保存されます。
- **Google Play Service Account Key**: アップロード用のAPIキーを求められることがありますが、手動アップロードする場合はスキップ可能です。

## 5. ビルド完了後

ビルドが成功すると、ダッシュボードのURLと、ビルド成果物（`.aab` または `.ipa`）のダウンロードリンクが表示されます。
これをダウンロードし、各ストア（Google Play Console / App Store Connect）へアップロードしてください。
