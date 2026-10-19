import { dayKeyFromISO } from "@mindcocoon/core/dates";
import { monthGrid } from "@mindcocoon/core/mood/selectors";
import type { MoodLog } from "@mindcocoon/core/types";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import { StyleSheet, Text, View, type HostInstance } from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";
import { useFeelingLabels } from "@/components/mood/FeelingChips";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const CELL = 30;
const TOP_WORDS = 5;

/** The month's most-picked feeling words, most frequent first (counts never shown). */
function topFeelings(logs: MoodLog[], year: number, month: number): string[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const counts = new Map<string, number>();
  for (const l of logs) {
    if (!dayKeyFromISO(l.createdAt).startsWith(prefix)) continue;
    for (const w of l.feelings ?? []) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_WORDS).map(([w]) => w);
}

/**
 * "Keep a picture of this month": a card of mood colours and feeling words (no notes, no numbers),
 * captured to an image only when the person taps Save or share. The temporary file is released after.
 */
export function JourneyCard({ logs, now }: { logs: MoodLog[]; now: Date }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const feelingLabels = useFeelingLabels();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const card = useRef<HostInstance>(null);
  const year = now.getFullYear();
  const month = now.getMonth();
  const cells = monthGrid(logs, year, month);
  const words = topFeelings(logs, year, month);
  const title = new Date(year, month, 1).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "long", year: "numeric" });

  async function share() {
    setBusy(true);
    let uri: string | null = null;
    try {
      uri = await captureRef(card, { format: "png", quality: 1, result: "tmpfile" });
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch {
      toast.show(t.vault.unavailable);
    } finally {
      if (uri) releaseCapture(uri);
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" onPress={() => setOpen(true)}>
        {t.moodPage.journeyButton}
      </Button>
      <Sheet visible={open} onClose={() => setOpen(false)} title={t.moodPage.journeyTitle}>
        <View ref={card} collapsable={false} testID="journey-card" style={[styles.card, { backgroundColor: c.background, borderColor: c.border }]}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 24, color: c.foreground }}>{title}</Text>
          <View style={styles.grid}>
            {cells.map((cell, i) => (
              <View
                key={cell?.dayKey ?? `pad-${i}`}
                style={[styles.cell, { backgroundColor: cell ? (cell.log ? c.mood[cell.log.mood] : c.muted) : "transparent" }]}
              />
            ))}
          </View>
          {words.length > 0 && <Text style={{ fontFamily: fonts.serifItalic, fontSize: 18, color: c.foreground }}>{feelingLabels(words)}</Text>}
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>MindCocoon</Text>
        </View>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>{t.moodPage.journeyHint}</Text>
        <Button disabled={busy} onPress={() => void share()}>
          {t.moodPage.journeyShare}
        </Button>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.xl, gap: space.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4, width: CELL * 7 + 4 * 6 },
  cell: { width: CELL, height: CELL, borderRadius: 6 },
});
