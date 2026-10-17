import { promptForDay } from "@mindcocoon/core/prompts";
import { checkText } from "@mindcocoon/core/safety/detect";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GentleCard, claimGentleCard } from "@/components/safety/GentleCard";
import { HelpLink } from "@/components/safety/HelpLink";
import { Button } from "@/components/ui/Button";
import { AfterRelease } from "@/components/vent/AfterRelease";
import { Dissolve, planDissolve, type DissolvePlan } from "@/components/vent/Dissolve";
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
export default function VentScreen() {
  const { t, locale } = useI18n();
  const { c, name } = useTheme();
  const insets = useSafeAreaInsets();
  const appState = useAppState();
  const now = useNow();
  const params = useLocalSearchParams<{ prompt?: string }>();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");
  const [plan, setPlan] = useState<DissolvePlan | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pending, setPending] = useState<"release" | "save" | null>(null);
  // The save sheet opens only once the gentle card has gone (iOS won't stack modals mid-animation).
  const [saveAfterCard, setSaveAfterCard] = useState(false);
  const empty = text.trim().length === 0;

  const clearEditor = useCallback(() => {
    setText("");
    setInputKey((k) => k + 1);
  }, []);

  function doRelease() {
    setPlan(planDissolve(text));
    clearEditor();
    setPhase("dissolving");
  }

  function attempt(action: "release" | "save") {
    if (empty) return;
    if (checkText(text).flagged && claimGentleCard()) {
      setPending(action);
      return;
    }
    if (action === "release") doRelease();
    else setSaveOpen(true);
  }

  function continuePending() {
    const action = pending;
    setPending(null);
    if (action === "release") doRelease();
    else if (action === "save") setSaveAfterCard(true);
  }

  const finishDissolve = useCallback(() => {
    setPlan(null);
    setPhase("released");
  }, []);

  const prompt = params.prompt !== undefined ? promptForDay(now, locale, Number(params.prompt) || 0) : null;

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
              keyboardAppearance={name === "dusk" ? "dark" : "light"}
              style={[styles.editor, { color: c.foreground }]}
            />
          )}
        </ScrollView>
      )}

      {phase === "writing" && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <View style={styles.actions}>
            <Button variant="ember" onPress={() => attempt("release")} disabled={empty}>
              {t.vent.release}
            </Button>
            <Button variant="ghost" onPress={() => attempt("save")} disabled={empty}>
              {t.vent.saveToVault}
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
        continueLabel={pending === "save" ? t.safety.continueSave : t.safety.continueRelease}
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
  back: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, alignSelf: "flex-start" },
  page: { flexGrow: 1, paddingHorizontal: space.xl, paddingTop: space.xl },
  prompt: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 26, marginBottom: space.lg },
  editor: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 34, minHeight: 240, textAlignVertical: "top" },
  footer: { paddingHorizontal: space.xl, gap: space.sm },
  actions: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
  cover: { alignItems: "center", justifyContent: "center" },
});
