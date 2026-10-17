import { describe, expect, it } from "vitest";
import { canShowAd, isQuietHour, parseAdsConfig, type AdsConfig } from "@mindcocoon/core/ads/config";

const at = (h: number, m = 0) => new Date(2026, 9, 16, h, m);

describe("isQuietHour", () => {
  it("handles a range across midnight", () => {
    expect(isQuietHour(at(23), [23, 5])).toBe(true);
    expect(isQuietHour(at(4, 59), [23, 5])).toBe(true);
    expect(isQuietHour(at(5), [23, 5])).toBe(false);
    expect(isQuietHour(at(22, 59), [23, 5])).toBe(false);
  });

  it("handles a same-day range", () => {
    expect(isQuietHour(at(2), [1, 3])).toBe(true);
    expect(isQuietHour(at(3), [1, 3])).toBe(false);
  });

  it("is never quiet without a range", () => {
    expect(isQuietHour(at(23), null)).toBe(false);
  });
});

describe("parseAdsConfig", () => {
  it("is off unless explicitly enabled", () => {
    expect(parseAdsConfig({}).enabled).toBe(false);
    expect(parseAdsConfig({ NEXT_PUBLIC_ADS_ENABLED: "true" }).enabled).toBe(true);
  });

  it("parses quiet hours and rejects nonsense", () => {
    expect(parseAdsConfig({ NEXT_PUBLIC_QUIET_HOURS: "23-5" }).quietHours).toEqual([23, 5]);
    expect(parseAdsConfig({ NEXT_PUBLIC_QUIET_HOURS: "" }).quietHours).toBeNull();
    expect(parseAdsConfig({ NEXT_PUBLIC_QUIET_HOURS: "25-x" }).quietHours).toBeNull();
  });
});

describe("canShowAd", () => {
  const config: AdsConfig = { enabled: true, client: "ca-pub-1", slots: { today: "1" }, quietHours: [23, 5] };

  it("shows a configured slot outside quiet hours", () => {
    expect(canShowAd({ placement: "today", now: at(14), config })).toBe(true);
  });

  it("hides when disabled, unconfigured or quiet", () => {
    expect(canShowAd({ placement: "today", now: at(14), config: { ...config, enabled: false } })).toBe(false);
    expect(canShowAd({ placement: "mood", now: at(14), config })).toBe(false);
    expect(canShowAd({ placement: "today", now: at(14), config: { ...config, client: undefined } })).toBe(false);
    expect(canShowAd({ placement: "today", now: at(23, 30), config })).toBe(false);
  });
});
