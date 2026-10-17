"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getMoodServerState, getMoodState, loadMoods, subscribeMoods } from "@mindcocoon/core/mood/store";

export function useMoodLogs() {
  const state = useSyncExternalStore(subscribeMoods, getMoodState, getMoodServerState);
  useEffect(() => {
    void loadMoods();
  }, []);
  return state;
}
