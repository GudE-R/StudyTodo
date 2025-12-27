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
    *   **iOS**: 標準のカメラアプリでQRコードを読み取り、Expo Goで開く通知をタップします。

## トラブルシューティング
*   **接続できない場合**: Windowsのファイアウォール設定でNode.jsの通信が許可されているか確認してください。または、`npx expo start --tunnel` コマンドでトンネル接続を試してください（少し遅くなりますが、ネットワーク制限を回避できます）。
*   **キャッシュの問題**: 動作がおかしい場合は、`npx expo start -c` でキャッシュをクリアして起動してください。
