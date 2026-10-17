import { getVaultServerState, getVaultState, initVault, subscribeVault } from "@mindcocoon/core/vault/session";
import { useEffect, useSyncExternalStore } from "react";

export function useVault() {
  const state = useSyncExternalStore(subscribeVault, getVaultState, getVaultServerState);
  useEffect(() => {
    initVault().catch((error) => console.warn("Vault failed to open", error));
  }, []);
  return state;
}
