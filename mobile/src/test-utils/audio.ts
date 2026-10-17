/* eslint-disable @typescript-eslint/no-require-imports */
import { TRACK_SOURCES } from "@/lib/audio/sources";

export interface FakeAudioPlayer {
  volume: number;
  loop: boolean;
  calls: string[];
  lockScreen: { active: boolean; meta?: { title?: string; artist?: string; albumTitle?: string } };
  emit(status: { playing?: boolean; didJustFinish?: boolean }): void;
}

/** The fake expo-audio player created for a track (jest.setup.ts mock). */
export function fakePlayer(id: string): FakeAudioPlayer | undefined {
  const { __players } = require("expo-audio") as { __players: Map<unknown, FakeAudioPlayer> };
  return __players.get(TRACK_SOURCES[id]);
}
