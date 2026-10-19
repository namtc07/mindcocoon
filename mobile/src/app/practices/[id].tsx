import { getPractice, type Practice } from "@mindcocoon/core/practices";
import { useRemoteContent } from "@/lib/remote-content";
import { Redirect, useLocalSearchParams } from "expo-router";
import { PracticeRunner } from "@/components/practices/PracticeRunner";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { useI18n } from "@/i18n/i18n";

/** One practice, step by step. Ad-free. */
export default function PracticeScreen() {
  const { locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const extra = useRemoteContent().practices[locale];
  const practice = getPractice(locale, id ?? "") ?? (extra.find((p) => p.id === id) as Practice | undefined);
  if (!practice) return <Redirect href="/practices" />;
  return (
    <>
      <StackHeader />
      <Screen title={practice.title}>
        <PracticeRunner practice={practice} />
      </Screen>
    </>
  );
}
