import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "../lib/prefs";
import { isNightNow, subscribeNight } from "./night";
import { MIDNIGHT, tokens, type ThemeColors, type ThemeName } from "./tokens";

/** Dusk (dark) is the default; the choice persists in prefs. */
export function currentTheme(): ThemeName {
  return getPref("theme") ?? "dusk";
}

const dimOn = () => getPref("nightDim") !== false;

/**
 * The chosen theme — or, late at night with "Dim after 10 pm" on (default), the softer Midnight
 * palette. `isDark` is what status bar and keyboards should follow.
 */
export function useTheme(): { name: ThemeName; c: ThemeColors; isDark: boolean; setTheme: (t: ThemeName) => Promise<void> } {
  const name = useSyncExternalStore(subscribePrefs, currentTheme, currentTheme);
  const dim = useSyncExternalStore(subscribePrefs, dimOn, dimOn);
  const night = useSyncExternalStore(subscribeNight, isNightNow, isNightNow);
  const midnight = dim && night;
  return { name, c: midnight ? MIDNIGHT : tokens[name], isDark: midnight || name === "dusk", setTheme: (t) => setPref("theme", t) };
}
