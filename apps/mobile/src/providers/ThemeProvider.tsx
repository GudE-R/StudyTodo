import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'paper-classic' | 'paper-washi' | 'paper-planner';

type ColorPalette = {
    background: string;
    surface: string;
    surfaceHighlight: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    primary: string;
    primaryLight: string;
    danger: string;
    success: string;
    warning: string;
    orange: string;
    icon: string;
};

export const Colors: Record<string, ColorPalette> = {
    light: {
        background: '#ffffff',
        surface: '#f8fafc',
        surfaceHighlight: '#eff6ff',
        text: '#333333',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        border: '#e2e8f0',
        primary: '#3b82f6',
        primaryLight: 'rgba(59, 130, 246, 0.15)',
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
        orange: '#fb923c',
        icon: '#666666',
    },
    dark: {
        background: '#0f172a',
        surface: '#1e293b',
        surfaceHighlight: '#172554',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        border: '#334155',
        primary: '#60a5fa',
        primaryLight: 'rgba(96, 165, 250, 0.2)',
        danger: '#f87171',
        success: '#4ade80',
        warning: '#fbbf24',
        orange: '#fb923c',
        icon: '#cbd5e1',
    },
    // Paper Classic - light variant
    'paper-classic-light': {
        background: '#FAF8F0',
        surface: '#FFFEF7',
        surfaceHighlight: '#F5F0E6',
        text: '#3D3529',
        textSecondary: '#7C7165',
        textMuted: '#A69E93',
        border: '#E8E0D0',
        primary: '#2C5282',
        primaryLight: 'rgba(44, 82, 130, 0.15)',
        danger: '#C53030',
        success: '#276749',
        warning: '#C05621',
        orange: '#DD6B20',
        icon: '#5C5347',
    },
    // Paper Classic - dark variant (leather journal)
    'paper-classic-dark': {
        background: '#2D2319',
        surface: '#3D3126',
        surfaceHighlight: '#4A3D30',
        text: '#E8DFD3',
        textSecondary: '#B8A99A',
        textMuted: '#8C7D6E',
        border: '#544638',
        primary: '#D4A76A',
        primaryLight: 'rgba(212, 167, 106, 0.2)',
        danger: '#FC8181',
        success: '#68D391',
        warning: '#F6AD55',
        orange: '#ED8936',
        icon: '#C4B5A4',
    },
    // Paper Washi - light variant
    'paper-washi-light': {
        background: '#F7F5F0',
        surface: '#FDFCF9',
        surfaceHighlight: '#EDE8DC',
        text: '#2D3748',
        textSecondary: '#718096',
        textMuted: '#A0AEC0',
        border: '#DDD8CC',
        primary: '#2B6CB0',
        primaryLight: 'rgba(43, 108, 176, 0.12)',
        danger: '#E53E3E',
        success: '#38A169',
        warning: '#D69E2E',
        orange: '#ED8936',
        icon: '#4A5568',
    },
    // Paper Washi - dark variant (indigo-dyed)
    'paper-washi-dark': {
        background: '#1A1F3D',
        surface: '#252B4D',
        surfaceHighlight: '#2D3460',
        text: '#E2E8F0',
        textSecondary: '#A0AEC0',
        textMuted: '#718096',
        border: '#3D4470',
        primary: '#90CDF4',
        primaryLight: 'rgba(144, 205, 244, 0.15)',
        danger: '#FEB2B2',
        success: '#9AE6B4',
        warning: '#FAF089',
        orange: '#FBD38D',
        icon: '#CBD5E0',
    },
    // Paper Planner - light variant
    'paper-planner-light': {
        background: '#F5F0EB',
        surface: '#FEFDFB',
        surfaceHighlight: '#EDE5DB',
        text: '#3C3632',
        textSecondary: '#7A706A',
        textMuted: '#A89F99',
        border: '#D9CFBF',
        primary: '#8B6914',
        primaryLight: 'rgba(139, 105, 20, 0.12)',
        danger: '#C53030',
        success: '#276749',
        warning: '#B7791F',
        orange: '#C05621',
        icon: '#6B5F56',
    },
    // Paper Planner - dark variant (dark leather + gold)
    'paper-planner-dark': {
        background: '#1F1B17',
        surface: '#2E2924',
        surfaceHighlight: '#3A342D',
        text: '#E8DFD3',
        textSecondary: '#B8A99A',
        textMuted: '#8C7D6E',
        border: '#4A4239',
        primary: '#D4A843',
        primaryLight: 'rgba(212, 168, 67, 0.2)',
        danger: '#FC8181',
        success: '#68D391',
        warning: '#F6E05E',
        orange: '#F6AD55',
        icon: '#C4B5A4',
    },
};

// Resolve theme mode + system dark/light to actual color palette key
function resolveColors(themeMode: ThemeMode, systemIsDark: boolean): { colors: ColorPalette; isDark: boolean } {
    switch (themeMode) {
        case 'light':
            return { colors: Colors.light, isDark: false };
        case 'dark':
            return { colors: Colors.dark, isDark: true };
        case 'paper-classic':
            return systemIsDark
                ? { colors: Colors['paper-classic-dark'], isDark: true }
                : { colors: Colors['paper-classic-light'], isDark: false };
        case 'paper-washi':
            return systemIsDark
                ? { colors: Colors['paper-washi-dark'], isDark: true }
                : { colors: Colors['paper-washi-light'], isDark: false };
        case 'paper-planner':
            return systemIsDark
                ? { colors: Colors['paper-planner-dark'], isDark: true }
                : { colors: Colors['paper-planner-light'], isDark: false };
        default:
            return { colors: Colors.light, isDark: false };
    }
}

const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'paper-classic', 'paper-washi', 'paper-planner'];

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colors: ColorPalette;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@studytodo_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved && VALID_THEMES.includes(saved as ThemeMode)) {
                setThemeModeState(saved as ThemeMode);
            }
            setIsLoaded(true);
        });
    }, []);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    };

    const systemIsDark = systemScheme === 'dark';
    const { colors, isDark } = resolveColors(themeMode, systemIsDark);

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

export function useThemeColors() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        return { colors: Colors.light as ColorPalette, isDark: false };
    }
    return { colors: context.colors, isDark: context.isDark };
}
