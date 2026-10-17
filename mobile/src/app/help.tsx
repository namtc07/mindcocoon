import { Muted, Screen } from "@/components/Screen";
import { useI18n } from "@/i18n/i18n";

/** Support lines — filled in by M3 Task 7. */
export default function HelpScreen() {
  const { t } = useI18n();
  return (
    <Screen title={t.safety.helpTitle}>
      <Muted>{t.safety.helpIntro}</Muted>
    </Screen>
  );
}
