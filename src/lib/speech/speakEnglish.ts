import { synthesizeSpeech } from "@/lib/openrouter/synthesizeSpeech";

const ENGLISH_LANG = "en-US";

export const isSpeechSupported = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance !== "undefined";

function getVoices(): SpeechSynthesisVoice[] {
  try {
    return window.speechSynthesis.getVoices();
  } catch {
    return [];
  }
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const normalized = voices.map((v) => ({ voice: v, lang: (v.lang || "").toLowerCase().replace("_", "-") }));
  return (
    normalized.find((v) => v.lang === "en-us")?.voice ??
    normalized.find((v) => v.lang.startsWith("en-"))?.voice ??
    normalized.find((v) => v.lang.startsWith("en"))?.voice ??
    normalized.find((v) => v.voice.default)?.voice
  );
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignora
    }
  }
  stopRemoteAudio();
}

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

function stopRemoteAudio(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      // ignora
    }
    currentAudio = null;
  }
  if (currentAudioUrl) {
    try {
      URL.revokeObjectURL(currentAudioUrl);
    } catch {
      // ignora
    }
    currentAudioUrl = null;
  }
}

interface SpeakOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

/** Fala o texto em inglês, interrompendo qualquer fala anterior. */
export function speakEnglish(text: string, { rate = 0.9, onStart, onEnd }: SpeakOptions = {}): void {
  if (!isSpeechSupported()) return;
  const clean = text.trim();
  if (!clean) return;

  // Interrompe fala anterior e destrava o Chrome (paused fica preso sem resume).
  window.speechSynthesis.cancel();
  try {
    window.speechSynthesis.resume();
  } catch {
    // ignora: alguns browsers não implementam resume
  }

  const doSpeak = (voice: SpeechSynthesisVoice | undefined) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = ENGLISH_LANG;
    utterance.rate = rate;
    if (voice) {
      utterance.voice = voice;
      // Mantém lang coerente com a voz escolhida.
      if (voice.lang) utterance.lang = voice.lang;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  const voices = getVoices();
  const voice = pickEnglishVoice(voices);
  if (voice || voices.length > 0) {
    doSpeak(voice);
    return;
  }

  // Chrome carrega as vozes de forma assíncrona: getVoices() vem vazio no 1º paint.
  let spoken = false;
  const speakOnce = (v: SpeechSynthesisVoice | undefined) => {
    if (spoken) return;
    spoken = true;
    doSpeak(v);
  };

  const handleVoicesChanged = () => {
    speakOnce(pickEnglishVoice(getVoices()));
  };
  window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged, { once: true });
  // Força o browser a carregar as vozes.
  getVoices();

  // Fallback: se o evento não disparar (Linux sem voz instalada, por ex.),
  // tenta falar mesmo sem voz para não deixar o botão “morto”.
  window.setTimeout(() => {
    window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    speakOnce(pickEnglishVoice(getVoices()));
  }, 800);
}

interface FallbackOptions extends SpeakOptions {
  apiKey?: string;
  onFallbackError?: (message: string) => void;
}

/**
 * Tenta a voz local; se não houver voz ou falhar (synthesis-failed no Linux),
 * usa o TTS da OpenRouter com a mesma chave da tradução.
 */
export async function speakEnglishWithFallback(
  text: string,
  { apiKey, rate = 0.9, onStart, onEnd, onFallbackError }: FallbackOptions = {},
): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  stopSpeaking();

  // 1) Sem API local: vai direto ao remoto.
  if (!isSpeechSupported()) {
    await playRemote(clean, { apiKey, rate, onStart, onEnd, onFallbackError });
    return;
  }

  const voices = getVoices();
  // Sem voz local instalada (caso do Linux): não insiste no speechSynthesis.
  if (!voices.length) {
    await playRemote(clean, { apiKey, rate, onStart, onEnd, onFallbackError });
    return;
  }

  // 2) Com voz: tenta local e observa se realmente começa a falar.
  const started = await tryLocal(clean, rate, onStart, onEnd);
  if (started) return;

  // 3) Local falhou: remoto.
  await playRemote(clean, { apiKey, rate, onStart, onEnd, onFallbackError });
}

function tryLocal(clean: string, rate: number, onStart?: () => void, onEnd?: () => void): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };

    try {
      window.speechSynthesis.cancel();
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignora
      }
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = ENGLISH_LANG;
      utterance.rate = rate;
      const voice = pickEnglishVoice(getVoices());
      if (voice) {
        utterance.voice = voice;
        if (voice.lang) utterance.lang = voice.lang;
      }
      utterance.onstart = () => {
        onStart?.();
        finish(true);
      };
      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
        finish(false);
      };
      window.speechSynthesis.speak(utterance);
      // Se nada disparar em 1.8s, considera falha e parte ao remoto.
      window.setTimeout(() => finish(false), 1800);
    } catch {
      finish(false);
    }
  });
}

async function playRemote(
  clean: string,
  { apiKey, rate = 0.9, onStart, onEnd, onFallbackError }: FallbackOptions,
): Promise<void> {
  if (!apiKey) {
    onFallbackError?.("Sem voz local. Cadastre a chave da OpenRouter para usar o áudio remoto.");
    onEnd?.();
    return;
  }
  try {
    onStart?.();
    const blob = await synthesizeSpeech({ text: clean, apiKey, speed: rate });
    stopRemoteAudio();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    currentAudioUrl = url;
    audio.onended = () => {
      stopRemoteAudio();
      onEnd?.();
    };
    audio.onerror = () => {
      stopRemoteAudio();
      onFallbackError?.("Falha ao tocar o áudio remoto.");
      onEnd?.();
    };
    await audio.play();
  } catch (error) {
    stopRemoteAudio();
    const message = error instanceof Error ? error.message : "Falha ao gerar áudio.";
    if (error instanceof DOMException && error.name === "AbortError") {
      onEnd?.();
      return;
    }
    onFallbackError?.(message);
    onEnd?.();
  }
}
