import { getStorage, newId } from "@/lib/storage";
import type { MoodLog, MoodType } from "@/types";

/**
 * Shared, in-memory view of mood logs backed by the storage adapter.
 * Several screens stay mounted at once (Next.js keeps recent routes alive),
 * so they all read from this one store instead of loading separately.
 */

export interface MoodState {
  status: "idle" | "loading" | "ready";
  logs: MoodLog[];
}

let state: MoodState = { status: "idle", logs: [] };
const SERVER_STATE: MoodState = state;
const listeners = new Set<() => void>();

function setState(next: MoodState) {
  state = next;
  listeners.forEach((l) => l());
}

export function subscribeMoods(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getMoodState = () => state;
export const getMoodServerState = () => SERVER_STATE;

export async function loadMoods() {
  if (state.status !== "idle") return;
  setState({ ...state, status: "loading" });
  const logs = await getStorage().moods.list();
  setState({ status: "ready", logs });
}

export async function addMood(input: { mood: MoodType; tags: string[]; note?: string }) {
  const log: MoodLog = {
    id: newId(),
    mood: input.mood,
    tags: input.tags,
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  await getStorage().moods.add(log);
  setState({ ...state, logs: [log, ...state.logs] });
  return log;
}

export async function removeMood(id: string) {
  await getStorage().moods.remove(id);
  setState({ ...state, logs: state.logs.filter((l) => l.id !== id) });
}

export async function clearMoods() {
  await getStorage().moods.clear();
  setState({ status: "ready", logs: [] });
}
