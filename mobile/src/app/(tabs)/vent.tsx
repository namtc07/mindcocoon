import { Muted, Screen } from "@/components/Screen";
import { useI18n } from "@/i18n/i18n";

/** Vent — placeholder until M3/M4. */
export default function VentScreen() {
  const { t } = useI18n();
  return (
    <Screen title={t.nav.vent}>
      <Muted>{t.vent.placeholder}</Muted>
    </Screen>
  );
}
