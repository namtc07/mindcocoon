import { getStory } from "@mindcocoon/core/stories";
import { Redirect, useFocusEffect, useLocalSearchParams } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { hush, say } from "@/lib/voice";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/**
 * A sleep story: the text to read, and "Read to me" — the phone's voice reads it paragraph by
 * paragraph, the current one gently highlighted. Leaving the screen stops it. Ad-free.
 */
export default function StoryScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = getStory(locale, id ?? "");
  const [reading, setReading] = useState<number | null>(null);
  // Bumped on every start/stop, so a late "done" from an old utterance never moves things on.
  const session = useRef(0);

  const stop = useCallback(() => {
    session.current += 1;
    hush();
    setReading(null);
  }, []);
  useFocusEffect(useCallback(() => stop, [stop]));

  function readFrom(index: number, run: number) {
    if (!story || index >= story.paragraphs.length) return setReading(null);
    setReading(index);
    say(story.paragraphs[index], locale, () => {
      if (session.current === run) readFrom(index + 1, run);
    });
  }

  function start() {
    session.current += 1;
    readFrom(0, session.current);
  }

  // The screen may dim while a story is read aloud; it doesn't need to stay lit.
  useEffect(() => {
    if (reading === null) return;
    activateKeepAwakeAsync("story").catch(() => {});
    return () => {
      deactivateKeepAwake("story").catch(() => {});
    };
  }, [reading]);

  if (!story) return <Redirect href="/sanctuary" />;
  return (
    <>
      <StackHeader />
      <Screen title={story.title}>
        <Muted>{t.stories.hint}</Muted>
        <View style={styles.actions}>
          {reading === null ? <Button onPress={start}>{t.stories.read}</Button> : <Button variant="outline" onPress={stop}>{t.stories.stop}</Button>}
        </View>
        <View style={styles.text}>
          {story.paragraphs.map((p, i) => (
            <Text key={i} style={[styles.paragraph, { color: reading === null || reading === i ? c.foreground : c.mutedForeground }]}>
              {p}
            </Text>
          ))}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", marginTop: space.sm },
  text: { gap: space.lg, marginTop: space.lg },
  paragraph: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 30 },
});
