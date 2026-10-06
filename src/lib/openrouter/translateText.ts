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
