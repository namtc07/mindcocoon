import { dayKey, dayKeyFromISO } from "@mindcocoon/core/dates";
import { addMood, changeMood, getMoodState, updateMoodDetails } from "@mindcocoon/core/mood/store";
import { DEFAULT_TAGS } from "@mindcocoon/core/moods";
import type { MoodLog, MoodType } from "@mindcocoon/core/types";
import { VaultLockedError, unlockWithPasscode } from "@mindcocoon/core/vault/session";
import { Check } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FeelingChips } from "@/components/mood/FeelingChips";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { openVault, useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

function latestToday(logs: MoodLog[], now: Date): MoodLog | null {
  return logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(now)) ?? null;
}

/** One tap saves the mood; tags and a note can be added afterwards to the same check-in. */
export function QuickCheckin() {
  const { t } = useI18n();
  const { c } = useTheme();
  const vault = useVault();
  const now = useNow();
  const locked = vault.status === "locked";
  const { logs } = useMoodLogs();
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  // Today's check-in comes from the store, so a change made elsewhere (Mood tab, wind-down) shows here.
  // The tab can stay mounted for days: yesterday's check-in is never today's to change.
  const today = latestToday(logs, now);
  // Writes go one after another, each on the check-in as it is by then (no lost words, no duplicates).
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [pendingFeelings, setPendingFeelings] = useState<string[] | null>(null);

  function resetDetails() {
    setOpen(false);
    setTags([]);
    setNote("");
    setPasscode("");
  }

  function enqueue(work: () => Promise<unknown>) {
    queue.current = queue.current.then(work).catch(() => setMessage(t.vault.unavailable));
    return queue.current;
  }

  function pick(mood: MoodType) {
    if (!today) resetDetails();
    setPendingFeelings(null);
    void enqueue(async () => {
      const current = latestToday(getMoodState().logs, new Date());
      await (current ? changeMood(current, mood) : addMood({ mood, tags: [] }));
      setMessage(t.today.saved);
    });
  }

  function pickFeelings(feelings: string[]) {
    setPendingFeelings(feelings);
    void enqueue(async () => {
      const current = latestToday(getMoodState().logs, new Date());
      if (current) await updateMoodDetails(current, { tags: current.tags, feelings });
    }).finally(() => setPendingFeelings((p) => (p === feelings ? null : p)));
  }

  async function saveDetails() {
    if (!today) return;
    try {
      await openVault();
      if (note.trim() && locked && !(await unlockWithPasscode(passcode))) {
        setMessage(t.vault.wrongPasscode);
        return;
      }
      await enqueue(() => updateMoodDetails(latestToday(getMoodState().logs, new Date()) ?? today, { tags, note }));
      // The plaintext note isn't kept in the form once it is encrypted and saved.
      setNote("");
      setPasscode("");
      setOpen(false);
      setMessage(t.today.detailsSaved);
    } catch (error) {
      setMessage(error instanceof VaultLockedError ? t.today.noteLocked : t.vault.unavailable);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.question, { color: c.mutedForeground }]}>{t.today.checkinQuestion}</Text>
      <MoodPicker variant="meter" value={today?.mood ?? null} onChange={(m) => void pick(m)} label={t.today.checkinQuestion} />
      <View accessibilityLiveRegion="polite" style={styles.message}>
        {today && message && (
          <>
            <Check size={16} color={c.primary} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.primary }}>{message}</Text>
          </>
        )}
      </View>
      {today && <FeelingChips mood={today.mood} value={pendingFeelings ?? today.feelings ?? []} onChange={pickFeelings} />}
      {today && !open && (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOpen(true)} style={styles.link}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground, textDecorationLine: "underline" }}>
            {t.today.addDetails}
          </Text>
        </Pressable>
      )}
      {today && open && (
        <View style={styles.details}>
          <View style={styles.tags}>
            {DEFAULT_TAGS.map((tag) => (
              <Chip key={tag} selected={tags.includes(tag)} onPress={() => setTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]))}>
                {t.mood.tags[tag]}
              </Chip>
            ))}
          </View>
          <TextField label={t.today.notePlaceholder} placeholder={t.today.notePlaceholder} value={note} onChangeText={setNote} multiline maxLength={280} />
          {locked && note.trim().length > 0 && (
            <TextField label={t.vault.passcodeLabel} placeholder={t.today.noteLocked} value={passcode} onChangeText={setPasscode} secureTextEntry autoComplete="off" />
          )}
          <View style={styles.row}>
            <Button onPress={() => void saveDetails()}>{t.today.saveDetails}</Button>
            <Button variant="ghost" onPress={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  question: { fontFamily: fonts.sans, fontSize: 15 },
  message: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 22 },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  details: { gap: space.lg },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  row: { flexDirection: "row", gap: space.md },
});
