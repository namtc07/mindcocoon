import { addMood, changeMood, removeMood } from "@mindcocoon/core/mood/store";
import { DEFAULT_TAGS } from "@mindcocoon/core/moods";
import type { MoodLog, MoodType } from "@mindcocoon/core/types";
import { VaultLockedError, initVault, unlockWithPasscode } from "@mindcocoon/core/vault/session";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** One tap saves the mood; tags and a note can be added afterwards. */
export function QuickCheckin() {
  const { t } = useI18n();
  const { c } = useTheme();
  const vault = useVault();
  const locked = vault.status === "locked";
  const [saved, setSaved] = useState<MoodLog | null>(null);
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function pick(mood: MoodType) {
    const log = saved ? await changeMood(saved, mood) : await addMood({ mood, tags: [] });
    setSaved(log);
    setMessage(t.today.saved);
  }

  async function saveDetails() {
    if (!saved) return;
    try {
      await initVault();
      if (note.trim() && locked && !(await unlockWithPasscode(passcode))) {
        setMessage(t.vault.wrongPasscode);
        return;
      }
      const log = await addMood({ mood: saved.mood, tags, note });
      await removeMood(saved.id);
      setSaved(log);
      setOpen(false);
      setPasscode("");
      setMessage(t.today.detailsSaved);
    } catch (error) {
      setMessage(error instanceof VaultLockedError ? t.today.noteLocked : t.account.error);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.question, { color: c.mutedForeground }]}>{t.today.checkinQuestion}</Text>
      <MoodPicker value={saved?.mood ?? null} onChange={(m) => void pick(m)} label={t.today.checkinQuestion} />
      <View accessibilityLiveRegion="polite" style={styles.message}>
        {message && (
          <>
            <Check size={16} color={c.primary} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.primary }}>{message}</Text>
          </>
        )}
      </View>
      {saved && !open && (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOpen(true)} style={styles.link}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground, textDecorationLine: "underline" }}>
            {t.today.addDetails}
          </Text>
        </Pressable>
      )}
      {saved && open && (
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
