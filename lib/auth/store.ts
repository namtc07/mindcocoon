import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";

/** Optional account (16+). Exposed as an external store for useSyncExternalStore. */

export type AuthStatus = "disabled" | "loading" | "signed-out" | "signed-in";

export interface AuthState {
  status: AuthStatus;
  user: { id: string; email?: string } | null;
}

const INITIAL: AuthState = { status: "loading", user: null };
let state: AuthState = INITIAL;
let session: Session | null = null;
let started = false;
const listeners = new Set<() => void>();
const signInListeners = new Set<() => void>();

function setSession(next: Session | null) {
  const wasSignedIn = state.status === "signed-in";
  session = next;
  state = next
    ? { status: "signed-in", user: { id: next.user.id, email: next.user.email } }
    : { status: "signed-out", user: null };
  listeners.forEach((l) => l());
  if (next && !wasSignedIn) signInListeners.forEach((l) => l());
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getAuthState = () => state;
export const getAuthServerState = () => INITIAL;

/** Fires once each time the user becomes signed in (used by backup). */
export function onSignedIn(listener: () => void) {
  signInListeners.add(listener);
  return () => {
    signInListeners.delete(listener);
  };
}

export function getAccessToken(): string | null {
  return session?.access_token ?? null;
}

export function initAuth() {
  if (started) return;
  started = true;
  const supabase = getSupabase();
  if (!supabase) {
    state = { status: "disabled", user: null };
    listeners.forEach((l) => l());
    return;
  }
  supabase.auth.getSession().then(({ data }) => setSession(data.session));
  supabase.auth.onAuthStateChange((_event, next) => setSession(next));
}

function requireClient() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Accounts are not configured");
  return supabase;
}

export async function signInWithEmail(email: string) {
  const { error } = await requireClient().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string) {
  const { error } = await requireClient().auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
}

export async function signInWithGoogle(locale: string) {
  const { error } = await requireClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/${locale}/auth/callback` },
  });
  if (error) throw error;
}

export async function signOut() {
  await requireClient().auth.signOut();
}

/** Deletes the account server-side (cascades backups and secrets), then signs out. */
export async function deleteAccount() {
  const token = getAccessToken();
  if (!token) throw new Error("Not signed in");
  const response = await fetch("/api/account", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Account deletion failed (${response.status})`);
  await signOut();
}

export function __resetAuthForTests() {
  state = INITIAL;
  session = null;
  started = false;
  listeners.clear();
  signInListeners.clear();
}
