"use client";

import { useSyncExternalStore } from "react";
import { getAudioServerState, getAudioState, subscribeAudio } from "@/lib/audio/engine";

export function useAudio() {
  return useSyncExternalStore(subscribeAudio, getAudioState, getAudioServerState);
}
