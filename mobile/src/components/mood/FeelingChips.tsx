import { FEELINGS, MAX_FEELINGS } from "@mindcocoon/core/feelings";
import type { MoodType } from "@mindcocoon/core/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { readableFill } from "@/theme/contrast";
import { useTheme } from "@/theme/theme";

/** "More precisely?" — up to three words under the chosen mood, as tiles in the mood's colour. Extra taps beyond three are ignored. */
export function FeelingChips({ mood, value, onChange }: { mood: MoodType; value: string[]; onChange: (next: string[]) => void }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const tint = c.mood[mood];
  const fill = readableFill(tint);
  function toggle(word: string) {
    if (value.includes(word)) onChange(value.filter((w) => w !== word));
    else if (value.length < MAX_FEELINGS) onChange([...value, word]);
  }
  return (
    // Fades in after a mood lands on the arc, instead of popping in.
    <Animated.View entering={FadeIn.duration(240)} style={styles.wrap}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{t.feelings.prompt}</Text>
      <View style={styles.row}>
        {FEELINGS[mood].map((word) => {
          const selected = value.includes(word);
          const disabled = !selected && value.length >= MAX_FEELINGS;
          return (
            <Pressable
              key={word}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              hitSlop={4}
              onPress={() => toggle(word)}
              style={[
                styles.tile,
                { borderColor: tint, backgroundColor: selected ? fill.background : "transparent", opacity: disabled ? 0.45 : 1 },
              ]}
            >
              <Text style={[styles.word, { color: selected ? fill.ink : c.foreground }]}>
                {t.feelings.words[word as keyof typeof t.feelings.words]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

/** "lonely, sad" in the app's language. */
export function useFeelingLabels() {
  const { t } = useI18n();
  return (words: string[] | undefined) => (words ?? []).map((w) => t.feelings.words[w as keyof typeof t.feelings.words] ?? w).join(", ");
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { fontFamily: fonts.sans, fontSize: 15 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tile: { minHeight: 40, justifyContent: "center", borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: space.md },
  word: { fontFamily: fonts.sans, fontSize: 15 },
});
