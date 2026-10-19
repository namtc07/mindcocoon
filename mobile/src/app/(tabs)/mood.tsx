import type { DayCell } from "@mindcocoon/core/mood/selectors";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AdBanner } from "@/components/ads/AdBanner";
import { Screen } from "@/components/Screen";
import { CheckinForm } from "@/components/mood/CheckinForm";
import { DayDetail } from "@/components/mood/DayDetail";
import { GentleInsights } from "@/components/mood/GentleInsights";
import { JourneyCard } from "@/components/mood/JourneyCard";
import { MonthHeatmap } from "@/components/mood/MonthHeatmap";
import { MoodHistory } from "@/components/mood/MoodHistory";
import { WeekStrip } from "@/components/mood/WeekStrip";
import { YearPixels } from "@/components/mood/YearPixels";
import { Chip } from "@/components/ui/Chip";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export default function MoodScreen() {
  const { t } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const { logs } = useMoodLogs();
  const [selected, setSelected] = useState<DayCell | null>(null);
  const [view, setView] = useState<"month" | "year">("month");
  return (
    <Screen title={t.moodPage.title}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground }}>{t.moodPage.intro}</Text>
      <View style={styles.sections}>
        <View testID="mood-checkin">
          <CheckinForm />
        </View>
        <GentleInsights />
        <View testID="mood-week">
          <WeekStrip logs={logs} now={now} />
        </View>
        <View testID="mood-calendar" style={styles.view}>
          <View style={styles.toggle}>
            <Chip selected={view === "month"} onPress={() => setView("month")}>
              {t.moodPage.viewMonth}
            </Chip>
            <Chip selected={view === "year"} onPress={() => setView("year")}>
              {t.moodPage.viewYear}
            </Chip>
          </View>
          {view === "month" ? <MonthHeatmap logs={logs} now={now} onSelect={setSelected} /> : <YearPixels logs={logs} now={now} />}
          <JourneyCard logs={logs} now={now} />
        </View>
        <View testID="mood-history">
          <MoodHistory logs={logs} />
        </View>
      </View>
      <DayDetail day={selected} logs={logs} onClose={() => setSelected(null)} />
      <AdBanner placement="mood" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl, marginTop: space.xl },
  view: { gap: space.md },
  toggle: { flexDirection: "row", gap: space.sm },
});
