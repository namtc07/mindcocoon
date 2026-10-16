/**
 * Phrase lists for the on-device risk check. Every entry is in normalized form
 * (see normalizeForMatch: lowercase, no diacritics, single spaces).
 *
 * MUST be reviewed by a native speaker and a mental-health professional before
 * launch (docs/LAUNCH_CHECKLIST.md). False positives only cost one tap
 * ("Continue releasing"); false negatives are covered by the always-visible help link.
 */

export const RISK_PHRASES = {
  vi: [
    "khong muon song",
    "chang muon song",
    // Texting negations common among teens and young adults.
    "ko muon song",
    "k muon song",
    "hong muon song",
    "khg muon song",
    "kh muon song",
    "chan song",
    "khong thiet song",
    "chang thiet song",
    "khong muon ton tai",
    "khong con ly do de song",
    "muon chet",
    "chet quach di",
    "tu sat",
    "tu ket lieu",
    "ket lieu ban than",
    "ket thuc cuoc doi",
    "ket thuc cuoc song",
    "lam hai ban than",
    "tu lam dau minh",
    "tu lam dau ban than",
    "rach tay",
    "muon bien mat mai mai",
    // Unaccented "tu tu" also means "slowly", so it only counts with intent words.
    "muon tu tu",
    "tinh tu tu",
    "dinh tu tu",
    "nghi den tu tu",
  ],
  en: [
    "kill myself",
    "end my life",
    "ending my life",
    "want to die",
    "wanna die",
    "end it all",
    "kms",
    "dont want to live",
    "do not want to live",
    "no reason to live",
    "better off dead",
    "suicide",
    "suicidal",
    "hurt myself",
    "self harm",
  ],
};

/** Accented forms matched on the original text (their unaccented form is ambiguous). */
export const ACCENTED_RISK_PHRASES = ["tự tử", "tự vẫn"];

/** Everyday hyperbole removed before matching, so it never triggers the card. */
export const EXCLUSIONS = [
  "cuoi muon chet",
  "met muon chet",
  "doi muon chet",
  "nong muon chet",
  "so muon chet",
  "chan muon chet",
  "buon ngu muon chet",
  "ngon muon chet",
];
