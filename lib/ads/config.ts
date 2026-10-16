/**
 * Ad configuration, read from build-time env vars (change + redeploy to flip).
 * Ads are OFF unless NEXT_PUBLIC_ADS_ENABLED=true, and never personalised.
 */

export type AdPlacement = "today" | "mood";

export interface AdsConfig {
  enabled: boolean;
  client?: string;
  slots: Partial<Record<AdPlacement, string>>;
  /** [startHour, endHour) in the user's local time; may wrap past midnight. */
  quietHours: [number, number] | null;
}

type Env = Partial<Record<string, string | undefined>>;

function parseQuietHours(raw: string | undefined): [number, number] | null {
  const match = raw?.trim().match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (start > 23 || end > 23 || start === end) return null;
  return [start, end];
}

export function parseAdsConfig(env: Env): AdsConfig {
  return {
    enabled: env.NEXT_PUBLIC_ADS_ENABLED === "true",
    client: env.NEXT_PUBLIC_ADSENSE_CLIENT || undefined,
    slots: {
      today: env.NEXT_PUBLIC_ADSENSE_SLOT_TODAY || undefined,
      mood: env.NEXT_PUBLIC_ADSENSE_SLOT_MOOD || undefined,
    },
    quietHours: parseQuietHours(env.NEXT_PUBLIC_QUIET_HOURS),
  };
}

/** Next.js inlines NEXT_PUBLIC_* only when accessed by literal name. */
export function getAdsConfig(): AdsConfig {
  return parseAdsConfig({
    NEXT_PUBLIC_ADS_ENABLED: process.env.NEXT_PUBLIC_ADS_ENABLED,
    NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
    NEXT_PUBLIC_ADSENSE_SLOT_TODAY: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TODAY,
    NEXT_PUBLIC_ADSENSE_SLOT_MOOD: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOOD,
    NEXT_PUBLIC_QUIET_HOURS: process.env.NEXT_PUBLIC_QUIET_HOURS,
  });
}

export function isQuietHour(date: Date, range: [number, number] | null): boolean {
  if (!range) return false;
  const [start, end] = range;
  const h = date.getHours();
  return start < end ? h >= start && h < end : h >= start || h < end;
}

export function canShowAd(p: { placement: AdPlacement; now: Date; config: AdsConfig }): boolean {
  const { config } = p;
  if (!config.enabled || !config.client || !config.slots[p.placement]) return false;
  return !isQuietHour(p.now, config.quietHours);
}
