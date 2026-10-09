"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadVocabulary, saveVocabulary } from "@/lib/storage/vocabulary";
import type { VocabularyEntry, VocabularyStatus } from "@/types/vocabulary";

export function useVocabulary() {
  const [entries, setEntries] = useState<VocabularyEntry[]>(() => loadVocabulary());

  useEffect(() => {
    saveVocabulary(entries);
  }, [entries]);

  /** Adiciona a palavra (ou atualiza tradução/fonética se já existir). */
  const addEntry = useCallback((word: string, translation: string, pronunciation: string) => {
    const key = word.toLowerCase();
    setEntries((prev) => {
      const existing = prev.find((e) => e.word === key);
      if (existing) {
        return prev.map((e) =>
          e.word === key ? { ...e, display: word, translation, pronunciation } : e,
        );
      }
      return [
        { word: key, display: word, translation, pronunciation, status: "nova", note: "", createdAt: Date.now() },
        ...prev,
      ];
    });
  }, []);

  const setStatus = useCallback((word: string, status: VocabularyStatus) => {
    setEntries((prev) => prev.map((e) => (e.word === word ? { ...e, status } : e)));
  }, []);

  /** Marca como dominada (cria a entrada se ainda não existir). */
  const markLearned = useCallback((word: string, translation: string, pronunciation: string) => {
    const key = word.toLowerCase();
    setEntries((prev) => {
      const existing = prev.find((e) => e.word === key);
      if (existing) {
        return prev.map((e) => (e.word === key ? { ...e, status: "dominada" } : e));
      }
      return [
        { word: key, display: word, translation, pronunciation, status: "dominada", note: "", createdAt: Date.now() },
        ...prev,
      ];
    });
  }, []);

  const setNote = useCallback((word: string, note: string) => {
    setEntries((prev) => prev.map((e) => (e.word === word ? { ...e, note } : e)));
  }, []);

  const removeEntry = useCallback((word: string) => {
    setEntries((prev) => prev.filter((e) => e.word !== word));
  }, []);

  const hasWord = useCallback(
    (word: string) => entries.some((e) => e.word === word.toLowerCase()),
    [entries],
  );

  /** Mapa palavra → entrada, para grifo e tooltip no texto. */
  const entryMap = useMemo(() => new Map(entries.map((e) => [e.word, e])), [entries]);

  return { entries, entryMap, addEntry, setStatus, setNote, removeEntry, hasWord, markLearned };
}
