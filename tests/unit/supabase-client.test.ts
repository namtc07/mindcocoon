import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("getSupabase", () => {
  it("returns null without configuration so the app stays local-only", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const { getSupabase } = await import("@/lib/supabase/client");
    expect(getSupabase()).toBeNull();
  });

  it("returns one shared client when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const { getSupabase } = await import("@/lib/supabase/client");
    const client = getSupabase();
    expect(client).not.toBeNull();
    expect(getSupabase()).toBe(client);
  });
});
