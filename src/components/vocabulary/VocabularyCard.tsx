"use client";

import { useEffect, useState } from "react";
import { SpeakerIcon } from "@/components/ui/SpeakerIcon";
import { SpeedControl } from "@/components/speech/SpeedControl";
import { useSpeech } from "@/hooks/useSpeech";
import type { VocabularyEntry, VocabularyStatus } from "@/types/vocabulary";

interface VocabularyCardProps {
  entry: VocabularyEntry;
  apiKey: string;
  onStatusChange: (word: string, status: VocabularyStatus) => void;
  onNoteChange: (word: string, note: string) => void;
  onRemove: (word: string) => void;
}

const STATUS_STYLES: Record<VocabularyStatus, string> = {
  nova: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700",
  aprendendo:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700",
  dominada:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
};

const STATUSES: { value: VocabularyStatus; label: string }[] = [
  { value: "nova", label: "Nova" },
  { value: "aprendendo", label: "Aprendendo" },
  { value: "dominada", label: "Dominada" },
];

export function VocabularyCard({ entry, apiKey, onStatusChange, onNoteChange, onRemove }: VocabularyCardProps) {
  const { supported, isSpeaking, speak, rate, setRate } = useSpeech(apiKey);
  const [note, setNote] = useState(entry.note);

  useEffect(() => {
    setNote(entry.note);
  }, [entry.note, entry.word]);

  return (
    <article className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg font-bold">{entry.display}</h3>
          <p className="text-stone-700 dark:text-stone-200">{entry.translation}</p>
          <div className="mt-1 flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
            <span>{entry.pronunciation}</span>
            {supported && (
              <button
                type="button"
                onClick={() => speak(entry.display)}
                aria-label={`Ouvir ${entry.display}`}
                className={`rounded-full p-1.5 hover:bg-teal-100 dark:hover:bg-stone-700 ${isSpeaking ? "animate-pulse bg-teal-100 dark:bg-stone-700" : ""}`}
              >
                <SpeakerIcon />
              </button>
            )}
            {supported && <SpeedControl rate={rate} onChange={setRate} />}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(entry.word)}
          aria-label={`Remover ${entry.display}`}
          title="Remover do caderno"
          className="rounded-full px-2 py-0.5 text-lg leading-none text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-700"
        >
          ×
        </button>
      </div>

      <div className="mt-3 flex gap-1.5" role="group" aria-label="Status de aprendizado">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusChange(entry.word, value)}
            aria-pressed={entry.status === value}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              entry.status === value
                ? STATUS_STYLES[value]
                : "border-stone-300 text-stone-500 hover:border-stone-400 dark:border-stone-600 dark:text-stone-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => {
          if (note !== entry.note) onNoteChange(entry.word, note);
        }}
        rows={2}
        placeholder="Escreva um macete para lembrar…"
        aria-label={`Anotação sobre ${entry.display}`}
        className="mt-3 w-full resize-y rounded-lg border border-stone-300 bg-white p-2 text-sm placeholder:text-stone-400 dark:border-stone-600 dark:bg-stone-800 dark:placeholder:text-stone-500"
      />
    </article>
  );
}
