import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import './src/i18n'; // Initialize i18n
import { MainLayoutSelector } from './src/components/layout/MainLayoutSelector';
import { runMigrations } from './src/utils/migrateLegacyStorage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RepositoryProvider } from './src/providers/RepositoryProvider';
import { AuthProvider } from './src/providers/AuthProvider';
import { ThemeProvider, useTheme } from './src/providers/ThemeProvider';
import { LayoutProvider } from './src/providers/LayoutProvider';
import { OnboardingProvider } from './src/providers/OnboardingProvider';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <MainLayoutSelector />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  const [isMigrationDone, setIsMigrationDone] = useState(false);

  useEffect(() => {
    // pomarc → studytodo マイグレーション
    // Provider構築（=DB初期化）前に完了させる必要がある
    runMigrations().then(() => setIsMigrationDone(true));
  }, []);

  // マイグレーション完了まで描画をブロック（スプラッシュ画面表示中に実行）
  if (!isMigrationDone) return null;

  return (
    <RepositoryProvider>
      <AuthProvider>
        <ThemeProvider>
          {/* 
            レイアウト設定（Default / Simple）をアプリ全体で管理するプロバイダー。
            アプリ起動時に保存された設定を読み込み、切り替えを可能にします。
          */}
          <LayoutProvider>
            <OnboardingProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                  {/* 
                    現在のレイアウト設定に基づいて、適切なメイン画面コンポーネント
                    （MainLayout または MainLayoutSimple）を自動的に選択して表示します。
                  */}
                  <AppContent />
                </SafeAreaProvider>
              </GestureHandlerRootView>
            </OnboardingProvider>
          </LayoutProvider>
        </ThemeProvider>
      </AuthProvider>
    </RepositoryProvider>

  );
}
