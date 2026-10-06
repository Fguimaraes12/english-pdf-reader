export const DEFAULT_MODEL = "google/gemini-2.5-flash";

export const STORAGE_KEYS = {
  apiKey: "or_key",
  model: "or_model",
  translationCache: "or_cache",
} as const;

export const TRANSLATION_CACHE_LIMIT = 500;
export const MAX_SELECTION_LENGTH = 300;
export const CONTEXT_RADIUS = 80;
export const SELECTION_DEBOUNCE_MS = 250;
export const PDF_WORKER_SRC = "/pdf.worker.min.js";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
export const DEFAULT_TTS_MODEL = "fish-audio/s2.1-pro-free:free";
export const DEFAULT_TTS_VOICE = "b347db033a6549378b48d00acb0d06cd";
