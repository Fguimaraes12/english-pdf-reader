import type { PDFDocumentProxy } from "pdfjs-dist";
import { PDF_WORKER_SRC } from "@/constants";

/** Carrega o pdf.js só no navegador e abre o arquivo. */
export async function loadPdfDocument(file: File): Promise<PDFDocumentProxy> {
  const buffer = await file.arrayBuffer();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      // Tentativa 1: com worker (fora da thread principal).
      return await pdfjs.getDocument({ data: buffer.slice(0) }).promise;
    } catch (error) {
      if (isStaleChunkError(error)) {
        // O navegador pediu um chunk que o servidor dev não tem mais
        // (servidor antigo, .next corrompido). Não adianta repetir.
        throw new Error(
          "Arquivos do leitor desatualizados. Recarregue a página (Ctrl+Shift+R). " +
            "Se persistir, pare o servidor (Ctrl+C), apague a pasta .next e rode npm run dev de novo.",
        );
      }
      if (attempt === 2) throw error;
      // O PDF.js desabilita o worker com defeito internamente ("fake worker"),
      // então a segunda tentativa roda na thread principal e costuma passar.
      console.warn("Abertura com worker falhou, tentando sem worker", error);
    }
  }
  throw new Error("Não foi possível abrir o PDF.");
}

function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /loading chunk|dynamically imported module|chunkloaderror/i.test(message);
}
