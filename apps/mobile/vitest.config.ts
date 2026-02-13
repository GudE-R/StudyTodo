import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // React Nativeのコンポーネントテストは除外（Expo環境が必要なため）
        // 純粋なロジックテストのみ実行
        include: ['src/**/*.{test,spec}.{js,ts}'],
        exclude: ['src/**/*.test.tsx', 'src/**/*.spec.tsx'],
        setupFiles: ['./vitest-setup.ts'],
        passWithNoTests: true, // テストがまだない場合でもパスする
    }
});



