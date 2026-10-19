import { useSyncExternalStore } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { stopReleaseSound } from "@/lib/release-sound";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

type BoolPref = "releaseSound" | "nightDim" | "writingPrompts" | "voiceGuide";

/** A Settings row with a switch for an on-by-default preference. */
function PrefSwitch({ pref, label, defaultOn = true }: { pref: BoolPref; label: string; defaultOn?: boolean }) {
  const { c } = useTheme();
  const read = () => (defaultOn ? getPref(pref) !== false : getPref(pref) === true);
  const enabled = useSyncExternalStore(subscribePrefs, read, read);
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={enabled}
        onValueChange={(v) => {
          if (pref === "releaseSound" && !v) stopReleaseSound();
          void setPref(pref, v);
        }}
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

/** Off by default: the phone's voice reads breathing phases and practice steps. */
export function VoiceGuideSetting() {
  const { t } = useI18n();
  return <PrefSwitch pref="voiceGuide" label={t.settings.voiceGuide} defaultOn={false} />;
}

/** On by default: a small writing idea on Today. */
export function WritingPromptsSetting() {
  const { t } = useI18n();
  return <PrefSwitch pref="writingPrompts" label={t.settings.writingPrompts} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  label: { fontFamily: fonts.sans, fontSize: 15, flex: 1 },
});
