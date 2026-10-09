import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import type { ExtractedBlock, ExtractedDocument, ExtractedImage, ExtractedPage } from "@/types/pdf";

/** Ops do PDF.js que representam pintura de imagem. */
const IMAGE_OPS = new Set([
  83, // paintImageMaskXObject
  84, // paintImageMaskXObjectGroup
  85, // paintImageXObject
  86, // paintInlineImageXObject
  87, // paintInlineImageXObjectGroup
  88, // paintImageXObjectRepeat
  89, // paintImageMaskXObjectRepeat
]);

const MIN_IMAGE_SIZE = 8;
const MAX_IMAGES_PER_PAGE = 20;

interface RawImage {
  width: number;
  height: number;
  kind?: number;
  data?: Uint8ClampedArray | Uint8Array | number[] | null;
  bitmap?: ImageBitmap | HTMLImageElement | HTMLCanvasElement | null;
}

/** Parágrafo com a posição vertical (Y do PDF: maior = mais acima na página). */
interface Paragraph {
  text: string;
  y: number;
}

/** Agrupa os itens de texto em linhas (por Y) e depois em parágrafos (por gap vertical). */
function groupTextIntoParagraphs(content: TextContent): Paragraph[] {
  const items = (content.items as TextItem[]).filter((item) => item.str?.trim());
  if (items.length === 0) return [];

  type Line = { y: number; x: number; height: number; parts: { x: number; text: string }[] };
  const lines: Line[] = [];
  const Y_TOLERANCE = 2.5;

  const sorted = [...items].sort((a, b) => {
    const ay = a.transform[5];
    const by = b.transform[5];
    if (Math.abs(ay - by) > Y_TOLERANCE) return by - ay; // Y de baixo-pra-cima: maior primeiro
    return a.transform[4] - b.transform[4];
  });

  for (const item of sorted) {
    const [, , , , x, y] = item.transform;
    const height = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 10;
    const line = lines.find((l) => Math.abs(l.y - y) <= Y_TOLERANCE);
    if (line) {
      line.parts.push({ x, text: item.str });
      line.parts.sort((p1, p2) => p1.x - p2.x);
    } else {
      lines.push({ y, x, height, parts: [{ x, text: item.str }] });
    }
  }

  lines.sort((a, b) => b.y - a.y);
  const lineTexts = lines.map((l) =>
    l.parts
      .map((p) => p.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  // Quebra em parágrafos quando o gap vertical é grande ou a linha termina com pontuação forte.
  // Guarda o Y da primeira linha (topo do parágrafo) para intercalar com as imagens.
  const paragraphs: Paragraph[] = [];
  let current = "";
  let currentY = 0;
  let prevY: number | null = null;
  let prevHeight = 12;

  lines.forEach((line, index) => {
    const text = lineTexts[index];
    if (!text) return;
    if (prevY === null) {
      current = text;
      currentY = line.y;
    } else {
      const gap = prevY - line.y;
      const isNewParagraph = gap > prevHeight * 1.6 || /[.!?:;]$/.test(current) && gap > prevHeight * 1.1;
      if (isNewParagraph) {
        if (current.trim()) paragraphs.push({ text: current.trim(), y: currentY });
        current = text;
        currentY = line.y;
      } else {
        const needsHyphenFix = current.endsWith("-");
        current = needsHyphenFix
          ? current.slice(0, -1) + text
          : current + (/-$/.test(current) ? "" : " ") + text;
      }
    }
    prevY = line.y;
    prevHeight = line.height || prevHeight;
  });
  if (current.trim()) paragraphs.push({ text: current.trim(), y: currentY });

  return paragraphs.filter((p) => p.text);
}

function isRawImage(value: unknown): value is RawImage {
  if (!value || typeof value !== "object") return false;
  const img = value as RawImage;
  return (
    typeof img.width === "number" &&
    typeof img.height === "number" &&
    ("data" in img || "bitmap" in img)
  );
}

type Matrix6 = [number, number, number, number, number, number];

const IDENTITY_MATRIX: Matrix6 = [1, 0, 0, 1, 0, 0];

/** Concatena duas matrizes PDF [a,b,c,d,e,f]. */
function concatMatrices(m1: Matrix6, m2: Matrix6): Matrix6 {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/** Topo da imagem no espaço do usuário: a imagem ocupa o quadrado [0,0]-[1,1] transformado pela CTM. */
function imageTopFromCtm(ctm: Matrix6): number {
  const y00 = ctm[5];
  const y10 = ctm[1] + ctm[5];
  const y01 = ctm[3] + ctm[5];
  const y11 = ctm[1] + ctm[3] + ctm[5];
  return Math.max(y00, y10, y01, y11);
}

interface ImagePlacement {
  key: string;
  name?: string;
  raw?: RawImage;
  rawList?: RawImage[];
  y: number;
}

interface OperatorListLike {
  fnArray: number[] | Uint8Array | number[];
  argsArray: unknown[][];
}

/**
 * Percorre a lista de operadores rastreando a matriz de transformação (save/restore/transform)
 * para descobrir ONDE cada imagem aparece na página (topo Y). Sem isso, texto entre duas
 * imagens seria perdido — as imagens cairiam todas no começo ou no fim.
 */
function analyzeImagePlacements(opList: OperatorListLike, pageNumber: number): ImagePlacement[] {
  const placements: ImagePlacement[] = [];
  const stack: Matrix6[] = [];
  let ctm: Matrix6 = [...IDENTITY_MATRIX];

  const { fnArray, argsArray } = opList;
  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i] as number;
    const args = argsArray[i] as unknown[];

    if (fn === 10 || fn === 74) {
      // save / paintFormXObjectBegin
      stack.push([...ctm] as Matrix6);
      continue;
    }
    if (fn === 11 || fn === 75) {
      // restore / paintFormXObjectEnd
      ctm = stack.pop() ?? ([...IDENTITY_MATRIX] as Matrix6);
      continue;
    }
    if (fn === 12) {
      // transform: concatena [a,b,c,d,e,f]
      const m = args as unknown as number[];
      if (m.length >= 6) {
        ctm = concatMatrices(ctm, [m[0], m[1], m[2], m[3], m[4], m[5]]);
      }
      continue;
    }
    if (!IMAGE_OPS.has(fn) || !args?.length) continue;

    const first = args[0];
    if (typeof first === "string") {
      if (fn === 88 || fn === 89) {
        // Repeat: várias posições [x1,y1,x2,y2...] no espaço atual.
        const positions = args[3] as number[] | undefined;
        let y = -Infinity;
        if (Array.isArray(positions)) {
          for (let p = 1; p < positions.length; p += 2) {
            const px = positions[p - 1] ?? 0;
            const py = positions[p] ?? 0;
            y = Math.max(y, ctm[1] * px + ctm[3] * py + ctm[5]);
          }
        }
        placements.push({
          key: first,
          name: first,
          y: Number.isFinite(y) ? y : imageTopFromCtm(ctm),
        });
      } else {
        placements.push({ key: first, name: first, y: imageTopFromCtm(ctm) });
      }
    } else if (Array.isArray(first)) {
      const raws = (first as unknown[]).filter(isRawImage);
      if (raws.length > 0) {
        placements.push({
          key: `p${pageNumber}-group-${i}`,
          rawList: raws,
          y: imageTopFromCtm(ctm),
        });
      }
    } else if (isRawImage(first)) {
      placements.push({
        key: `p${pageNumber}-inline-${i}`,
        raw: first,
        y: imageTopFromCtm(ctm),
      });
    }
  }
  return placements;
}

function resolveImageObject(page: PDFPageProxy, name: string): Promise<RawImage | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (img: RawImage | null) => {
      if (!settled) {
        settled = true;
        resolve(img);
      }
    };
    try {
      const direct =
        (page.objs.has(name) ? (page.objs.get(name) as RawImage) : null) ??
        (page.commonObjs.has(name) ? (page.commonObjs.get(name) as RawImage) : null);
      if (direct?.width) {
        done(direct);
        return;
      }
      // Objeto ainda não carregado: registra callback e aguarda.
      page.objs.get(name, (img: RawImage) => done(img ?? null));
      // Fallback: não trava a extração se a imagem nunca chegar.
      window.setTimeout(() => done(null), 1500);
    } catch {
      done(null);
    }
  });
}

