import { MAX_NAME_LENGTH, ONBOARDING_INTENTS, type OnboardingIntent } from "@mindcocoon/core/onboarding";
import { usePathname } from "expo-router";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ken } from "@/components/art/Ken";
import { PrivacyCover } from "@/components/PrivacyCover";
import { Sky } from "@/components/art/Sky";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { setReminder } from "@/lib/reminder";
import { setWelcomeOpen } from "@/lib/welcome-state";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const seenPref = () => getPref("firstRunSeen") === true;

/**
 * First launch: what MindCocoon is (and isn't), why the person came, what to call them, and an
 * optional evening reminder. Everything is skippable; shown once; never over Help.
 */
export function Welcome() {
  const { t } = useI18n();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const seen = useSyncExternalStore(subscribePrefs, seenPref, seenPref);
  const [step, setStep] = useState(0);
  const [intents, setIntents] = useState<OnboardingIntent[]>([]);
  const [name, setName] = useState("");
  const [remind, setRemind] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const visible = !seen && pathname !== "/help";

  // Ads wait while this window is up or still fading out (iOS reports the end through onDismiss).
  const wasVisible = useRef(false);
  useEffect(() => {
    if (visible) setWelcomeOpen(true);
    else if (wasVisible.current && Platform.OS !== "ios") setWelcomeOpen(false);
    wasVisible.current = visible;
  }, [visible]);

  const skip = () => void setPref("firstRunSeen", true);
  async function begin() {
    setBusy(true);
    try {
      await setPref("intents", intents);
      const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
      if (trimmed) await setPref("name", trimmed);
      if (remind) {
        const result = await setReminder(22, t).catch(() => "denied" as const);
        if (result === "denied") {
          // Say so and turn the switch off; the next "Begin" finishes without a reminder.
          setRemind(false);
          setDenied(true);
          return;
        }
      }
      await setPref("firstRunSeen", true);
    } catch {
      // Saving a preference failed: still let the person in (nothing here is required).
      void setPref("firstRunSeen", true).catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  /** Android back: one step back; on the first step it closes like Skip. */
  const back = () => (step > 0 ? setStep(step - 1) : skip());
  const toggle = (i: OnboardingIntent) => setIntents((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  const text = [styles.body, { color: c.mutedForeground }];

  return (
    <Modal testID="welcome" visible={visible} animationType="fade" onRequestClose={back} onDismiss={() => setWelcomeOpen(false)}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        style={{ backgroundColor: c.background }}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl }]}
      >
        <View style={styles.top}>
          {step > 0 ? (
            <Button variant="ghost" onPress={() => setStep(step - 1)}>
              {t.welcome.back}
            </Button>
          ) : (
            <View />
          )}
          <Button variant="ghost" onPress={skip}>
            {t.welcome.skip}
          </Button>
        </View>

        {step === 0 && (
          <View style={styles.step}>
            <View>
              <Sky part="night" height={170} />
              <View style={styles.ken}>
                <Ken mood="glad" size={84} />
              </View>
            </View>
            <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
              {t.welcome.title}
            </Text>
            <Text style={text}>{t.settings.firstRunBody}</Text>
            <Text style={[styles.small, { color: c.mutedForeground }]}>{t.settings.disclaimer}</Text>
            <Button onPress={() => setStep(1)}>{t.welcome.continue}</Button>
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
              {t.welcome.intentsTitle}
            </Text>
            <Text style={text}>{t.welcome.intentsHint}</Text>
            <View style={styles.chips}>
              {ONBOARDING_INTENTS.map((i) => (
                <Chip key={i} selected={intents.includes(i)} onPress={() => toggle(i)}>
                  {t.welcome.intents[i]}
                </Chip>
              ))}
            </View>
            <Button onPress={() => setStep(2)}>{t.welcome.continue}</Button>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Ken size={64} />
            <TextField label={t.welcome.nameLabel} showLabel value={name} onChangeText={setName} maxLength={MAX_NAME_LENGTH} autoComplete="given-name" />
            <Text style={[styles.small, { color: c.mutedForeground }]}>{t.welcome.nameHint}</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.body, { color: c.foreground }]}>{t.welcome.remind}</Text>
                <Text style={[styles.small, { color: c.mutedForeground }]}>{t.welcome.remindHint}</Text>
              </View>
              <Switch
                accessibilityLabel={t.welcome.remind}
                value={remind}
                onValueChange={(v) => {
                  setRemind(v);
                  setDenied(false);
                }} trackColor={{ true: c.primary, false: c.muted }} />
            </View>
            {denied && (
              <Text accessibilityLiveRegion="polite" style={[styles.small, { color: c.foreground }]}>
                {t.settings.reminderDenied}
              </Text>
            )}
            <Button disabled={busy} onPress={() => void begin()}>
              {t.welcome.begin}
            </Button>
          </View>
        )}
      </ScrollView>
      {/* A Modal is its own native window: the root cover can't reach it (same as Sheet). */}
      <PrivacyCover />
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.xl, gap: space.lg, flexGrow: 1 },
  top: { flexDirection: "row", justifyContent: "space-between" },
  step: { gap: space.lg },
  ken: { position: "absolute", left: 0, right: 0, bottom: -space.lg, alignItems: "center" },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, marginTop: space.md },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 44 },
});
