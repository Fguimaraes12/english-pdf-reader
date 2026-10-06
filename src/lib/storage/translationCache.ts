import { STORAGE_KEYS, TRANSLATION_CACHE_LIMIT } from "@/constants";
import type { Translation } from "@/types/translation";
import { safeStorage } from "./safeStorage";

let entries: Record<string, Translation> | null = null;

function load(): Record<string, Translation> {
  if (entries) return entries;
  try {
    entries = JSON.parse(safeStorage.get(STORAGE_KEYS.translationCache) ?? "{}");
  } catch {
    entries = {};
  }
  return entries!;
}

export const translationCache = {
  get(key: string): Translation | undefined {
    return load()[key];
  },
  set(key: string, value: Translation): void {
    const all = load();
    all[key] = value;
    const keys = Object.keys(all);
    for (const old of keys.slice(0, Math.max(0, keys.length - TRANSLATION_CACHE_LIMIT))) {
      delete all[old];
    }
    safeStorage.set(STORAGE_KEYS.translationCache, JSON.stringify(all));
  },
};
