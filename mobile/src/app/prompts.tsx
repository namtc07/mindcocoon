import { PROMPT_THEME_OF, PROMPT_THEMES, REFLECTION_PROMPTS, type PromptTheme } from "@mindcocoon/core/prompts";
import { router } from "expo-router";
import { Shuffle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const write = (index: number) => router.push({ pathname: "/vent", params: { promptIndex: String(index) } });

/** Every reflection prompt; tap one to write about it in Vent. Ad-free. */
export default function PromptsScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const [theme, setTheme] = useState<PromptTheme | null>(null);
  const shown = REFLECTION_PROMPTS[locale].map((prompt, i) => ({ prompt, i })).filter(({ i }) => !theme || PROMPT_THEME_OF[i] === theme);
  return (
    <>
      <StackHeader />
      <Screen title={t.prompts.title}>
        <Muted>{t.prompts.intro}</Muted>
        <View style={styles.surprise}>
          <Button variant="outline" onPress={() => write(shown[Math.floor(Math.random() * shown.length)]?.i ?? 0)}>
            {t.prompts.surprise}
          </Button>
          <Shuffle size={16} color={c.mutedForeground} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themes}>
          <Chip selected={theme === null} onPress={() => setTheme(null)}>
            {t.prompts.all}
          </Chip>
          {PROMPT_THEMES.map((id) => (
            <Chip key={id} selected={theme === id} onPress={() => setTheme(id)}>
              {t.prompts.themes[id]}
            </Chip>
          ))}
        </ScrollView>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          {shown.map(({ prompt, i }, n) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={t.prompts.write.replace("{prompt}", prompt)}
              onPress={() => write(i)}
              style={[styles.row, n > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
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
  themes: { gap: space.sm, paddingRight: space.lg },
  surprise: { flexDirection: "row", alignItems: "center", gap: space.md },
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg },
  row: { paddingVertical: space.lg, minHeight: 44 },
});
