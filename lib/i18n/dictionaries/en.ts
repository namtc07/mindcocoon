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
  mood: {
    states: {
      peaceful: { label: "Peaceful", description: "Settled, quiet inside" },
      hopeful: { label: "Hopeful", description: "A little light ahead" },
      numb: { label: "Numb", description: "Flat, far away from it all" },
      heavy: { label: "Heavy", description: "Weighed down, tired" },
      anxious: { label: "Anxious", description: "Restless, on edge" },
    },
    tags: {
      work: "Work",
      relationship: "Relationship",
      solitude: "Solitude",
      family: "Family",
      health: "Health",
      study: "Study",
    },
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
