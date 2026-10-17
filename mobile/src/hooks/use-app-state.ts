import { useSyncExternalStore } from "react";
import { AppState, type AppStateStatus } from "react-native";

const subscribe = (onChange: () => void) => {
  const sub = AppState.addEventListener("change", onChange);
  return () => sub.remove();
};

// React Native keeps AppState.currentState up to date even when nobody is listening.
const read = () => (AppState.currentState as AppStateStatus | null) ?? "active";

/** "active" | "inactive" (iOS app switcher) | "background". */
export function useAppState(): AppStateStatus {
  return useSyncExternalStore(subscribe, read, read);
}
