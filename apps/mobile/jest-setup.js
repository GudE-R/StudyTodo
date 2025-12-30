// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseSync: jest.fn(() => ({
        execSync: jest.fn(),
        getAllAsync: jest.fn(() => Promise.resolve([])),
        getFirstAsync: jest.fn(() => Promise.resolve(null)),
        runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 0 })),
    })),
}));

// Mock other native modules if needed
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'test-uuid'),
}));
