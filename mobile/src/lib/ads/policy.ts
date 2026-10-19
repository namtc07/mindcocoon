import { isQuietHour } from "@mindcocoon/core/ads/config";

/**
 * When ads may appear. Banners live only on Today and Mood (the ad-free zones are
 * enforced by where <AdBanner/> is placed); rewarded ads are user-initiated, so
 * quiet hours don't apply to them.
 */

export type AdPlacement = "today" | "mood";

export interface RemoteFlags {
  adsEnabled: boolean;
  rewardedEnabled: boolean;
  /** [startHour, endHour) in local time, may wrap past midnight; null = no quiet hours. */
  quietHours: [number, number] | null;
  /** "Watch one ad, no ads for a while" is offered (on unless set to false). */
  adFreeEnabled?: boolean;
  /** How long that lasts, in whole hours 1–72 (24 unless set). */
  adFreeHours?: number;
}

/** Ads stay off until the remote flag turns them on. */
export const DEFAULT_FLAGS: RemoteFlags = { adsEnabled: false, rewardedEnabled: false, quietHours: [23, 5], adFreeEnabled: true, adFreeHours: 24 };

const isHour = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 23;

function parseQuietHours(value: unknown): RemoteFlags["quietHours"] | undefined {
  // null or an empty list (easy to type in the dashboard): no quiet hours.
  if (value === null || (Array.isArray(value) && value.length === 0)) return null;
  if (Array.isArray(value) && value.length === 2 && isHour(value[0]) && isHour(value[1]) && value[0] !== value[1]) {
    return [value[0], value[1]];
  }
  return undefined;
}

/** Rows from `app_config` ([{ key, value }]); anything malformed falls back to the default for that key. */
export function parseFlags(rows: unknown): RemoteFlags {
  const flags = { ...DEFAULT_FLAGS };
  if (!Array.isArray(rows)) return flags;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { key, value } = row as { key?: unknown; value?: unknown };
    if (key === "ads_enabled" && typeof value === "boolean") flags.adsEnabled = value;
    else if (key === "rewarded_enabled" && typeof value === "boolean") flags.rewardedEnabled = value;
    else if (key === "ad_free_enabled" && typeof value === "boolean") flags.adFreeEnabled = value;
    else if (key === "ad_free_hours" && typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 72) flags.adFreeHours = value;
    else if (key === "quiet_hours") {
      const parsed = parseQuietHours(value);
      if (parsed !== undefined) flags.quietHours = parsed;
    }
  }
  return flags;
}

export function canShowBanner(p: { placement: AdPlacement; now: Date; flags: RemoteFlags; ready: boolean }): boolean {
  return p.flags.adsEnabled && p.ready && !isQuietHour(p.now, p.flags.quietHours);
}

export function canOfferRewarded(p: { flags: RemoteFlags; ready: boolean }): boolean {
  return p.flags.rewardedEnabled && p.ready;
}
