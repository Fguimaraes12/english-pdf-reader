import { PDF_WORKER_SRC } from "@/constants";

const THUMB_MAX_WIDTH = 320;

/**
 * Renderiza a primeira página em miniatura (JPEG) para a capa do card
 * de "Abertos recentemente". Retorna null se falhar.
 */
export async function captureFirstPageThumbnail(file: File): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    try {
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      if (!base.width || !base.height) return null;
      const viewport = page.getViewport({ scale: Math.min(1.5, THUMB_MAX_WIDTH / base.width) });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL("image/jpeg", 0.7);
    } finally {
      await pdf.destroy().catch(() => {});
    }
  } catch (error) {
    console.warn("Não consegui gerar a miniatura do PDF", error);
    return null;
  }
}
