import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackupRemote, BackupWraps, RemoteBackup } from "./remote";

/** Supabase-backed remote. RLS limits every query to the signed-in user's own rows. */
export function createSupabaseRemote(supabase: SupabaseClient, userId: string): BackupRemote {
  return {
    async fetch(): Promise<RemoteBackup | null> {
      const { data, error } = await supabase
        .from("vault_backups")
        .select("ciphertext, wraps, updated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ? { ciphertext: data.ciphertext, wraps: data.wraps as BackupWraps, updatedAt: data.updated_at } : null;
    },

    async put(backup) {
      const { error } = await supabase.from("vault_backups").upsert({
        user_id: userId,
        ciphertext: backup.ciphertext,
        wraps: backup.wraps,
        snapshot_version: 1,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },

    async getServerSecret() {
      const existing = await supabase.from("vault_recovery_secrets").select("secret").eq("user_id", userId).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return existing.data.secret as string;
      const created = await supabase.from("vault_recovery_secrets").insert({ user_id: userId }).select("secret").single();
      if (created.error) throw created.error;
      return created.data.secret as string;
    },
  };
}
