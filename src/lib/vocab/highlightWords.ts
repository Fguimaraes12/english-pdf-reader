export interface HighlightPart {
  text: string;
  /** Verdadeiro quando o trecho é uma palavra salva no caderno. */
  marked: boolean;
}

export function highlightKey(token: string): string {
  return token.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

function lookupKey(token: string): string {
  return highlightKey(token);
}

/**
 * Divide o texto preservando espaços e pontuação, marcando as palavras
 * que estão no caderno (comparação sem maiúsculas e sem pontuação colada).
 * Expressões com espaço salvas no caderno não são grifadas.
 */
export function splitHighlightParts(text: string, words: Set<string>): HighlightPart[] {
  if (!text || words.size === 0) return [{ text, marked: false }];
  return text.split(/(\s+)/).map((part) => {
    if (!part || /^\s+$/.test(part)) return { text: part, marked: false };
    const key = lookupKey(part);
    return { text: part, marked: key.length > 0 && words.has(key) };
  });
}
