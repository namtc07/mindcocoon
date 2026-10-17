import { toast } from "@/components/ui/Toast";
import { audio } from "@/lib/audio";

/** Toggles a sound; a failure (audio session busy, file unreadable) becomes a quiet toast. */
export async function toggleSound(id: string, errorText: string) {
  try {
    await audio.toggle(id);
  } catch {
    toast.show(errorText);
  }
}
