import { describe, expect, it } from "vitest";
import { gentleInsights } from "@mindcocoon/core/mood/insights";
import type { MoodLog, MoodType } from "@mindcocoon/core/types";

const NOW = new Date(2026, 9, 19, 21, 0);
let n = 0;
function log(mood: MoodType, daysAgo: number, opts: { tags?: string[]; feelings?: string[]; hour?: number } = {}): MoodLog {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(opts.hour ?? 20, 0, 0, 0);
  return { id: String(n++), mood, tags: opts.tags ?? [], feelings: opts.feelings, createdAt: d.toISOString() };
}

describe("gentleInsights", () => {
  it("says nothing with too little data", () => {
    expect(gentleInsights([log("anxious", 1, { tags: ["work"] }), log("anxious", 2, { tags: ["work"] })], NOW)).toEqual([]);
  });

  it("notices a tag that often comes with one mood", () => {
    const logs = [1, 2, 3, 4].map((d) => log(d === 4 ? "numb" : "anxious", d, { tags: ["work"] }));
    expect(gentleInsights(logs, NOW)).toContainEqual({ kind: "tag-mood", tag: "work", mood: "anxious" });
  });

  it("needs a clear majority for a tag", () => {
    const logs = [log("anxious", 1, { tags: ["work"] }), log("anxious", 2, { tags: ["work"] }), log("heavy", 3, { tags: ["work"] }), log("numb", 4, { tags: ["work"] })];
    expect(gentleInsights(logs, NOW).some((i) => i.kind === "tag-mood")).toBe(false);
  });

  it("notices a feeling word picked lately", () => {
    const logs = [1, 3, 5].map((d) => log("heavy", d, { feelings: ["lonely"] }));
    expect(gentleInsights(logs, NOW)).toContainEqual({ kind: "feeling-lately", word: "lonely" });
    const old = [10, 12, 14].map((d) => log("heavy", d, { feelings: ["lonely"] }));
    expect(gentleInsights(old, NOW).some((i) => i.kind === "feeling-lately")).toBe(false);
  });

  it("notices heavy moments that come late at night", () => {
    const logs = [1, 2, 3, 4].map((d) => log("anxious", d, { hour: 23 }));
    expect(gentleInsights(logs, NOW)).toContainEqual({ kind: "late-night", mood: "anxious" });
    const daytime = [1, 2, 3, 4].map((d) => log("anxious", d, { hour: 14 }));
    expect(gentleInsights(daytime, NOW).some((i) => i.kind === "late-night")).toBe(false);
  });

  it("ignores check-ins older than 30 days and returns at most three", () => {
    const old = [40, 41, 42, 43].map((d) => log("anxious", d, { tags: ["work"], hour: 23 }));
    expect(gentleInsights(old, NOW)).toEqual([]);
    const lots = [
      ...[1, 2, 3, 4].map((d) => log("anxious", d, { tags: ["work"], feelings: ["worried"], hour: 23 })),
      ...[1, 2, 3, 4].map((d) => log("heavy", d, { tags: ["family"] })),
    ];
    expect(gentleInsights(lots, NOW).length).toBeLessThanOrEqual(3);
  });
});
