/**
 * M1 crypto spike: proves @mindcocoon/core's WebCrypto code runs on React Native
 * (react-native-quick-crypto) and is byte-compatible with Node/web.
 */
import { sealSnapshot, openSnapshot, buildSnapshot } from "@mindcocoon/core/backup/snapshot";
import { decryptString, encryptString, fromBase64, importDek, isEnvelope } from "@mindcocoon/core/crypto";
import { getStorage, setStorage } from "@mindcocoon/core/storage/index";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import { unlockWithRecoveryCode } from "@mindcocoon/core/vault/keyring";
import {
  __resetVaultForTests,
  decryptField,
  encryptField,
  getUnlockedDek,
  getVaultState,
  initVault,
  lockVault,
  saveVaultEntry,
  setVaultPasscode,
  unlockWithPasscode,
} from "@mindcocoon/core/vault/session";
import vectors from "./vectors.json";

export interface SpikeResult {
  name: string;
  ok: boolean;
  ms: number;
  detail?: string;
}

const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
const toB64 = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

async function check(name: string, run: () => Promise<string | void>): Promise<SpikeResult> {
  const start = performance.now();
  try {
    const detail = (await run()) ?? undefined;
    return { name, ok: true, ms: Math.round(performance.now() - start), detail };
  } catch (error) {
    return { name, ok: false, ms: Math.round(performance.now() - start), detail: String(error) };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Runs every check in order; later checks still run when earlier ones fail. */
export async function runSpike(): Promise<SpikeResult[]> {
  const results: SpikeResult[] = [];
  // Checks 6–7 use a throwaway in-memory vault; the app's real (SQLite) vault is restored after.
  const realStorage = getStorage();

  results.push(
    await check("1. crypto.subtle + getRandomValues", async () => {
      assert(typeof crypto?.subtle?.importKey === "function", "crypto.subtle missing");
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      assert(bytes.some((b) => b !== 0), "random bytes are all zero");
    }),
  );

  results.push(
    await check("2. PBKDF2-SHA256 ×310000 matches Node", async () => {
      const material = await crypto.subtle.importKey("raw", new TextEncoder().encode("2468"), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: fromBase64(vectors.saltB64), iterations: 310_000, hash: "SHA-256" },
        material,
        256,
      );
      assert(toHex(bits) === vectors.pbkdf2Hex, `got ${toHex(bits).slice(0, 16)}…`);
    }),
  );

  results.push(
    await check("3. AES-GCM opens a Node envelope", async () => {
      const dek = await importDek(fromBase64(vectors.dekB64));
      assert((await decryptString(dek, vectors.envelope)) === "golden", "wrong plaintext");
    }),
  );

  results.push(
    await check("4. Encrypt → decrypt round trip on device", async () => {
      const dek = await importDek(fromBase64(vectors.dekB64));
      const envelope = await encryptString(dek, "xin chào 🌙");
      assert(isEnvelope(envelope) && envelope.split(".").length === 3, "bad envelope shape");
      assert((await decryptString(dek, envelope)) === "xin chào 🌙", "round trip failed");
    }),
  );

  results.push(
    await check("5. Recovery code opens a Node wrap", async () => {
      const unlocked = await unlockWithRecoveryCode(
        { version: 1, recovery: vectors.recovery, autoLockMinutes: 5 },
        vectors.recoveryCode,
      );
      assert(unlocked && toB64(unlocked.raw) === vectors.dekB64, "recovery wrap did not open");
    }),
  );

  results.push(
    await check("6. Vault session: passcode, lock, unlock, fields", async () => {
      setStorage(createLocalAdapter(createMemoryDriver()));
      __resetVaultForTests();
      await initVault();
      assert(getVaultState().status === "unlocked", `status ${getVaultState().status}`);
      await saveVaultEntry({ title: "spike", body: "nhật ký thử" });
      await setVaultPasscode("2468");
      lockVault();
      assert(!(await unlockWithPasscode("0000")), "wrong passcode accepted");
      assert(await unlockWithPasscode("2468"), "right passcode refused");
      assert(getVaultState().entries[0]?.body === "nhật ký thử", "entry not decrypted");
      assert((await decryptField(await encryptField("note"))) === "note", "field round trip failed");
    }),
  );

  results.push(
    await check("7. Backup snapshot seal → open", async () => {
      const dek = getUnlockedDek();
      assert(dek, "vault locked");
      const snapshot = await buildSnapshot();
      const reopened = await openSnapshot(await sealSnapshot(snapshot, dek), dek);
      assert(JSON.stringify(reopened) === JSON.stringify(snapshot), "snapshot differs");
    }),
  );

  results.push(
    await check("8. Phone → Node envelope (verify on the Mac)", async () => {
      const dek = await importDek(fromBase64(vectors.dekB64));
      const envelope = await encryptString(dek, "from-phone");
      console.log(`[spike] PHONE_ENVELOPE ${envelope}`);
      return envelope;
    }),
  );

  setStorage(realStorage);
  __resetVaultForTests();
  await initVault();
  return results;
}
