import type { PDFDocumentProxy } from "pdfjs-dist";
import { PDF_WORKER_SRC } from "@/constants";

/** Carrega o pdf.js só no navegador e abre o arquivo. */
export async function loadPdfDocument(file: File): Promise<PDFDocumentProxy> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  return pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
}
