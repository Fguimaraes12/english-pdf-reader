import { safeStorage } from "./safeStorage";
import type { VocabularyEntry } from "@/types/vocabulary";

const KEY = "epr_vocab";

export function loadVocabulary(): VocabularyEntry[] {
  try {
    const raw = safeStorage.get(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is VocabularyEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as VocabularyEntry).word === "string" &&
        typeof (e as VocabularyEntry).translation === "string",
    );
  } catch {
    return [];
  }
}

export function saveVocabulary(entries: VocabularyEntry[]): void {
  try {
    safeStorage.set(KEY, JSON.stringify(entries));
  } catch {
    // armazenamento é opcional
  }
}
