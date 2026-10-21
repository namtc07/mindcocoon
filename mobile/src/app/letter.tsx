import { dayKey } from "@mindcocoon/core/dates";
import { LOCALE_TAGS } from "@mindcocoon/core/i18n/config";
import { letterWeek, weeklyLetter, type LetterLine } from "@mindcocoon/core/mood/letter";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ken } from "@/components/art/Ken";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref } from "@/lib/prefs";
import { noteProMoment } from "@/lib/purchases/moments";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** The Sunday that "this week's" letter belongs to (the most recent one, if it isn't Sunday evening/Monday). */
function weekOf(now: Date) {
  const offered = letterWeek(now);
  if (offered) return offered;
  return dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()));
}

/** Kén's weekly letter: a few lines in words only. Reading it is all; nothing to answer. */
export default function LetterScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const { logs } = useMoodLogs();
  const name = getPref("name");
  const { lines } = weeklyLetter(logs, now, getPref("sleepLog") ?? []);
  const week = weekOf(now);

  useEffect(() => {
    void setPref("letterReadOn", week);
    void noteProMoment("letter");
  }, [week]);

  const text = (line: LetterLine) => {
    switch (line.kind) {
      case "quiet":
        return t.letter.quiet;
      case "showed-up":
        return line.amount === "most" ? t.letter.showedMost : t.letter.showedFew;
      case "mostly":
        return line.family === "low" ? t.letter.mostlyLow : line.family === "light" ? t.letter.mostlyLight : t.letter.mostlyMixed;
      case "lighter-on":
        return line.when === "weekend" ? t.letter.lighterWeekend : t.letter.lighterWeekdays;
      case "slept-better":
        return t.letter.sleptBetter;
      case "lighter-weekday": {
        const back = (now.getDay() - line.weekday + 7) % 7;
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
        return t.letter.lighterWeekday.replace("{day}", day.toLocaleDateString(LOCALE_TAGS[locale], { weekday: "long" }));
      }
      case "word":
        return t.letter.word.replace("{word}", t.feelings.words[line.word as keyof typeof t.feelings.words] ?? line.word);
    }
  };
  const body = [styles.body, { color: c.foreground }];
  return (
    <>
      <StackHeader />
      <Screen title={t.letter.title}>
        <View style={[styles.paper, { backgroundColor: c.surface }]}>
          <Ken mood="calm" size={56} />
          <Text style={body}>{name ? t.letter.hello.split("{name}").join(name) : t.letter.helloPlain}</Text>
          {lines.map((line, i) => (
            <Text key={i} style={body}>
              {text(line)}
            </Text>
          ))}
          <Text style={body}>{t.letter.closing}</Text>
          <Text style={[styles.signature, { color: c.mutedForeground }]}>{t.letter.signature}</Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  paper: { borderRadius: 18, padding: space.xl, gap: space.md, marginTop: space.md },
  body: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 29 },
  signature: { fontFamily: fonts.serif, fontSize: 17, fontStyle: "italic", textAlign: "right" },
});
