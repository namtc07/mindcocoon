import type { MoodType } from "@mindcocoon/core/types";

/**
 * Tranquil theme, identical to the web (app/globals.css): Dusk = `.dark`, Mist = `:root`.
 * test/tokens.test.ts fails if these drift from the web values.
 */
export interface ThemeColors {
  background: string;
  foreground: string;
  surface: string;
  card: string;
  primary: string;
  primaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  ember: string;
  destructive: string;
  mood: Record<MoodType, string>;
}

export type ThemeName = "dusk" | "mist";

export const tokens: Record<ThemeName, ThemeColors> = {
  dusk: {
    background: "#0f172a",
    foreground: "#f1f5f9",
    surface: "#131d33",
    card: "#16213a",
    primary: "#7fb5a8",
    primaryForeground: "#0f172a",
    muted: "#1b2640",
    mutedForeground: "#94a3b8",
    border: "rgba(241, 245, 249, 0.08)",
    ember: "#d9a86c",
    destructive: "#e08a7e",
    mood: { peaceful: "#37a88a", hopeful: "#b88c2e", numb: "#9c83c9", heavy: "#3568b2", anxious: "#b14648" },
  },
  mist: {
    background: "#f1f5f9",
    foreground: "#1e293b",
    surface: "#e8edf3",
    card: "#f8fafc",
    primary: "#3f7a6c",
    primaryForeground: "#f8fafc",
    muted: "#e2e8f0",
    mutedForeground: "#586477",
    border: "rgba(15, 23, 42, 0.1)",
    ember: "#a8712f",
    destructive: "#b4534a",
    mood: { peaceful: "#269b7e", hopeful: "#b07a00", numb: "#9077bc", heavy: "#21539c", anxious: "#a43a3d" },
  },
};

/**
 * Mobile-only late-night palette (22:00–06:00 when "Dim after 10 pm" is on): darker, warmer and
 * lower-contrast than Dusk, like candlelight. Not part of the web themes.
 */
export const MIDNIGHT: ThemeColors = {
  background: "#0b0f1a",
  foreground: "#d8d2c6",
  surface: "#10151f",
  card: "#131925",
  primary: "#6f9c91",
  primaryForeground: "#0b0f1a",
  muted: "#161c28",
  mutedForeground: "#8a8579",
  border: "rgba(216, 210, 198, 0.07)",
  ember: "#c99a62",
  destructive: "#c97d72",
  mood: { peaceful: "#2f9178", hopeful: "#a07a28", numb: "#8a74b3", heavy: "#2f5b9c", anxious: "#9c3f41" },
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, full: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
