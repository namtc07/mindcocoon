import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ScreenActive } from "@/components/art/activity";
import { PracticeList } from "@/components/practices/PracticeList";
import { BoxBreathing } from "@/components/sanctuary/BoxBreathing";
import { SanctuaryHero } from "@/components/sanctuary/SanctuaryHero";
import { StoryList } from "@/components/sanctuary/StoryList";
import { SleepTimer } from "@/components/sanctuary/SleepTimer";
import { SoundMixer } from "@/components/sanctuary/SoundMixer";
import { TonightCard } from "@/components/sanctuary/TonightCard";
import { Screen } from "@/components/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

type Part = "sounds" | "breathe" | "practices";
/** Links from Today: "breathe" opens Breathe; "tonight" (Tonight's music) opens Sounds. */
const PART_OF_SECTION: Record<string, Part> = { breathe: "breathe", tonight: "sounds" };
const readPart = (): Part => getPref("sanctuaryTab") ?? "sounds";

/**
 * Sanctuary: a picture of what is playing, then three parts — Sounds, Breathe, Practices — instead
 * of one long scroll. The last part opened is remembered. No ads, ever.
 */
export default function SanctuaryScreen() {
  const { t } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const remembered = useSyncExternalStore(subscribePrefs, readPart, readPart);
  const linked = section ? PART_OF_SECTION[section] : undefined;
  const part = linked ?? remembered;

  // A link from Today opens its part (and it becomes the remembered one); the param is then cleared.
  useEffect(() => {
    if (!section) return;
    const target = PART_OF_SECTION[section];
    if (target) void setPref("sanctuaryTab", target);
    router.setParams({ section: undefined });
  }, [section]);

  const choose = (next: Part) => void setPref("sanctuaryTab", next);

  return (
    <ScreenActive>
      <Screen title={t.sanctuary.title} hero={<SanctuaryHero now={now} />}>
        <View style={styles.tabs}>
          <Segmented
            label={t.sanctuary.partsLabel}
            value={part}
            onChange={choose}
            options={[
              { id: "sounds", label: t.sanctuary.parts.sounds },
              { id: "breathe", label: t.sanctuary.parts.breathe },
              { id: "practices", label: t.sanctuary.parts.practices },
            ]}
          />
        </View>
        <Animated.View key={part} entering={FadeIn.duration(220)} style={styles.part}>
          {part === "sounds" && (
            <>
              <View testID="section-tonight">
                <TonightCard now={now} />
              </View>
              <SoundMixer />
              <SleepTimer />
            </>
          )}
          {part === "breathe" && (
            <View testID="section-breathe">
              <BoxBreathing />
            </View>
          )}
          {part === "practices" && (
            <View style={{ gap: space.md }}>
              <Text accessibilityRole="header" style={{ fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, color: c.foreground }}>
                {t.practices.title}
              </Text>
              <PracticeList />
              <Text accessibilityRole="header" style={{ fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, color: c.foreground, marginTop: space.lg }}>
                {t.stories.title}
              </Text>
              <StoryList />
            </View>
          )}
        </Animated.View>
      </Screen>
    </ScreenActive>
  );
}

const styles = StyleSheet.create({
  tabs: { marginTop: space.sm },
  part: { gap: space.xl, marginTop: space.lg },
});
