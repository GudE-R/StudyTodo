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
    // Paper Classic - クリーム×セピアブラウン（大学ノート風）
    'paper-classic-light': {
        background: '#FDF6E3',
        surface: '#FFF8E7',
        surfaceHighlight: '#F5EBCF',
        text: '#433422',
        textSecondary: '#7A6548',
        textMuted: '#A89574',
        border: '#E3D5B8',
        primary: '#8B5E3C',
        primaryLight: 'rgba(139, 94, 60, 0.15)',
        danger: '#C0392B',
        success: '#5D8A3C',
        warning: '#C07A1E',
        orange: '#D4762C',
        icon: '#6B5340',
    },
    // Paper Classic - dark (古い革表紙ノート)
    'paper-classic-dark': {
        background: '#2A1F14',
        surface: '#3B2E20',
        surfaceHighlight: '#4D3D2B',
        text: '#EDDCC8',
        textSecondary: '#C4AD8F',
        textMuted: '#917A5E',
        border: '#5C4A36',
        primary: '#D4A05A',
        primaryLight: 'rgba(212, 160, 90, 0.2)',
        danger: '#E8756A',
        success: '#8FBE6A',
        warning: '#E0A83C',
        orange: '#D98A4E',
        icon: '#C0A882',
    },
    // Paper Washi - 薄灰青×藍 (和紙・墨テクスチャ風)
    'paper-washi-light': {
        background: '#F0F2F4',
        surface: '#F8F9FB',
        surfaceHighlight: '#E4E8ED',
        text: '#2C3E50',
        textSecondary: '#5D7085',
        textMuted: '#8FA0B0',
        border: '#C8D1DA',
        primary: '#2E5E8E',
        primaryLight: 'rgba(46, 94, 142, 0.12)',
        danger: '#C44D4D',
        success: '#3C8A6A',
        warning: '#B88B2E',
        orange: '#C47830',
        icon: '#4A6275',
    },
    // Paper Washi - dark (藍染め風)
    'paper-washi-dark': {
        background: '#141E30',
        surface: '#1E2D42',
        surfaceHighlight: '#263A53',
        text: '#D4DEE8',
        textSecondary: '#8DA3B8',
        textMuted: '#5D7A94',
        border: '#2F4562',
        primary: '#7EB8E0',
        primaryLight: 'rgba(126, 184, 224, 0.15)',
        danger: '#E88E8E',
        success: '#7AC4A0',
        warning: '#E0C66A',
        orange: '#E0A86A',
        icon: '#9AB2C8',
    },
    // Paper Planner - アイボリー×深緑ゴールド (高級手帳・システム手帳風)
    'paper-planner-light': {
        background: '#F9F6F1',
        surface: '#FFFFFF',
        surfaceHighlight: '#EEE9DF',
        text: '#2D3830',
        textSecondary: '#5C6B5E',
        textMuted: '#8A9B8C',
        border: '#CDD4C8',
        primary: '#2D6B48',
        primaryLight: 'rgba(45, 107, 72, 0.12)',
        danger: '#B83B3B',
        success: '#2D8A50',
        warning: '#A67C2E',
        orange: '#B8722E',
        icon: '#4A5E4C',
    },
    // Paper Planner - dark (ダークレザー＋金箔)
    'paper-planner-dark': {
        background: '#171D17',
        surface: '#232B24',
        surfaceHighlight: '#2E3A30',
        text: '#DDE4DF',
        textSecondary: '#A0B4A4',
        textMuted: '#6E8672',
        border: '#3A4E3E',
        primary: '#C9A84C',
        primaryLight: 'rgba(201, 168, 76, 0.2)',
        danger: '#E88E8E',
        success: '#6EBE8A',
        warning: '#E0C44E',
        orange: '#D4A050',
        icon: '#A0B8A4',
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
    const [themeMode, setThemeModeState] = useState<ThemeMode>('paper-classic');
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
