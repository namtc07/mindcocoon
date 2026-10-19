import { promptAt, promptForDay } from "@mindcocoon/core/prompts";
import { useRemoteContent } from "@/lib/remote-content";
import { checkText } from "@mindcocoon/core/safety/detect";
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState, useSyncExternalStore } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GentleCard, claimGentleCard } from "@/components/safety/GentleCard";
import { HelpLink } from "@/components/safety/HelpLink";
import { Button } from "@/components/ui/Button";
import { AfterRelease } from "@/components/vent/AfterRelease";
import { Dissolve, planDissolve, RITUALS, type DissolvePlan } from "@/components/vent/Dissolve";
import { Chip } from "@/components/ui/Chip";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { stopReleaseSound } from "@/lib/release-sound";
import { addWorry } from "@/lib/worries";
import { VaultLockedError } from "@mindcocoon/core/vault/session";
import { toast } from "@/components/ui/Toast";
import { SaveSheet } from "@/components/vent/SaveSheet";
import { useAppState } from "@/hooks/use-app-state";
import { appAutoLock } from "@/lib/app-auto-lock";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

type Phase = "writing" | "dissolving" | "released";

/**
 * Full-screen writing surface. Released text is never persisted: it lives only in
 * component state until the dissolve finishes; then the input is remounted so its
 * native undo history goes too. Autocorrect/suggestions are off so the keyboard
 * doesn't learn what was written, and the page is covered in the app switcher.
 */
const readRitual = () => getPref("ritual") ?? "burn";

