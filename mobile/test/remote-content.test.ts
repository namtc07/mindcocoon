import { describe, expect, it, vi } from "vitest";
import { EMPTY_CONTENT } from "@mindcocoon/core/remote-content";
import { createRemoteContent, type CachedContent } from "../src/lib/remote-content-core";

const HOUR = 3_600_000;
const ROWS = [{ id: "p1", kind: "prompt", locale: "en", body: { text: "How was the light today?" }, created_at: "2026-10-18T00:00:00Z" }];
const ok = (rows: unknown) => new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });

function setup(opts: { cache?: CachedContent; fetch?: typeof fetch } = {}) {
  let clock = 1_000_000_000;
  let cache = opts.cache;
  const fetchFn = vi.fn(opts.fetch ?? (async () => ok(ROWS)));
  const rc = createRemoteContent({
    fetch: fetchFn as unknown as typeof fetch,
    url: "https://example.supabase.co",
    key: "sb_publishable_test",
    now: () => clock,
    load: () => cache,
    save: (v) => {
      cache = v;
    },
  });
  return { rc, fetchFn, tick: (ms: number) => (clock += ms), cache: () => cache };
}

describe("remote content", () => {
  it("asks only for published rows, oldest first, and keeps what it got", async () => {
    const { rc, fetchFn, cache } = setup();
    await rc.refresh(true);
    expect(String(fetchFn.mock.calls[0][0])).toContain("/rest/v1/content?select=id,kind,locale,body,created_at&published=eq.true&order=created_at.asc");
    expect(rc.get().prompts.en[0].text).toBe("How was the light today?");
    expect(cache()?.value.prompts.en).toHaveLength(1);
  });

  it("offline or broken: keeps the last content (or nothing)", async () => {
    const { rc } = setup({ fetch: (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch });
    await rc.refresh(true);
    expect(rc.get()).toEqual(EMPTY_CONTENT);
  });

  it("refreshes at most every six hours unless forced", async () => {
    const { rc, fetchFn, tick } = setup();
    await rc.refresh(true);
    await rc.refresh();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    tick(6 * HOUR + 1);
    await rc.refresh();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
