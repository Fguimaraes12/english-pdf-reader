"use client";

import { useCallback } from "react";
import { DEFAULT_MODEL, STORAGE_KEYS } from "@/constants";
import { useStoredString } from "./useStoredString";

export interface Settings {
  apiKey: string;
  model: string;
}

export function useSettings() {
  const [apiKey, setApiKey] = useStoredString(STORAGE_KEYS.apiKey, "");
  const [model, setModel] = useStoredString(STORAGE_KEYS.model, DEFAULT_MODEL);

  const save = useCallback(
    (next: Settings) => {
      setApiKey(next.apiKey.trim());
      setModel(next.model.trim() || DEFAULT_MODEL);
    },
    [setApiKey, setModel],
  );

  return { apiKey, model, save };
}
