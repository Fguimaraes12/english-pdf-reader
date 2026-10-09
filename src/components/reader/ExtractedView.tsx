"use client";

import { useEffect, useMemo, useState } from "react";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { usePdfContent } from "@/hooks/usePdfContent";
import { useSetting } from "@/hooks/useSetting";
import { fileKeyOf, getCachedDocument, setCachedDocument } from "@/lib/pdf/extractCache";
import { getStoredExtract } from "@/lib/pdf/extractStore";
import type { ExtractedDocument } from "@/types/pdf";
import type { VocabularyEntry } from "@/types/vocabulary";
import { HighlightedText } from "@/components/vocabulary/HighlightedText";
import { ReadMark } from "./ReadMark";

export function ExtractedView({
  file,
  readPages,
  onToggleRead,
  vocabEntries,
}: {
  file: File;
  readPages: Set<number>;
  onToggleRead: (pageNumber: number) => void;
  vocabEntries: Map<string, VocabularyEntry>;
}) {
  const pdfState = usePdfDocument(file);
  const pdf = pdfState.status === "ready" ? pdfState.pdf : null;
  const cacheKey = useMemo(() => fileKeyOf(file), [file]);
  const content = usePdfContent(pdf, cacheKey);

  // Livro já extraído numa sessão anterior: mostra na hora, sem esperar o PDF recarregar.
  const [quickDoc, setQuickDoc] = useState<ExtractedDocument | null>(null);
  useEffect(() => {
    setQuickDoc(getCachedDocument(cacheKey) ?? null);
    let active = true;
    void getStoredExtract(cacheKey).then((stored) => {
      if (!stored) return;
      setCachedDocument(cacheKey, stored);
      if (active) setQuickDoc(stored);
    });
    return () => {
      active = false;
    };
  }, [cacheKey]);

  if (pdfState.status === "loading") {
    // Já extraído antes? Mostra o cache na hora, sem piscar "Abrindo…".
    const hit = quickDoc ?? getCachedDocument(cacheKey);
    if (hit) {
      return <ExtractedDocView doc={hit} readPages={readPages} onToggleRead={onToggleRead} vocabEntries={vocabEntries} />;
    }
    return <p className="text-center text-stone-500">Abrindo PDF…</p>;
  }
  if (pdfState.status === "error") {
    return (
      <div className="text-center">
        <p>Não consegui abrir este PDF.</p>
        {pdfState.message && (
          <p className="mx-auto mt-2 max-w-md text-xs break-words text-stone-400">Detalhe: {pdfState.message}</p>
        )}
      </div>
    );
  }

  if (content.status === "loading" || content.status === "idle") {
    const progress = content.status === "loading" ? content.progress : 0;
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="mb-2 text-stone-600 dark:text-stone-300">
          Extraindo texto e imagens… {progress}%
        </p>
        <div className="h-2 overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
          <div
            className="h-full bg-teal-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (content.status === "error") {
    return <p className="text-center">{content.message}</p>;
  }

  const doc = content.document;
  return <ExtractedDocView doc={doc} readPages={readPages} onToggleRead={onToggleRead} vocabEntries={vocabEntries} />;
}

const MIN_FONT = 0.875;
const MAX_FONT = 1.6;
const FONT_STEP = 0.125;

function ExtractedDocView({
  doc,
  readPages,
  onToggleRead,
  vocabEntries,
}: {
  doc: ExtractedDocument;
  readPages: Set<number>;
  onToggleRead: (pageNumber: number) => void;
  vocabEntries: Map<string, VocabularyEntry>;
}) {
  const [fontSetting, setFontSetting] = useSetting("epr_fontscale", 1);
  const fontScale = Math.min(MAX_FONT, Math.max(MIN_FONT, fontSetting || 1));
  const stepFont = (delta: number) =>
    setFontSetting(Math.round(Math.min(MAX_FONT, Math.max(MIN_FONT, fontScale + delta)) * 1000) / 1000);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-100 px-4 py-2 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
        <span className="mr-auto">
          {doc.numPages} página(s) · {doc.totalImages} imagem(ns) extraída(s)
          {doc.metadata.title ? ` · ${doc.metadata.title}` : ""}
        </span>
        <button
          type="button"
          onClick={() => stepFont(-FONT_STEP)}
          disabled={fontScale <= MIN_FONT}
          aria-label="Diminuir fonte"
          title="Diminuir fonte"
          className="rounded px-1.5 py-0.5 text-xs font-bold hover:bg-stone-200 disabled:opacity-40 dark:hover:bg-stone-700"
        >
          A−
        </button>
        <button
          type="button"
          onClick={() => setFontSetting(1)}
          title="Voltar a 100%"
          aria-label="Tamanho da fonte, clique para voltar a 100%"
          className="min-w-11 rounded px-1 py-0.5 text-center text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-700"
        >
          {Math.round(fontScale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => stepFont(FONT_STEP)}
          disabled={fontScale >= MAX_FONT}
          aria-label="Aumentar fonte"
          title="Aumentar fonte"
          className="rounded px-1.5 py-0.5 text-xs font-bold hover:bg-stone-200 disabled:opacity-40 dark:hover:bg-stone-700"
        >
          A+
        </button>
      </div>

      <div style={{ fontSize: `${Math.round(fontScale * 100)}%` }}>
      {doc.pages.map((page) => (
        <section
          key={page.pageNumber}
          data-extracted-layer
          data-page={page.pageNumber}
          className="relative mb-6 rounded-lg bg-white p-5 shadow dark:bg-stone-900"
        >
          <ReadMark
            pageNumber={page.pageNumber}
            marked={readPages.has(page.pageNumber)}
            onToggle={() => onToggleRead(page.pageNumber)}
          />
          <p className="mb-3 text-xs font-semibold tracking-wide text-stone-400 uppercase">
            Página {page.pageNumber}
          </p>
          {page.blocks.length === 0 && (
            <p className="text-sm text-stone-400 italic">Página sem texto extraível.</p>
          )}
          {page.blocks.map((block, index) =>
            block.kind === "text" ? (
              <p
                key={`t-${index}`}
                className="mb-3 leading-relaxed text-stone-800 dark:text-stone-100"
              >
                <HighlightedText text={block.text} entries={vocabEntries} />
              </p>
            ) : (
              <figure key={block.image.id} className="my-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.image.dataUrl}
                  alt={`Imagem da página ${page.pageNumber}`}
                  width={block.image.width}
                  height={block.image.height}
                  className="mx-auto max-w-full rounded border border-stone-200 dark:border-stone-700"
                  loading="lazy"
                />
                <figcaption className="mt-1 text-center text-xs text-stone-400">
                  Imagem · pág. {page.pageNumber} · {block.image.width}×{block.image.height}
                </figcaption>
              </figure>
            ),
          )}
        </section>
      ))}
      </div>
    </div>
  );
}

