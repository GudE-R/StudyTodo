---
description: モバイルアプリ（Expo）の起動方法
---

# モバイルアプリ (Expo) の起動とテスト方法

モバイルアプリは `apps/mobile` ディレクトリ内で Expo CLI を使用して起動します。

## 事前準備
1.  スマートフォンに **Expo Go** アプリをインストールしてください。
    *   [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)
    *   [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
2.  PCとスマートフォンが **同じWi-Fiネットワーク** に接続されていることを確認してください。

## 起動手順

1.  ターミナルを開き、`apps/mobile` ディレクトリに移動します。
    ```powershell
    cd apps/mobile
    ```

2.  開発サーバーを起動します。
    // turbo
    ```powershell
    npx expo start
    ```

3.  QRコードが表示されます。
    *   **Android**: Expo Goアプリを開き、「Scan QR Code」をタップしてQRコードを読み取ります。
    *   **エミュレータ (実機なし)**: PCでAndroidエミュレータを起動し、ターミナルで `a` キーを押します。詳細は [ANDROID_TEST_SETUP.md](../../docs/ANDROID_TEST_SETUP.md) を参照してください。
    *   **iOS**: 標準のカメラアプリでQRコードを読み取り、Expo Goで開く通知をタップします。

## トラブルシューティング
*   **VirtualBox環境の場合**: NAT モードでは物理スマートフォンから接続できません。必ず `--tunnel` オプションを使用してください：
    ```bash
    npx expo start --tunnel
    ```
*   **接続できない場合**: Windowsのファイアウォール設定でNode.jsの通信が許可されているか確認してください。または、`npx expo start --tunnel` コマンドでトンネル接続を試してください（少し遅くなりますが、ネットワーク制限を回避できます）。
*   **キャッシュの問題**: 動作がおかしい場合は、`npx expo start -c` でキャッシュをクリアして起動してください。
*   **Network request failed エラー**: Supabaseプロジェクトが一時停止している可能性があります。[Supabase Dashboard](https://supabase.com/dashboard) でプロジェクトを確認・復帰してください。
