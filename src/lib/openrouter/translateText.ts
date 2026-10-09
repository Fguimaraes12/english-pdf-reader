import { OPENROUTER_URL } from "@/constants";
import type { Translation } from "@/types/translation";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

export class TranslationError extends Error {}

interface TranslateParams {
  text: string;
  context: string;
  apiKey: string;
  model: string;
  signal?: AbortSignal;
}

function postCompletion(body: object, apiKey: string, signal?: AbortSignal) {
  return fetch(OPENROUTER_URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Title": "Leitor de ingles",
    },
    body: JSON.stringify(body),
  });
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    return (await response.json()).error?.message ?? "";
  } catch {
    return "";
  }
}

export async function translateText(params: TranslateParams): Promise<Translation> {
  const { text, context, apiKey, model, signal } = params;
  const body: Record<string, unknown> = {
    model,
    temperature: 0,
    max_tokens: 80,
    reasoning: { enabled: false },
    provider: { sort: "latency" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(text, context) },
    ],
  };

  let response: Response;
  try {
    response = await postCompletion(body, apiKey, signal);
    if (response.status === 400) {
      // Alguns modelos não aceitam os parâmetros opcionais: tenta sem eles.
      delete body.reasoning;
      delete body.provider;
      response = await postCompletion(body, apiKey, signal);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TranslationError(
      "Não consegui conectar à OpenRouter. Confira a internet e desative bloqueadores para esta página.",
    );
  }

  if (response.status === 401) {
    throw new TranslationError("Chave inválida. Confira em “Configurar chave”.");
  }
  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new TranslationError(`Erro da OpenRouter (${response.status}). ${detail}`);
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  const json = raw.match(/\{[\s\S]*\}/);
  if (!json) throw new TranslationError("Resposta inesperada do modelo.");

  const parsed = JSON.parse(json[0]);
  return {
    translation: parsed.translation || "—",
    pronunciation: parsed.pronunciation || "",
  };
}

/** Extrai um campo string de um JSON ainda incompleto (durante o stream). */
function extractPartialField(src: string, field: "translation" | "pronunciation"): string {
  const match = src.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`));
  if (!match) return "";
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1].replace(/\\(.)/g, "$1");
  }
}

function partialFromContent(content: string): Translation {
  const translation = extractPartialField(content, "translation");
  const pronunciation = extractPartialField(content, "pronunciation");
  if (!translation && !pronunciation) {
    // JSON ainda incompleto (ex: '{"transl'): não exibe o fragmento cru.
    if (content.trimStart().startsWith("{")) return { translation: "", pronunciation: "" };
    // Modelo respondeu texto puro em vez de JSON: mostra como chegou.
    if (content.trim()) return { translation: content.trim(), pronunciation: "" };
  }
  return { translation, pronunciation };
}

interface StreamParams extends TranslateParams {
  onToken: (partial: Translation) => void;
}

/**
 * Tradução com streaming (SSE): chama `onToken` a cada pedaço para a
 * interface exibir a tradução em tempo real, sem esperar a resposta completa.
 */
export async function streamTranslateText(params: StreamParams): Promise<Translation> {
  const { text, context, apiKey, model, signal, onToken } = params;

  const makeBody = (withExtras: boolean): Record<string, unknown> => ({
    model,
    temperature: 0,
    max_tokens: 80,
    stream: true,
    ...(withExtras
      ? { reasoning: { enabled: false }, provider: { sort: "latency" } }
      : {}),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(text, context) },
    ],
  });

  let response: Response;
  try {
    response = await postCompletion(makeBody(true), apiKey, signal);
    if (response.status === 400) {
      // Alguns modelos não aceitam os parâmetros opcionais: tenta sem eles.
      response = await postCompletion(makeBody(false), apiKey, signal);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TranslationError(
      "Não consegui conectar à OpenRouter. Confira a internet e desative bloqueadores para esta página.",
    );
  }

  if (response.status === 401) {
    throw new TranslationError("Chave inválida. Confira em “Configurar chave”.");
  }
  if (!response.ok || !response.body) {
    const detail = await readErrorDetail(response);
    throw new TranslationError(`Erro da OpenRouter (${response.status}). ${detail}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload);
          const delta: string = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            content += delta;
            onToken(partialFromContent(content));
          }
        } catch {
          // fragmento de controle/keep-alive: ignora
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    // Rede cortada no meio: se já veio algo, finaliza com o parcial.
    if (!content.trim()) throw error;
  } finally {
    try {
      reader.cancel();
    } catch {}
  }

  const json = content.match(/\{[\s\S]*\}/);
  if (!json) {
    if (content.trim()) return { translation: content.trim(), pronunciation: "" };
    throw new TranslationError("Resposta inesperada do modelo.");
  }
  const parsed = JSON.parse(json[0]);
  return {
    translation: parsed.translation || content.trim() || "—",
    pronunciation: parsed.pronunciation || "",
  };
}