export default function VentScreen() {
  const { t, locale } = useI18n();
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const appState = useAppState();
  const now = useNow();
  const params = useLocalSearchParams<{ prompt?: string; promptIndex?: string; remotePrompt?: string }>();
  const remotePrompts = useRemoteContent().prompts;
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");
  const [plan, setPlan] = useState<DissolvePlan | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pending, setPending] = useState<"release" | "save" | "worry" | null>(null);
  // The save sheet opens only once the gentle card has gone (iOS won't stack modals mid-animation).
  const [saveAfterCard, setSaveAfterCard] = useState(false);
  const empty = text.trim().length === 0;
  const ritual = useSyncExternalStore(subscribePrefs, readRitual, readRitual);

  const clearEditor = useCallback(() => {
    setText("");
    setInputKey((k) => k + 1);
  }, []);

  function doRelease() {
    setPlan(planDissolve(text, ritual));
    clearEditor();
    setPhase("dissolving");
  }

  /** Worry box: rests (encrypted) until morning. A locked vault can't encrypt it, so the words stay. */
  const [settingDown, setSettingDown] = useState(false);
  async function doWorry() {
    if (settingDown) return;
    setSettingDown(true);
    try {
      await addWorry(text);
      clearEditor();
      toast.show(t.worries.setDownDone);
    } catch (error) {
      toast.show(error instanceof VaultLockedError ? t.worries.lockedHint : t.worries.saveFailed);
    } finally {
      setSettingDown(false);
    }
  }

  function attempt(action: "release" | "save" | "worry") {
    if (empty) return;
    if (checkText(text).flagged && claimGentleCard()) {
      setPending(action);
      return;
    }
    if (action === "release") doRelease();
    else if (action === "worry") void doWorry();
    else setSaveOpen(true);
  }

  function continuePending() {
    const action = pending;
    setPending(null);
    if (action === "release") doRelease();
    else if (action === "worry") void doWorry();
    else if (action === "save") setSaveAfterCard(true);
  }

  // Leaving Vent silences a release sound that is still playing.
  // …and forgets a prompt opened from the library, so Today's "Write about this" never shows a stale one.
  const hasPromptParam = params.prompt !== undefined || params.promptIndex !== undefined || params.remotePrompt !== undefined;
  // Vent's own navigation object targets this route (router.setParams would hit whatever is focused next).
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(
      () => () => {
        stopReleaseSound();
        if (hasPromptParam) navigation.setParams({ prompt: undefined, promptIndex: undefined, remotePrompt: undefined } as never);
      },
      [hasPromptParam, navigation],
    ),
  );

  const finishDissolve = useCallback(() => {
    setPlan(null);
    setPhase("released");
  }, []);

  // From the library: a fixed index, so switching language keeps the same prompt. From Today: the day's prompt.
  const prompt =
    params.remotePrompt !== undefined
      ? (remotePrompts[locale][Number(params.remotePrompt) || 0]?.text ?? null)
      : params.promptIndex !== undefined
      ? promptAt(locale, Number(params.promptIndex) || 0)
      : params.prompt !== undefined
        ? promptForDay(now, locale, Number(params.prompt) || 0)
        : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.fill, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.vent.back} hitSlop={12} onPress={() => router.navigate("/")} style={styles.back}>
          <ArrowLeft size={20} color={c.mutedForeground} />
          <Text style={{ fontFamily: fonts.sans, color: c.mutedForeground, fontSize: 15 }}>{t.vent.back}</Text>
        </Pressable>
      </View>

      {phase === "released" ? (
        <View style={styles.page}>
          <AfterRelease
            onWriteAgain={() => {
              clearEditor();
              setPhase("writing");
            }}
          />
        </View>
      ) : (
        <ScrollView style={styles.fill} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          {prompt && <Text style={[styles.prompt, { color: c.mutedForeground }]}>{prompt}</Text>}
          {phase === "dissolving" && plan ? (
            <Dissolve plan={plan} onDone={finishDissolve} />
          ) : (
            <TextInput
              key={inputKey}
              accessibilityLabel={t.vent.editorLabel}
              placeholder={t.vent.placeholder}
              placeholderTextColor={c.mutedForeground}
              value={text}
              onChangeText={(v) => {
                appAutoLock.markActivity();
                setText(v);
              }}
              multiline
              autoFocus
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              textContentType="none"
              keyboardAppearance={isDark ? "dark" : "light"}
              style={[styles.editor, { color: c.foreground }]}
            />
          )}
        </ScrollView>
      )}

      {phase === "writing" && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <View style={styles.rituals}>
            <Text style={{ fontFamily: fonts.sans, color: c.mutedForeground, fontSize: 14 }}>{t.vent.ritualLabel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.ritualRow}>
              {RITUALS.map((r) => (
                <Chip key={r} selected={ritual === r} onPress={() => void setPref("ritual", r)}>
                  {t.vent.rituals[r]}
                </Chip>
              ))}
            </ScrollView>
          </View>
          <View style={styles.actions}>
            <Button variant="ember" onPress={() => attempt("release")} disabled={empty}>
              {t.vent.release}
            </Button>
            <Button variant="ghost" onPress={() => attempt("save")} disabled={empty}>
              {t.vent.saveToVault}
            </Button>
            <Button variant="ghost" onPress={() => attempt("worry")} disabled={empty || settingDown}>
              {t.worries.setDown}
            </Button>
          </View>
          <HelpLink />
        </View>
      )}

      {appState !== "active" && (
        <View accessibilityLabel={t.vent.privacyCover} style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: c.background }]}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 28, color: c.foreground }}>MindCocoon</Text>
        </View>
      )}

      <GentleCard
        visible={pending !== null}
        continueLabel={pending === "save" ? t.safety.continueSave : pending === "worry" ? t.safety.continuePractice : t.safety.continueRelease}
        onContinue={continuePending}
        onClose={() => setPending(null)}
        onDismissed={() => {
          if (!saveAfterCard) return;
          setSaveAfterCard(false);
          setSaveOpen(true);
        }}
      />
      <SaveSheet
        visible={saveOpen}
        body={text}
        onClose={() => setSaveOpen(false)}
        onSaved={() => {
          setSaveOpen(false);
          clearEditor();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingHorizontal: space.xl, paddingVertical: space.sm },
  rituals: { gap: space.xs },
  ritualRow: { gap: space.sm, paddingRight: space.lg },
  back: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, alignSelf: "flex-start" },
  page: { flexGrow: 1, paddingHorizontal: space.xl, paddingTop: space.xl },
  prompt: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 26, marginBottom: space.lg },
  editor: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 34, minHeight: 240, textAlignVertical: "top" },
  footer: { paddingHorizontal: space.xl, gap: space.sm },
  actions: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
  cover: { alignItems: "center", justifyContent: "center" },
});
