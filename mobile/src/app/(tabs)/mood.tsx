import { Muted, Screen } from "@/components/Screen";
import { useI18n } from "@/i18n/i18n";

/** Mood — placeholder until M3/M4. */
export default function MoodScreen() {
  const { t } = useI18n();
  return (
    <Screen title={t.nav.mood}>
      <Muted>{t.moodPage.intro}</Muted>
    </Screen>
  );
}
