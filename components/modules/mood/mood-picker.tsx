"use client";

import { useRef, type KeyboardEvent } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { MOODS } from "@/lib/moods";
import { cn } from "@/lib/utils";
import type { MoodType } from "@/types";

interface MoodPickerProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
  size?: "md" | "lg";
  label: string;
  disabled?: boolean;
}

/** Five coloured states as a radio group (arrow keys move between them). */
export function MoodPicker({ value, onChange, size = "md", label, disabled }: MoodPickerProps) {
  const { t } = useI18n();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    MOODS.findIndex((m) => m.id === value),
  );

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + MOODS.length) % MOODS.length;
    refs.current[next]?.focus();
    onChange(MOODS[next].id);
  }

  return (
    <div role="radiogroup" aria-label={label} className="grid max-w-md grid-cols-5 gap-1 sm:gap-3">
      {MOODS.map((mood, index) => {
        const selected = mood.id === value;
        const copy = t.mood.states[mood.id];
        return (
          <button
            key={mood.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={copy.label}
            title={copy.description}
            tabIndex={index === activeIndex ? 0 : -1}
            disabled={disabled}
            data-mood={mood.id}
            onClick={() => onChange(mood.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className="group flex min-w-0 flex-col items-center gap-2 rounded-xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <span
              aria-hidden
              className={cn(
                "block rounded-full transition-[transform,box-shadow] duration-300 group-hover:scale-105",
                size === "lg" ? "size-11 sm:size-12" : "size-9",
                selected && "scale-110 ring-2 ring-foreground/80 ring-offset-4 ring-offset-background",
              )}
              style={{ backgroundColor: mood.color }}
            />
            <span
              className={cn(
                "text-center text-xs leading-tight text-muted-foreground transition-colors",
                selected && "text-foreground",
              )}
            >
              {copy.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
