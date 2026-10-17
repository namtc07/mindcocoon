import { router } from "expo-router";
import { HeartHandshake } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

let shownThisSession = false;

/** True the first time per app session; the card never nags twice. */
export function claimGentleCard(): boolean {
  if (shownThisSession) return false;
  shownThisSession = true;
  return true;
}

export function __resetGentleCardForTests() {
  shownThisSession = false;
}

/** Shown before releasing or saving words that suggest risk. Never blocks, never stores. */
export function GentleCard({
  visible,
  continueLabel,
  onContinue,
  onClose,
  onDismissed,
}: {
  visible: boolean;
  continueLabel: string;
  onContinue: () => void;
  onClose: () => void;
  onDismissed?: () => void;
}) {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={t.safety.helpTitle} onDismissed={onDismissed}>
      <View style={styles.body}>
        <HeartHandshake size={30} color={c.primary} />
        <Text style={[styles.message, { color: c.foreground }]}>{t.safety.cardMessage}</Text>
        <Button
          onPress={() => {
            onClose();
            router.push("/help");
          }}
        >
          {t.safety.callLine}
        </Button>
        <Button variant="ghost" onPress={onContinue}>
          {continueLabel}
        </Button>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  message: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 31 },
});
