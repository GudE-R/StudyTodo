import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { MainLayout } from './src/components/layout/MainLayout_Safe';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RepositoryProvider } from './src/providers/RepositoryProvider';

export default function App() {
  return (
    <RepositoryProvider>
      <SafeAreaProvider>
        <MainLayout />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </RepositoryProvider>
  );
}
