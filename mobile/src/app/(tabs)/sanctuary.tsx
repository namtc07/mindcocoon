import { View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { SleepTimer } from "@/components/sanctuary/SleepTimer";
import { SoundMixer } from "@/components/sanctuary/SoundMixer";
import { TonightCard } from "@/components/sanctuary/TonightCard";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { space } from "@/theme/tokens";

/** Sanctuary: breathe for a minute, tonight's music, ambient sounds, sleep timer. No ads, ever. */
export default function SanctuaryScreen() {
  const { t } = useI18n();
  const now = useNow();
  return (
    <Screen title={t.sanctuary.title}>
      <Muted>{t.sanctuary.intro}</Muted>
      <View style={{ gap: space.xxl, marginTop: space.lg }}>
        <View testID="section-breathe" />
        <View testID="section-tonight">
          <TonightCard now={now} />
        </View>
        <SoundMixer />
        <SleepTimer />
      </View>
    </Screen>
  );
}
