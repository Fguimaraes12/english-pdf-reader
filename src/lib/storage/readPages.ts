import { safeStorage } from "./safeStorage";

const PREFIX = "epr_read_";

function keyFor(file: File | null): string | null {
  if (!file) return null;
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(0, 80);
  return `${PREFIX}${safeName}_${file.size}_${file.lastModified}`;
}

/** Páginas marcadas como lidas para o arquivo atual. */
export function loadReadPages(file: File | null): number[] {
  const key = keyFor(file);
  if (!key) return [];
  try {
    const raw = safeStorage.get(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => Number.isInteger(n) && (n as number) > 0);
  } catch {
    return [];
  }
}

export function saveReadPages(file: File | null, pages: number[]): void {
  const key = keyFor(file);
  if (!key) return;
  try {
    safeStorage.set(key, JSON.stringify(pages));
  } catch {
    // armazenamento é opcional
  }
}
