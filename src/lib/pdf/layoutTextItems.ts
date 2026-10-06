import type { PageViewport } from "pdfjs-dist";
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";

export interface PositionedSpan {
  id: number;
  text: string;
  left: number;
  top: number;
  fontSize: number;
  fontFamily: string;
  transform: string;
}

type Matrix = number[];

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

let measureContext: CanvasRenderingContext2D | null = null;

function measureWidth(text: string, fontSize: number, fontFamily: string): number {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext) return 0;
  measureContext.font = `${fontSize}px ${fontFamily}`;
  return measureContext.measureText(text).width;
}

/** Converte o texto do PDF em spans posicionados sobre a página renderizada. */
export function layoutTextItems(content: TextContent, viewport: PageViewport): PositionedSpan[] {
  const spans: PositionedSpan[] = [];

  content.items.forEach((item, id) => {
    const textItem = item as TextItem;
    if (!textItem.str?.trim()) return;

    const matrix = multiply(viewport.transform, textItem.transform);
    const fontSize = Math.hypot(matrix[2], matrix[3]);
    if (!fontSize) return;

    const style = content.styles[textItem.fontName];
    const fontFamily = style?.fontFamily ?? "sans-serif";
    const ascent = style?.ascent ?? 0.9;

    const naturalWidth = measureWidth(textItem.str, fontSize, fontFamily);
    const targetWidth = textItem.width * viewport.scale;
    const scaleX = naturalWidth > 0 && targetWidth > 0 ? targetWidth / naturalWidth : 1;
    const angle = Math.atan2(matrix[1], matrix[0]);

    spans.push({
      id,
      text: textItem.str,
      left: matrix[4],
      top: matrix[5] - fontSize * ascent,
      fontSize,
      fontFamily,
      transform: `${angle ? `rotate(${angle}rad) ` : ""}scaleX(${scaleX})`,
    });
  });

  return spans;
}
