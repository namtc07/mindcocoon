import * as Clipboard from "expo-clipboard";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Shows the 12 words once. Closing requires confirming they were saved. */
export function RecoveryCodeCard({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const words = code?.split(" ") ?? [];

  function close() {
    setSaved(false);
    setCopied(false);
    onClose();
  }

  return (
    <Sheet visible={code !== null} onClose={() => saved && close()} title={t.vault.recoveryTitle} dismissable={saved}>
      <Text style={[styles.body, { color: c.mutedForeground }]}>{t.vault.recoveryBody}</Text>
      <View style={[styles.grid, { backgroundColor: c.surface }]}>
        {words.map((word, i) => (
          <View key={i} style={styles.word}>
            <Text style={[styles.n, { color: c.mutedForeground }]}>{i + 1}</Text>
            <Text testID="recovery-word" selectable style={[styles.w, { color: c.foreground }]}>
              {word}
            </Text>
          </View>
        ))}
      </View>
      <Button
        variant="outline"
        onPress={async () => {
          if (code) setCopied(await Clipboard.setStringAsync(code));
        }}
      >
        {copied ? t.vault.copied : t.vault.copy}
      </Button>
      <Text style={[styles.body, { color: c.ember }]}>{t.vault.recoveryWarning}</Text>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={t.vault.savedIt}
        accessibilityState={{ checked: saved }}
        onPress={() => setSaved((s) => !s)}
        style={styles.check}
      >
        <View style={[styles.box, { borderColor: saved ? c.primary : c.border, backgroundColor: saved ? c.primary : "transparent" }]}>
          {saved && <Check size={14} color={c.primaryForeground} />}
        </View>
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.foreground }}>{t.vault.savedIt}</Text>
      </Pressable>
      <Button onPress={close} disabled={!saved}>
        {t.vault.done}
      </Button>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
  grid: { flexDirection: "row", flexWrap: "wrap", borderRadius: radius.md, padding: space.md, rowGap: space.sm },
  word: { width: "50%", flexDirection: "row", gap: space.sm },
  n: { width: 20, textAlign: "right", fontFamily: "Menlo", fontSize: 13 },
  w: { fontFamily: "Menlo", fontSize: 15 },
  check: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 44 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
