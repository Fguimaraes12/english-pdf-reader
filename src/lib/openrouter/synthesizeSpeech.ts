import { DEFAULT_TTS_MODEL, DEFAULT_TTS_VOICE, OPENROUTER_SPEECH_URL } from "@/constants";

export class SpeechError extends Error {}

interface SynthesizeParams {
  text: string;
  apiKey: string;
  model?: string;
  voice?: string;
  speed?: number;
  signal?: AbortSignal;
}

/** Chama o TTS da OpenRouter e devolve o áudio em MP3. */
export async function synthesizeSpeech({
  text,
  apiKey,
  model = DEFAULT_TTS_MODEL,
  voice = DEFAULT_TTS_VOICE,
  speed = 0.95,
  signal,
}: SynthesizeParams): Promise<Blob> {
  const clean = text.trim().slice(0, 400);
  if (!clean) throw new SpeechError("Texto vazio.");
  if (!apiKey) throw new SpeechError("Cadastre sua chave da OpenRouter em “Configurar chave”.");

  let response: Response;
  try {
    response = await fetch(OPENROUTER_SPEECH_URL, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "Leitor de ingles",
      },
      body: JSON.stringify({
        model,
        input: clean,
        voice,
        response_format: "mp3",
        speed,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new SpeechError("Não consegui conectar à OpenRouter para gerar o áudio.");
  }

  if (response.status === 401) {
    throw new SpeechError("Chave inválida para gerar áudio. Confira em “Configurar chave”.");
  }
  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data.error?.message ?? "";
    } catch {
      // resposta é binária ou ilegível
    }
    throw new SpeechError(`Erro do TTS (${response.status}). ${detail}`.trim());
  }

  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength) throw new SpeechError("Áudio vazio retornado pelo TTS.");
  return new Blob([buffer], { type: "audio/mpeg" });
}
