import { promptForDay } from "@mindcocoon/core/prompts";
import { StatusBar } from "expo-status-bar";
import { saveVaultEntry } from "@mindcocoon/core/vault/session";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { useTheme } from "@/theme/theme";
import { runSpike, type SpikeResult } from "../../../spike/run-spike";

/** M1: shows today's prompt from the shared core, then the crypto spike results. */
/** M2 persistence check: real (SQLite + Keychain) vault, language and theme survive a relaunch. */
function Persistence() {
  const vault = useVault();
  const { locale } = useI18n();
  const { name } = useTheme();
  return (
    <View style={styles.persist}>
      <Text style={styles.heading}>Persistence</Text>
      <Text style={styles.result}>
        vault: {vault.status} · entries: {vault.entries.length} · locale: {locale} · theme: {name}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={vault.status !== "unlocked"}
        onPress={() => void saveVaultEntry({ body: `m2 persistence ${new Date().toISOString()}` })}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Add test entry</Text>
      </Pressable>
    </View>
  );
}

export default function SpikeScreen() {
  const [results, setResults] = useState<SpikeResult[] | null>(null);

  useEffect(() => {
    runSpike().then((r) => {
      setResults(r);
      console.log(`[spike] ${r.every((x) => x.ok) ? "ALL PASS" : "FAILED"} ${JSON.stringify(r)}`);
    });
  }, []);

  const allPass = results?.every((r) => r.ok);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>MindCocoon · M1</Text>
        <Text style={styles.prompt}>{promptForDay(new Date(), "vi")}</Text>
        <Text style={styles.heading}>Crypto spike</Text>
        {results === null && <Text style={styles.muted}>Running…</Text>}
        {results?.map((r) => (
          <View key={r.name} style={styles.row}>
            <Text style={[styles.result, { color: r.ok ? "#7FB5A8" : "#E08A7E" }]}>
              {r.ok ? "✓" : "✗"} {r.name} <Text style={styles.muted}>{r.ms} ms</Text>
            </Text>
            {r.detail ? (
              <Text selectable style={styles.detail}>
                {r.detail}
              </Text>
            ) : null}
          </View>
        ))}
        {results && <Persistence />}
        {results && (
          <Text style={[styles.verdict, { color: allPass ? "#7FB5A8" : "#E08A7E" }]}>
            {allPass ? "ALL PASS" : "FAILED"}
          </Text>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { padding: 24, paddingTop: 72 },
  label: { color: "#94A3B8", fontSize: 13, marginBottom: 10 },
  prompt: { color: "#F1F5F9", fontSize: 24, lineHeight: 32, marginBottom: 28 },
  heading: { color: "#F1F5F9", fontSize: 17, fontWeight: "600", marginBottom: 10 },
  row: { marginBottom: 10 },
  result: { fontSize: 14 },
  detail: { color: "#94A3B8", fontSize: 11, marginTop: 2, fontFamily: "Menlo" },
  muted: { color: "#64748B", fontSize: 12 },
  persist: { marginTop: 24, gap: 8 },
  button: { alignSelf: "flex-start", borderColor: "#7FB5A8", borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  buttonText: { color: "#7FB5A8", fontSize: 14 },
  verdict: { fontSize: 20, fontWeight: "700", marginTop: 16 },
});
