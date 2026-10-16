import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { isDefaultTag } from "@/lib/moods";

/** Built-in tags are stored as keys and translated; custom tags show as typed. */
export function tagLabel(t: Dictionary, tag: string) {
  return isDefaultTag(tag) ? t.mood.tags[tag] : tag;
}
