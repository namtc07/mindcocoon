import type { CompanionState } from "@mindcocoon/core/companion";

/**
 * The contract a home-screen widget reads (see plugins/with-tonight-widget.js): Kén's
 * growth stage and ornament, tonight's prompt in the person's own language, and the day
 * it was written. Small, JSON-only, no journal content, nothing personal beyond a prompt
 * that is the same for everyone with the same seed.
 */
export interface TonightWidgetState {
  version: 1;
  stage: number;
  ornament: CompanionState["ornament"];
  prompt: string;
  updatedOn: string;
}

export function buildTonightWidgetState(state: CompanionState, prompt: string, today: string): TonightWidgetState {
  return { version: 1, stage: state.stage, ornament: state.ornament, prompt, updatedOn: today };
}
