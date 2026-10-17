import { usePathname } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** Shown once, on first launch; never over the help screen. */
export function FirstRunNotice() {
  const { t } = useI18n();
  const { c } = useTheme();
  const pathname = usePathname();
  const [seen, setSeen] = useState(() => getPref("firstRunSeen") === true);
  const dismiss = () => {
    setSeen(true);
    void setPref("firstRunSeen", true);
  };
  return (
    <Sheet visible={!seen && pathname !== "/help"} onClose={dismiss} title={t.settings.firstRunTitle}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, color: c.foreground }}>{t.settings.firstRunBody}</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: c.mutedForeground }}>{t.settings.disclaimer}</Text>
      <Button onPress={dismiss}>{t.settings.firstRunOk}</Button>
    </Sheet>
  );
}
