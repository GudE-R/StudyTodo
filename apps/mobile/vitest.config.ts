import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // Note: Component tests (.test.tsx) are excluded because they require 
        // a complex React Native / Expo transformation setup not yet configured for Vitest.
        // Pure logic tests (.test.ts) are fully supported.
        include: ['src/**/*.test.{js,ts}'],
        setupFiles: ['./vitest-setup.ts'],
        passWithNoTests: true,
    }
});
