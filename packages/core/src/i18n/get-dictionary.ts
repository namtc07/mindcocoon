import type { Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { id } from "./dictionaries/id";
import { vi } from "./dictionaries/vi";

const DICTIONARIES: Record<Locale, Dictionary> = { en, vi, id };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
