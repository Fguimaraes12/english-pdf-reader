/** Conteúdo extraído de um PDF, pronto para manipulação (leitura, seleção, tradução). */

export interface ExtractedImage {
  id: string;
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ExtractedPage {
  pageNumber: number;
  /** Parágrafos em ordem de leitura. */
  paragraphs: string[];
  /** Texto corrido da página (parágrafos unidos). */
  text: string;
  images: ExtractedImage[];
  /** Texto e imagens intercalados na ordem em que aparecem na página (de cima para baixo). */
  blocks: ExtractedBlock[];
}

/** Bloco de conteúdo na ordem de leitura. `y` é a posição vertical no PDF (maior = mais acima). */
export type ExtractedBlock =
  | { kind: "text"; text: string; y: number }
  | { kind: "image"; image: ExtractedImage; y: number };

export interface ExtractedDocument {
  numPages: number;
  pages: ExtractedPage[];
  /** Metadados básicos, quando disponíveis. */
  metadata: {
    title?: string;
    author?: string;
  };
  totalImages: number;
}

export type PdfContentState =
  | { status: "idle" }
  | { status: "loading"; progress: number }
  | { status: "ready"; document: ExtractedDocument }
  | { status: "error"; message: string };
