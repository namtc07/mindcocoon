import { FEELINGS, MAX_FEELINGS } from "@mindcocoon/core/feelings";
import type { MoodType } from "@mindcocoon/core/types";
import { StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** "More precisely?" — up to three words under the chosen mood. Extra taps beyond three are ignored. */
export function FeelingChips({ mood, value, onChange }: { mood: MoodType; value: string[]; onChange: (next: string[]) => void }) {
  const { t } = useI18n();
  const { c } = useTheme();
  function toggle(word: string) {
    if (value.includes(word)) onChange(value.filter((w) => w !== word));
    else if (value.length < MAX_FEELINGS) onChange([...value, word]);
  }
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{t.feelings.prompt}</Text>
      <View style={styles.row}>
        {FEELINGS[mood].map((word) => (
          <Chip key={word} selected={value.includes(word)} disabled={!value.includes(word) && value.length >= MAX_FEELINGS} onPress={() => toggle(word)}>
            {t.feelings.words[word as keyof typeof t.feelings.words]}
          </Chip>
        ))}
      </View>
    </View>
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
});
