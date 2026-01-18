import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { MainLayout } from './src/components/layout/MainLayout_Safe';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RepositoryProvider } from './src/providers/RepositoryProvider';
import { AuthProvider } from './src/providers/AuthProvider';
import { ThemeProvider, useTheme } from './src/providers/ThemeProvider';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <MainLayout />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <RepositoryProvider>
      <AuthProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </ThemeProvider>
      </AuthProvider>
    </RepositoryProvider>
  );
}
