import { getLocales } from "expo-localization";

/** The phone's region (ISO 3166-1 alpha-2, e.g. "PH"), or null if the system doesn't say. */
export function deviceRegion(): string | null {
  for (const l of getLocales()) if (l.regionCode) return l.regionCode.toUpperCase();
  return null;
}
