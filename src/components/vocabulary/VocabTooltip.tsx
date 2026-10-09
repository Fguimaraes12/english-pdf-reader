"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SpeakerIcon } from "@/components/ui/SpeakerIcon";
import { SpeedControl } from "@/components/speech/SpeedControl";
import { useSpeech } from "@/hooks/useSpeech";
import type { VocabularyEntry } from "@/types/vocabulary";

interface Tip {
  entry: VocabularyEntry;
  x: number;
  y: number;
  above: boolean;
}

interface VocabTooltipApi {
  showTip: (entry: VocabularyEntry, rect: DOMRect) => void;
  hideTip: () => void;
}

const VocabTooltipContext = createContext<VocabTooltipApi | null>(null);

export function useVocabTooltip(): VocabTooltipApi {
  const ctx = useContext(VocabTooltipContext);
  if (!ctx) throw new Error("useVocabTooltip fora do VocabTooltipProvider");
  return ctx;
}

const CARD_WIDTH = 260;

export function VocabTooltipProvider({
  apiKey,
  onLearned,
  children,
}: {
  apiKey: string;
  onLearned: (word: string) => void;
  children: ReactNode;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<number | null>(null);
  const { supported, isSpeaking, speak, rate, setRate } = useSpeech(apiKey);

  const cancelHide = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const showTip = useCallback(
    (entry: VocabularyEntry, rect: DOMRect) => {
      cancelHide();
      const x = Math.max(
        CARD_WIDTH / 2 + 8,
        Math.min(window.innerWidth - CARD_WIDTH / 2 - 8, rect.left + rect.width / 2),
      );
      const above = rect.bottom + 8 + 220 > window.innerHeight && rect.top > 240;
      setTip({ entry, x, y: above ? rect.top - 8 : rect.bottom + 8, above });
    },
    [cancelHide],
  );

  const hideTip = useCallback(() => {
    cancelHide();
    timer.current = window.setTimeout(() => setTip(null), 150);
  }, [cancelHide]);

  return (
    <VocabTooltipContext.Provider value={{ showTip, hideTip }}>
      {children}
      {tip && (
        <div
          role="status"
          onMouseEnter={cancelHide}
          onMouseLeave={() => setTip(null)}
          style={{
            left: tip.x,
            top: tip.y,
            width: CARD_WIDTH,
            transform: tip.above ? "translate(-50%, -100%)" : "translateX(-50%)",
          }}
          className="fixed z-40 rounded-xl border border-stone-300 bg-white px-4 py-3 text-left shadow-xl dark:border-stone-600 dark:bg-stone-800"
        >
          <p className="font-serif text-base font-bold">{tip.entry.display}</p>
          <p className="text-sm text-stone-700 dark:text-stone-200">{tip.entry.translation}</p>
          <div className="mt-1 flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
            <span>{tip.entry.pronunciation}</span>
            {supported && (
              <button
                type="button"
                onClick={() => speak(tip.entry.display)}
                aria-label={`Ouvir ${tip.entry.display}`}
                className={`rounded-full p-1 hover:bg-teal-50 dark:hover:bg-stone-700 ${isSpeaking ? "animate-pulse bg-teal-100 dark:bg-stone-700" : ""}`}
              >
                <SpeakerIcon />
              </button>
            )}
            {supported && <SpeedControl rate={rate} onChange={setRate} />}
          </div>
          {tip.entry.note && (
            <p className="mt-1.5 border-t border-stone-200 pt-1.5 text-xs text-stone-500 italic dark:border-stone-700">
              {tip.entry.note}
            </p>
          )}
          {tip.entry.status === "dominada" ? (
            <p className="mt-2 w-full rounded-lg bg-green-50 px-3 py-1.5 text-center text-sm font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
              ✓ Dominada
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                onLearned(tip.entry.word);
                setTip(null);
              }}
              className="mt-2 w-full rounded-lg border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/40"
            >
              Aprendi ✓
            </button>
          )}
        </div>
      )}
    </VocabTooltipContext.Provider>
  );
}
