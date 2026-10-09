"use client";

import { useEffect } from "react";
import { SpeakerIcon } from "@/components/ui/SpeakerIcon";
import { SpeedControl } from "@/components/speech/SpeedControl";
import { useSpeech } from "@/hooks/useSpeech";
import type { TextSelection, TranslationState } from "@/types/translation";

interface TranslationPopoverProps {
  selection: TextSelection | null;
  state: TranslationState;
  apiKey: string;
  onTranslate: () => void;
  onSave: () => void;
  saved: boolean;
  onLearned: () => void;
  learned: boolean;
}

const HALF_WIDTH = 160;

export function TranslationPopover({ selection, state, apiKey, onTranslate, onSave, saved, onLearned, learned }: TranslationPopoverProps) {
  const { supported, isSpeaking, audioError, speak, stop, rate, setRate } = useSpeech(apiKey);

  useEffect(() => {
    if (!selection) stop();
  }, [selection, stop]);

  if (!selection) return null;

  const left = Math.max(HALF_WIDTH, Math.min(window.innerWidth - HALF_WIDTH, selection.anchor.x));

  return (
    <div
      role="status"
      // Mantém a seleção ativa ao tocar no menu.
      onMouseDown={(event) => event.preventDefault()}
      style={{ left, top: selection.anchor.y + 10 }}
      className="absolute z-20 -translate-x-1/2"
    >
      {state.status === "idle" ? (
        <button
          onClick={onTranslate}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Traduzir
        </button>
      ) : (
        <div className="min-w-44 max-w-[min(300px,90vw)] rounded-xl border border-stone-300 bg-white px-4 py-3 text-center shadow-xl dark:border-stone-600 dark:bg-stone-800">
          {state.status === "loading" && <p className="text-sm text-stone-500">Traduzindo…</p>}
          {state.status === "streaming" && (
            <>
              <p className="font-serif text-lg font-semibold">
                {state.partial.translation || "…"}
                <span className="animate-pulse text-teal-600">▍</span>
              </p>
              {state.partial.pronunciation && (
                <div className="text-teal-700 dark:text-teal-300">
                  <span>{state.partial.pronunciation}</span>
                </div>
              )}
            </>
          )}
          {state.status === "error" && <p className="text-sm text-stone-500">{state.message}</p>}
          {state.status === "success" && (
            <>
              <p className="font-serif text-lg font-semibold">{state.data.translation}</p>
              <div className="flex items-center justify-center gap-2 text-teal-700 dark:text-teal-300">
                <span>{state.data.pronunciation}</span>
                {supported && (
                  <button
                    onClick={() => speak(selection.text)}
                    aria-label="Ouvir pronúncia"
                    aria-pressed={isSpeaking}
                    className={`rounded-full p-1.5 hover:bg-teal-50 dark:hover:bg-stone-700 ${isSpeaking ? "animate-pulse bg-teal-100 dark:bg-stone-700" : ""}`}
                  >
                    <SpeakerIcon />
                  </button>
                )}
              </div>
              {audioError && <p className="mt-1 text-xs text-red-500">{audioError}</p>}
              {supported && (
                <div className="mt-1.5 flex justify-center">
                  <SpeedControl rate={rate} onChange={setRate} />
                </div>
              )}
              <button
                onClick={onSave}
                disabled={saved}
                className={`mt-2 w-full rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  saved
                    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-200"
                    : "border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
                }`}
              >
                {saved ? "✓ Salva no caderno" : "Salvar no caderno"}
              </button>
              {!/\s/.test(selection.text) ? null : (
              <button
                onClick={onLearned}
                disabled={learned}
                className={`mt-1.5 w-full rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  learned
                    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-200"
                    : "border-green-600 text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/40"
                }`}
              >
                {learned ? "✓ Dominada" : "Aprendi ✓"}
              </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
