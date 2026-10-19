// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getStorage, setStorage } from "@mindcocoon/core/storage/index";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import {
  __resetMoodsForTests,
  addMood,
  changeMood,
  getMoodState,
  loadMoods,
  readNote,
  removeMood,
  updateMoodDetails,
} from "@mindcocoon/core/mood/store";
import {
  latestMoodByDay,
  monthGrid,
  shouldShowHeavyNudge,
  weekStrip,
} from "@mindcocoon/core/mood/selectors";
import { __setIterationsForTests } from "@mindcocoon/core/vault/keyring";
import {
  VaultLockedError,
  __resetVaultForTests,
  initVault,
  lockVault,
  setVaultPasscode,
  unlockWithPasscode,
} from "@mindcocoon/core/vault/session";
import type { MoodLog, MoodType } from "@mindcocoon/core/types";

const DAY = 86_400_000;

function log(mood: MoodType, date: Date, id = `${mood}-${date.getTime()}`): MoodLog {
  return { id, mood, tags: [], createdAt: date.toISOString() };
}

describe("selectors", () => {
  it("uses the latest log of each local day", () => {
    const morning = log("heavy", new Date(2026, 9, 16, 9, 0));
    const evening = log("hopeful", new Date(2026, 9, 16, 21, 0));
    const byDay = latestMoodByDay([morning, evening]);
    expect(byDay.get("2026-10-16")?.mood).toBe("hopeful");
  });

  it("keeps a 23:30 log on its own day", () => {
    const late = log("anxious", new Date(2026, 9, 16, 23, 30));
    const byDay = latestMoodByDay([late]);
    expect(byDay.has("2026-10-16")).toBe(true);
    expect(byDay.has("2026-10-17")).toBe(false);
  });

  it("builds a 7-day strip ending today", () => {
    const now = new Date(2026, 9, 16, 22, 0);
    const strip = weekStrip([log("peaceful", new Date(2026, 9, 14, 8, 0))], now);
    expect(strip).toHaveLength(7);
    expect(strip[6].dayKey).toBe("2026-10-16");
    expect(strip[0].dayKey).toBe("2026-10-10");
    expect(strip[4].log?.mood).toBe("peaceful");
    expect(strip[5].log).toBeNull();
  });

  it("lays out a Monday-first month grid", () => {
    const grid = monthGrid([log("numb", new Date(2026, 9, 2, 12, 0))], 2026, 9);
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    const days = grid.filter((cell) => cell !== null);
    expect(days).toHaveLength(31);
    expect(days[0]!.dayKey).toBe("2026-10-01");
    expect(days[1]!.log?.mood).toBe("numb");
  });

  describe("heavy nudge", () => {
    const now = new Date(2026, 9, 16, 22, 0);
    const heavyDays = (count: number) =>
      Array.from({ length: count }, (_, i) => log("heavy", new Date(now.getTime() - i * DAY)));

    it("shows after seven heavy days in a row", () => {
      expect(shouldShowHeavyNudge(heavyDays(7), now, null)).toBe(true);
    });

    it("does not show after six", () => {
      expect(shouldShowHeavyNudge(heavyDays(6), now, null)).toBe(false);
    });

    it("does not show when a day ended lighter", () => {
      const logs = heavyDays(7);
      logs.push(log("peaceful", new Date(now.getTime() - 3 * DAY + 60_000)));
      expect(shouldShowHeavyNudge(logs, now, null)).toBe(false);
    });

    it("counts a week of low days even when they are named differently (lonely, anxious, angry, heavy)", () => {
      const moods = ["alone", "heavy", "alone", "anxious", "angry", "heavy", "alone"] as const;
      const logs = moods.map((m, i) => log(m, new Date(now.getTime() - i * DAY)));
      expect(shouldShowHeavyNudge(logs, now, null)).toBe(true);
    });

    it("a confused or numb day still breaks the run (only clearly low days count)", () => {
      const logs = heavyDays(7);
      logs.push(log("numb", new Date(now.getTime() - 2 * DAY + 60_000)));
      expect(shouldShowHeavyNudge(logs, now, null)).toBe(false);
    });

    it("waits a week after it was last shown", () => {
      expect(shouldShowHeavyNudge(heavyDays(7), now, now.getTime() - 3 * DAY)).toBe(false);
      expect(shouldShowHeavyNudge(heavyDays(7), now, now.getTime() - 7 * DAY)).toBe(true);
    });
  });
});

