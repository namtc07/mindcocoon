import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn().mockResolvedValue({ error: null });
const supabase = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => supabase.client }));

import {
  __resetAnalyticsForTests,
  getDeviceId,
  hourBucket,
  setAnalyticsEnabled,
  trackAppOpen,
} from "@/lib/analytics";

beforeEach(() => {
  localStorage.clear();
  insert.mockClear();
  supabase.client = { from: vi.fn(() => ({ insert })) };
  __resetAnalyticsForTests();
});

describe("analytics", () => {
  it("buckets times to the UTC hour", () => {
    expect(hourBucket(new Date("2026-10-16T01:47:12+07:00"))).toBe("2026-10-15T18:00:00.000Z");
  });

  it("keeps a stable random device id", () => {
    const id = getDeviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(getDeviceId()).toBe(id);
  });

  it("sends only device id, hour and locale, once per page load", async () => {
    await trackAppOpen(new Date("2026-10-16T22:10:00Z"), "vi");
    await trackAppOpen(new Date("2026-10-16T22:20:00Z"), "vi");
    expect(insert).toHaveBeenCalledTimes(1);
    const payload = insert.mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual(["device_id", "hour_bucket", "locale"]);
    expect(payload).toMatchObject({ hour_bucket: "2026-10-16T22:00:00.000Z", locale: "vi" });
  });

  it("sends nothing when turned off", async () => {
    setAnalyticsEnabled(false);
    await trackAppOpen(new Date(), "en");
    expect(insert).not.toHaveBeenCalled();
  });

  it("sends nothing without Supabase", async () => {
    supabase.client = null;
    await trackAppOpen(new Date(), "en");
    expect(insert).not.toHaveBeenCalled();
  });

  it("ignores a duplicate for the same hour", async () => {
    insert.mockResolvedValueOnce({ error: { code: "23505", message: "duplicate" } });
    await expect(trackAppOpen(new Date(), "en")).resolves.toBeUndefined();
  });
});
