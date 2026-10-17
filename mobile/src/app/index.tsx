import { promptForDay } from "@mindcocoon/core/prompts";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/** Temporary home until the tab navigator lands (Task 5). */
export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{promptForDay(new Date(), "vi")}</Text>
      {__DEV__ && (
        <Link href="/dev/spike" style={styles.link}>
          Crypto spike
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", justifyContent: "center", padding: 28 },
  prompt: { color: "#F1F5F9", fontSize: 26, lineHeight: 34 },
  link: { color: "#7FB5A8", marginTop: 24, fontSize: 15 },
});
