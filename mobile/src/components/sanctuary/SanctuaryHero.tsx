import { mixMatches, PRESET_MIXES } from "@mindcocoon/core/audio/mixes";
import { partOfDay } from "@mindcocoon/core/dates";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ken } from "@/components/art/Ken";
import { Scene } from "@/components/art/Scene";
import { Sky } from "@/components/art/Sky";
import { useI18n } from "@/i18n/i18n";
import { useAudio } from "@/lib/audio";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { SCENE_OF } from "./MixCard";

/** The picture at the top: the scene of the ready-made mix that is on, else the sky with Kén. */
export function SanctuaryHero({ now }: { now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const { playing, held, volumes } = useAudio();
  const sounding = playing.length > 0 ? playing : held;
  const preset = PRESET_MIXES.find((p) => mixMatches(p.mix, sounding, volumes));
  const part = partOfDay(now);
  const caption = preset
    ? `${t.sanctuary.nowPlaying}: ${t.sanctuary.presets[preset.id]}`
    : sounding.length > 0
      ? `${t.sanctuary.nowPlaying}: ${sounding.map((id) => t.sounds[id as keyof typeof t.sounds]).join(" + ")}`
      : t.sanctuary.nothingPlaying;
  return (
    <View style={styles.wrap}>
      {preset ? (
        <Animated.View key={preset.id} entering={FadeIn.duration(500)} testID={`sanctuary-hero-${SCENE_OF[preset.id]}`} style={styles.picture}>
          <Scene kind={SCENE_OF[preset.id]} height={150} />
        </Animated.View>
      ) : (
        <View>
          <Sky part={part} height={140} />
          <View style={styles.ken}>
            <Ken mood={part === "night" ? "sleepy" : "calm"} size={52} />
          </View>
        </View>
      )}
      <Text accessibilityLiveRegion="polite" style={[styles.caption, { color: sounding.length > 0 ? c.foreground : c.mutedForeground }]}>
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  picture: { borderRadius: radius.xl, overflow: "hidden" },
  ken: { position: "absolute", right: space.xl, bottom: -space.sm },
  caption: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23 },
});
