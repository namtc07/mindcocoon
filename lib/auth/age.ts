/** The 16+ answer, asked once before any sign-in UI (Nghị định 13/2023). */

export type AgeAnswer = "yes" | "no" | null;

const KEY = "mc:age-ok";
const listeners = new Set<() => void>();

export function getAgeAnswer(): AgeAnswer {
  try {
    const value = localStorage.getItem(KEY);
    return value === "yes" || value === "no" ? value : null;
  } catch {
    return null;
  }
}

export function setAgeAnswer(answer: "yes" | "no") {
  try {
    localStorage.setItem(KEY, answer);
  } catch {
    // Storage blocked: the answer holds for this session.
  }
  listeners.forEach((l) => l());
}

export function subscribeAge(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
