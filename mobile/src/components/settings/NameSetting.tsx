import { MAX_NAME_LENGTH } from "@mindcocoon/core/onboarding";
import { useState } from "react";
import { Text, View } from "react-native";
import { TextField } from "@/components/ui/TextField";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Optional name for Today's greeting; saved when editing ends, removed when emptied. */
export function NameSetting() {
  const { t } = useI18n();
  const { c } = useTheme();
  const [draft, setDraft] = useState(() => getPref("name") ?? "");
  function save() {
    const name = draft.trim().slice(0, MAX_NAME_LENGTH);
    setDraft(name);
    void setPref("name", name || undefined);
  }
  return (
    <View style={{ gap: space.xs }}>
      <TextField label={t.settings.nameLabel} showLabel value={draft} onChangeText={setDraft} onEndEditing={save} maxLength={MAX_NAME_LENGTH} autoComplete="given-name" />
      <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{t.settings.nameHint}</Text>
    </View>
  );
}
