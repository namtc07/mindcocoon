"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getVaultServerState,
  getVaultState,
  initVault,
  subscribeVault,
} from "@mindcocoon/core/vault/session";
import { startVaultAutoLock } from "@/lib/vault/auto-lock";

export function useVault() {
  const state = useSyncExternalStore(subscribeVault, getVaultState, getVaultServerState);
  useEffect(() => {
    initVault().catch((error) => console.error("Vault failed to open", error));
    startVaultAutoLock();
  }, []);
  return state;
}
