"use client";

import { useCallback, useEffect, useState } from "react";
import { safeStorage } from "@/lib/storage/safeStorage";

/** Estado de texto persistido no navegador (lido após a hidratação). */
export function useStoredString(key: string, fallback: string) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const stored = safeStorage.get(key);
    if (stored) setValue(stored);
  }, [key]);

  const update = useCallback(
    (next: string) => {
      setValue(next);
      safeStorage.set(key, next);
    },
    [key],
  );

  return [value, update] as const;
}
