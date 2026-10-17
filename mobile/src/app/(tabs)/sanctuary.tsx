import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View, type LayoutChangeEvent, type ScrollViewInstance } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { BoxBreathing } from "@/components/sanctuary/BoxBreathing";
import { SleepTimer } from "@/components/sanctuary/SleepTimer";
import { SoundMixer } from "@/components/sanctuary/SoundMixer";
import { TonightCard } from "@/components/sanctuary/TonightCard";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { space } from "@/theme/tokens";

type Section = "breathe" | "tonight";

/** Sanctuary: breathe for a minute, tonight's music, ambient sounds, sleep timer. No ads, ever. */
export default function SanctuaryScreen() {
  const { t } = useI18n();
  const now = useNow();
  const { section } = useLocalSearchParams<{ section?: Section }>();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [offsets, setOffsets] = useState<Partial<Record<Section, number>>>({});

  // Links from Today ("Breathe for a minute", "Tonight's music") land on their section.
  useEffect(() => {
    if (!section) return;
    const y = offsets[section];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - space.lg), animated: true });
    router.setParams({ section: undefined });
  }, [section, offsets]);

  const measure = (name: Section) => (e: LayoutChangeEvent) => {
    const { y } = e.nativeEvent.layout;
    setOffsets((o) => (o[name] === y ? o : { ...o, [name]: y }));
  };

  return (
    <Screen title={t.sanctuary.title} scrollRef={scrollRef}>
      <Muted>{t.sanctuary.intro}</Muted>
      {/* Sections are direct children of the scroll content so their layout y is a scroll offset. */}
      <View testID="section-breathe" onLayout={measure("breathe")} style={{ marginTop: space.lg }}>
        <BoxBreathing />
      </View>
      <View testID="section-tonight" onLayout={measure("tonight")} style={{ marginTop: space.xl }}>
        <TonightCard now={now} />
      </View>
      <View style={{ marginTop: space.xl }}>
        <SoundMixer />
      </View>
      <View style={{ marginTop: space.xl }}>
        <SleepTimer />
      </View>
    </Screen>
  );
}
