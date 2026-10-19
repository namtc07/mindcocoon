import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ken } from "@/components/art/Ken";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { buy, restore, useIsPro } from "@/lib/purchases/pro";
import { activeStore, type Plan, type PlanId } from "@/lib/purchases/store";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** MindCocoon Pro: what it gives, three plans, Continue and Restore. No pressure, no countdowns. */
export default function ProScreen() {
  const { t } = useI18n();
  const { c } = useTheme();
  const pro = useIsPro();
  const store = activeStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [choice, setChoice] = useState<PlanId>("yearly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    store
      ?.plans()
      .then((p) => live && setPlans(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [store]);

  const label: Record<PlanId, string> = { monthly: t.pro.monthly, yearly: t.pro.yearly, lifetime: t.pro.lifetime };
  const priceLine = (p: Plan) => (p.id === "monthly" ? t.pro.perMonth : p.id === "yearly" ? t.pro.perYear : t.pro.once).replace("{price}", p.price);

  async function go() {
    setBusy(true);
    setMessage(null);
    const result = await buy(choice);
    setBusy(false);
    if (result === "purchased") setMessage(t.pro.thanks);
    else if (result === "failed") setMessage(t.pro.failed);
  }

  async function bringBack() {
    setBusy(true);
    const plan = await restore();
    setBusy(false);
    setMessage(plan ? t.pro.restored : t.pro.nothingToRestore);
  }

  const benefits = [t.pro.noAds, t.pro.mixes, t.pro.future, t.pro.independent];
  return (
    <>
      <StackHeader />
      <Screen title={t.pro.title}>
        <View style={styles.hero}>
          <Ken mood="glad" size={72} />
          <Muted>{t.pro.intro}</Muted>
        </View>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          {benefits.map((b) => (
            <View key={b} style={styles.benefit}>
              <Check size={18} color={c.primary} />
              <Text style={[styles.benefitText, { color: c.foreground }]}>{b}</Text>
            </View>
          ))}
        </View>
        {pro ? (
          <Text accessibilityLiveRegion="polite" style={[styles.message, { color: c.primary }]}>
            {message ?? t.pro.thanks}
          </Text>
        ) : (
          <>
            <View accessibilityRole="radiogroup" accessibilityLabel={t.pro.plansLabel} style={styles.plans}>
              {plans.map((p) => {
                const checked = p.id === choice;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="radio"
                    accessibilityLabel={`${label[p.id]}, ${priceLine(p)}`}
                    accessibilityState={{ checked }}
                    onPress={() => setChoice(p.id)}
                    style={[styles.plan, { borderColor: checked ? c.primary : c.border, backgroundColor: checked ? c.surface : "transparent" }]}
                  >
                    <Text style={[styles.planName, { color: c.foreground }]}>{label[p.id]}</Text>
                    <Text style={[styles.planPrice, { color: c.mutedForeground }]}>{priceLine(p)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button disabled={busy || !store} onPress={() => void go()}>
              {t.pro.continue}
            </Button>
            {message && (
              <Text accessibilityLiveRegion="polite" style={[styles.message, { color: c.foreground }]}>
                {message}
              </Text>
            )}
          </>
        )}
        <Button variant="ghost" disabled={busy || !store} onPress={() => void bringBack()}>
          {t.pro.restore}
        </Button>
        {store?.test && <Text style={[styles.small, { color: c.ember }]}>{t.pro.testNote}</Text>}
        <Text style={[styles.small, { color: c.mutedForeground }]}>{t.pro.terms}</Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: space.lg },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  benefit: { flexDirection: "row", alignItems: "center", gap: space.md },
  benefitText: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
  plans: { gap: space.sm },
  plan: { borderWidth: 1.5, borderRadius: radius.lg, padding: space.lg, gap: 2 },
  planName: { fontFamily: fonts.sansMedium, fontSize: 16 },
  planPrice: { fontFamily: fonts.sans, fontSize: 14 },
  message: { fontFamily: fonts.sansMedium, fontSize: 15, textAlign: "center" },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
});
