import { getVaultServerState, getVaultState, initVault, subscribeVault, type VaultState } from "@mindcocoon/core/vault/session";
import { useEffect, useSyncExternalStore } from "react";

/**
 * A failure to open the vault (e.g. the Keychain/Keystore is temporarily unreadable) is shown
 * as "unavailable" with a retry — never as "locked", which would invite a passcode reset.
 */
let failed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function open() {
  initVault()
    .then(() => {
      if (failed) {
        failed = false;
        emit();
      }
    })
    .catch((error) => {
      console.warn("Vault failed to open", error);
      failed = true;
      emit();
    });
}

function subscribeFailed(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type MobileVaultState = Omit<VaultState, "status"> & { status: VaultState["status"] | "unavailable"; retry: () => void };

export function useVault(): MobileVaultState {
  const state = useSyncExternalStore(subscribeVault, getVaultState, getVaultServerState);
  const isFailed = useSyncExternalStore(subscribeFailed, () => failed, () => false);
  useEffect(open, []);
  return { ...state, status: isFailed ? "unavailable" : state.status, retry: open };
}

export function __resetVaultHookForTests() {
  failed = false;
}
