import { vi } from 'vitest';

// Mock React Native __DEV__ global
(globalThis as any).__DEV__ = true;

// Mock expo-sqlite
vi.mock('expo-sqlite', () => ({
    openDatabaseSync: vi.fn(() => ({
        execSync: vi.fn(),
        getAllAsync: vi.fn(() => Promise.resolve([])),
        getAllSync: vi.fn(() => []),
        getFirstAsync: vi.fn(() => Promise.resolve(null)),
        runAsync: vi.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 0 })),
        runSync: vi.fn(() => ({ lastInsertRowId: 1, changes: 0 })),
    })),
}));

// Mock expo-secure-store
vi.mock('expo-secure-store', () => ({
    setItemAsync: vi.fn(() => Promise.resolve()),
    getItemAsync: vi.fn(() => Promise.resolve(null)),
    deleteItemAsync: vi.fn(() => Promise.resolve()),
}));

// Mock expo-crypto
vi.mock('expo-crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Mock expo-network
vi.mock('expo-network', () => ({
    getNetworkStateAsync: vi.fn(() => Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
    })),
}));

// Mock react-native
vi.mock('react-native', () => ({
    Platform: { OS: 'ios' },
    StyleSheet: { create: (styles: Record<string, unknown>) => styles },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    SectionList: 'SectionList',
}));
