import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { Fragment, useEffect, useState } from "react";
import { View } from "react-native";
import { AdsBootstrap } from "@/components/ads/AdsBootstrap";
import { FirstRunNotice } from "@/components/FirstRunNotice";
import { AudioLabelsSync } from "@/components/sanctuary/AudioLabelsSync";
import { NotificationRouter } from "@/components/settings/NotificationRouter";
import { ReminderSync } from "@/components/settings/ReminderSync";
import { ToastHost } from "@/components/ui/Toast";
import { appAutoLock } from "@/lib/app-auto-lock";
import { hydrateAudio, startAudioLifecycle } from "@/lib/audio";
import { useEraseCount } from "@/lib/export";
import { loadPrefs } from "@/lib/prefs";
import { startRemoteConfig } from "@/lib/remote-config";
import { useAppFonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

void SplashScreen.preventAutoHideAsync();

/** Holds the splash until fonts and saved preferences (language, theme) are ready. */
export default function RootLayout() {
  const fontsReady = useAppFonts();
  const [prefsReady, setPrefsReady] = useState(false);
  const { name, c } = useTheme();
  const eraseCount = useEraseCount();

  useEffect(() => {
    loadPrefs().finally(() => setPrefsReady(true));
    void hydrateAudio();
  }, []);

  // Locks a passcode vault after the chosen idle time, in the background or foreground.
  // Also re-checks the sleep timer on return to the foreground.
  useEffect(() => {
    const stopAutoLock = appAutoLock.start();
    const stopAudio = startAudioLifecycle();
    const stopFlags = startRemoteConfig();
    return () => {
      stopAutoLock();
      stopAudio();
      stopFlags();
    };
  }, []);

  const ready = fontsReady && prefsReady;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.background);
    if (ready) void SplashScreen.hideAsync();
  }, [ready, c.background]);

  if (!ready) return null;

  return (
    // Any touch counts as activity for the foreground auto-lock (observed, never captured).
    <View style={{ flex: 1 }} onTouchStart={appAutoLock.markActivity}>
      {/* Keyed on erases: after "Erase everything" every screen, draft and form starts over. */}
      <Fragment key={eraseCount}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
        <Stack.Screen name="(tabs)" options={{ title: "MindCocoon" }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="help" />
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="dev/spike" />
        </Stack.Protected>
      </Stack>
      <FirstRunNotice />
      </Fragment>
      <AudioLabelsSync />
      <AdsBootstrap />
      <ReminderSync />
      <NotificationRouter />
      <ToastHost />
      <StatusBar style={name === "dusk" ? "light" : "dark"} />
    </View>
  );
}
