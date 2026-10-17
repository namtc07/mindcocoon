import { DEFAULT_FLAGS, parseFlags, type RemoteFlags } from "./ads/policy";

/**
 * Remote switches (ads on/off, quiet hours) from Supabase `app_config`, read anonymously
 * over REST with the publishable key. Platform-free; `remote-config.ts` wires the app.
 * Unreachable or garbled → keep the last cached flags → built-in defaults (ads off).
 */

export interface CachedFlags {
  value: RemoteFlags;
  fetchedAt: number;
}

export interface RemoteConfigDeps {
  fetch: typeof fetch;
  url?: string;
  key?: string;
  now: () => number;
  load(): CachedFlags | undefined;
  save(value: CachedFlags): void;
}

export const REFRESH_EVERY_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 4_000;

export function createRemoteConfig(deps: RemoteConfigDeps) {
  const listeners = new Set<() => void>();
  let fetchedAt = 0;
  let flags: RemoteFlags | null = null;
  let inflight: Promise<void> | null = null;

  function current(): RemoteFlags {
    if (flags) return flags;
    const cached = deps.load();
    return cached?.value ?? DEFAULT_FLAGS;
  }

  async function fetchFlags() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await deps.fetch(`${deps.url}/rest/v1/app_config?select=key,value`, {
        headers: { apikey: deps.key!, Authorization: `Bearer ${deps.key}` },
        signal: controller.signal,
      });
      if (!res.ok) return;
      const rows: unknown = await res.json();
      if (!Array.isArray(rows)) return;
      flags = parseFlags(rows);
      fetchedAt = deps.now();
      deps.save({ value: flags, fetchedAt });
      listeners.forEach((l) => l());
    } catch {
      // Offline, timed out or not JSON: keep what we have.
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    getFlags: current,

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Fetches when forced or when the last fetch is older than 6 hours. */
    refresh(force = false): Promise<void> {
      if (!deps.url || !deps.key) return Promise.resolve();
      const last = fetchedAt || deps.load()?.fetchedAt || 0;
      if (!force && last && deps.now() - last < REFRESH_EVERY_MS) return Promise.resolve();
      inflight ??= fetchFlags().finally(() => {
        inflight = null;
      });
      return inflight;
    },

    /** Prefs load after the module is created: re-read the cache and notify. */
    reload() {
      flags = null;
      fetchedAt = 0;
      listeners.forEach((l) => l());
    },
  };
}

export type RemoteConfig = ReturnType<typeof createRemoteConfig>;
