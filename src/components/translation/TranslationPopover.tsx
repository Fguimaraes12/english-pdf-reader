"use client";

import { useEffect } from "react";
import { SpeakerIcon } from "@/components/ui/SpeakerIcon";
import { useSpeech } from "@/hooks/useSpeech";
import type { TextSelection, TranslationState } from "@/types/translation";

interface TranslationPopoverProps {
  selection: TextSelection | null;
  state: TranslationState;
  apiKey: string;
  onTranslate: () => void;
}

const HALF_WIDTH = 160;

export function TranslationPopover({ selection, state, apiKey, onTranslate }: TranslationPopoverProps) {
  const { supported, isSpeaking, audioError, speak, stop } = useSpeech(apiKey);

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
          className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm text-white shadow-lg dark:bg-stone-100 dark:text-stone-900"
        >
          Traduzir
        </button>
      ) : (
        <div className="min-w-44 max-w-[min(300px,90vw)] rounded-xl border border-stone-300 bg-white px-4 py-3 text-center shadow-xl dark:border-stone-600 dark:bg-stone-800">
          {state.status === "loading" && <p className="text-sm text-stone-500">Traduzindo…</p>}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
