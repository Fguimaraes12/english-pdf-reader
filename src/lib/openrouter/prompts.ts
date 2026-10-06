export const SYSTEM_PROMPT =
  'Traduza inglês para português do Brasil. Responda só JSON: {"translation":"...","pronunciation":"..."}. ' +
  '"translation": tradução do trecho conforme o contexto. ' +
  '"pronunciation": pronúncia do trecho em inglês aportuguesada, com hífens e sílaba tônica em MAIÚSCULAS (equal -> Í-cuol).';

export function buildUserPrompt(text: string, context: string): string {
  return `Trecho: "${text}"\nContexto: "${context}"`;
}
