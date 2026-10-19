import { useSyncExternalStore } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

type BoolPref = "releaseSound" | "nightDim";

/** A Settings row with a switch for an on-by-default preference. */
function PrefSwitch({ pref, label }: { pref: BoolPref; label: string }) {
  const { c } = useTheme();
  const read = () => getPref(pref) !== false;
  const enabled = useSyncExternalStore(subscribePrefs, read, read);
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={enabled}
        onValueChange={(v) => void setPref(pref, v)}
        trackColor={{ true: c.primary, false: c.muted }}
      />
    </View>
  );
}

/** On by default: a short sound when letting go in Vent. */
export function ReleaseSoundSetting() {
  const { t } = useI18n();
  return <PrefSwitch pref="releaseSound" label={t.settings.releaseSound} />;
}

/** On by default: softer midnight colours from 22:00 to 06:00. */
export function NightDimSetting() {
  const { t } = useI18n();
  return <PrefSwitch pref="nightDim" label={t.settings.nightDim} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  label: { fontFamily: fonts.sans, fontSize: 15, flex: 1 },
});
