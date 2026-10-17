import { describe, expect, it } from "vitest";
import { canOfferRewarded, canShowBanner, DEFAULT_FLAGS, parseFlags, type RemoteFlags } from "../src/lib/ads/policy";

const ON: RemoteFlags = { adsEnabled: true, rewardedEnabled: true, quietHours: [23, 5] };
const at = (h: number, m = 0) => new Date(2026, 9, 17, h, m);

describe("parseFlags", () => {
  it("defaults keep ads off", () => {
    expect(DEFAULT_FLAGS).toEqual({ adsEnabled: false, rewardedEnabled: false, quietHours: [23, 5] });
    expect(parseFlags([])).toEqual(DEFAULT_FLAGS);
  });

  it("parses valid rows", () => {
    expect(
      parseFlags([
        { key: "ads_enabled", value: true },
        { key: "rewarded_enabled", value: true },
        { key: "quiet_hours", value: [0, 6] },
      ]),
    ).toEqual({ adsEnabled: true, rewardedEnabled: true, quietHours: [0, 6] });
    expect(parseFlags([{ key: "quiet_hours", value: null }]).quietHours).toBeNull();
  });

  it("ignores garbage per key", () => {
    expect(parseFlags([{ key: "ads_enabled", value: "yes" }, { key: "rewarded_enabled", value: true }])).toEqual({
      ...DEFAULT_FLAGS,
      rewardedEnabled: true,
    });
    expect(parseFlags([{ key: "quiet_hours", value: [25, 3] }]).quietHours).toEqual([23, 5]);
    expect(parseFlags([{ key: "quiet_hours", value: [4, 4] }]).quietHours).toEqual([23, 5]);
    expect(parseFlags([{ key: "quiet_hours", value: [1.5, 3] }]).quietHours).toEqual([23, 5]);
    expect(parseFlags("oops")).toEqual(DEFAULT_FLAGS);
    expect(parseFlags([null, 3, { key: 1 }])).toEqual(DEFAULT_FLAGS);
  });
});

describe("canShowBanner", () => {
  const show = (now: Date, flags = ON, ready = true) => canShowBanner({ placement: "today", now, flags, ready });

  it("quiet hours edges", () => {
    expect(show(at(22, 59))).toBe(true);
    expect(show(at(23, 0))).toBe(false);
    expect(show(at(4, 59))).toBe(false);
    expect(show(at(5, 0))).toBe(true);
  });

  it("a remote [0, 6] window", () => {
    const flags = { ...ON, quietHours: [0, 6] as [number, number] };
    expect(show(at(23, 30), flags)).toBe(true);
    expect(show(at(0, 0), flags)).toBe(false);
    expect(show(at(6, 0), flags)).toBe(true);
  });

  it("null quiet hours shows all day", () => {
    expect(show(at(2, 0), { ...ON, quietHours: null })).toBe(true);
  });

  it("banner needs ads on and SDK ready", () => {
    expect(show(at(12), { ...ON, adsEnabled: false })).toBe(false);
    expect(show(at(12), ON, false)).toBe(false);
    expect(show(at(12))).toBe(true);
  });
});

describe("canOfferRewarded", () => {
  it("rewarded ignores quiet hours but needs rewarded on and ready", () => {
    expect(canOfferRewarded({ flags: ON, ready: true })).toBe(true);
    expect(canOfferRewarded({ flags: { ...ON, rewardedEnabled: false }, ready: true })).toBe(false);
    expect(canOfferRewarded({ flags: ON, ready: false })).toBe(false);
  });
});
