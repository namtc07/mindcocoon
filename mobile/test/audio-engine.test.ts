import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAudioEngine,
  minutesLeft,
  sleepMinutesLeft,
  type AudioEngineDeps,
  type AudioPrefs,
  type MixPlayer,
  type PlayerStatus,
} from "../src/lib/audio/engine";

type Meta = { title?: string; artist?: string; albumTitle?: string };

class FakePlayer implements MixPlayer {
  volume = 1;
  loop = false;
  calls: string[] = [];
  lockScreen: { active: boolean; meta?: Meta } = { active: false };
  metaUpdates: Meta[] = [];
  private listener: ((s: PlayerStatus) => void) | null = null;

  constructor(public id: string) {}
  play() {
    this.calls.push("play");
  }
  pause() {
    this.calls.push("pause");
  }
  async seekTo(seconds: number) {
    this.calls.push(`seek:${seconds}`);
  }
  remove() {
    this.calls.push("remove");
  }
  setActiveForLockScreen(active: boolean, meta?: Meta) {
    this.lockScreen = { active, meta };
  }
  updateLockScreenMetadata(meta: Meta) {
    this.metaUpdates.push(meta);
  }
  clearLockScreenControls() {
    this.lockScreen = { active: false };
  }
  addListener(_: "playbackStatusUpdate", cb: (s: PlayerStatus) => void) {
    this.listener = cb;
    return { remove: () => (this.listener = null) };
  }
  emit(status: Partial<PlayerStatus>) {
    this.listener?.({ playing: false, didJustFinish: false, ...status });
  }
}

let players: Map<string, FakePlayer>;
let clock: number;
let saved: AudioPrefs | undefined;

function setup(overrides: Partial<AudioEngineDeps> = {}) {
  const deps: AudioEngineDeps = {
    trackIds: ["rain", "ocean", "piano-still"],
    createPlayer: (id) => {
      const p = new FakePlayer(id);
      players.set(id, p);
      return p;
    },
    prepareSession: vi.fn().mockResolvedValue(undefined),
    loadPrefs: () => saved,
    savePrefs: (p) => {
      saved = p;
    },
    now: () => clock,
    ...overrides,
  };
  return { engine: createAudioEngine(deps), deps };
}

const p = (id: string) => players.get(id)!;

