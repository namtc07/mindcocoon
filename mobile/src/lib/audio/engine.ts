/**
 * Sanctuary mixer — platform-free so it runs under Vitest with fake players.
 * `index.ts` wires it to expo-audio, the audio session and persisted prefs.
 *
 * Lock-screen controls belong to one "leader" player (the first sound in the mix).
 * Pause/play pressed there (or an OS interruption) reaches us only as a player
 * changing state on its own; the status sync turns that into pauseAll/resumeAll.
 */

export type SleepMinutes = 10 | 20 | 30 | 60;
export const SLEEP_OPTIONS: SleepMinutes[] = [10, 20, 30, 60];

export interface AudioState {
  /** Tracks currently playing. */
  playing: string[];
  /** Tracks paused together (mini bar, lock screen, interruption), resumed together. */
  held: string[];
  volumes: Record<string, number>;
  master: number;
  loop: boolean;
  /** Epoch ms when the sleep timer stops everything, or null. */
  sleepEndsAt: number | null;
  /** The option the sleep timer was set with, or null. */
  sleepMinutes: SleepMinutes | null;
}

export interface AudioPrefs {
  volumes: Record<string, number>;
  master: number;
  loop: boolean;
}

export interface PlayerStatus {
  playing: boolean;
  didJustFinish: boolean;
}

type LockScreenMetadata = { title?: string; artist?: string; albumTitle?: string };

/** The subset of expo-audio's AudioPlayer the mixer uses. */
export interface MixPlayer {
  volume: number;
  loop: boolean;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  remove(): void;
  setActiveForLockScreen(active: boolean, metadata?: LockScreenMetadata): void;
  updateLockScreenMetadata(metadata: LockScreenMetadata): void;
  clearLockScreenControls(): void;
  addListener(event: "playbackStatusUpdate", cb: (s: PlayerStatus) => void): { remove(): void };
}

export interface AudioEngineDeps {
  trackIds: string[];
  createPlayer(id: string): MixPlayer;
  /** Called once, before the first play; a rejection fails that play (and is retried next time). */
  prepareSession(): Promise<void>;
  loadPrefs(): Partial<AudioPrefs> | undefined;
  savePrefs(prefs: AudioPrefs): void;
  now?: () => number;
}

export interface AudioEngine {
  getState(): AudioState;
  subscribe(listener: () => void): () => void;
  play(id: string): Promise<void>;
  pause(id: string): void;
  toggle(id: string): Promise<void>;
  pauseAll(): void;
  resumeAll(): Promise<void>;
  stopAll(): void;
  setTrackVolume(id: string, volume: number): void;
  setMasterVolume(master: number): void;
  setLoop(loop: boolean): void;
  setSleepTimer(minutes: SleepMinutes | null): void;
  /** Sleep-timer check; runs every second while a timer is set and when the app returns to the foreground. */
  tick(): void;
  setLabels(labels: { names: Record<string, string>; album: string }): void;
  /** Stops everything, drops the players and returns to defaults (ignoring stored prefs). */
  reset(): void;
  /** Plays exactly this mix (sounds outside it stop; the sleep timer keeps running); unplayable ids are skipped. */
  applyMix(mix: { volumes: Record<string, number> }, playable: (id: string) => boolean): Promise<void>;
  /** Re-reads stored prefs (they load asynchronously after the engine is created at startup). */
  restorePrefs(): void;
}

const DEFAULT_VOLUME = 0.6;
const DEFAULT_MASTER = 0.8;
const FADE_MS = 60_000;
const TICK_MS = 1_000;
const ARTIST = "MindCocoon";

/** Whole minutes left on a timer, rounded up (never shows 0 while running). */
export function minutesLeft(ms: number) {
  return Math.max(1, Math.ceil(ms / 60_000));
}

/** Minutes left on the sleep timer for display; never more than the option chosen (clocks in the UI may lag a few seconds). */
export function sleepMinutesLeft(state: Pick<AudioState, "sleepEndsAt" | "sleepMinutes">, now: number): number | null {
  if (state.sleepEndsAt === null || state.sleepMinutes === null) return null;
  return Math.min(state.sleepMinutes, minutesLeft(state.sleepEndsAt - now));
}

