import type { RemoteContent } from "@mindcocoon/core/remote-content";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import type { AppStateLike } from "./auto-lock";
import { getPref, loadPrefs, setPref } from "./prefs";
import { createRemoteContent } from "./remote-content-core";

/** App-wide extra content (EXPO_PUBLIC_SUPABASE_URL / _KEY; without them, only what ships in the app). */
export const remoteContent = createRemoteContent({
  fetch: (...args) => fetch(...args),
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  key: process.env.EXPO_PUBLIC_SUPABASE_KEY,
  now: () => Date.now(),
  load: () => getPref("remoteContent"),
  save: (value) => void setPref("remoteContent", value),
});

/** Cache first, then a fetch on every cold start, then at most every six hours in the foreground. */
export function startRemoteContent(appState: AppStateLike = AppState as unknown as AppStateLike) {
  void loadPrefs().then(() => {
    remoteContent.reload();
    return remoteContent.refresh(true);
  });
  const sub = appState.addEventListener("change", (s) => {
    if (s === "active") void remoteContent.refresh();
  });
  return () => sub.remove();
}

export function useRemoteContent(): RemoteContent {
  return useSyncExternalStore(remoteContent.subscribe, remoteContent.get, remoteContent.get);
}
