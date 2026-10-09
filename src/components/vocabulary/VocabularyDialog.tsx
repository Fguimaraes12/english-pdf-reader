"use client";

import { useEffect, useRef, useState } from "react";
import { safeStorage } from "@/lib/storage/safeStorage";
import type { VocabularyEntry, VocabularyStatus } from "@/types/vocabulary";
import { VocabularyCard } from "./VocabularyCard";

interface VocabularyDialogProps {
  open: boolean;
  entries: VocabularyEntry[];
  apiKey: string;
  onStatusChange: (word: string, status: VocabularyStatus) => void;
  onNoteChange: (word: string, note: string) => void;
  onRemove: (word: string) => void;
  onClose: () => void;
}

interface ModalSize {
  width: number;
  height: number;
}

const SIZE_KEY = "epr_vocab_size";
const MIN_WIDTH = 320;
const MIN_HEIGHT = 280;

function loadSize(): ModalSize | null {
  try {
    const raw = safeStorage.get(SIZE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ModalSize>;
    if (
      typeof parsed.width === "number" &&
      typeof parsed.height === "number" &&
      parsed.width >= MIN_WIDTH &&
      parsed.height >= MIN_HEIGHT
    ) {
      return { width: parsed.width, height: parsed.height };
    }
  } catch {
    // ignora e usa o tamanho padrão
  }
  return null;
}

export function VocabularyDialog({
  open,
  entries,
  apiKey,
  onStatusChange,
  onNoteChange,
  onRemove,
  onClose,
}: VocabularyDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ModalSize | null>(null);

  // Restaura o tamanho regulado pelo usuário.
  useEffect(() => {
    if (open) setSize(loadSize());
  }, [open ]);

  // Esc fecha; trava a rolagem do fundo.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  // Salva o tamanho quando o usuário redimensiona (alça no canto inferior direito).
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    let timer: number | null = null;
    const observer = new ResizeObserver(() => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const rect = panel.getBoundingClientRect();
        const next = {
          width: Math.round(Math.max(MIN_WIDTH, rect.width)),
          height: Math.round(Math.max(MIN_HEIGHT, rect.height)),
        };
        setSize((prev) => {
          if (prev && Math.abs(prev.width - next.width) < 2 && Math.abs(prev.height - next.height) < 2) {
            return prev;
          }
          try {
            safeStorage.set(SIZE_KEY, JSON.stringify(next));
          } catch {
            // armazenamento é opcional
          }
          return next;
        });
      }, 300);
    });
    observer.observe(panel);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [open ]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Caderno de vocabulário"
        style={size ? { width: size.width, height: size.height, maxWidth: "calc(100vw - 2rem)" } : undefined}
        className="flex max-h-[90vh] min-h-[280px] w-[94vw] max-w-4xl min-w-[320px] flex-col overflow-hidden rounded-2xl border border-stone-300 bg-white p-5 text-sm text-stone-900 shadow-2xl resize sm:p-6 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
      >
        <div className="flex items-center gap-2">
          <h2 className="mr-auto font-bold">Caderno de vocabulário</h2>
          {entries.length > 0 && (
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900 dark:text-teal-200">
              {entries.length} {entries.length === 1 ? "palavra" : "palavras"}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar caderno"
            title="Fechar"
            className="rounded-full px-2.5 py-1 text-lg leading-none text-stone-500 hover:bg-stone-200 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
          >
            ×
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="mt-3 text-stone-500">
            Nenhuma palavra salva ainda. Selecione uma palavra no texto, traduza e toque em salvar.
          </p>
        ) : (
          <div className="mt-4 grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(min(100%,280px),280px))] content-start gap-3 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <VocabularyCard
                key={entry.word}
                entry={entry}
                apiKey={apiKey}
                onStatusChange={onStatusChange}
                onNoteChange={onNoteChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
