import { dayKey, dayKeyFromISO } from "@mindcocoon/core/dates";
import { feelingsFor } from "@mindcocoon/core/feelings";
import { addMood, changeMood, getMoodState, updateMoodDetails } from "@mindcocoon/core/mood/store";
import { DEFAULT_TAGS } from "@mindcocoon/core/moods";
import type { MoodLog, MoodType } from "@mindcocoon/core/types";
import { VaultLockedError, unlockWithPasscode } from "@mindcocoon/core/vault/session";
import { Check } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { FeelingChips, useFeelingLabels } from "@/components/mood/FeelingChips";
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

/**
 * Choose a mood (and, if you like, a few words), then Save; nothing is kept before that. Every Save
 * is a moment of its own — a day can hold several, and the day is spoken for by its latest. Once
 * saved, the picker folds into one line ("Today: Heavy · Change") showing that latest moment:
 * "Change" corrects it, "Add another moment" starts a new one, and tags and a note go on it.
 */
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
  // Today's latest moment comes from the store, so a moment added elsewhere (Mood tab,
  // wind-down) shows here. The tab can stay mounted for days: yesterday's moments are
  // never today's to change.
  const today = latestToday(logs, now);
  // Writes go one after another, each on the check-in as it is by then (no lost words, no duplicates).
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  // The picker's draft: open while there is no moment today, after "Change" (correcting the
  // latest moment), or after "Add another moment" (a fresh moment alongside the saved ones).
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftMood, setDraftMood] = useState<MoodType | null>(null);
  const [draftFeelings, setDraftFeelings] = useState<string[]>([]);
  const picking = !today || changing || adding;
  const feelingLabels = useFeelingLabels();

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

  function choose(mood: MoodType) {
    setSaveError(null);
    if (mood === draftMood) return;
    // Correcting the latest moment and coming back to its mood brings its saved words back;
    // otherwise only the words that belong to the newly picked mood are kept.
    setDraftFeelings(changing && today && mood === today.mood ? (today.feelings ?? []) : feelingsFor(mood, draftFeelings));
    setDraftMood(mood);
  }

  function startChange() {
    if (!today) return;
    setDraftMood(today.mood);
    setDraftFeelings(today.feelings ?? []);
    setChanging(true);
  }

  /** A new moment alongside today's saved ones: the picker starts empty. */
  function startAdd() {
    setSaveError(null);
    setDraftMood(null);
    setDraftFeelings([]);
    setAdding(true);
  }

  /** Lets the choice go: back to the saved line when changing, or an empty picker on a first check-in. */
  function cancelChange() {
    setSaveError(null);
    setChanging(false);
    setAdding(false);
    setDraftMood(null);
    setDraftFeelings([]);
  }

  /** Keeps the choice until it is really saved: on failure it stays (with a message) to try again. */
  function save() {
    const mood = draftMood;
    if (!mood || saving) return;
    const feelings = draftFeelings;
    setSaving(true);
    setSaveError(null);
    const work = queue.current.then(async () => {
      // Not correcting: this Save is a new moment, kept alongside today's earlier ones.
      if (!changing) return void (await addMood({ mood, tags: [], feelings }));
      const current = latestToday(getMoodState().logs, new Date());
      if (!current) return void (await addMood({ mood, tags: [], feelings }));
      const unchanged = current.mood === mood && (current.feelings ?? []).join() === feelings.join();
      if (unchanged) return;
      // Same mood: keep the moment (id, time); a new mood replaces it (it is a correction).
      const base = current.mood === mood ? current : await changeMood(current, mood);
      await updateMoodDetails(base, { tags: base.tags, feelings });
    });
    queue.current = work.catch(() => {});
    work
      .then(() => {
        if (!today) resetDetails();
        setChanging(false);
        setAdding(false);
        setDraftMood(null);
        setDraftFeelings([]);
        setMessage(t.today.saved);
      })
      .catch(() => setSaveError(t.vault.unavailable))
      .finally(() => setSaving(false));
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
      {picking && <Text style={[styles.question, { color: c.mutedForeground }]}>{t.today.checkinQuestion}</Text>}
      {picking ? (
        <>
          <MoodPicker variant="orbs" value={draftMood} onChange={choose} label={t.today.checkinQuestion} />
          {draftMood && <FeelingChips mood={draftMood} value={draftFeelings} onChange={setDraftFeelings} />}
          {draftMood && (
            <Animated.View entering={FadeIn.duration(240)} style={styles.row}>
              <Button disabled={saving} onPress={save}>
                {t.today.saveMood}
              </Button>
              <Button variant="ghost" onPress={cancelChange}>
                {t.common.cancel}
              </Button>
            </Animated.View>
          )}
          {saveError && (
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.sans, fontSize: 15, color: c.destructive }}>
              {saveError}
            </Text>
          )}
        </>
      ) : (
        today && (
          <View style={[styles.summary, { backgroundColor: c.surface }]}>
            <View style={[styles.dot, { backgroundColor: c.mood[today.mood] }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.summaryTitle, { color: c.foreground }]}>
                {t.today.todaySummary.split("{mood}").join(t.mood.states[today.mood].label)}
              </Text>
              {(today.feelings?.length ?? 0) > 0 && (
                <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>{feelingLabels(today.feelings)}</Text>
              )}
            </View>
            <Button variant="ghost" onPress={startChange}>
              {t.today.change}
            </Button>
          </View>
        )
      )}
      {today && !picking && message && (
        <View testID="checkin-message" accessibilityLiveRegion="polite" style={styles.message}>
          <Check size={16} color={c.primary} />
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.primary }}>{message}</Text>
        </View>
      )}
      {today && !picking && !open && (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={startAdd} style={styles.link}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground, textDecorationLine: "underline" }}>
            {t.today.addMoment}
          </Text>
        </Pressable>
      )}
      {today && !picking && !open && (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOpen(true)} style={styles.link}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground, textDecorationLine: "underline" }}>
            {t.today.addDetails}
          </Text>
        </Pressable>
      )}
      {today && !picking && open && (
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
  wrap: { gap: space.md },
  question: { fontFamily: fonts.sans, fontSize: 15 },
  message: { flexDirection: "row", alignItems: "center", gap: 6 },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  details: { gap: space.lg },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  row: { flexDirection: "row", gap: space.md },
  summary: { flexDirection: "row", alignItems: "center", gap: space.md, borderRadius: 16, paddingLeft: space.lg, paddingVertical: space.sm },
  dot: { width: 20, height: 20, borderRadius: 10 },
  summaryTitle: { fontFamily: fonts.sansMedium, fontSize: 16 },
});
