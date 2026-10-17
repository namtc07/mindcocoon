import { getVaultState, isIdleTooLong, lockVault } from "@mindcocoon/core/vault/session";

export interface AppStateLike {
  addEventListener(type: "change", listener: (state: string) => void): { remove(): void };
}

/**
 * Mobile auto-lock: a passcode vault locks when the app returns after more than the limit in
 * the background, and after the same idle time in the foreground (touches mark activity).
 */
export function createAutoLock({ appState, now = Date.now }: { appState: AppStateLike; now?: () => number }) {
  let lastActivity = now();
  let leftAt: number | null = null;

  function markActivity() {
    lastActivity = now();
  }

  function check() {
    if (isIdleTooLong(lastActivity, now(), getVaultState())) lockVault();
  }

  function start() {
    markActivity();
    const sub = appState.addEventListener("change", (state) => {
      if (state === "active") {
        if (leftAt !== null && isIdleTooLong(leftAt, now(), getVaultState())) lockVault();
        leftAt = null;
        markActivity();
      } else if (leftAt === null) {
        leftAt = now();
      }
    });
    const timer = setInterval(check, 30_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }

  return { start, markActivity, check };
}
