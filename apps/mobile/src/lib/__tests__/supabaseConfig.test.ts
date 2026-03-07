import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({})),
}));

describe('Supabase configuration', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('should throw when EXPO_PUBLIC_SUPABASE_URL is missing', async () => {
        delete process.env.EXPO_PUBLIC_SUPABASE_URL;
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        await expect(() => import('../supabase')).rejects.toThrow(
            'Supabase environment variables are not configured'
        );
    });

    it('should throw when EXPO_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        await expect(() => import('../supabase')).rejects.toThrow(
            'Supabase environment variables are not configured'
        );
    });

    it('should throw when both env vars are missing', async () => {
        delete process.env.EXPO_PUBLIC_SUPABASE_URL;
        delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        await expect(() => import('../supabase')).rejects.toThrow(
            'Supabase environment variables are not configured'
        );
    });

    it('should not throw when both env vars are set', async () => {
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

        await expect(import('../supabase')).resolves.toBeDefined();
    });
});
