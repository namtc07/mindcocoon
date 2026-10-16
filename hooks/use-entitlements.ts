"use client";

import { useSyncExternalStore } from "react";
import {
  getEntitlements,
  getServerEntitlements,
  subscribeEntitlements,
} from "@/lib/entitlements";

export function useEntitlements() {
  return useSyncExternalStore(subscribeEntitlements, getEntitlements, getServerEntitlements);
}