interface PlayerRecord {
  player: MixPlayer;
  /** What the engine last asked of this player. */
  wanted: boolean;
  /** The player is known to be in the wanted state (reported, or already there when asked). */
  settled: boolean;
  /** Last state the player reported. Real players only report changes, never a no-op pause/play. */
  reported: boolean;
  subscription: { remove(): void };
}

export function createAudioEngine(deps: AudioEngineDeps): AudioEngine {
  const now = deps.now ?? (() => Date.now());
  const listeners = new Set<() => void>();
  const records = new Map<string, PlayerRecord>();
  let session: Promise<void> | null = null;
  let fade = 1;
  let sleepTimer: ReturnType<typeof setInterval> | null = null;
  let labels: { names: Record<string, string>; album: string } = { names: {}, album: "" };
  let lockLeader: string | null = null;
  let lockMetaKey = "";

  function defaults(): AudioState {
    return {
      playing: [],
      held: [],
      volumes: Object.fromEntries(deps.trackIds.map((id) => [id, DEFAULT_VOLUME])),
      master: DEFAULT_MASTER,
      loop: true,
      sleepEndsAt: null,
      sleepMinutes: null,
    };
  }

  function withPrefs(base: AudioState): AudioState {
    const prefs = deps.loadPrefs();
    if (!prefs) return base;
    return {
      ...base,
      volumes: { ...base.volumes, ...prefs.volumes },
      master: prefs.master ?? base.master,
      loop: prefs.loop ?? base.loop,
    };
  }

  let state = withPrefs(defaults());

  function setState(patch: Partial<AudioState>) {
    state = { ...state, ...patch };
    syncLockScreen();
    listeners.forEach((l) => l());
  }

  function savePrefs() {
    deps.savePrefs({ volumes: state.volumes, master: state.master, loop: state.loop });
  }

  function effectiveVolume(id: string) {
    return Math.min(1, Math.max(0, (state.volumes[id] ?? DEFAULT_VOLUME) * state.master * fade));
  }

  function applyVolumes() {
    records.forEach((rec, id) => {
      rec.player.volume = effectiveVolume(id);
    });
  }

  function record(id: string): PlayerRecord {
    let rec = records.get(id);
    if (!rec) {
      const player = deps.createPlayer(id);
      const created: PlayerRecord = {
        player,
        wanted: false,
        settled: true,
        reported: false,
        subscription: player.addListener("playbackStatusUpdate", (s) => onStatus(id, s)),
      };
      rec = created;
      records.set(id, rec);
    }
    rec.player.loop = state.loop;
    rec.player.volume = effectiveVolume(id);
    return rec;
  }

  function command(rec: PlayerRecord, play: boolean) {
    rec.wanted = play;
    rec.settled = rec.reported === play;
    if (play) rec.player.play();
    else rec.player.pause();
  }

  function onStatus(id: string, status: PlayerStatus) {
    const rec = records.get(id);
    if (!rec) return;
    rec.reported = status.playing;
    if (status.didJustFinish && !state.loop) {
      rec.wanted = false;
      rec.settled = true;
      rec.reported = false;
      // expo-audio stays at the end of a finished item; rewind so Play starts it again.
      rec.player.seekTo(0).catch(() => {});
      if (state.playing.includes(id)) setState({ playing: state.playing.filter((p) => p !== id) });
      return;
    }
    if (status.playing === rec.wanted) {
      rec.settled = true;
      return;
    }
    if (!rec.settled) return; // still starting or stopping after our own command
    if (!status.playing) {
      // Paused from the lock screen or by the OS (call, Siri, headphones out).
      rec.wanted = false;
      engine.pauseAll();
    } else if (state.held.includes(id)) {
      // Play pressed on the lock screen: bring the whole mix back.
      void engine.resumeAll();
    } else {
      command(rec, false);
    }
  }

  function title(ids: string[]) {
    return ids.map((id) => labels.names[id] ?? id).join(" + ");
  }

  function syncLockScreen() {
    const active = state.playing.length ? state.playing : state.held;
    const leader = active[0] ?? null;
    const meta: LockScreenMetadata = { title: title(active), artist: ARTIST, albumTitle: labels.album };
    const metaKey = JSON.stringify(meta);
    if (leader !== lockLeader) {
      if (lockLeader) records.get(lockLeader)?.player.clearLockScreenControls();
      lockLeader = leader && records.has(leader) ? leader : null;
      if (lockLeader) records.get(lockLeader)!.player.setActiveForLockScreen(true, meta);
      lockMetaKey = metaKey;
    } else if (leader && metaKey !== lockMetaKey) {
      records.get(leader)?.player.updateLockScreenMetadata(meta);
      lockMetaKey = metaKey;
    }
  }

  function prepareSession() {
    session ??= deps.prepareSession().catch((error: unknown) => {
      session = null;
      throw error;
    });
    return session;
  }

  function clearSleep() {
    if (sleepTimer) clearInterval(sleepTimer);
    sleepTimer = null;
    if (fade !== 1) {
      fade = 1;
      applyVolumes();
    }
  }

  const engine: AudioEngine = {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async play(id) {
      if (state.playing.includes(id)) return;
      await prepareSession();
      if (state.playing.includes(id)) return;
      const rec = record(id);
      command(rec, true);
      setState({ playing: [...state.playing, id], held: state.held.filter((h) => h !== id) });
    },

    pause(id) {
      const rec = records.get(id);
      if (rec) command(rec, false);
      setState({ playing: state.playing.filter((p) => p !== id) });
    },

    toggle(id) {
      if (state.playing.includes(id)) {
        engine.pause(id);
        return Promise.resolve();
      }
      return engine.play(id);
    },

    pauseAll() {
      if (!state.playing.length) return;
      const { playing } = state;
      playing.forEach((id) => {
        const rec = records.get(id);
        if (rec) command(rec, false);
      });
      setState({ playing: [], held: playing });
    },

    async resumeAll() {
      const { held } = state;
      // Keep `held` until each sound is back so the lock screen keeps its leader.
      await Promise.allSettled(held.map((id) => engine.play(id)));
      setState({ held: [] });
    },

    stopAll() {
      [...state.playing, ...state.held].forEach((id) => {
        const rec = records.get(id);
        if (!rec) return;
        command(rec, false);
        rec.player.seekTo(0).catch(() => {});
      });
      clearSleep();
      setState({ playing: [], held: [], sleepEndsAt: null, sleepMinutes: null });
    },

    setTrackVolume(id, volume) {
      setState({ volumes: { ...state.volumes, [id]: volume } });
      savePrefs();
      applyVolumes();
    },

    setMasterVolume(master) {
      setState({ master });
      savePrefs();
      applyVolumes();
    },

    setLoop(loop) {
      setState({ loop });
      savePrefs();
      records.forEach((rec) => {
        rec.player.loop = loop;
      });
    },

    setSleepTimer(minutes) {
      clearSleep();
      if (minutes === null) {
        setState({ sleepEndsAt: null, sleepMinutes: null });
        return;
      }
      setState({ sleepEndsAt: now() + minutes * 60_000, sleepMinutes: minutes });
      sleepTimer = setInterval(() => engine.tick(), TICK_MS);
    },

    tick() {
      const { sleepEndsAt } = state;
      if (sleepEndsAt === null) return;
      const remaining = sleepEndsAt - now();
      if (remaining <= 0) {
        engine.stopAll();
        return;
      }
      fade = Math.min(1, remaining / FADE_MS);
      applyVolumes();
    },

    setLabels(next) {
      labels = next;
      setState({});
    },

    async applyMix(mix, playable) {
      const targets = Object.entries(mix.volumes)
        .filter(([id, v]) => v > 0 && deps.trackIds.includes(id) && playable(id))
        .map(([id]) => id);
      const volumes = { ...state.volumes };
      targets.forEach((id) => {
        volumes[id] = mix.volumes[id];
      });
      state.playing
        .filter((id) => !targets.includes(id))
        .forEach((id) => {
          const rec = records.get(id);
          if (rec) command(rec, false);
        });
      setState({ volumes, playing: state.playing.filter((id) => targets.includes(id)), held: [] });
      savePrefs();
      applyVolumes();
      await Promise.allSettled(targets.map((id) => engine.play(id)));
    },

    restorePrefs() {
      state = withPrefs(state);
      applyVolumes();
      records.forEach((rec) => {
        rec.player.loop = state.loop;
      });
      listeners.forEach((l) => l());
    },

    reset() {
      engine.stopAll();
      records.forEach((rec) => {
        rec.player.clearLockScreenControls();
        rec.subscription.remove();
        rec.player.remove();
      });
      records.clear();
      lockLeader = null;
      lockMetaKey = "";
      fade = 1;
      state = defaults();
      listeners.forEach((l) => l());
    },
  };

  return engine;
}
