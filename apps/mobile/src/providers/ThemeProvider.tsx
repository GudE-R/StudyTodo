import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export const Colors = {
    light: {
        background: '#ffffff',
        surface: '#f8fafc', // slate-50
        surfaceHighlight: '#eff6ff', // blue-50
        text: '#333333',
        textSecondary: '#64748b', // slate-500
        textMuted: '#94a3b8', // slate-400
        border: '#e2e8f0', // slate-200
        primary: '#3b82f6', // blue-500
        primaryLight: 'rgba(59, 130, 246, 0.15)',
        danger: '#ef4444', // red-500
        success: '#22c55e', // green-500
        warning: '#f59e0b', // amber-500
        orange: '#fb923c', // orange-400
        icon: '#666666',
    },
    dark: {
        background: '#0f172a', // slate-900
        surface: '#1e293b', // slate-800
        surfaceHighlight: '#172554', // blue-950
        text: '#f1f5f9', // slate-100
        textSecondary: '#94a3b8', // slate-400
        textMuted: '#64748b', // slate-500
        border: '#334155', // slate-700
        primary: '#60a5fa', // blue-400
        primaryLight: 'rgba(96, 165, 250, 0.2)',
        danger: '#f87171', // red-400
        success: '#4ade80', // green-400
        warning: '#fbbf24', // amber-400
        orange: '#fb923c',
        icon: '#cbd5e1', // slate-300
    }
};

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colors: typeof Colors.light;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@pomarc_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference
    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
                setThemeModeState(saved as ThemeMode);
            }
            setIsLoaded(true);
        });
    }, []);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    };

    // Determine actual dark/light based on mode and system preference
    const isDark = themeMode === 'system'
        ? systemScheme === 'dark'
        : themeMode === 'dark';

    const colors = isDark ? Colors.dark : Colors.light;

    // Don't render until we've loaded the saved preference
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Backward compatible hook for existing code
export function useThemeColors() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Fallback: use system color scheme directly (for components outside ThemeProvider)
        const scheme = useColorScheme();
        const isDark = scheme === 'dark';
        const colors = isDark ? Colors.dark : Colors.light;
        return { colors, isDark };
    }
    return { colors: context.colors, isDark: context.isDark };
}
