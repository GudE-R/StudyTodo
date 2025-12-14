"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * チE�Eマ�E型定義
 * - light: ライトモーチE
 * - dark: ダークモーチE
 * - system: シスチE��設定に従う
 */
type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark"; // 実際に適用されるテーチE
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * チE�Eマ�Eロバイダーコンポ�EネンチE
 * 
 * アプリ全体でチE�Eマ状態を共有し、HTMLのclass属性でダークモードを制御します、E
 * LocalStorageにチE�Eマ設定を永続化します、E
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    // LocalStorageから初期値を取得！ESR対策でnull初期化！E
    const [theme, setThemeState] = useState<Theme>("light");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    // クライアントサイドでマウント後にLocalStorageから読み込み
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const stored = localStorage.getItem("pomarc-theme") as Theme | null;
        if (stored && ["light", "dark", "system"].includes(stored)) {
            setThemeState(stored);
        }
    }, []);

    // チE�Eマ変更時�E処琁E
    useEffect(() => {
        if (!mounted) return;

        // LocalStorageに保孁E
        localStorage.setItem("pomarc-theme", theme);

        // 実際に適用するチE�Eマを決宁E
        let effectiveTheme: "light" | "dark";
        if (theme === "system") {
            effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        } else {
            effectiveTheme = theme;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResolvedTheme(effectiveTheme);

        // HTML要素にクラスを適用
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(effectiveTheme);
    }, [theme, mounted]);

    // シスチE��チE�Eマ変更を監要E
    useEffect(() => {
        if (!mounted || theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            setResolvedTheme(e.matches ? "dark" : "light");
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(e.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    // SSR中は子要素のみ返す�E�Eydration対策！E
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * チE�EマコンチE��ストを使用するカスタムフック
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
