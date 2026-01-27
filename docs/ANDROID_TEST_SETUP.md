# Android エミュレータ セットアップガイド (Linux)

実機がない環境で Android 版アプリをテストするために、Android Studio のエミュレータ (AVD) をセットアップする手順です。

## 1. Android Studio のインストール

1. [Android Studio 公式サイト](https://developer.android.com/studio) から Linux 用パッケージをダウンロードします。
2. 解凍して `bin/studio.sh` を実行し、セットアップウィザードに従います。
3. "Standard" インストールを選択し、SDK、SDK Platform、Build-Tools をインストールします。

## 2. 環境変数の設定

`~/.bashrc` または `~/.zshrc` に以下の設定を追加します。

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

設定を反映させます：
```bash
source ~/.bashrc  # または ~/.zshrc
```

## 3. エミュレータ (AVD) の作成

1. Android Studio を開き、**Device Manager** を選択します。
2. **Create Device** をクリックします。
3. **Phone** (例: Pixel 7) を選択し、**Next** をクリックします。
4. システムイメージを選択します（例: **UpsideDownCake** / API 34 / x86_64）。ダウンロードが必要な場合は「↓」アイコンをクリックします。
5. **Finish** をクリックして作成を完了します。

## 4. KVM の設定 (Linux のみ)

エミュレータを高速に動作させるために必要です。

```bash
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
sudo adduser $USER kvm
```
※ 設定後、一度ログアウトして再ログインする必要があります。

## 5. エミュレータの起動と実行

1. Device Manager から作成したデバイスの「再生アイコン」をクリックしてエミュレータを起動します。
2. ターミナルで `apps/mobile` に移動し、開発サーバーを起動します：
   ```bash
   npx expo start
   ```
3. サーバーが起動したら、キーボードの **`a`** を押すと、エミュレータ内でアプリが起動します。

## 6. トラブルシューティング

### "Error: spawn adb ENOENT" が発生する場合

Expoが Android SDK を見つけられないエラーです。特に Linux ではフォルダ名の大文字・小文字が区別されるため、パスの不一致が原因になることが多いです。

**原因**:
実際のインストール場所が `~/Android/Sdk` (大文字S) であるのに対し、ツールが `~/Android/sdk` (小文字kms) を探している場合があります。

**解決策**:
シンボリックリンクを作成して、どちらのパスでもアクセスできるようにします。

```bash
ln -s ~/Android/Sdk ~/Android/sdk
```

または、`~/.bashrc` で `ANDROID_HOME` を正しく設定し直してください。

### アプリが白画面になり "Pomarc-Monorepo" と表示される

**原因**:
プロジェクトのルートディレクトリ (`pomarc-monorepo`) で `npx expo start` を実行していませんか？

**解決策**:
必ずモバイルアプリのディレクトリに移動してから実行してください。

```bash
cd apps/mobile
npx expo start
```
