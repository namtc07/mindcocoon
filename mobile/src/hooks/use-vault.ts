import { getVaultServerState, getVaultState, initVault, subscribeVault, type VaultState } from "@mindcocoon/core/vault/session";
import { useEffect, useSyncExternalStore } from "react";

/**
 * A failure to open the vault (e.g. the Keychain/Keystore is temporarily unreadable) is shown
 * as "unavailable" with a retry — never as "locked", which would invite a passcode reset.
 * Every screen opens the vault through openVault() so the flag stays true to the last attempt.
 */
let failed = false;
let opening = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function openVault(): Promise<void> {
  opening = true;
  emit();
  try {
    await initVault();
    failed = false;
  } catch (error) {
    console.warn("Vault failed to open", error);
    failed = true;
    throw error;
  } finally {
    opening = false;
    emit();
  }
}

// Opened by any other route (unlock, recovery, a direct initVault): no longer unavailable.
subscribeVault(() => {
  if (failed && getVaultState().status === "unlocked") {
    failed = false;
    emit();
  }
});

function subscribeFlags(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const retry = () => void openVault().catch(() => {});

export type MobileVaultState = Omit<VaultState, "status"> & { status: VaultState["status"] | "unavailable"; retry: () => void };

export function useVault(): MobileVaultState {
  const state = useSyncExternalStore(subscribeVault, getVaultState, getVaultServerState);
  const isFailed = useSyncExternalStore(subscribeFlags, () => failed, () => false);
  const isOpening = useSyncExternalStore(subscribeFlags, () => opening, () => false);
  useEffect(retry, []);
  // While an open is in flight, core's interim "locked" must not flash the unlock/forgot screen.
  const status = isFailed ? "unavailable" : isOpening && state.status === "locked" ? "loading" : state.status;
  return { ...state, status, retry };
}

export function __resetVaultHookForTests() {
  failed = false;
  opening = false;
}
