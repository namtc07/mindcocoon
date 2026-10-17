import { getMoodServerState, getMoodState, loadMoods, subscribeMoods } from "@mindcocoon/core/mood/store";
import { useEffect, useSyncExternalStore } from "react";

export function useMoodLogs() {
  const state = useSyncExternalStore(subscribeMoods, getMoodState, getMoodServerState);
  useEffect(() => {
    void loadMoods();
  }, []);
  return state;
}
