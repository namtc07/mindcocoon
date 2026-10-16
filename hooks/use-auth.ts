"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getAuthServerState, getAuthState, initAuth, subscribeAuth } from "@/lib/auth/store";

export function useAuth() {
  const state = useSyncExternalStore(subscribeAuth, getAuthState, getAuthServerState);
  useEffect(() => {
    initAuth();
  }, []);
  return state;
}
