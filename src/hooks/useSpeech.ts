"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  isSpeechSupported,
  speakEnglishWithFallback,
  stopSpeaking,
} from "@/lib/speech/speakEnglish";
import {
  getSpeechRate,
  setSpeechRate,
  subscribeSpeechRate,
} from "@/lib/speech/speechRate";

export function useSpeech(apiKey = "") {
  const [supported, setSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const rate = useSyncExternalStore(subscribeSpeechRate, getSpeechRate, () => 1 as const);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setSupported(isSpeechSupported());
    // Reavalia quando as vozes terminam de carregar (Chrome).
    const update = () => setSupported(isSpeechSupported());
    try {
      window.speechSynthesis?.addEventListener("voiceschanged", update);
    } catch {
      // ignora
    }
    return () => {
      try {
        window.speechSynthesis?.removeEventListener("voiceschanged", update);
      } catch {
        // ignora
      }
      stopSpeaking();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      setAudioError(null);
      setIsSpeaking(true);
      if (timer.current) window.clearTimeout(timer.current);
      void speakEnglishWithFallback(text, {
        apiKey,
        rate: getSpeechRate(),
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onFallbackError: (message) => setAudioError(message),
      });
      // Segurança: se onend/onerror nunca dispararem (bug do Chrome com fila),
      // não deixa o botão preso no estado "falando".
      const fallbackMs = Math.min(15000, 1500 + text.length * 80);
      timer.current = window.setTimeout(() => setIsSpeaking(false), fallbackMs);
    },
    [apiKey],
  );

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // Botão aparece se há voz local OU chave para o TTS remoto.
  const canSpeak = supported || apiKey.trim().length > 0;

  return { supported: canSpeak, isSpeaking, audioError, speak, stop, rate, setRate: setSpeechRate };
}
