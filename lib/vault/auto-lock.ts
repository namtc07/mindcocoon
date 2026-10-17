import { getVaultState, isIdleTooLong, lockVault, subscribeVault } from "@mindcocoon/core/vault/session";

/**
 * Web auto-lock: locks a passcode vault after inactivity, or when the tab comes
 * back after being hidden longer than the limit.
 */
let lastActivity = 0;
let hiddenAt: number | null = null;
let started = false;

function markActivity() {
  lastActivity = Date.now();
}

export function startVaultAutoLock() {
  if (started || typeof window === "undefined") return;
  started = true;
  markActivity();
  let wasUnlocked = getVaultState().status === "unlocked";
  subscribeVault(() => {
    const unlocked = getVaultState().status === "unlocked";
    if (unlocked && !wasUnlocked) markActivity();
    wasUnlocked = unlocked;
  });
  for (const evt of ["pointerdown", "keydown", "scroll"]) {
    window.addEventListener(evt, markActivity, { passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
    } else if (hiddenAt !== null) {
      if (isIdleTooLong(hiddenAt, Date.now(), getVaultState())) lockVault();
      hiddenAt = null;
    }
  });
  window.setInterval(() => {
    if (isIdleTooLong(lastActivity, Date.now(), getVaultState())) lockVault();
  }, 30_000);
}
