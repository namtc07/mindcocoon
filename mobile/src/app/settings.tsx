import { LOCALES, type Locale } from "@mindcocoon/core/i18n/config";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { NightDimSetting, ReleaseSoundSetting, VoiceGuideSetting, WritingPromptsSetting } from "@/components/settings/ReleaseSoundSetting";
import Constants from "expo-constants";
import appConfig from "../../app.json";
import { Download, LifeBuoy, Lock, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react-native";
import { useIsPro } from "@/lib/purchases/pro";
import { activeStore } from "@/lib/purchases/store";
import { Ken } from "@/components/art/Ken";
import { AdFreeSetting } from "@/components/settings/AdFreeSetting";
import { SettingsGroup, SettingsRow } from "@/components/settings/SettingsGroup";
import { useNow } from "@/hooks/use-now";
import { useRewardedUnlock } from "@/hooks/use-rewarded-unlock";
import { useAdFreeUntil } from "@/lib/ads/ad-free";
import { setPref } from "@/lib/prefs";
import { NameSetting } from "@/components/settings/NameSetting";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { StackHeader } from "@/components/StackHeader";
import { showAdPrivacyOptions, useAdPrivacyRequired } from "@/lib/ads/admob";
import { eraseEverything, shareExport } from "@/lib/export";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import type { ThemeName } from "@/theme/tokens";

const LANGUAGE_NAMES: Record<Locale, string> = { vi: "Tiếng Việt", en: "English", id: "Bahasa Indonesia" };
/** Shorter pill text so three languages fit on one row; the full name stays the accessible name. */
const LANGUAGE_PILLS: Record<Locale, string> = { ...LANGUAGE_NAMES, id: "Indonesia" };

/** A setting with a few options, as a row: the name on the left, the options as small pills. */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; accessibilityLabel?: string }[];
  onChange: (id: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.choice}>
      <Text style={[styles.rowLabel, { color: c.foreground }]}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.pills, { backgroundColor: c.background }]}>
        {options.map((o) => {
          const checked = o.id === value;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityLabel={o.accessibilityLabel}
              accessibilityState={{ checked }}
              onPress={() => onChange(o.id)}
              style={[styles.pill, checked && { backgroundColor: c.card, borderColor: c.border }]}
            >
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: checked ? c.foreground : c.mutedForeground }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EraseSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  // Accept any Unicode form and the older accent placement ("xoá" = "xóa").
  const norm = (text: string) => text.normalize("NFC").trim().toLowerCase().replace(/oá/g, "óa");
  const ok = norm(word) === norm(t.settings.eraseConfirmWord);
  return (
    <Sheet visible={visible} onClose={onClose} title={t.settings.erase}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: c.mutedForeground }}>{t.settings.eraseHint}</Text>
      <TextField label={t.settings.eraseConfirmLabel} showLabel value={word} onChangeText={setWord} autoCapitalize="none" autoCorrect={false} />
      <Button
        variant="destructive"
        disabled={!ok || busy}
        onPress={async () => {
          setBusy(true);
          try {
            onClose();
            // The root layout remounts the app on erase: fresh tabs, back on Today.
            await eraseEverything();
          } catch {
            setBusy(false);
          }
        }}
      >
        {t.settings.eraseNow}
      </Button>
    </Sheet>
  );
}

