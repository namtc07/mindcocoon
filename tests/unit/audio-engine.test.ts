import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __getElementForTests,
  __resetAudioForTests,
  getAudioState,
  playTrack,
  setSleepTimer,
} from "@/lib/audio/engine";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-16T22:00:00Z") });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  localStorage.clear();
  __resetAudioForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sleep timer", () => {
  it("fades out over the last minute, then stops and restores volume", async () => {
    await playTrack("rain");
    const full = __getElementForTests("rain")!.volume;
    expect(full).toBeCloseTo(0.6 * 0.8);

    setSleepTimer(10);
    expect(getAudioState().sleepEndsAt).toBe(Date.now() + 600_000);

    vi.advanceTimersByTime(570_000);
    expect(__getElementForTests("rain")!.volume).toBeCloseTo(full / 2, 2);

    vi.advanceTimersByTime(30_000);
    expect(getAudioState()).toMatchObject({ playing: [], sleepEndsAt: null, master: 0.8 });
    expect(__getElementForTests("rain")!.volume).toBeCloseTo(full);
  });

  it("can be cancelled", async () => {
    await playTrack("ocean");
    setSleepTimer(10);
    setSleepTimer(null);
    vi.advanceTimersByTime(700_000);
    expect(getAudioState().playing).toEqual(["ocean"]);
  });
});
