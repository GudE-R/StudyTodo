"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "light" | "dark" | "paper-classic" | "paper-washi" | "paper-planner";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_THEMES: Theme[] = ['light', 'dark', 'paper-classic', 'paper-washi', 'paper-planner'];

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("paper-classic");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("studytodo-theme") as Theme | null;
        if (stored && VALID_THEMES.includes(stored)) {
            setThemeState(stored);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        localStorage.setItem("studytodo-theme", theme);

        let effectiveLight: "light" | "dark";
        if (theme === "light") {
            effectiveLight = "light";
        } else if (theme === "dark") {
            effectiveLight = "dark";
        } else {
            // Paper themes follow system preference
            effectiveLight = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        setResolvedTheme(effectiveLight);

        // Apply CSS classes
        const root = document.documentElement;
        root.classList.remove("light", "dark", "paper-classic", "paper-washi", "paper-planner");

        if (theme === "light" || theme === "dark") {
            root.classList.add(theme);
        } else {
            // Paper themes: add both the paper class and the resolved light/dark
            root.classList.add(effectiveLight);
            root.classList.add(theme);
        }
    }, [theme, mounted]);

    // Watch system theme changes for paper themes
    useEffect(() => {
        if (!mounted) return;
        if (theme === "light" || theme === "dark") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? "dark" : "light";
            setResolvedTheme(resolved);
            const root = document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(resolved);
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

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
