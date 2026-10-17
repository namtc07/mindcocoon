import { Muted, Screen } from "@/components/Screen";
import { useI18n } from "@/i18n/i18n";

/** Sanctuary — placeholder until M3/M4. */
export default function SanctuaryScreen() {
  const { t } = useI18n();
  return (
    <Screen title={t.nav.sanctuary}>
      <Muted>{t.sanctuary.intro}</Muted>
    </Screen>
  );
}
