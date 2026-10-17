import type { Locale } from "@mindcocoon/core/i18n/config";
import { getDictionary, type Dictionary } from "@mindcocoon/core/i18n/get-dictionary";
import { useSyncExternalStore } from "react";
import { subscribePrefs } from "../lib/prefs";
import { currentLocale, setLocale } from "./locale";

/** Same dictionaries as the web app; locale from the saved choice or the device. */
export function useI18n(): { locale: Locale; t: Dictionary; setLocale: (l: Locale) => Promise<void> } {
  const locale = useSyncExternalStore(subscribePrefs, currentLocale, currentLocale);
  return { locale, t: getDictionary(locale), setLocale };
}