describe("mood store", () => {
  beforeAll(() => __setIterationsForTests(1_000));

  beforeEach(async () => {
    setStorage(createLocalAdapter(createMemoryDriver()));
    __resetVaultForTests();
    __resetMoodsForTests();
    await initVault();
    await loadMoods();
  });

  it("encrypts notes at rest", async () => {
    const saved = await addMood({ mood: "heavy", tags: ["work"], note: "deadline" });
    const stored = await getStorage().moods.list();
    expect(stored[0].note).toMatch(/^v1\./);
    expect(stored[0].isNoteEncrypted).toBe(true);
    expect(JSON.stringify(stored)).not.toContain("deadline");
    expect(await readNote(saved)).toBe("deadline");
  });

  it("refuses a note while the vault is locked and stores nothing", async () => {
    await setVaultPasscode("2468");
    lockVault();
    await expect(addMood({ mood: "heavy", tags: [], note: "x" })).rejects.toBeInstanceOf(
      VaultLockedError,
    );
    expect(await getStorage().moods.list()).toEqual([]);

    const saved = await addMood({ mood: "heavy", tags: [] });
    expect(saved.note).toBeUndefined();
    expect(await getStorage().moods.list()).toHaveLength(1);
  });

  it("hides notes while locked", async () => {
    const saved = await addMood({ mood: "numb", tags: [], note: "far away" });
    await setVaultPasscode("2468");
    lockVault();
    expect(await readNote(saved)).toBeNull();
    await unlockWithPasscode("2468");
    expect(await readNote(saved)).toBe("far away");
  });

  it("removes logs", async () => {
    const saved = await addMood({ mood: "hopeful", tags: [] });
    await removeMood(saved.id);
    expect(getMoodState().logs).toEqual([]);
    expect(await getStorage().moods.list()).toEqual([]);
  });
});

describe("updateMoodDetails", () => {
  beforeEach(async () => {
    __setIterationsForTests(1_000);
    setStorage(createLocalAdapter(createMemoryDriver()));
    __resetVaultForTests();
    __resetMoodsForTests();
    await initVault();
  });

  it("keeps the id, time and mood while adding tags and an encrypted note", async () => {
    const first = await addMood({ mood: "heavy", tags: [] });
    const updated = await updateMoodDetails(first, { tags: ["work"], note: "long day" });
    const logs = await getStorage().moods.list();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ id: first.id, createdAt: first.createdAt, mood: "heavy", tags: ["work"] });
    expect(logs[0].note).toMatch(/^v1\./);
    expect(await readNote(updated)).toBe("long day");
    expect(getMoodState().logs).toEqual([updated]);
  });

  it("keeps an existing note when none is given", async () => {
    const first = await addMood({ mood: "heavy", tags: [], note: "kept" });
    const updated = await updateMoodDetails(first, { tags: ["study"] });
    expect(await readNote(updated)).toBe("kept");
  });
});

describe("feeling words on check-ins", () => {
  beforeEach(async () => {
    __setIterationsForTests(1_000);
    setStorage(createLocalAdapter(createMemoryDriver()));
    __resetVaultForTests();
    __resetMoodsForTests();
    await initVault();
  });

  it("addMood stores feelings", async () => {
    const log = await addMood({ mood: "heavy", tags: [], feelings: ["lonely", "exhausted"] });
    expect(log.feelings).toEqual(["lonely", "exhausted"]);
    expect((await getStorage().moods.list())[0].feelings).toEqual(["lonely", "exhausted"]);
  });

  it("updateMoodDetails keeps feelings unless given", async () => {
    const log = await addMood({ mood: "heavy", tags: [], feelings: ["sad"] });
    const kept = await updateMoodDetails(log, { tags: ["work"] });
    expect(kept.feelings).toEqual(["sad"]);
    const changed = await updateMoodDetails(kept, { tags: ["work"], feelings: ["hurt"] });
    expect(changed.feelings).toEqual(["hurt"]);
  });

  it("changeMood drops feelings of the old mood", async () => {
    const log = await addMood({ mood: "heavy", tags: [], feelings: ["sad", "lonely"] });
    const moved = await changeMood(log, "anxious");
    expect(moved.feelings ?? []).toEqual([]);
  });

  it("old logs without feelings still load", async () => {
    await getStorage().moods.add({ id: "old", mood: "numb", tags: [], createdAt: new Date().toISOString() });
    await loadMoods(true);
    expect(getMoodState().logs[0].feelings).toBeUndefined();
  });
});

describe("yearGrid", () => {
  it("has twelve months of real days with the latest mood per day", async () => {
    const { yearGrid } = await import("@mindcocoon/core/mood/selectors");
    const logs: MoodLog[] = [
      { id: "a", mood: "heavy", tags: [], createdAt: new Date(2028, 1, 29, 9).toISOString() },
      { id: "b", mood: "hopeful", tags: [], createdAt: new Date(2028, 1, 29, 22).toISOString() },
    ];
    const grid = yearGrid(logs, 2028);
    expect(grid).toHaveLength(12);
    expect(grid[1]).toHaveLength(29);
    expect(grid[0]).toHaveLength(31);
    expect(grid[1][28].dayKey).toBe("2028-02-29");
    expect(grid[1][28].log?.mood).toBe("hopeful");
    expect(yearGrid([], 2027)[1]).toHaveLength(28);
  });
});
