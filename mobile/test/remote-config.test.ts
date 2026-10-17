import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FLAGS, type RemoteFlags } from "../src/lib/ads/policy";
import { createRemoteConfig, type CachedFlags } from "../src/lib/remote-config-core";

const ON: RemoteFlags = { adsEnabled: true, rewardedEnabled: true, quietHours: [23, 5] };
const HOUR = 3_600_000;

function rowsResponse(rows: unknown, status = 200) {
  return new Response(JSON.stringify(rows), { status, headers: { "content-type": "application/json" } });
}

function setup(opts: { cache?: CachedFlags; fetch?: typeof fetch; url?: string; key?: string } = {}) {
  let clock = 1_000_000_000;
  let cache = opts.cache;
  const fetchFn = vi.fn(
    opts.fetch ??
      (async () =>
        rowsResponse([
          { key: "ads_enabled", value: true },
          { key: "rewarded_enabled", value: true },
        ])),
  );
  const rc = createRemoteConfig({
    fetch: fetchFn as unknown as typeof fetch,
    url: "url" in opts ? opts.url : "https://example.supabase.co",
    key: "key" in opts ? opts.key : "sb_publishable_test",
    now: () => clock,
    load: () => cache,
    save: (v) => {
      cache = v;
    },
  });
  return { rc, fetchFn, tick: (ms: number) => (clock += ms), cache: () => cache, now: () => clock };
}

describe("remote config", () => {
  it("starts from the cache, else defaults", () => {
    expect(setup().rc.getFlags()).toEqual(DEFAULT_FLAGS);
    expect(setup({ cache: { value: ON, fetchedAt: 1 } }).rc.getFlags()).toEqual(ON);
  });

  it("refresh stores parsed flags and timestamp", async () => {
    const { rc, cache, now } = setup();
    const listener = vi.fn();
    rc.subscribe(listener);
    await rc.refresh();
    expect(rc.getFlags()).toEqual({ ...DEFAULT_FLAGS, adsEnabled: true, rewardedEnabled: true });
    expect(cache()).toEqual({ value: rc.getFlags(), fetchedAt: now() });
    expect(listener).toHaveBeenCalled();
  });

  it("skips refresh within 6 hours unless forced", async () => {
    const { rc, fetchFn, tick } = setup();
    await rc.refresh();
    tick(5 * HOUR);
    await rc.refresh();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    await rc.refresh(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    tick(6 * HOUR + 1);
    await rc.refresh();
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("timeout, HTTP 500 and bad JSON keep the cached flags", async () => {
    vi.useFakeTimers();
    try {
      const hang = setup({
        cache: { value: ON, fetchedAt: 0 },
        fetch: ((_: unknown, init?: RequestInit) =>
          new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))))) as typeof fetch,
      });
      const pending = hang.rc.refresh();
      await vi.advanceTimersByTimeAsync(4_000);
      await pending;
      expect(hang.rc.getFlags()).toEqual(ON);
    } finally {
      vi.useRealTimers();
    }
    const failed = setup({ cache: { value: ON, fetchedAt: 0 }, fetch: (async () => rowsResponse({ message: "boom" }, 500)) as typeof fetch });
    await failed.rc.refresh();
    expect(failed.rc.getFlags()).toEqual(ON);
    const garbled = setup({ cache: { value: ON, fetchedAt: 0 }, fetch: (async () => new Response("<html>", { status: 200 })) as typeof fetch });
    await garbled.rc.refresh();
    expect(garbled.rc.getFlags()).toEqual(ON);
  });

  it("no url/key → never fetches", async () => {
    const { rc, fetchFn } = setup({ url: undefined });
    await rc.refresh(true);
    expect(fetchFn).not.toHaveBeenCalled();
    const noKey = setup({ key: "" });
    await noKey.rc.refresh(true);
    expect(noKey.fetchFn).not.toHaveBeenCalled();
  });

  it("sends the publishable key headers", async () => {
    const { rc, fetchFn } = setup();
    await rc.refresh();
    const [requestUrl, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(requestUrl).toBe("https://example.supabase.co/rest/v1/app_config?select=key,value");
    expect(init.headers).toMatchObject({ apikey: "sb_publishable_test", Authorization: "Bearer sb_publishable_test" });
  });
});
