import { DEFAULT_LOCALE, isLocale, type Locale } from "@mindcocoon/core/i18n/config";
import { getLocales } from "expo-localization";
import { getPref, setPref } from "../lib/prefs";

export { loadPrefs } from "../lib/prefs";

/** First device language we support (vi/en), else English. */
export function deviceLocale(locales: { languageCode: string | null }[] = getLocales()): Locale {
  for (const { languageCode } of locales) {
    if (isLocale(languageCode)) return languageCode;
  }
  return DEFAULT_LOCALE;
}

/** The person's explicit choice wins over the device language. */
export function currentLocale(): Locale {
  return getPref("locale") ?? deviceLocale();
}

export function setLocale(locale: Locale) {
  return setPref("locale", locale);
}
