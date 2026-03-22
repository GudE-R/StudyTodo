export type AccentColor =
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "orange"
  | "pink"
  | "teal";

type AccentVariant = {
  primary: string;
  primaryLight: string;
};

type AccentPreset = {
  light: AccentVariant;
  dark: AccentVariant;
};

const withAlpha = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const preset = (light: string, dark: string): AccentPreset => ({
  light: { primary: light, primaryLight: withAlpha(light, 0.15) },
  dark: { primary: dark, primaryLight: withAlpha(dark, 0.15) },
});

export const ACCENT_PRESETS: Record<AccentColor, AccentPreset> = {
  blue: preset("#3b82f6", "#60a5fa"),
  green: preset("#22c55e", "#4ade80"),
  red: preset("#ef4444", "#f87171"),
  purple: preset("#8b5cf6", "#a78bfa"),
  orange: preset("#f97316", "#fb923c"),
  pink: preset("#ec4899", "#f472b6"),
  teal: preset("#14b8a6", "#2dd4bf"),
};

export const DEFAULT_ACCENT: AccentColor = "green";
