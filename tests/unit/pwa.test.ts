import { describe, expect, it } from "vitest";
import { shouldShowInstallHint, type InstallHintState } from "@/lib/pwa";

const DAY = 86_400_000;
const base: InstallHintState = { isIOS: true, standalone: false, visits: 2, lastShownAt: null, path: "/" };

describe("shouldShowInstallHint", () => {
  it("shows on the second visit in iOS Safari", () => {
    expect(shouldShowInstallHint(Date.now(), base)).toBe(true);
  });

  it("waits for a second visit", () => {
    expect(shouldShowInstallHint(Date.now(), { ...base, visits: 1 })).toBe(false);
  });

  it("never shows once installed or outside iOS", () => {
    expect(shouldShowInstallHint(Date.now(), { ...base, standalone: true })).toBe(false);
    expect(shouldShowInstallHint(Date.now(), { ...base, isIOS: false })).toBe(false);
  });

  it("shows at most once every 14 days", () => {
    const now = Date.now();
    expect(shouldShowInstallHint(now, { ...base, lastShownAt: now - 3 * DAY })).toBe(false);
    expect(shouldShowInstallHint(now, { ...base, lastShownAt: now - 14 * DAY })).toBe(true);
  });

  it("never interrupts venting", () => {
    expect(shouldShowInstallHint(Date.now(), { ...base, path: "/vent" })).toBe(false);
  });
});
