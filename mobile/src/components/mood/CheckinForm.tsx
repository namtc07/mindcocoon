import { addMood } from "@mindcocoon/core/mood/store";
import { DEFAULT_TAGS, isDefaultTag } from "@mindcocoon/core/moods";
import type { MoodType } from "@mindcocoon/core/types";
import { VaultLockedError, unlockWithPasscode } from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FeelingChips } from "@/components/mood/FeelingChips";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { openVault, useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const MAX_CUSTOM_TAGS = 12;

export function useTagLabel() {
  const { t } = useI18n();
  return (tag: string) => (isDefaultTag(tag) ? t.mood.tags[tag] : tag);
}

/** Full check-in: mood, tags (default + up to 12 of your own), and an encrypted note. */
export function CheckinForm() {
  const { t } = useI18n();
  const { c } = useTheme();
  const tagLabel = useTagLabel();
  const vault = useVault();
  const locked = vault.status === "locked";
  const [mood, setMood] = useState<MoodType | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>(() => getPref("customTags") ?? []);
  const [newTag, setNewTag] = useState("");
  const [note, setNote] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addCustomTag() {
    const tag = newTag.trim().slice(0, 24);
    if (!tag || customTags.includes(tag)) return;
    const next = [...customTags, tag].slice(-MAX_CUSTOM_TAGS);
    setCustomTags(next);
    void setPref("customTags", next);
    setTags((cur) => [...cur, tag]);
    setNewTag("");
  }

  async function save() {
    if (!mood) return;
    setError(null);
    try {
      await openVault();
      if (note.trim() && locked && !(await unlockWithPasscode(passcode))) {
        setError(t.vault.wrongPasscode);
        return;
      }
      await addMood({ mood, tags, note, feelings });
      toast.show(t.moodPage.saved);
      setMood(null);
      setTags([]);
      setFeelings([]);
      setNote("");
      setPasscode("");
    } catch (e) {
      setError(e instanceof VaultLockedError ? t.today.noteLocked : t.vault.unavailable);
    }
  }

  return (
    <View accessibilityLabel={t.moodPage.checkIn} style={[styles.card, { backgroundColor: c.surface }]}>
      <Text accessibilityRole="header" style={[styles.h, { color: c.foreground }]}>
        {t.moodPage.checkIn}
      </Text>
      <MoodPicker
        value={mood}
        onChange={(m) => {
          setMood(m);
          setFeelings([]);
        }}
        label={t.today.checkinQuestion}
        variant="orbs"
      />
      {mood && <FeelingChips mood={mood} value={feelings} onChange={setFeelings} />}
      <Text style={[styles.label, { color: c.mutedForeground }]}>{t.moodPage.tagsLabel}</Text>
      <View style={styles.tags}>
        {[...DEFAULT_TAGS, ...customTags].map((tag) => (
          <Chip key={tag} selected={tags.includes(tag)} onPress={() => setTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]))}>
            {tagLabel(tag)}
          </Chip>
        ))}
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField label={t.moodPage.addTag} placeholder={t.moodPage.addTag} value={newTag} onChangeText={setNewTag} maxLength={24} onSubmitEditing={addCustomTag} />
        </View>
        <Button variant="outline" onPress={addCustomTag} disabled={!newTag.trim()}>
          {t.moodPage.addTagButton}
        </Button>
      </View>
      <TextField label={t.moodPage.noteLabel} showLabel value={note} onChangeText={setNote} multiline maxLength={280} />
      {locked && note.trim().length > 0 && (
        <TextField label={t.vault.passcodeLabel} placeholder={t.today.noteLocked} value={passcode} onChangeText={setPasscode} secureTextEntry autoComplete="off" />
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: c.destructive, fontFamily: fonts.sans }}>
          {error}
        </Text>
      )}
      <Button onPress={() => void save()} disabled={!mood}>
        {t.moodPage.save}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.lg },
  h: { fontFamily: fonts.serif, fontSize: 24 },
  label: { fontFamily: fonts.sans, fontSize: 14 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  row: { flexDirection: "row", gap: space.sm, alignItems: "center" },
});
