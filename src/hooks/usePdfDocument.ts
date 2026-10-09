"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdfDocument } from "@/lib/pdf/loadPdfDocument";

type State =
  | { status: "loading" }
  | { status: "error"; message?: string }
  | { status: "ready"; pdf: PDFDocumentProxy; aspectRatio: string };

export function usePdfDocument(file: File): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      try {
        const pdf = await loadPdfDocument(file);
        const { width, height } = (await pdf.getPage(1)).getViewport({ scale: 1 });
        if (!cancelled) setState({ status: "ready", pdf, aspectRatio: `${width} / ${height}` });
      } catch (error) {
        console.error("Falha ao abrir PDF", error);
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error && error.message ? error.message : undefined,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return state;
}
