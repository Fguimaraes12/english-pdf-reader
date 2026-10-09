import type { ExtractedDocument } from "@/types/pdf";

/** Limite de documentos guardados: cada um pode ter imagens em dataURL (pesadas). */
const MAX_CACHED_DOCUMENTS = 3;

const cache = new Map<string, ExtractedDocument>();

type FileIdentity = Pick<File, "name" | "size" | "lastModified">;

/** Chave estável por arquivo: trocar de aba e voltar reaproveita a extração. */
export function fileKeyOf(file: FileIdentity | null): string | null {
  if (!file) return null;
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(0, 80);
  return `${safeName}_${file.size}_${file.lastModified}`;
}

export function getCachedDocument(key: string | null): ExtractedDocument | undefined {
  if (!key) return undefined;
  const doc = cache.get(key);
  if (doc) {
    // LRU: recém-usado vai para o fim.
    cache.delete(key);
    cache.set(key, doc);
  }
  return doc;
}

export function setCachedDocument(key: string | null, doc: ExtractedDocument): void {
  if (!key) return;
  cache.delete(key);
  cache.set(key, doc);
  while (cache.size > MAX_CACHED_DOCUMENTS) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}
