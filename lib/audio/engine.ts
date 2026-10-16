import { SOUND_TRACKS, TRACK_BY_ID } from "@/lib/sounds";

/**
 * Ambient mixer. Module-level so playback survives route changes; one
 * HTMLAudioElement per track (keeps playing in background tabs and shows in the
 * OS media controls via the Media Session API).
 */

export type SleepMinutes = 10 | 20 | 30 | 60;

export interface AudioState {
  /** Tracks currently playing. */
  playing: string[];
  /** Tracks paused together from the mini bar, resumed together. */
  held: string[];
  volumes: Record<string, number>;
  master: number;
  loop: boolean;
  /** Epoch ms when the sleep timer stops everything, or null. */
  sleepEndsAt: number | null;
}

const PREFS_KEY = "mindcocoon:audio";
const FADE_MS = 60_000;
const TICK_MS = 1_000;
const DEFAULT_STATE: AudioState = {
  playing: [],
  held: [],
  volumes: Object.fromEntries(SOUND_TRACKS.map((t) => [t.id, 0.6])),
  master: 0.8,
  loop: true,
  sleepEndsAt: null,
};

let state: AudioState | null = null;
let fade = 1;
let sleepTimer: ReturnType<typeof setInterval> | null = null;
const elements = new Map<string, HTMLAudioElement>();
const listeners = new Set<() => void>();

function loadState(): AudioState {
  if (state) return state;
  state = DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const prefs = JSON.parse(raw) as Pick<AudioState, "volumes" | "master" | "loop">;
      state = {
        ...DEFAULT_STATE,
        volumes: { ...DEFAULT_STATE.volumes, ...prefs.volumes },
        master: prefs.master ?? DEFAULT_STATE.master,
        loop: prefs.loop ?? DEFAULT_STATE.loop,
      };
    }
  } catch {
    // Unreadable prefs: use defaults.
  }
  return state;
}

function setState(patch: Partial<AudioState>) {
  state = { ...loadState(), ...patch };
  try {
    const { volumes, master, loop } = state;
    localStorage.setItem(PREFS_KEY, JSON.stringify({ volumes, master, loop }));
  } catch {
    // Storage blocked — prefs just won't persist.
  }
  syncMediaSession();
  listeners.forEach((l) => l());
}

export function subscribeAudio(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getAudioState = () => loadState();
export const getAudioServerState = () => DEFAULT_STATE;

function applyVolume(id: string, el: HTMLAudioElement) {
  const s = loadState();
  el.volume = Math.min(1, Math.max(0, (s.volumes[id] ?? 0.6) * s.master * fade));
}

function applyAllVolumes() {
  elements.forEach((el, id) => applyVolume(id, el));
}

function element(id: string): HTMLAudioElement {
  let el = elements.get(id);
  if (!el) {
    el = new Audio(TRACK_BY_ID[id].src);
    el.preload = "auto";
    el.addEventListener("ended", () => {
      const s = loadState();
      if (!s.loop) setState({ playing: s.playing.filter((p) => p !== id) });
    });
    elements.set(id, el);
  }
  el.loop = loadState().loop;
  applyVolume(id, el);
  return el;
}

export async function playTrack(id: string) {
  const s = loadState();
  if (s.playing.includes(id)) return;
  setState({ playing: [...s.playing, id], held: [] });
  try {
    await element(id).play();
  } catch (error) {
    setState({ playing: loadState().playing.filter((p) => p !== id) });
    throw error;
  }
}

export function pauseTrack(id: string) {
  elements.get(id)?.pause();
  setState({ playing: loadState().playing.filter((p) => p !== id) });
}

export function toggleTrack(id: string) {
  return loadState().playing.includes(id) ? pauseTrack(id) : playTrack(id);
}

/** Pauses everything, remembering the mix so resumeAll can bring it back. */
export function pauseAll() {
  const { playing } = loadState();
  playing.forEach((id) => elements.get(id)?.pause());
  setState({ playing: [], held: playing });
}

export async function resumeAll() {
  const { held } = loadState();
  setState({ held: [] });
  await Promise.allSettled(held.map((id) => playTrack(id)));
}

/** Stops and forgets the current mix (and any sleep timer). */
export function stopAll() {
  const { playing } = loadState();
  playing.forEach((id) => {
    const el = elements.get(id);
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  });
  clearSleep();
  setState({ playing: [], held: [], sleepEndsAt: null });
}

export function setTrackVolume(id: string, volume: number) {
  const s = loadState();
  setState({ volumes: { ...s.volumes, [id]: volume } });
  const el = elements.get(id);
  if (el) applyVolume(id, el);
}

export function setMasterVolume(master: number) {
  setState({ master });
  applyAllVolumes();
}

export function setLoop(loop: boolean) {
  setState({ loop });
  elements.forEach((el) => {
    el.loop = loop;
  });
}

// --- Sleep timer ---------------------------------------------------------------

function clearSleep() {
  if (sleepTimer) clearInterval(sleepTimer);
  sleepTimer = null;
  if (fade !== 1) {
    fade = 1;
    applyAllVolumes();
  }
}

function tickSleep() {
  const { sleepEndsAt } = loadState();
  if (sleepEndsAt === null) return;
  const remaining = sleepEndsAt - Date.now();
  if (remaining <= 0) {
    stopAll();
    return;
  }
  fade = Math.min(1, remaining / FADE_MS);
  applyAllVolumes();
}

/** Fades everything out over the last minute, then stops. Null cancels. */
export function setSleepTimer(minutes: SleepMinutes | null) {
  clearSleep();
  if (minutes === null) {
    setState({ sleepEndsAt: null });
    return;
  }
  setState({ sleepEndsAt: Date.now() + minutes * 60_000 });
  sleepTimer = setInterval(tickSleep, TICK_MS);
}

function syncMediaSession() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const s = loadState();
  const active = s.playing.length ? s.playing : s.held;
  if (!active.length) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: active.map((id) => TRACK_BY_ID[id]?.title).join(" + "),
    artist: "MindCocoon",
    album: "Sanctuary",
  });
  navigator.mediaSession.playbackState = s.playing.length ? "playing" : "paused";
  navigator.mediaSession.setActionHandler("play", () => void resumeAll());
  navigator.mediaSession.setActionHandler("pause", pauseAll);
  navigator.mediaSession.setActionHandler("stop", stopAll);
}

export function __getElementForTests(id: string) {
  return elements.get(id);
}

export function __resetAudioForTests() {
  clearSleep();
  elements.clear();
  state = null;
  fade = 1;
}
