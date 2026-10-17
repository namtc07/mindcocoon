import { useState, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import { useI18n } from "@/i18n/i18n";
import { getPref, subscribePrefs } from "@/lib/prefs";
import { REMINDER_HOURS, setReminder, type ReminderHour } from "@/lib/reminder";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const savedHour = () => getPref("reminder")?.hour ?? null;

export function ReminderSettings() {
  const { t } = useI18n();
  const { c } = useTheme();
  const hour = useSyncExternalStore(subscribePrefs, savedHour, savedHour);
  const [denied, setDenied] = useState(false);

  async function choose(next: ReminderHour | null) {
    const result = await setReminder(next, t);
    setDenied(result === "denied");
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.hint, { color: c.mutedForeground }]}>{t.settings.reminderHint}</Text>
      <View style={styles.chips}>
        <Chip selected={hour === null} onPress={() => void choose(null)}>
          {t.settings.reminderOff}
        </Chip>
        {REMINDER_HOURS.map((h) => (
          <Chip key={h} selected={hour === h} onPress={() => void choose(h)}>
            {`${h}:00`}
          </Chip>
        ))}
      </View>
      {denied && (
        <Text accessibilityLiveRegion="polite" style={[styles.hint, { color: c.foreground }]}>
          {t.settings.reminderDenied}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  hint: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
});
