"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getCachedDocument, setCachedDocument } from "@/lib/pdf/extractCache";
import { extractPdfContent } from "@/lib/pdf/extractPdfContent";
import { getStoredExtract, setStoredExtract } from "@/lib/pdf/extractStore";
import type { PdfContentState } from "@/types/pdf";

/**
 * Extrai texto + imagens do PDF em segundo plano, com progresso e cancelamento.
 * `cacheKey` identifica o arquivo: se já extraído, retorna o cache na hora,
 * sem passar pelo loading de novo (ex: alternar PDF original ↔ texto extraído).
 */
export function usePdfContent(pdf: PDFDocumentProxy | null, cacheKey: string | null): PdfContentState {
  const [state, setState] = useState<PdfContentState>(() => {
    const hit = getCachedDocument(cacheKey);
    return hit ? { status: "ready", document: hit } : { status: "idle" };
  });

  useEffect(() => {
    if (!pdf) {
      const hit = getCachedDocument(cacheKey);
      setState(hit ? { status: "ready", document: hit } : { status: "idle" });
      return;
    }
    const hit = getCachedDocument(cacheKey);
    if (hit) {
      setState({ status: "ready", document: hit });
      return;
    }
    let cancelled = false;
    setState({ status: "loading", progress: 0 });

    (async () => {
      try {
        // 1) Disco: reabrir o livro reaproveita a extração salva.
        const stored = await getStoredExtract(cacheKey);
        if (cancelled) return;
        if (stored) {
          setCachedDocument(cacheKey, stored);
          setState({ status: "ready", document: stored });
          return;
        }
        // 2) Extrai do zero e guarda (memória + disco).
        const document = await extractPdfContent(pdf, (done, total) => {
          if (!cancelled) setState({ status: "loading", progress: Math.round((done / total) * 100) });
        });
        setCachedDocument(cacheKey, document);
        void setStoredExtract(cacheKey, document);
        if (!cancelled) setState({ status: "ready", document });
      } catch (error) {
        console.error("Falha ao extrair conteúdo do PDF", error);
        if (!cancelled) setState({ status: "error", message: "Não consegui extrair o conteúdo deste PDF." });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf, cacheKey]);

  return state;
}
