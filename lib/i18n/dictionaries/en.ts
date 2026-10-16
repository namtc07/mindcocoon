/** Source of truth for UI copy. `vi.ts` must mirror every key. */
export const en = {
  meta: {
    title: "MindCocoon",
    description: "A quiet place to let it out, breathe, and fall asleep a little lighter.",
  },
  nav: {
    today: "Today",
    vent: "Vent",
    mood: "Mood",
    sanctuary: "Sanctuary",
    vault: "Vault",
    settings: "Settings",
    primary: "Main",
  },
  common: {
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    back: "Back",
    loading: "Opening…",
    notFoundTitle: "This page drifted away",
    notFoundBody: "Let's go back somewhere familiar.",
    goToday: "Go to Today",
  },
};

export type Dictionary = typeof en;
