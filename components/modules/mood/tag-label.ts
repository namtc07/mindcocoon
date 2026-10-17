import type { Dictionary } from "@mindcocoon/core/i18n/get-dictionary";
import { isDefaultTag } from "@mindcocoon/core/moods";

/** Built-in tags are stored as keys and translated; custom tags show as typed. */
export function tagLabel(t: Dictionary, tag: string) {
  return isDefaultTag(tag) ? t.mood.tags[tag] : tag;
}
