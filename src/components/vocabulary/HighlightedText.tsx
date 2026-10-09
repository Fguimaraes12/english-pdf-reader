"use client";

import { useMemo } from "react";
import { highlightKey, splitHighlightParts } from "@/lib/vocab/highlightWords";
import type { VocabularyEntry } from "@/types/vocabulary";
import { useVocabTooltip } from "./VocabTooltip";

interface HighlightedTextProps {
  text: string;
  entries: Map<string, VocabularyEntry>;
  /**
   * Modo sobreposição (camada de texto do PDF): o texto é transparente e o
   * canvas está embaixo, então o grifo precisa ser translúcido e sem padding
   * para não cobrir a palavra nem deslocar o layout medido do span.
   */
  overlay?: boolean;
}

/** Renderiza o texto grifando de azul claro as palavras salvas no caderno. */
export function HighlightedText({ text, entries, overlay = false }: HighlightedTextProps) {
  const tooltip = useVocabTooltip();
  const keys = useMemo(
    () => new Set([...entries.keys()].filter((k) => !/\s/.test(k))),
    [entries],
  );
  if (keys.size === 0) return <>{text}</>;

  const parts = splitHighlightParts(text, keys);
  return (
    <>
      {parts.map((part, index) => {
        if (!part.marked) return <span key={index}>{part.text}</span>;
        const entry = entries.get(highlightKey(part.text));
        if (!entry) return <span key={index}>{part.text}</span>;
        const show = (target: HTMLElement) => tooltip.showTip(entry, target.getBoundingClientRect());
        return (
          <mark
            key={index}
            onMouseEnter={(e) => show(e.currentTarget)}
            onMouseLeave={tooltip.hideTip}
            onClick={(e) => show(e.currentTarget)}
            className={
              overlay
                ? "cursor-pointer bg-blue-400/40 text-inherit"
                : "cursor-pointer rounded-[3px] bg-blue-200 px-px text-inherit dark:bg-blue-800"
            }
          >
            {part.text}
          </mark>
        );
      })}
    </>
  );
}
