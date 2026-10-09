export interface Translation {
  translation: string;
  pronunciation: string;
}

export type TranslationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "streaming"; partial: Translation }
  | { status: "success"; data: Translation }
  | { status: "error"; message: string };

export interface TextSelection {
  text: string;
  /** Trecho ao redor da seleção, enviado ao modelo para desambiguar. */
  context: string;
  /** Posição (em coordenadas da página) onde o popover deve aparecer. */
  anchor: { x: number; y: number };
}
