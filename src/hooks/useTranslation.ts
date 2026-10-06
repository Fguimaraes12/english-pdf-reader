"use client";

import { useCallback, useRef, useState } from "react";
import { translateText } from "@/lib/openrouter/translateText";
import { translationCache } from "@/lib/storage/translationCache";
import type { TextSelection, Translation, TranslationState } from "@/types/translation";

interface Options {
  apiKey: string;
  model: string;
}

const isSingleWord = (text: string) => !/\s/.test(text);
const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

export function useTranslation({ apiKey, model }: Options) {
  const [state, setState] = useState<TranslationState>({ status: "idle" });
  const jobs = useRef(new Map<string, Promise<Translation>>());
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);

  /** Busca no cache, reaproveita chamadas em andamento ou chama a API. */
  const request = useCallback(
    (selection: TextSelection): Promise<Translation> => {
      const key = `${selection.text}|${selection.context}`;
      const cached = translationCache.get(key);
      if (cached) return Promise.resolve(cached);

      const running = jobs.current.get(key);
      if (running) return running;

      if (jobs.current.size) controller.current?.abort();
      controller.current = new AbortController();

      const job = translateText({
        text: selection.text,
        context: selection.context,
        apiKey,
        model,
        signal: controller.current.signal,
      }).then((result) => {
        translationCache.set(key, result);
        return result;
      });

      jobs.current.set(key, job);
      job.catch(() => {}).finally(() => jobs.current.delete(key));
      return job;
    },
    [apiKey, model],
  );

  const translate = useCallback(
    async (selection: TextSelection) => {
      if (!apiKey) {
        setState({ status: "error", message: "Cadastre sua chave da OpenRouter em “Configurar chave”." });
        return;
      }
      const id = ++requestId.current;
      setState({ status: "loading" });
      try {
        const data = await request(selection);
        if (id === requestId.current) setState({ status: "success", data });
      } catch (error) {
        if (isAbort(error) || id !== requestId.current) return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Erro inesperado." });
      }
    },
    [apiKey, request],
  );

  /** Começa a traduzir palavras soltas antes de a pessoa tocar em "Traduzir". */
  const prefetch = useCallback(
    (selection: TextSelection) => {
      if (apiKey && isSingleWord(selection.text)) request(selection).catch(() => {});
    },
    [apiKey, request],
  );

  const reset = useCallback(() => {
    requestId.current++;
    setState({ status: "idle" });
  }, []);

  return { state, translate, prefetch, reset };
}
