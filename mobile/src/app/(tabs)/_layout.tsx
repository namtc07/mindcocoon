import { router, Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/js-tabs";
import { BookLock, Feather, Leaf, Settings2, Sunrise, Waves } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { MiniPlayer } from "@/components/sanctuary/MiniPlayer";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** Five tabs as on the web; settings sits in the header (as in the web's mobile layout). */
export default function TabsLayout() {
  const { t } = useI18n();
  const { c } = useTheme();

  return (
    <Tabs
      // The mini player rides on top of the tab bar; on Vent the bar is hidden but the player stays.
      tabBar={(props) => {
        const immersive = props.state.routes[props.state.index]?.name === "vent";
        return (
          <>
            <MiniPlayer safeBottom={immersive} />
            <BottomTabBar {...props} />
          </>
        );
      }}
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitle: () => <Text style={{ fontFamily: fonts.serif, fontSize: 21, color: c.foreground }}>MindCocoon</Text>,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.shell.openSettings}
            hitSlop={12}
            onPress={() => router.push("/settings")}
            style={{ paddingHorizontal: 16 }}
          >
            <Settings2 size={22} color={c.mutedForeground} />
          </Pressable>
        ),
        sceneStyle: { backgroundColor: c.background },
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.border },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarLabelStyle: { fontFamily: fonts.sans, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.nav.today, tabBarIcon: ({ color, size }) => <Sunrise color={color} size={size} /> }} />
      <Tabs.Screen
        name="vent"
        options={{
          title: t.nav.vent,
          // Distraction-free: no header, no tab bar while venting (the screen has its own back link).
          headerShown: false,
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => <Feather color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="mood" options={{ title: t.nav.mood, tabBarIcon: ({ color, size }) => <Waves color={color} size={size} /> }} />
      <Tabs.Screen name="sanctuary" options={{ title: t.nav.sanctuary, tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} /> }} />
      <Tabs.Screen name="vault" options={{ title: t.nav.vault, tabBarIcon: ({ color, size }) => <BookLock color={color} size={size} /> }} />
    </Tabs>
  );
}
