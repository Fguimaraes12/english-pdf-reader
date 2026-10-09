"use client";

import { useCallback, useEffect, useState } from "react";
import { loadReadPages, saveReadPages } from "@/lib/storage/readPages";

/** Páginas marcadas como lidas, persistidas por arquivo. */
export function useReadPages(file: File | null) {
  const [readPages, setReadPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    setReadPages(new Set(loadReadPages(file)));
  }, [file]);

  useEffect(() => {
    if (file) saveReadPages(file, [...readPages]);
  }, [file, readPages]);

  const toggle = useCallback((pageNumber: number) => {
    setReadPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
  }, []);

  return { readPages, toggle, readCount: readPages.size };
}
