import { Stack } from "expo-router";
import { useTheme } from "@/theme/theme";

/** The plain back-arrow header used by stack screens (Settings, practices, prompts). */
export function StackHeader() {
  const { c } = useTheme();
  return (
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
  );
}
