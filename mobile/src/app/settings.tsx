import { LOCALES, type Locale } from "@mindcocoon/core/i18n/config";
import { Stack } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
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

/** Settings (M2: language and appearance; the rest arrives with M3–M6). */
export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const { name, c, setTheme } = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerTintColor: c.foreground,
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
        <View style={[styles.section, { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
          <Muted>{t.settings.disclaimer}</Muted>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, paddingTop: space.xl },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space.lg, paddingVertical: space.sm },
});
