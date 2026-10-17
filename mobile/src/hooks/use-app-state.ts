import { useSyncExternalStore } from "react";
import { AppState, type AppStateStatus } from "react-native";

let current: AppStateStatus = (AppState.currentState as AppStateStatus | null) ?? "active";

function subscribe(onChange: () => void) {
  const sub = AppState.addEventListener("change", (next) => {
    current = next;
    onChange();
  });
  return () => sub.remove();
}

/** "active" | "inactive" (iOS app switcher) | "background". */
export function useAppState(): AppStateStatus {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
