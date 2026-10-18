import { router, type Href } from "expo-router";
import { Feather, Flower2, Music2, Wind, type LucideIcon } from "lucide-react-native";
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

export function EntryLinks() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <Entry first href="/vent" Icon={Feather} title={t.today.tiles.ventTitle} body={t.today.tiles.ventBody} />
      <Entry href={{ pathname: "/sanctuary", params: { section: "breathe" } }} Icon={Wind} title={t.today.tiles.breatheTitle} body={t.today.tiles.breatheBody} />
      <Entry href={{ pathname: "/sanctuary", params: { section: "tonight" } }} Icon={Music2} title={t.today.tiles.musicTitle} body={t.today.tiles.musicBody} />
      <Entry href="/practices" Icon={Flower2} title={t.today.tiles.practicesTitle} body={t.today.tiles.practicesBody} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg },
  entry: { flexDirection: "row", gap: space.lg, paddingVertical: space.lg, alignItems: "flex-start" },
  text: { flex: 1, gap: 2 },
});
