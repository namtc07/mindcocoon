import type { PresetMixId } from "@mindcocoon/core/audio/mixes";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Scene, type SceneKind } from "@/components/art/Scene";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export const SCENE_OF: Record<PresetMixId, SceneKind> = {
  "rainy-night": "rain",
  "by-the-fire": "fire",
  "sea-breeze": "sea",
  "rain-at-sea": "rain-sea",
};

/** A ready-made mix as a small picture card (the name stays the button's name). */
export function MixCard({ id, selected, onPress }: { id: PresetMixId; selected: boolean; onPress: () => void }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const name = t.sanctuary.presets[id];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, { borderColor: selected ? c.ember : c.border, backgroundColor: c.card }]}
    >
      <Scene kind={SCENE_OF[id]} height={78} />
      {selected && (
        <View testID="mix-check" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.check, { backgroundColor: c.ember }]}>
          <Check size={14} color={c.primaryForeground} strokeWidth={3} />
        </View>
      )}
      <Text numberOfLines={1} style={[styles.name, { color: selected ? c.foreground : c.mutedForeground }]}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 132, borderRadius: radius.lg, borderWidth: 2, overflow: "hidden" },
  check: { position: "absolute", top: space.sm, right: space.sm, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.sansMedium, fontSize: 14, paddingHorizontal: space.sm, paddingVertical: space.sm },
});
