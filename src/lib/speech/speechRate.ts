import { safeStorage } from "@/lib/storage/safeStorage";

export type SpeechRate = 0.5 | 1 | 2;

export const SPEECH_RATES: SpeechRate[] = [0.5, 1, 2];

const STORAGE_KEY = "epr_rate";

function loadInitial(): SpeechRate {
  try {
    const raw = safeStorage.get(STORAGE_KEY);
    const value = raw !== null ? Number(raw) : NaN;
    if (value === 0.5 || value === 1 || value === 2) return value;
  } catch {
    // ignora e usa o padrão
  }
  return 1;
}

let current: SpeechRate = loadInitial();
const listeners = new Set<() => void>();

export function getSpeechRate(): SpeechRate {
  return current;
}

export function setSpeechRate(rate: SpeechRate): void {
  if (rate === current) return;
  current = rate;
  try {
    safeStorage.set(STORAGE_KEY, String(rate));
  } catch {
    // armazenamento é opcional
  }
  listeners.forEach((notify) => notify());
}

export function subscribeSpeechRate(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}
