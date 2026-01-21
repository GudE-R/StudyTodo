import React from 'react';
import { StatusBar } from 'expo-status-bar';
import './src/i18n'; // Initialize i18n
import { MainLayoutSelector } from './src/components/layout/MainLayoutSelector';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RepositoryProvider } from './src/providers/RepositoryProvider';
import { AuthProvider } from './src/providers/AuthProvider';
import { ThemeProvider, useTheme } from './src/providers/ThemeProvider';
import { LayoutProvider } from './src/providers/LayoutProvider';

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
  return (
    <RepositoryProvider>
      <AuthProvider>
        <ThemeProvider>
          <LayoutProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <AppContent />
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </LayoutProvider>
        </ThemeProvider>
      </AuthProvider>
    </RepositoryProvider>
  );
}
