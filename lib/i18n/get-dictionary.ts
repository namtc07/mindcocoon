import type { Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { vi } from "./dictionaries/vi";

const DICTIONARIES: Record<Locale, Dictionary> = { en, vi };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
