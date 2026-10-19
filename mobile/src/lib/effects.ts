import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { audio } from "./audio";

/**
 * Short one-shot sound effects (letting go, breathing cues). With no Sanctuary sound playing they
 * mix with other apps' audio and respect the silent switch; the mixer re-applies its own session
 * (lock-screen controls) on its next sound.
 */
export interface EffectChannel {
  play(source: number, volume: number): Promise<void>;
  stop(): void;
}

const MAX_MS = 6_000;

export function createEffectChannel(): EffectChannel {
  type OneShot = ReturnType<typeof createAudioPlayer>;
  let current: OneShot | null = null;
  let cleanup: ReturnType<typeof setTimeout> | null = null;
  // Bumped by every stop, so a sound still preparing after its screen was left never starts.
  let generation = 0;

  function stop() {
    generation++;
    if (cleanup) clearTimeout(cleanup);
    cleanup = null;
    if (!current) return;
    try {
      current.pause();
      current.remove();
    } catch {
      // Already released.
    }
    current = null;
  }

  async function play(source: number, volume: number) {
    stop();
    const mine = generation;
    try {
      // A playing or paused Sanctuary mix owns the session (and its lock-screen controls): leave it.
      const { playing, held } = audio.getState();
      if (playing.length === 0 && held.length === 0) {
        await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: "mixWithOthers" });
        audio.invalidateSession();
      }
      if (mine !== generation) return;
      const player = createAudioPlayer(source);
      player.volume = volume;
      player.play();
      current = player;
      cleanup = setTimeout(stop, MAX_MS);
    } catch {
      // Effects are a nicety; nothing depends on them.
    }
  }

  return { play, stop };
}
