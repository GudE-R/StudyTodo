# Windows開発環境セットアップガイド

## 背景
Linux (VirtualBox) 上のプロジェクトデータをWindows側で直接開き、Windows上のAndroid Studio (エミュレータ) を使用してビルド・テストを行うための手順です。
LinuxとWindowsで同じファイルを共有している場合（共有フォルダなど）、OS間の互換性問題（特に `node_modules`）に注意が必要です。

## 前提条件
Windows側に以下のツールがインストールされている必要があります。
1.  **Node.js (LTS)**: v20推奨。
2.  **Git for Windows**: リポジトリ操作用。
3.  **JDK 17**: Androidビルドに必要（Zulu OpenJDK 17 など）。
4.  **Android Studio**: エミュレータとSDK Platform-Tools。
    - SDK Managerで `Android SDK Platform 34` (または最新) をインストール。
    - 環境変数 `ANDROID_HOME` を設定。

## 手順

### 1. プロジェクトの準備
もしLinuxとファイルを共有している場合（VirtualBoxの共有フォルダ機能など）、**Linux側でインストールした依存関係はWindowsでは動きません**。

Windows側のターミナル（PowerShell または Command Prompt）でプロジェクトルートを開き、以下を実行してクリーンインストールします。

```powershell
# node_modules とロックファイルを削除 (Linux版のバイナリを一掃するため)
rm -r node_modules
rm -r apps/mobile/node_modules
# ...他ワークスペースがあれば同様に

# Windows用に依存関係を再インストール
npm install
```

### 2. 環境変数の設定
`.env` ファイルがプロジェクトルートにあることを確認してください。
Windowsには `cp` コマンドがない場合があるため、エクスプローラーでコピーするか、以下のように作成します。

```powershell
# まだ存在しない場合
copy .env.example .env
```

### 3. モバイルアプリの起動
Windows側のターミナルで実行します。

```powershell
cd apps/mobile
npx expo run:android
```

- これにより、Windows上でGradleビルドが走り、Windows上のエミュレータにアプリがインストールされます。
- Metro BundlerもWindows上で立ち上がります。

## 注意点
- **改行コード**: Gitの設定で `core.autocrlf` が `true` になっていると、Linux側で見た時に変更差分が大量に出る可能性があります。`input` または `false` 推奨です。
- **シンボリックリンク**: Linuxで作成したシンボリックリンクはWindowsでは機能しない場合があります。
- **Gradle**: Windowsでの初回ビルド時、Gradleのダウンロードが走るため時間がかかります。

---

これで「Linuxでコードを書き、Windowsで実行/テストする」というハイブリッドな開発が可能になります。
本来は `node_modules` を共有しない（OSごとに別の場所にcloneする）のが最も安全ですが、共有フォルダを使う場合は上記のように `node_modules` の再構築が必須です。
