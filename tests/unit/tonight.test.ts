import { describe, expect, it } from "vitest";
import { pickTonightTrack } from "@/lib/audio/tonight";
import { SOUND_TRACKS } from "@/lib/sounds";

const music = SOUND_TRACKS.filter((t) => t.category === "music");

describe("pickTonightTrack", () => {
  it("has music tracks tagged with moods", () => {
    expect(music.length).toBeGreaterThanOrEqual(6);
    expect(music.every((t) => (t.moods ?? []).length > 0)).toBe(true);
  });

  it("matches the mood", () => {
    for (let d = 1; d <= 10; d++) {
      const track = pickTonightTrack(SOUND_TRACKS, "heavy", new Date(2026, 9, d));
      expect(track.moods).toContain("heavy");
    }
  });

  it("is stable for a day", () => {
    const a = pickTonightTrack(SOUND_TRACKS, "anxious", new Date(2026, 9, 16, 1));
    const b = pickTonightTrack(SOUND_TRACKS, "anxious", new Date(2026, 9, 16, 23));
    expect(a.id).toBe(b.id);
  });

  it("falls back to any music without a mood", () => {
    const track = pickTonightTrack(SOUND_TRACKS, null, new Date(2026, 9, 16));
    expect(track.category).toBe("music");
    expect(pickTonightTrack(SOUND_TRACKS, null, new Date(2026, 9, 16)).id).toBe(track.id);
  });
});