beforeEach(() => {
  vi.useFakeTimers();
  players = new Map();
  clock = 1_000_000;
  saved = undefined;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("audio engine", () => {
  it("play starts a player at volume 0.6*0.8 and marks it playing", async () => {
    const { engine } = setup();
    await engine.play("rain");
    expect(p("rain").calls).toContain("play");
    expect(p("rain").volume).toBeCloseTo(0.48);
    expect(p("rain").loop).toBe(true);
    expect(engine.getState().playing).toEqual(["rain"]);
  });

  it("toggle pauses a playing track", async () => {
    const { engine } = setup();
    await engine.toggle("rain");
    await engine.toggle("rain");
    expect(p("rain").calls).toEqual(["play", "pause"]);
    expect(engine.getState().playing).toEqual([]);
  });

  it("prepareSession runs once, before the first play", async () => {
    const order: string[] = [];
    const prepareSession = vi.fn(async () => {
      order.push("session");
    });
    const { engine } = setup({
      prepareSession,
      createPlayer: (id) => {
        const fp = new FakePlayer(id);
        fp.play = () => order.push(`play:${id}`);
        players.set(id, fp);
        return fp;
      },
    });
    await engine.play("rain");
    await engine.play("ocean");
    expect(prepareSession).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["session", "play:rain", "play:ocean"]);
  });

  it("a failed prepareSession rolls the track back and rejects", async () => {
    const { engine } = setup({ prepareSession: vi.fn().mockRejectedValueOnce(new Error("no session")).mockResolvedValue(undefined) });
    await expect(engine.play("rain")).rejects.toThrow("no session");
    expect(engine.getState().playing).toEqual([]);
    await engine.play("rain");
    expect(engine.getState().playing).toEqual(["rain"]);
  });

  it("pauseAll holds the mix and resumeAll plays it again", async () => {
    const { engine } = setup();
    await engine.play("rain");
    await engine.play("ocean");
    engine.pauseAll();
    expect(engine.getState()).toMatchObject({ playing: [], held: ["rain", "ocean"] });
    expect(p("ocean").calls).toContain("pause");
    await engine.resumeAll();
    expect(engine.getState()).toMatchObject({ playing: ["rain", "ocean"], held: [] });
  });

  it("stopAll seeks every player to 0 and clears held and the sleep timer", async () => {
    const { engine } = setup();
    await engine.play("rain");
    engine.setSleepTimer(10);
    engine.stopAll();
    expect(p("rain").calls).toEqual(["play", "pause", "seek:0"]);
    expect(engine.getState()).toMatchObject({ playing: [], held: [], sleepEndsAt: null });
  });

  it("volume, master and loop are saved and loaded", async () => {
    const { engine } = setup();
    await engine.play("rain");
    engine.setTrackVolume("rain", 0.5);
    engine.setMasterVolume(0.4);
    engine.setLoop(false);
    expect(p("rain").volume).toBeCloseTo(0.2);
    expect(p("rain").loop).toBe(false);
    expect(saved).toMatchObject({ master: 0.4, loop: false });
    expect(saved?.volumes.rain).toBe(0.5);

    const second = setup().engine;
    expect(second.getState()).toMatchObject({ master: 0.4, loop: false });
    expect(second.getState().volumes.rain).toBe(0.5);
    expect(second.getState().volumes.ocean).toBe(0.6);
  });

  it("sleep timer fades over the last minute and stops", async () => {
    const { engine } = setup();
    await engine.play("rain");
    engine.setSleepTimer(10);
    expect(engine.getState().sleepEndsAt).toBe(clock + 10 * 60_000);
    clock += 9.5 * 60_000;
    vi.advanceTimersByTime(1_000);
    expect(p("rain").volume).toBeCloseTo(0.24, 1);
    clock += 30_000;
    vi.advanceTimersByTime(1_000);
    expect(engine.getState()).toMatchObject({ playing: [], sleepEndsAt: null });
    expect(p("rain").volume).toBeCloseTo(0.48);
  });

  it("late tick stops at once", async () => {
    const { engine } = setup();
    await engine.play("rain");
    engine.setSleepTimer(10);
    clock += 15 * 60_000;
    engine.tick();
    expect(engine.getState()).toMatchObject({ playing: [], sleepEndsAt: null });
  });

  it("the first playing track leads the lock screen with the mix name", async () => {
    const { engine } = setup();
    engine.setLabels({ names: { rain: "Rain", ocean: "Ocean" }, album: "Sanctuary" });
    await engine.play("rain");
    expect(p("rain").lockScreen).toEqual({
      active: true,
      meta: { title: "Rain", artist: "MindCocoon", albumTitle: "Sanctuary" },
    });
    await engine.play("ocean");
    expect(p("rain").metaUpdates.at(-1)).toEqual({ title: "Rain + Ocean", artist: "MindCocoon", albumTitle: "Sanctuary" });
    expect(p("ocean").lockScreen.active).toBe(false);
  });

  it("pausing the leader hands the lock screen to the next track", async () => {
    const { engine } = setup();
    engine.setLabels({ names: { rain: "Rain", ocean: "Ocean" }, album: "Sanctuary" });
    await engine.play("rain");
    await engine.play("ocean");
    engine.pause("rain");
    expect(p("rain").lockScreen.active).toBe(false);
    expect(p("ocean").lockScreen).toEqual({
      active: true,
      meta: { title: "Ocean", artist: "MindCocoon", albumTitle: "Sanctuary" },
    });
  });

  it("stopAll clears the lock screen", async () => {
    const { engine } = setup();
    await engine.play("rain");
    engine.stopAll();
    expect(p("rain").lockScreen.active).toBe(false);
  });

  it("ignores status updates until a player settles", async () => {
    const { engine } = setup();
    await engine.play("rain");
    p("rain").emit({ playing: false });
    expect(engine.getState().playing).toEqual(["rain"]);
    expect(p("rain").calls).toEqual(["play"]);
  });

  it("a lock-screen pause pauses the whole mix", async () => {
    const { engine } = setup();
    await engine.play("rain");
    await engine.play("ocean");
    p("rain").emit({ playing: true });
    p("ocean").emit({ playing: true });
    p("rain").emit({ playing: false });
    expect(engine.getState()).toMatchObject({ playing: [], held: ["rain", "ocean"] });
    expect(p("ocean").calls).toContain("pause");
  });

  it("a lock-screen play resumes the whole mix", async () => {
    const { engine } = setup();
    await engine.play("rain");
    await engine.play("ocean");
    engine.pauseAll();
    p("rain").emit({ playing: false });
    p("ocean").emit({ playing: false });
    p("rain").emit({ playing: true });
    await vi.waitFor(() => expect(engine.getState().playing).toEqual(["rain", "ocean"]));
    expect(engine.getState().held).toEqual([]);
  });

  it("external pause of several players holds the mix once", async () => {
    const { engine } = setup();
    await engine.play("rain");
    await engine.play("ocean");
    p("rain").emit({ playing: true });
    p("ocean").emit({ playing: true });
    p("rain").emit({ playing: false });
    p("ocean").emit({ playing: false });
    expect(engine.getState()).toMatchObject({ playing: [], held: ["rain", "ocean"] });
  });

  it("a finished track leaves the mix when loop is off", async () => {
    const { engine } = setup();
    engine.setLoop(false);
    await engine.play("piano-still");
    p("piano-still").emit({ playing: true });
    p("piano-still").emit({ playing: false, didJustFinish: true });
    expect(engine.getState().playing).toEqual([]);
  });

  it("reset stops, drops players and ignores stored prefs", async () => {
    const { engine } = setup();
    await engine.play("rain");
    engine.setTrackVolume("rain", 0.2);
    engine.reset();
    expect(p("rain").calls).toContain("remove");
    expect(p("rain").lockScreen.active).toBe(false);
    expect(engine.getState()).toMatchObject({ playing: [], held: [], master: 0.8, loop: true });
    expect(engine.getState().volumes.rain).toBe(0.6);
  });

  it("notifies subscribers on change", async () => {
    const { engine } = setup();
    const listener = vi.fn();
    const off = engine.subscribe(listener);
    await engine.play("rain");
    expect(listener).toHaveBeenCalled();
    off();
  });
});

describe("like real players (status only on actual changes)", () => {
  it("lock-screen pause then play brings the whole mix back", async () => {
    const { engine } = setup();
    await engine.play("rain");
    await engine.play("ocean");
    p("rain").emit({ playing: true });
    p("ocean").emit({ playing: true });
    p("rain").emit({ playing: false }); // lock-screen pause
    p("ocean").emit({ playing: false }); // ocean really stops after pauseAll; rain was already paused, so it stays silent
    p("rain").emit({ playing: true }); // lock-screen play
    await vi.waitFor(() => expect(engine.getState().playing).toEqual(["rain", "ocean"]));
    expect(engine.getState().held).toEqual([]);
    expect(p("ocean").calls.filter((c) => c === "play")).toHaveLength(2);
  });

  it("a sound the OS resumes after a call shows as playing again", async () => {
    const { engine } = setup();
    await engine.play("rain");
    p("rain").emit({ playing: true });
    p("rain").emit({ playing: false }); // call starts
    expect(engine.getState().held).toEqual(["rain"]);
    p("rain").emit({ playing: true }); // call ends, iOS resumes it
    await vi.waitFor(() => expect(engine.getState().playing).toEqual(["rain"]));
  });

  it("a finished track rewinds so it can play again", async () => {
    const { engine } = setup();
    engine.setLoop(false);
    await engine.play("piano-still");
    p("piano-still").emit({ playing: true });
    p("piano-still").emit({ playing: false, didJustFinish: true });
    expect(p("piano-still").calls).toContain("seek:0");
    await engine.play("piano-still");
    p("piano-still").emit({ playing: true });
    expect(engine.getState().playing).toEqual(["piano-still"]);
  });
});

describe("restorePrefs", () => {
  it("applies prefs that were not readable when the engine was created", async () => {
    let stored: Partial<AudioPrefs> | undefined;
    const { engine } = setup({ loadPrefs: () => stored });
    expect(engine.getState().master).toBe(0.8);
    stored = { volumes: { rain: 0.3 }, master: 0.5, loop: false };
    engine.restorePrefs();
    expect(engine.getState()).toMatchObject({ master: 0.5, loop: false });
    expect(engine.getState().volumes).toMatchObject({ rain: 0.3, ocean: 0.6 });
    await engine.play("rain");
    expect(p("rain").volume).toBeCloseTo(0.15);
    expect(p("rain").loop).toBe(false);
  });
});

describe("sleepMinutesLeft", () => {
  it("never shows more than the minutes chosen, even with a slightly stale clock", async () => {
    const { engine } = setup();
    engine.setSleepTimer(20);
    expect(engine.getState().sleepMinutes).toBe(20);
    expect(sleepMinutesLeft(engine.getState(), clock - 4_000)).toBe(20);
    expect(sleepMinutesLeft(engine.getState(), clock + 60_500)).toBe(19);
    engine.setSleepTimer(null);
    expect(engine.getState().sleepMinutes).toBeNull();
    expect(sleepMinutesLeft(engine.getState(), clock)).toBeNull();
  });
});

describe("minutesLeft", () => {
  it("rounds up and never shows 0", () => {
    expect(minutesLeft(0)).toBe(1);
    expect(minutesLeft(61_000)).toBe(2);
    expect(minutesLeft(10 * 60_000)).toBe(10);
  });
});
