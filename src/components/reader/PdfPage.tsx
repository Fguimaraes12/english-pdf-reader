"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useInView } from "@/hooks/useInView";
import { layoutTextItems, type PositionedSpan } from "@/lib/pdf/layoutTextItems";
import { HighlightedText } from "@/components/vocabulary/HighlightedText";
import type { VocabularyEntry } from "@/types/vocabulary";
import { ReadMark } from "./ReadMark";

interface PdfPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  aspectRatio: string;
  marked: boolean;
  onToggleRead: () => void;
  vocabEntries: Map<string, VocabularyEntry>;
}

const MAX_PIXEL_RATIO = 3;

export function PdfPage({ pdf, pageNumber, aspectRatio, marked, onToggleRead, vocabEntries }: PdfPageProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spans, setSpans] = useState<PositionedSpan[]>([]);
  // Largura real da caixa: re-renderiza nítido se a janela/layout mudar.
  const [boxWidth, setBoxWidth] = useState(0);

  useEffect(() => {
    const holder = ref.current;
    if (!holder) return;
    let timer: number | null = null;
    const update = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => setBoxWidth(holder.clientWidth), 150);
    };
    setBoxWidth(holder.clientWidth);
    const observer = new ResizeObserver(update);
    observer.observe(holder);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [ref]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!inView || !canvas || boxWidth <= 0) return;
    let cancelled = false;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: boxWidth / base.width });
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      await page.render({
        canvasContext: canvas.getContext("2d")!,
        viewport,
        transform: [ratio, 0, 0, ratio, 0, 0],
      }).promise;

      const content = await page.getTextContent();
      if (!cancelled) setSpans(layoutTextItems(content, viewport));
    })().catch((error) => console.error(`Erro na página ${pageNumber}`, error));

    return () => {
      cancelled = true;
    };
  }, [inView, pdf, pageNumber, boxWidth]);

  return (
    <div ref={ref} style={{ aspectRatio }} className="relative mx-auto mb-3 w-full bg-white shadow">
      <ReadMark pageNumber={pageNumber} marked={marked} onToggle={onToggleRead} />
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div data-text-layer className="text-layer absolute inset-0 overflow-hidden leading-none">
        {spans.map((span) => (
          <span
            key={span.id}
            className="absolute origin-top-left cursor-text whitespace-pre text-transparent"
            style={{
              left: span.left,
              top: span.top,
              fontSize: span.fontSize,
              fontFamily: span.fontFamily,
              transform: span.transform,
            }}
          >
            <HighlightedText text={span.text} entries={vocabEntries} overlay />
          </span>
        ))}
      </div>
    </div>
  );
}