/** Desempacota GRAYSCALE_1BPP (1 bit por pixel, bit setado = branco). */
function unpackGrayscale1bpp(src: ArrayLike<number>, width: number, height: number, dest: Uint8ClampedArray): void {
  const stride = (width + 7) >> 3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const byte = src[y * stride + (x >> 3)] ?? 0;
      const white = byte & (128 >> (x & 7)) ? 1 : 0;
      const v = white ? 255 : 0;
      const j = (y * width + x) * 4;
      dest[j] = v;
      dest[j + 1] = v;
      dest[j + 2] = v;
      dest[j + 3] = 255;
    }
  }
}

function rawImageToDataUrl(img: RawImage): string | null {
  try {
    const { width, height } = img;
    if (!width || !height || width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) return null;
    // Evita estouro de memória com imagens gigantes.
    if (width * height > 12_000_000) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // No navegador o PDF.js entrega ImageBitmap em vez do buffer cru.
    if (img.bitmap) {
      ctx.drawImage(img.bitmap, 0, 0, width, height);
      return canvas.toDataURL("image/png");
    }

    const raw = img.data;
    if (!raw) return null;

    const imageData = ctx.createImageData(width, height);
    const pixelCount = width * height;
    // ImageKind do PDF.js: GRAYSCALE_1BPP = 1, RGB_24BPP = 2, RGBA_32BPP = 3.
    let kind = img.kind;
    if (kind !== 1 && kind !== 2 && kind !== 3) {
      if (raw.length === pixelCount * 4) kind = 3;
      else if (raw.length === pixelCount * 3) kind = 2;
      else kind = 1;
    }

    if (kind === 3) {
      // RGBA_32BPP: cópia direta.
      const src = raw as Uint8ClampedArray | Uint8Array | number[];
      if (src.length < pixelCount * 4) return null;
      if (src instanceof Uint8ClampedArray) {
        imageData.data.set(src.subarray(0, pixelCount * 4));
      } else {
        for (let i = 0; i < pixelCount * 4; i++) {
          imageData.data[i] = (src[i] as number) ?? 0;
        }
      }
    } else if (kind === 2) {
      // RGB_24BPP -> RGBA.
      const rgb = raw as Uint8Array | number[] | Uint8ClampedArray;
      if (rgb.length < pixelCount * 3) return null;
      for (let i = 0, j = 0; i < pixelCount * 3; i += 3, j += 4) {
        imageData.data[j] = (rgb[i] as number) ?? 0;
        imageData.data[j + 1] = (rgb[i + 1] as number) ?? 0;
        imageData.data[j + 2] = (rgb[i + 2] as number) ?? 0;
        imageData.data[j + 3] = 255;
      }
    } else {
      // GRAYSCALE_1BPP: bits empacotados por linha.
      unpackGrayscale1bpp(raw as Uint8Array | number[], width, height, imageData.data);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

interface PlacedImage {
  image: ExtractedImage;
  y: number;
}

async function extractPageImages(
  page: PDFPageProxy,
  pageNumber: number,
): Promise<PlacedImage[]> {
  const images: PlacedImage[] = [];
  const seen = new Set<string>();
  try {
    const opList = await page.getOperatorList();
    const placements = analyzeImagePlacements(
      opList as unknown as OperatorListLike,
      pageNumber,
    );
    let count = 0;

    const pushImage = (raw: RawImage, key: string, y: number) => {
      if (count >= MAX_IMAGES_PER_PAGE) return;
      if (seen.has(key)) return;
      seen.add(key);
      if (!raw?.width || (!raw?.data && !raw?.bitmap)) return;
      const dataUrl = rawImageToDataUrl(raw);
      if (!dataUrl) return;
      images.push({
        image: {
          id: `${key}-${count}`,
          pageNumber,
          dataUrl,
          width: raw.width,
          height: raw.height,
        },
        y,
      });
      count++;
    };

    for (const placement of placements) {
      if (count >= MAX_IMAGES_PER_PAGE) break;
      if (placement.name) {
        const raw = await resolveImageObject(page, placement.name);
        if (raw) pushImage(raw, placement.key, placement.y);
      } else if (placement.rawList) {
        placement.rawList.forEach((raw, g) =>
          pushImage(raw, `${placement.key}-${g}`, placement.y),
        );
      } else if (placement.raw) {
        pushImage(placement.raw, placement.key, placement.y);
      }
    }
  } catch (error) {
    console.warn(`Não consegui extrair imagens da página ${pageNumber}`, error);
  }
  return images;
}

async function extractPage(page: PDFPageProxy, pageNumber: number): Promise<ExtractedPage> {
  const [content, placedImages] = await Promise.all([
    page.getTextContent(),
    extractPageImages(page, pageNumber),
  ]);
  const paragraphs = groupTextIntoParagraphs(content);
  const images = placedImages.map((p) => p.image);

  // Intercala texto e imagens de cima para baixo (Y maior = mais acima).
  // Ordenação estável: em empate, o texto vem antes (lido primeiro).
  const blocks: ExtractedBlock[] = [
    ...paragraphs.map((p) => ({ kind: "text" as const, text: p.text, y: p.y })),
    ...placedImages.map((p) => ({ kind: "image" as const, image: p.image, y: p.y })),
  ].sort((a, b) => b.y - a.y);

  return {
    pageNumber,
    paragraphs: paragraphs.map((p) => p.text),
    text: paragraphs.map((p) => p.text).join("\n\n"),
    images,
    blocks,
  };
}

/**
 * Extrai todo o conteúdo manipulável do PDF: texto em ordem de leitura
 * (agrupado em parágrafos) + imagens embutidas como dataURL.
 * Não mexe na renderização atual — roda em paralelo e alimenta o modo leitura.
 */
export async function extractPdfContent(
  pdf: PDFDocumentProxy,
  onProgress?: (done: number, total: number) => void,
): Promise<ExtractedDocument> {
  const numPages = pdf.numPages;
  const pages: ExtractedPage[] = [];

  let title: string | undefined;
  let author: string | undefined;
  try {
    const meta = await pdf.getMetadata().catch(() => null);
    const info = meta?.info as Record<string, unknown> | undefined;
    if (info) {
      if (typeof info.Title === "string") title = info.Title;
      if (typeof info.Author === "string") author = info.Author;
    }
  } catch {
    // metadados são opcionais
  }

  for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    pages.push(await extractPage(page, pageNumber));
    await page.cleanup();
    onProgress?.(pageNumber, numPages);
  }

  return {
    numPages,
    pages,
    metadata: { title, author },
    totalImages: pages.reduce((acc, p) => acc + p.images.length, 0),
  };
}
