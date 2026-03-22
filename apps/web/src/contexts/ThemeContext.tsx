"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AccentColor, ACCENT_PRESETS, DEFAULT_ACCENT } from "@studytodo/shared";

export type Theme = "light" | "dark" | "paper-classic" | "paper-washi" | "paper-planner";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_THEMES: Theme[] = ['light', 'dark', 'paper-classic', 'paper-washi', 'paper-planner'];
const VALID_ACCENTS: AccentColor[] = Object.keys(ACCENT_PRESETS) as AccentColor[];

function applyAccentCSSVariables(accent: AccentColor, resolvedTheme: "light" | "dark") {
    const root = document.documentElement;
    const preset = ACCENT_PRESETS[accent];
    const variant = resolvedTheme === "dark" ? preset.dark : preset.light;
    root.style.setProperty("--accent-primary", variant.primary);
    root.style.setProperty("--accent-secondary", variant.primaryLight);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("paper-classic");
    const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULT_ACCENT);
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("studytodo-theme") as Theme | null;
        if (stored && VALID_THEMES.includes(stored)) {
            setThemeState(stored);
        }
        const storedAccent = localStorage.getItem("studytodo-accent-color") as AccentColor | null;
        if (storedAccent && VALID_ACCENTS.includes(storedAccent)) {
            setAccentColorState(storedAccent);
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
            effectiveLight = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        setResolvedTheme(effectiveLight);

        const root = document.documentElement;
        root.classList.remove("light", "dark", "paper-classic", "paper-washi", "paper-planner");

        if (theme === "light" || theme === "dark") {
            root.classList.add(theme);
        } else {
            root.classList.add(effectiveLight);
            root.classList.add(theme);
        }

        applyAccentCSSVariables(accentColor, effectiveLight);
    }, [theme, accentColor, mounted]);

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
            applyAccentCSSVariables(accentColor, resolved);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme, accentColor, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const setAccentColor = (color: AccentColor) => {
        setAccentColorState(color);
        localStorage.setItem("studytodo-accent-color", color);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, accentColor, setAccentColor }}>
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
