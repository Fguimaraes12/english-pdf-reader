"use client";

import { useCallback, useState } from "react";
import { safeStorage } from "@/lib/storage/safeStorage";

/** Número persistido no navegador (zoom, tamanho de fonte, etc). */
export function useSetting(key: string, defaultValue: number): [number, (value: number) => void] {
  const [value, setValue] = useState<number>(() => {
    try {
      const raw = safeStorage.get(key);
      const parsed = raw !== null ? Number(raw) : NaN;
      return Number.isFinite(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (next: number) => {
      setValue(next);
      try {
        safeStorage.set(key, String(next));
      } catch {
        // armazenamento é opcional
      }
    },
    [key],
  );

  return [value, set];
}
