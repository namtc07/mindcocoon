import type { Locale } from "@mindcocoon/core/i18n/config";
import * as Speech from "expo-speech";
import { getPref } from "./prefs";

/** BCP 47 tags for the device voices. */
const LANGUAGE: Record<Locale, string> = { vi: "vi-VN", en: "en-US" };

/** The nicest installed voice per language (an "Enhanced" one if the person downloaded it). */
const best = new Map<string, string | undefined>();
async function voiceFor(language: string) {
  if (best.has(language)) return best.get(language);
  const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
  const matching = voices.filter((v) => v.language?.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()));
  const pick = matching.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ?? matching.find((v) => v.language === language);
  best.set(language, pick?.identifier);
  return pick?.identifier;
}
// Warm the cache early so the first words aren't late.
void voiceFor(LANGUAGE.en);
void voiceFor(LANGUAGE.vi);

/** "Voice guidance" in Settings (off unless turned on). */
export const voiceGuideOn = () => getPref("voiceGuide") === true;

/** Says `text` in the app's language, calmly; anything still being said is cut off first. */
export function say(text: string, locale: Locale, onDone?: () => void) {
  void Speech.stop();
  const language = LANGUAGE[locale];
  Speech.speak(text, { language, rate: 0.88, pitch: 1, voice: best.get(language), onDone });
}

/** Only when voice guidance is on (breathing phases, practice steps). */
export function guide(text: string, locale: Locale) {
  if (voiceGuideOn()) say(text, locale);
}

export function hush() {
  void Speech.stop();
}
