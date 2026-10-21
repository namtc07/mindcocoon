import { getPref, setPref } from "../prefs";
import { withMoment, type ValueMoment } from "./placement";

/** Record a moment of value (once each); it only ever unlocks the quiet Pro offer in Settings. */
export async function noteProMoment(moment: ValueMoment): Promise<void> {
  await setPref("proMoments", withMoment(getPref("proMoments"), moment));
}
