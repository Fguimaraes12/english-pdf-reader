"use client";

import { useEffect, useState, type RefObject } from "react";
import { SELECTION_DEBOUNCE_MS } from "@/constants";
import { readSelection } from "@/lib/selection/readSelection";
import type { TextSelection } from "@/types/translation";

/** Acompanha a seleção de texto dentro do container, com debounce. */
export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  useEffect(() => {
    let timer: number;
    const handleChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => setSelection(readSelection(containerRef.current)),
        SELECTION_DEBOUNCE_MS,
      );
    };
    document.addEventListener("selectionchange", handleChange);
    return () => {
      document.removeEventListener("selectionchange", handleChange);
      window.clearTimeout(timer);
    };
  }, [containerRef]);

  return selection;
}
