import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { MainLayout } from './src/components/layout/MainLayout_Safe';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RepositoryProvider } from './src/providers/RepositoryProvider';
import { AuthProvider } from './src/providers/AuthProvider';

export default function App() {
  return (
    <RepositoryProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <MainLayout />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </AuthProvider>
    </RepositoryProvider>
  );
}
