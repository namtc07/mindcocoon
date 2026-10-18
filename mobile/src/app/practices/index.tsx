import { PracticeList } from "@/components/practices/PracticeList";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { useI18n } from "@/i18n/i18n";

/** Gentle practices: an ad-free list of short evening exercises. */
export default function PracticesScreen() {
  const { t } = useI18n();
  return (
    <>
      <StackHeader />
      <Screen title={t.practices.title}>
        <Muted>{t.practices.intro}</Muted>
        <PracticeList />
      </Screen>
    </>
  );
}
