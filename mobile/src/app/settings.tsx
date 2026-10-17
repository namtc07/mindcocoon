import { LOCALES, type Locale } from "@mindcocoon/core/i18n/config";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { eraseEverything, shareExport } from "@/lib/export";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import type { ThemeName } from "@/theme/tokens";

const LANGUAGE_NAMES: Record<Locale, string> = { vi: "Tiếng Việt", en: "English" };

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.section}>
      <Muted>{label}</Muted>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
        {options.map((o) => {
          const checked = o.id === value;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              onPress={() => onChange(o.id)}
              style={[
                styles.chip,
                { borderColor: checked ? c.primary : c.border, backgroundColor: checked ? c.surface : "transparent" },
              ]}
            >
              <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: checked ? c.foreground : c.mutedForeground }}>
                {o.label}
              </Text>
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
  const ok = word.trim().toLowerCase() === t.settings.eraseConfirmWord;
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: c.foreground }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Language, appearance, vault, your data (export / erase) and about. Account & backup arrive in M5. */
export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const { name, c, setTheme } = useTheme();
  const [eraseOpen, setEraseOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerTintColor: c.foreground,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Screen title={t.settings.title}>
        <Choice
          label={t.settings.language}
          value={locale}
          onChange={(l) => void setLocale(l)}
          options={LOCALES.map((l) => ({ id: l, label: LANGUAGE_NAMES[l] }))}
        />
        <Choice<ThemeName>
          label={t.settings.appearance}
          value={name}
          onChange={(v) => void setTheme(v)}
          options={[
            { id: "dusk", label: t.settings.themeDusk },
            { id: "mist", label: t.settings.themeMist },
          ]}
        />
        <Section title={t.settings.reminderTitle}>
          <ReminderSettings />
        </Section>
        <Section title={t.settings.vault}>
          <Button variant="outline" onPress={() => router.navigate("/vault")}>
            {t.settings.vaultLink}
          </Button>
        </Section>
        <Section title={t.settings.data}>
          <Muted>{t.settings.exportHint}</Muted>
          <Button
            variant="outline"
            disabled={exporting}
            onPress={async () => {
              setExporting(true);
              try {
                await shareExport();
              } finally {
                setExporting(false);
              }
            }}
          >
            {t.settings.export}
          </Button>
          <Button variant="destructive" onPress={() => setEraseOpen(true)}>
            {t.settings.erase}
          </Button>
        </Section>
        <Section title={t.settings.about}>
          <Muted>{t.settings.disclaimer}</Muted>
          <Button variant="ghost" onPress={() => router.push("/help")}>
            {t.settings.helpLink}
          </Button>
        </Section>
        <EraseSheet visible={eraseOpen} onClose={() => setEraseOpen(false)} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, paddingTop: space.xl },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space.lg, paddingVertical: space.sm },
});
