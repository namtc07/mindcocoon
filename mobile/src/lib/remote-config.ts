import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import type { RemoteFlags } from "./ads/policy";
import type { AppStateLike } from "./auto-lock";
import { getPref, loadPrefs, setPref } from "./prefs";
import { createRemoteConfig } from "./remote-config-core";

/** App-wide remote flags (EXPO_PUBLIC_SUPABASE_URL / _KEY; without them the cache or defaults apply). */
export const remoteConfig = createRemoteConfig({
  fetch: (...args) => fetch(...args),
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  key: process.env.EXPO_PUBLIC_SUPABASE_KEY,
  now: () => Date.now(),
  load: () => getPref("flags"),
  save: (value) => void setPref("flags", value),
});

/** Reads the cache once prefs are loaded, fetches, then re-checks on every return to the foreground. */
export function startRemoteConfig(appState: AppStateLike = AppState as unknown as AppStateLike) {
  void loadPrefs().then(() => {
    remoteConfig.reload();
    return remoteConfig.refresh(true); // every cold start: switching ads off takes effect on the next launch
  });
  const sub = appState.addEventListener("change", (s) => {
    if (s === "active") void remoteConfig.refresh();
  });
  return () => sub.remove();
}

export function useFlags(): RemoteFlags {
  return useSyncExternalStore(remoteConfig.subscribe, remoteConfig.getFlags, remoteConfig.getFlags);
}
