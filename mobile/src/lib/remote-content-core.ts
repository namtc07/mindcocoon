import { EMPTY_CONTENT, parseRemoteContent, type RemoteContent } from "@mindcocoon/core/remote-content";

/**
 * Newer writing ideas, stories and practices from Supabase `content` (published rows only, read
 * anonymously with the publishable key). Platform-free; `remote-content.ts` wires the app.
 * Unreachable or garbled → keep the last cached content → nothing extra.
 */
export interface CachedContent {
  value: RemoteContent;
  fetchedAt: number;
}

export interface RemoteContentDeps {
  fetch: typeof fetch;
  url?: string;
  key?: string;
  now: () => number;
  load(): CachedContent | undefined;
  save(value: CachedContent): void;
}

const REFRESH_EVERY_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 6_000;
const QUERY = "/rest/v1/content?select=id,kind,locale,body,created_at&published=eq.true&order=created_at.asc";

export function createRemoteContent(deps: RemoteContentDeps) {
  const listeners = new Set<() => void>();
  let value: RemoteContent | null = null;
  let fetchedAt = 0;
  let inflight: Promise<void> | null = null;

  const get = (): RemoteContent => value ?? deps.load()?.value ?? EMPTY_CONTENT;

  async function load() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await deps.fetch(`${deps.url}${QUERY}`, {
        headers: { apikey: deps.key!, Authorization: `Bearer ${deps.key}` },
        signal: controller.signal,
      });
      if (!res.ok) return;
      const rows: unknown = await res.json();
      if (!Array.isArray(rows)) return;
      value = parseRemoteContent(rows);
      fetchedAt = deps.now();
      deps.save({ value, fetchedAt });
      listeners.forEach((l) => l());
    } catch {
      // Offline, timed out or not JSON: keep what we have.
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get,
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
      inflight ??= load().finally(() => {
        inflight = null;
      });
      return inflight;
    },
    /** Re-reads the cache (after prefs load). */
    reload() {
      value = null;
      listeners.forEach((l) => l());
    },
  };
}
