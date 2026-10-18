import { PROMPT_COUNT, REFLECTION_PROMPTS } from "@mindcocoon/core/prompts";
import { router } from "expo-router";
import { Shuffle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const write = (index: number) => router.push({ pathname: "/vent", params: { promptIndex: String(index) } });

/** Every reflection prompt; tap one to write about it in Vent. Ad-free. */
export default function PromptsScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  return (
    <>
      <StackHeader />
      <Screen title={t.prompts.title}>
        <Muted>{t.prompts.intro}</Muted>
        <View style={styles.surprise}>
          <Button variant="outline" onPress={() => write(Math.floor(Math.random() * PROMPT_COUNT))}>
            {t.prompts.surprise}
          </Button>
          <Shuffle size={16} color={c.mutedForeground} />
        </View>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          {REFLECTION_PROMPTS[locale].map((prompt, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={t.prompts.write.replace("{prompt}", prompt)}
              onPress={() => write(i)}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
            >
              <Text style={{ fontFamily: fonts.serif, fontSize: 19, lineHeight: 26, color: c.foreground }}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  surprise: { flexDirection: "row", alignItems: "center", gap: space.md },
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg },
  row: { paddingVertical: space.lg, minHeight: 44 },
});
