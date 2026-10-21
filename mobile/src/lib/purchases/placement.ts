/**
 * When Pro may be offered — placement only, never pressure.
 *
 * Pro appears (today: the row in Settings that leads to the Pro screen) only after the
 * person has had a real moment of value here: a first completed wind-down ("sleep-fade"),
 * a first weekly letter read ("letter"), or bumping into the free mix limit ("mix-limit").
 * Never during onboarding or the first session, and never without a store that can sell.
 * Someone who already owns Pro always sees their status row.
 */
export type ValueMoment = "sleep-fade" | "letter" | "mix-limit";

export function withMoment(moments: readonly ValueMoment[] | undefined, moment: ValueMoment): ValueMoment[] {
  return moments?.includes(moment) ? [...moments] : [...(moments ?? []), moment];
}

export function proOfferVisible(input: {
  isPro: boolean;
  storeAvailable: boolean;
  moments: readonly ValueMoment[] | undefined;
  firstRunSeen: boolean;
}): boolean {
  if (input.isPro) return true;
  if (!input.firstRunSeen) return false;
  return input.storeAvailable && (input.moments?.length ?? 0) > 0;
}
