"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getVaultServerState,
  getVaultState,
  initVault,
  startVaultAutoLock,
  subscribeVault,
} from "@/lib/vault";

export function useVault() {
  const state = useSyncExternalStore(subscribeVault, getVaultState, getVaultServerState);
  useEffect(() => {
    initVault().catch((error) => console.error("Vault failed to open", error));
    startVaultAutoLock();
  }, []);
  return state;
}
