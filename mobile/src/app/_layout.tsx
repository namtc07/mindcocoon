import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { loadPrefs } from "@/lib/prefs";
import { useAppFonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

void SplashScreen.preventAutoHideAsync();

/** Holds the splash until fonts and saved preferences (language, theme) are ready. */
export default function RootLayout() {
  const fontsReady = useAppFonts();
  const [prefsReady, setPrefsReady] = useState(false);
  const { name, c } = useTheme();

  useEffect(() => {
    loadPrefs().finally(() => setPrefsReady(true));
  }, []);

  const ready = fontsReady && prefsReady;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.background);
    if (ready) void SplashScreen.hideAsync();
  }, [ready, c.background]);

  if (!ready) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />
      <StatusBar style={name === "dusk" ? "light" : "dark"} />
    </>
  );
}
