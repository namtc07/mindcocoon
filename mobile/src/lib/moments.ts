import { createSealedList } from "./sealed-list";

/** The jar of light moments: small good things, encrypted, brought back on a heavy day. */
const store = createSealedList<{ kind: "moment" }>("moments:v1");

export const moments = {
  ...store,
  add: (text: string, now = new Date()) => store.add(text, { kind: "moment" }, now),
};

/** Kept at least this long before Kén may bring it back (yesterday's moment isn't a memory yet). */
export const MIN_AGE_MS = 3 * 24 * 60 * 60 * 1000;
