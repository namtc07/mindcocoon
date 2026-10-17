import { AMBIENT_TRACKS, MUSIC_TRACKS } from "@mindcocoon/core/sounds";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import type { AppStateLike } from "@/lib/auto-lock";
import { getPref, loadPrefs, setPref } from "@/lib/prefs";
import { createAudioEngine, type AudioState, type MixPlayer } from "./engine";
import { TRACK_SOURCES } from "./sources";

/** The app-wide Sanctuary mixer (playback survives navigation; keeps playing when locked). */
export const audio = createAudioEngine({
  trackIds: [...AMBIENT_TRACKS, ...MUSIC_TRACKS].map((t) => t.id),
  createPlayer: (id) => createAudioPlayer(TRACK_SOURCES[id], { updateInterval: 500 }) as unknown as MixPlayer,
  // Set lazily before the first sound so merely opening the app never interrupts other apps' music.
  // `doNotMix` is required for lock-screen controls.
  prepareSession: () => setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" }),
  loadPrefs: () => getPref("audio"),
  savePrefs: (prefs) => void setPref("audio", prefs),
});

/** The engine is created at import, before prefs are read: apply the saved mix settings once they load. */
export async function hydrateAudio() {
  await loadPrefs();
  audio.restorePrefs();
}

/** Re-checks the sleep timer whenever the app comes back to the foreground (JS may be throttled while locked). */
export function startAudioLifecycle(appState: AppStateLike = AppState as unknown as AppStateLike) {
  const sub = appState.addEventListener("change", (s) => {
    if (s === "active") audio.tick();
  });
  return () => sub.remove();
}

export function useAudio(): AudioState {
  return useSyncExternalStore(audio.subscribe, audio.getState, audio.getState);
}
