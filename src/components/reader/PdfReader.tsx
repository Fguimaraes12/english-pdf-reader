"use client";

import { usePdfDocument } from "@/hooks/usePdfDocument";
import type { VocabularyEntry } from "@/types/vocabulary";
import { PdfPage } from "./PdfPage";

export function PdfReader({
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
  const state = usePdfDocument(file);

  if (state.status === "loading") return <p className="text-center text-stone-500">Abrindo PDF…</p>;
  if (state.status === "error")
    return (
      <div className="text-center">
        <p>Não consegui abrir este PDF.</p>
        {state.message && (
          <p className="mx-auto mt-2 max-w-md text-xs break-words text-stone-400">Detalhe: {state.message}</p>
        )}
      </div>
    );

  const pages = Array.from({ length: state.pdf.numPages }, (_, index) => index + 1);
  return (
    <>
      {pages.map((pageNumber) => (
        <PdfPage
          key={pageNumber}
          pdf={state.pdf}
          pageNumber={pageNumber}
          aspectRatio={state.aspectRatio}
          marked={readPages.has(pageNumber)}
          onToggleRead={() => onToggleRead(pageNumber)}
          vocabEntries={vocabEntries}
        />
      ))}
    </>
  );
}
