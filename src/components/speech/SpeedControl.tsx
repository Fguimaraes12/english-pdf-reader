"use client";

import { SPEECH_RATES, type SpeechRate } from "@/lib/speech/speechRate";

interface SpeedControlProps {
  rate: SpeechRate;
  onChange: (rate: SpeechRate) => void;
}

/** Seletor compacto de velocidade da voz (0.5x, 1x, 2x). Vale para todos os áudios. */
export function SpeedControl({ rate, onChange }: SpeedControlProps) {
  return (
    <div
      role="group"
      aria-label="Velocidade da voz"
      className="inline-flex overflow-hidden rounded-full border border-stone-300 dark:border-stone-600"
    >
      {SPEECH_RATES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={rate === option}
          className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
            rate === option
              ? "bg-teal-700 text-white"
              : "bg-white text-stone-500 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
          }`}
        >
          {option}x
        </button>
      ))}
    </div>
  );
}
