/**
 * Whether the welcome window is on screen — including its closing fade, which on iOS lasts until
 * the Modal's onDismiss. Ads wait for this, since iOS can't present the consent form meanwhile.
 */
let open = false;
const listeners = new Set<() => void>();

export const isWelcomeOpen = () => open;

export function setWelcomeOpen(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((l) => l());
}

export function subscribeWelcome(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
