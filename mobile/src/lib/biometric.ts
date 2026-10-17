import { unlockWithPasscode } from "@mindcocoon/core/vault/session";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "./prefs";

/**
 * Face ID / fingerprint unlock for a passcode vault. The passcode itself is kept in a
 * Keychain/Keystore item that only opens after biometric authentication, on this device only.
 * Any passcode change, removal, reset or erase deletes it.
 */

export const BIOMETRIC_KEY = "vault-biometric";
export type BiometricMethod = "face" | "fingerprint";

export async function biometricMethod(): Promise<BiometricMethod | null> {
  try {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return null;
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "face";
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "fingerprint";
  } catch {
    // No biometric support reported.
  }
  return null;
}

const options = (prompt?: string): SecureStore.SecureStoreOptions => ({
  requireAuthentication: true,
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  authenticationPrompt: prompt,
});

/** Checks the passcode against the vault, then stores it behind biometrics. */
export async function enableBiometric(passcode: string, prompt?: string): Promise<boolean> {
  if (!(await unlockWithPasscode(passcode))) return false;
  await SecureStore.setItemAsync(BIOMETRIC_KEY, passcode, options(prompt));
  await setPref("biometric", true);
  return true;
}

export async function disableBiometric() {
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY).catch(() => {});
  if (getPref("biometric")) await setPref("biometric", undefined);
}

/** Reading the item shows the Face ID / fingerprint prompt. A stored passcode that no longer opens the vault is deleted. */
export async function unlockWithBiometric(prompt?: string): Promise<"unlocked" | "cancelled" | "failed"> {
  let passcode: string | null;
  try {
    passcode = await SecureStore.getItemAsync(BIOMETRIC_KEY, options(prompt));
  } catch {
    return "cancelled"; // dismissed, locked out or timed out: the passcode field is still there
  }
  if (passcode && (await unlockWithPasscode(passcode))) return "unlocked";
  await disableBiometric();
  return "failed";
}

const enabled = () => getPref("biometric") === true;

export function useBiometricEnabled(): boolean {
  return useSyncExternalStore(subscribePrefs, enabled, enabled);
}
