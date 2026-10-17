import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createBackupEngine } from "@/lib/backup/engine";
import { createSupabaseRemote } from "@/lib/backup/supabase-remote";
import { __resetMoodsForTests, addMood, getMoodState, loadMoods } from "@/lib/mood/store";
import { setStorage } from "@/lib/storage";
import { createMemoryDriver } from "@/lib/storage/driver";
import { createLocalAdapter } from "@/lib/storage/local";
import { __setIterationsForTests } from "@/lib/vault/keyring";
import { __resetVaultForTests, getVaultState, initVault, regenerateRecoveryCode, saveVaultEntry } from "@/lib/vault/session";

/**
 * Runs against the real project with two throwaway users, then deletes them.
 * Never part of `npm test`.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

interface TestUser {
  id: string;
  client: SupabaseClient;
}
const users: TestUser[] = [];

async function makeUser(): Promise<TestUser> {
  const email = `mc-live-${crypto.randomUUID()}@example.com`;
  const password = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = createClient(url, publishable, { auth: { persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  const user = { id: data.user.id, client };
  users.push(user);
  return user;
}

async function newDevice() {
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
  __resetMoodsForTests();
  await initVault();
  await loadMoods();
}

let a: TestUser;
let b: TestUser;

beforeAll(async () => {
  __setIterationsForTests(1_000);
  a = await makeUser();
  b = await makeUser();
});

afterAll(async () => {
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
});

describe("live Supabase", () => {
  let recoveryCode = "";

  it("backs up end-to-end encrypted on first sign-in", async () => {
    await newDevice();
    await saveVaultEntry({ title: "live", body: "a private live entry" });
    await addMood({ mood: "heavy", tags: ["work"], note: "a private live note" });
    recoveryCode = await regenerateRecoveryCode();

    const outcome = await createBackupEngine(createSupabaseRemote(a.client, a.id)).onSignedIn();
    expect(outcome).toBe("pushed");

    const { data } = await a.client.from("vault_backups").select("ciphertext, wraps").eq("user_id", a.id).single();
    expect(data!.ciphertext).toMatch(/^v1\./);
    expect(Object.keys(data!.wraps)).toEqual(["recovery"]);
    for (const plain of ["a private live entry", "a private live note", "heavy"]) {
      expect(JSON.stringify(data)).not.toContain(plain);
    }
  });

  it("generates the recovery secret on the server and refuses a client-chosen one", async () => {
    const secret = await createSupabaseRemote(a.client, a.id).getServerSecret();
    expect(secret).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    const forged = await b.client.from("vault_recovery_secrets").insert({ user_id: b.id, secret: "chosen-by-client" });
    expect(forged.error).not.toBeNull();
  });

  it("keeps one user's rows invisible and untouchable to another", async () => {
    const read = await b.client.from("vault_backups").select("user_id");
    expect(read.data).toEqual([]);
    const secrets = await b.client.from("vault_recovery_secrets").select("user_id").eq("user_id", a.id);
    expect(secrets.data).toEqual([]);

    const update = await b.client.from("vault_backups").update({ ciphertext: "v1.x.y" }).eq("user_id", a.id).select();
    expect(update.data ?? []).toEqual([]);
    const hijack = await b.client
      .from("vault_backups")
      .insert({ user_id: a.id, ciphertext: "v1.x.y", wraps: { recovery: {} } });
    expect(hijack.error).not.toBeNull();
    const del = await b.client.from("vault_backups").delete().eq("user_id", a.id).select();
    expect(del.data ?? []).toEqual([]);

    const still = await a.client.from("vault_backups").select("ciphertext").eq("user_id", a.id).single();
    expect(still.data!.ciphertext).not.toBe("v1.x.y");
  });

  it("restores on a new device with the recovery code", async () => {
    const before = { entries: getVaultState().entries, moods: getMoodState().logs };
    await newDevice();
    const engine = createBackupEngine(createSupabaseRemote(a.client, a.id));
    expect(await engine.onSignedIn()).toBe("restore-available");
    expect(await engine.restore("abandon ".repeat(11) + "about")).toBe(false);
    expect(await engine.restore(recoveryCode)).toBe(true);
    expect(getVaultState().entries).toEqual(before.entries);
    expect(getMoodState().logs).toEqual(before.moods);
  });

  it("removes backups and secrets when the account is deleted", async () => {
    await admin.auth.admin.deleteUser(a.id);
    users.splice(users.indexOf(a), 1);
    const backups = await admin.from("vault_backups").select("user_id").eq("user_id", a.id);
    const secrets = await admin.from("vault_recovery_secrets").select("user_id").eq("user_id", a.id);
    expect(backups.data).toEqual([]);
    expect(secrets.data).toEqual([]);
  });
});
