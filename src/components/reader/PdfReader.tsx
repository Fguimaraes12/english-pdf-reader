"use client";

import { usePdfDocument } from "@/hooks/usePdfDocument";
import { PdfPage } from "./PdfPage";

export function PdfReader({ file }: { file: File }) {
  const state = usePdfDocument(file);

  if (state.status === "loading") return <p className="text-center text-stone-500">Abrindo PDF…</p>;
  if (state.status === "error") return <p className="text-center">Não consegui abrir este PDF.</p>;

  const pages = Array.from({ length: state.pdf.numPages }, (_, index) => index + 1);
  return (
    <>
      {pages.map((pageNumber) => (
        <PdfPage key={pageNumber} pdf={state.pdf} pageNumber={pageNumber} aspectRatio={state.aspectRatio} />
      ))}
    </>
  );
}
