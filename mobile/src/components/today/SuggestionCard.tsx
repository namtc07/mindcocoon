import { dayKey, dayKeyFromISO } from "@mindcocoon/core/dates";
import { suggestionFor } from "@mindcocoon/core/feelings";
import { getPractice } from "@mindcocoon/core/practices";
import { Flower2, Music2, Wind, type LucideIcon } from "lucide-react-native";
import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { toast } from "@/components/ui/Toast";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { openPractice, openSuggestedBreathing, playPreset } from "@/lib/suggest-actions";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const hiddenOn = () => getPref("suggestHiddenOn") ?? null;

function Row({ Icon, kind, name, onPress, first }: { Icon: LucideIcon; kind: string; name: string; onPress: () => void; first?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kind}: ${name}`}
      onPress={onPress}
      style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
    >
      <Icon size={18} color={c.mutedForeground} />
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground, width: 44 }}>{kind}</Text>
      <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 16, color: c.foreground }}>{name}</Text>
    </Pressable>
  );
}

/** After today's check-in: one breath, one mix, one practice that fit the feeling. An offer, easy to dismiss. */
export function SuggestionCard({ now }: { now: Date }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const { logs } = useMoodLogs();
  const hidden = useSyncExternalStore(subscribePrefs, hiddenOn, hiddenOn);
  const today = dayKey(now);
  const log = logs.find((l) => dayKeyFromISO(l.createdAt) === today);
  if (!log || hidden === today) return null;

  const s = suggestionFor(log.mood);
  const breathName = `${t.sanctuary.patterns[s.breath.pattern]} · ${t.sanctuary.minutes.replace("{n}", String(s.breath.minutes))}`;
  const mixName = t.sanctuary.presets[s.mix];
  const practice = getPractice(locale, s.practice);

  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.serif, fontSize: 20, color: c.foreground, flex: 1 }}>
          {t.suggest.title}
        </Text>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={() => void setPref("suggestHiddenOn", today)} style={styles.notNow}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>{t.suggest.notNow}</Text>
        </Pressable>
      </View>
      <Row first Icon={Wind} kind={t.suggest.breathe} name={breathName} onPress={() => void openSuggestedBreathing(s.breath)} />
      <Row
        Icon={Music2}
        kind={t.suggest.listen}
        name={mixName}
        onPress={() =>
          void playPreset(s.mix)
            .then(() => toast.show(t.suggest.playing.replace("{name}", mixName)))
            .catch(() => toast.show(t.sanctuary.playError))
        }
      />
      {practice && <Row Icon={Flower2} kind={t.suggest.try} name={practice.title} onPress={() => openPractice(practice.id)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg, paddingTop: space.lg },
  head: { flexDirection: "row", alignItems: "center", gap: space.md, paddingBottom: space.sm },
  notNow: { minHeight: 44, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52, paddingVertical: space.md },
});
