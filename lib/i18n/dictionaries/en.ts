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
  today: {
    greeting: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
      night: "Still awake? That's okay.",
    },
    promptLabel: "Today's prompt",
    promptAnother: "Another prompt",
    promptWrite: "Write about this",
    checkinQuestion: "How are you, right now?",
    saved: "Saved for today",
    addDetails: "Add tags or a note",
    saveDetails: "Save details",
    detailsSaved: "Details saved",
    notePlaceholder: "A few words, if you want",
    noteLocked: "Unlock your vault to add a note.",
    tiles: {
      ventTitle: "Let it out",
      ventBody: "Write freely, then release it or keep it.",
      breatheTitle: "Breathe for a minute",
      breatheBody: "Four slow boxes of breath.",
      musicTitle: "Tonight's music",
      musicBody: "Soft piano for how you feel.",
    },
  },
  shell: {
    skipToContent: "Skip to content",
    openSettings: "Open settings",
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
