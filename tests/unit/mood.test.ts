// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getStorage, setStorage } from "@/lib/storage";
import { createMemoryDriver } from "@/lib/storage/driver";
import { createLocalAdapter } from "@/lib/storage/local";
import {
  __resetMoodsForTests,
  addMood,
  getMoodState,
  loadMoods,
  readNote,
  removeMood,
} from "@/lib/mood/store";
import {
  latestMoodByDay,
  monthGrid,
  shouldShowHeavyNudge,
  weekStrip,
} from "@/lib/mood/selectors";
import { __setIterationsForTests } from "@/lib/vault/keyring";
import {
  VaultLockedError,
  __resetVaultForTests,
  initVault,
  lockVault,
  setVaultPasscode,
  unlockWithPasscode,
} from "@/lib/vault/session";
import type { MoodLog, MoodType } from "@/types";

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
