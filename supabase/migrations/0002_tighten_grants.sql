-- Supabase grants ALL on new public tables to anon/authenticated by default, which made the
-- column-level grants in 0001 ineffective (e.g. a client could choose its own recovery secret).
-- Revoke everything, then grant exactly what the app uses. RLS policies are unchanged.

revoke all on public.vault_backups, public.vault_recovery_secrets, public.app_opens from anon, authenticated;

grant select, insert, update, delete on public.vault_backups to authenticated;

grant select on public.vault_recovery_secrets to authenticated;
grant insert (user_id) on public.vault_recovery_secrets to authenticated;

grant insert (device_id, hour_bucket, locale) on public.app_opens to anon, authenticated;
