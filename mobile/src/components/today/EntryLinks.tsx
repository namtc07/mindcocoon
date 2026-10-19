import { router, type Href } from "expo-router";
import { Feather, Flower2, Mail, Moon, Music2, Wind, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

function Entry({ href, Icon, title, body, first }: { href: Href; Icon: LucideIcon; title: string; body: string; first?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${body}`}
      onPress={() => router.push(href)}
      style={[styles.entry, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
    >
      <Icon size={20} color={c.mutedForeground} />
      <View style={styles.text}>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: c.foreground }}>{title}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>{body}</Text>
      </View>
    </Pressable>
  );
}

/** Ways in. At night "Wind down for sleep" leads; by day "Let it out" leads and wind-down waits at the end. */
export function EntryLinks({ evening = false }: { evening?: boolean }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const windDown = { key: "wind", href: "/wind-down" as Href, Icon: Moon, title: t.today.tiles.windDownTitle, body: t.today.tiles.windDownBody };
  const rest = [
    { key: "vent", href: "/vent" as Href, Icon: Feather, title: t.today.tiles.ventTitle, body: t.today.tiles.ventBody },
    { key: "breathe", href: { pathname: "/sanctuary", params: { section: "breathe" } } as Href, Icon: Wind, title: t.today.tiles.breatheTitle, body: t.today.tiles.breatheChoicesBody },
    { key: "practices", href: "/practices" as Href, Icon: Flower2, title: t.today.tiles.practicesTitle, body: t.today.tiles.practicesBody },
    { key: "music", href: { pathname: "/sanctuary", params: { section: "tonight" } } as Href, Icon: Music2, title: t.today.tiles.musicTitle, body: t.today.tiles.musicBody },
    { key: "letter", href: "/future-letters" as Href, Icon: Mail, title: t.futureLetters.entryTitle, body: t.futureLetters.entryBody },
  ];
  const entries = evening ? [windDown, ...rest] : [...rest, windDown];
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      {entries.map((e, i) => (
        <Entry key={e.key} first={i === 0} href={e.href} Icon={e.Icon} title={e.title} body={e.body} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg },
  entry: { flexDirection: "row", gap: space.lg, paddingVertical: space.lg, alignItems: "flex-start" },
  text: { flex: 1, gap: 2 },
});
