# Windowsエミュレータでのテスト手順

## 背景
モバイルアプリに **AdMob (広告)** を導入したため、Expo Goアプリでは動作しなくなりました（ネイティブモジュールが含まれるため）。
そのため、**開発ビルド (Development Build)** を作成し、エミュレータにインストールする必要があります。

Linux環境（VirtualBox/WSL）からWindows側のエミュレータを直接起動するのは難しいため、以下の手順で進めます。

1. **Linux**: アプリのインストーラー(APK)を作成する
2. **Windows**: エミュレータを起動し、APKをインストールする
3. **Linux**: 開発サーバーを起動し、Windowsから接続する

---

## 手順 1: LinuxでAPKをビルドする
ターミナルで以下のコマンドを実行し、Android用のデバッグビルドを作成します。

```bash
cd apps/mobile/android
./gradlew assembleDebug
```
※ 初回は数分〜10分程度かかります。

**成功すると:**
以下のパスに `app-debug.apk` というファイルが生成されます。
`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 手順 2: APKをWindowsに移動してインストール
1. Windowsのエクスプローラーで、上記の `app-debug.apk` を探します（共有フォルダ等経由）。
2. **Windows側でAndroid Studioのエミュレータを起動**します。
3. `app-debug.apk` ファイルを、**エミュレータの画面上にドラッグ＆ドロップ**します。
   - または `adb install app-debug.apk` コマンドを使用。
4. インストールが完了すると、アプリ一覧に「StudyTodo」アイコンが表示されます。

---

## 手順 3: 開発サーバーに接続
1. **Linux側のターミナル**で、開発サーバーを立ち上げます。
   - Windowsからアクセスできるよう `--tunnel` (推奨) または `--host lan` を付けます。

```bash
# apps/mobile ディレクトリで
npx expo start --dev-client --tunnel
```

2. **Windowsのエミュレータ**で、インストールした「StudyTodo」アプリを開きます。
3. 開発サーバーのURL（`exp://...`）を入力するか、QRコードをスキャンして接続します。
   - トンネル接続の場合、少し待つと自動的に接続されることもあります。
   - 手動入力の場合: アプリ画面上の入力欄に `exp://.......` を入力して「Connect」を押します。

---

## トラブルシューティング
- **ビルドエラー**: `JAVA_HOME` が設定されていない等のエラーが出た場合は、Java環境を確認してください。
- **接続できない**: WindowsとLinuxが通信できていない可能性があります。`--tunnel` を使うのが最も確実です。
