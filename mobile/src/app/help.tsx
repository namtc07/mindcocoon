import { FIND_A_HELPLINE_URL, HOTLINES, isOpenNow, telHref, type Hotline } from "@mindcocoon/core/safety/hotlines";
import type { Locale } from "@mindcocoon/core/i18n/config";
import { Stack } from "expo-router";
import { Phone } from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const HOME_COUNTRY: Record<Locale, string | null> = { vi: "VN", en: null };

function HotlineItem({ line, now, first }: { line: Hotline; now: Date; first: boolean }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const open = isOpenNow(line, now);
  const hours =
    line.hours === "24/7" ? t.safety.allHours : t.safety.hoursRange.replace("{open}", line.hours.open).replace("{close}", line.hours.close);
  return (
    <View style={[styles.item, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text testID="hotline-name" style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: c.foreground }}>
          {line.name[locale]}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 18, color: c.foreground }}>{line.phone}</Text>
          {"  "}
          {hours}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: open ? c.primary : c.mutedForeground }}>
          {open ? t.safety.openNow : t.safety.closedNow}
          {line.audience === "youth" ? `   ${t.safety.youth}` : ""}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.safety.call} ${line.name[locale]}`}
        onPress={() => void Linking.openURL(telHref(line.phone))}
        style={[styles.call, { backgroundColor: c.primary }]}
      >
        <Phone size={16} color={c.primaryForeground} />
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: c.primaryForeground }}>{t.safety.call}</Text>
      </Pressable>
    </View>
  );
}

/** Support lines: the user's country first, then lines answering now. Bundled, so it works offline. */
export default function HelpScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const home = HOME_COUNTRY[locale];
  const byOpen = (a: Hotline, b: Hotline) => Number(isOpenNow(b, now)) - Number(isOpenNow(a, now));
  const local = HOTLINES.filter((h) => h.country === home).sort(byOpen);
  const others = HOTLINES.filter((h) => h.country !== home).sort(byOpen);
  const card = [styles.card, { backgroundColor: c.surface }];

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
      <Screen title={t.safety.helpTitle}>
        <Muted>{t.safety.helpIntro}</Muted>
        <View style={styles.sections}>
          {__DEV__ && HOTLINES.some((h) => !h.verified) && (
            <Text style={[styles.unverified, { color: c.ember, borderColor: c.ember }]}>{t.safety.unverified}</Text>
          )}
          {local.length > 0 && (
            <View testID="home-lines" style={card}>
              {local.map((h, i) => (
                <HotlineItem key={h.id} line={h} now={now} first={i === 0} />
              ))}
            </View>
          )}
          <View style={{ gap: space.md }}>
            {local.length > 0 && <Muted>{t.safety.otherCountries}</Muted>}
            <View style={card}>
              {others.map((h, i) => (
                <HotlineItem key={h.id} line={h} now={now} first={i === 0} />
              ))}
            </View>
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(FIND_A_HELPLINE_URL)} style={{ minHeight: 44, justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: c.primary }}>{t.safety.findHelpline}</Text>
            </Pressable>
          </View>
          <Muted>{t.safety.disclaimer}</Muted>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xl, marginTop: space.xl },
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg },
  item: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.lg },
  call: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.full, paddingHorizontal: space.lg, minHeight: 44 },
  unverified: { borderWidth: 1, borderStyle: "dashed", borderRadius: radius.md, padding: space.md, fontFamily: fonts.sans, fontSize: 14 },
});