/** Grouped like a phone's own settings: you, appearance, reminder, while using, vault, ads, data, about. */
export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const { name, setTheme, c } = useTheme();
  const [eraseOpen, setEraseOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const adPrivacy = useAdPrivacyRequired();
  const pro = useIsPro();
  // Pro is offered only where a store can sell it (today: the test store in development builds).
  const proOffered = pro || activeStore() !== null;
  const { adFreeOffer } = useRewardedUnlock();
  const adFreeUntil = useAdFreeUntil();
  const now = useNow();
  // The ad-free row shows while it is offered, or while ads are off (to say until when).
  const adFree = adFreeOffer || adFreeUntil > now.getTime();
  return (
    <>
      <StackHeader />
      <Screen title={t.settings.title}>
        <View style={styles.groups}>
          <SettingsGroup title={t.settings.groupYou} testID="group-you">
            <View style={styles.you}>
              <Ken size={44} />
              <View style={{ flex: 1 }}>
                <NameSetting />
              </View>
            </View>
            {proOffered ? (
              <SettingsRow icon={Sparkles} label={pro ? `${t.pro.title} · ${t.pro.on}` : t.pro.title} onPress={() => router.push("/pro")} />
            ) : null}
            {__DEV__ && pro ? <SettingsRow icon={RotateCcw} role="button" label={t.pro.resetTest} onPress={() => void setPref("pro", undefined)} /> : null}
          </SettingsGroup>

          <SettingsGroup title={t.settings.appearance} testID="group-appearance">
            <Choice
              label={t.settings.language}
              value={locale}
              onChange={(l) => void setLocale(l)}
              options={LOCALES.map((l) => ({ id: l, label: LANGUAGE_PILLS[l], accessibilityLabel: LANGUAGE_NAMES[l] }))}
            />
            <Choice<ThemeName>
              label={t.settings.theme}
              value={name}
              onChange={(v) => void setTheme(v)}
              options={[
                { id: "dusk", label: t.settings.themeDusk },
                { id: "mist", label: t.settings.themeMist },
              ]}
            />
            <NightDimSetting />
          </SettingsGroup>

          <SettingsGroup title={t.settings.reminderTitle} testID="group-reminder">
            <ReminderSettings />
          </SettingsGroup>

          <SettingsGroup title={t.settings.groupUsing} testID="group-using">
            <WritingPromptsSetting />
            <ReleaseSoundSetting />
            <VoiceGuideSetting />
          </SettingsGroup>

          <SettingsGroup title={t.settings.vault} testID="group-vault">
            <SettingsRow icon={Lock} label={t.settings.vaultLink} onPress={() => router.navigate("/vault")} />
          </SettingsGroup>

          <SettingsGroup title={t.settings.groupAds} testID="group-ads" footer={t.settings.adsNote}>
            {adFree ? <AdFreeSetting /> : null}
            {adPrivacy ? <SettingsRow icon={ShieldCheck} role="button" label={t.settings.adPrivacy} onPress={() => void showAdPrivacyOptions()} /> : null}
          </SettingsGroup>

          <SettingsGroup title={t.settings.data} testID="group-data" footer={t.settings.exportHint}>
            <SettingsRow
              icon={Download}
              role="button"
              label={t.settings.export}
              disabled={exporting}
              onPress={async () => {
                setExporting(true);
                try {
                  await shareExport();
                } finally {
                  setExporting(false);
                }
              }}
            />
            <SettingsRow icon={Trash2} role="button" destructive label={t.settings.erase} onPress={() => setEraseOpen(true)} />
          </SettingsGroup>

          <SettingsGroup title={t.settings.about} testID="group-about" footer={t.settings.disclaimer}>
            <SettingsRow icon={LifeBuoy} label={t.settings.helpLink} onPress={() => router.push("/help")} />
          </SettingsGroup>

          <Text style={[styles.version, { color: c.mutedForeground }]}>
            {t.settings.versionLabel.replace("{version}", Constants.expoConfig?.version ?? appConfig.expo.version)}
          </Text>
        </View>
        <EraseSheet visible={eraseOpen} onClose={() => setEraseOpen(false)} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  groups: { gap: space.xl, marginTop: space.md },
  you: { flexDirection: "row", alignItems: "center", gap: space.md },
  choice: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 44, flexWrap: "wrap" },
  rowLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
  pills: { flexDirection: "row", flexWrap: "wrap", flexShrink: 1, borderRadius: radius.full, padding: 3, gap: 2 },
  pill: { borderRadius: radius.full, borderWidth: 1, borderColor: "transparent", paddingHorizontal: space.md, paddingVertical: 6 },
  version: { fontFamily: fonts.sans, fontSize: 12, textAlign: "center", marginTop: space.sm },
});
