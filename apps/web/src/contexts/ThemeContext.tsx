"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * テーマの型定義
 * - light: ライトモード
 * - dark: ダークモード
 * - system: システム設定に従う
 */
type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark"; // 実際に適用されるテーマ
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * テーマプロバイダーコンポーネント
 * 
 * アプリ全体でテーマ状態を共有し、HTMLのclass属性でダークモードを制御します。
 * LocalStorageにテーマ設定を永続化します。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    // LocalStorageから初期値を取得（SSR対策でnull初期化）
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

    // テーマ変更時の処理
    useEffect(() => {
        if (!mounted) return;

        // LocalStorageに保存
        localStorage.setItem("pomarc-theme", theme);

        // 実際に適用するテーマを決定
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
        const body = document.body;

        root.classList.remove("light", "dark");
        root.classList.add(effectiveTheme);

        if (body) {
            body.classList.remove("light", "dark");
            body.classList.add(effectiveTheme);
        }
    }, [theme, mounted]);

    // システムテーマ変更を監視
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

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * テーマコンテキストを使用するカスタムフック
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
