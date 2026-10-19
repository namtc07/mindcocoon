import { useSyncExternalStore } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

const on = () => getPref("releaseSound") !== false;

/** On by default: a short sound when letting go in Vent. */
export function ReleaseSoundSetting() {
  const { t } = useI18n();
  const { c } = useTheme();
  const enabled = useSyncExternalStore(subscribePrefs, on, on);
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.foreground }]}>{t.settings.releaseSound}</Text>
      <Switch
        accessibilityLabel={t.settings.releaseSound}
        value={enabled}
        onValueChange={(v) => void setPref("releaseSound", v)}
        trackColor={{ true: c.primary, false: c.muted }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  label: { fontFamily: fonts.sans, fontSize: 15, flex: 1 },
});
