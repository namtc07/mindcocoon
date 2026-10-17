import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "../lib/prefs";
import { tokens, type ThemeColors, type ThemeName } from "./tokens";

/** Dusk (dark) is the default; the choice persists in prefs. */
export function currentTheme(): ThemeName {
  return getPref("theme") ?? "dusk";
}

export function useTheme(): { name: ThemeName; c: ThemeColors; setTheme: (t: ThemeName) => Promise<void> } {
  const name = useSyncExternalStore(subscribePrefs, currentTheme, currentTheme);
  return { name, c: tokens[name], setTheme: (t) => setPref("theme", t) };
}
