import { useEffect } from "react";
import { useI18n } from "@/i18n/i18n";
import { audio } from "@/lib/audio";

/** Keeps the lock-screen title ("Rain + Ocean") in the app's language. Renders nothing. */
export function AudioLabelsSync() {
  const { t } = useI18n();
  useEffect(() => {
    audio.setLabels({ names: t.sounds, album: t.sanctuary.title });
  }, [t]);
  return null;
}
