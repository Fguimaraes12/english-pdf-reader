import { CONTEXT_RADIUS, MAX_SELECTION_LENGTH } from "@/constants";
import type { TextSelection } from "@/types/translation";

function extractContext(anchorNode: Node, text: string): string {
  const element = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
  const layer = element?.closest("[data-text-layer], [data-extracted-layer]");
  if (!layer) return "";

  // Modo PDF: spans posicionados; modo extraído: parágrafos + seção da página.
  // No modo PDF lê só os spans posicionados (filhos diretos): o textContent
  // deles já inclui os fragmentos internos e as palavras grifadas (<mark>).
  const full = layer.hasAttribute("data-extracted-layer")
    ? (layer.textContent ?? "").replace(/\s+/g, " ")
    : Array.from(layer.querySelectorAll(":scope > span"))
        .map((span) => span.textContent ?? "")
        .join(" ")
        .replace(/\s+/g, " ");
  const index = full.indexOf(text.slice(0, 30));
  if (index < 0) return full.slice(0, CONTEXT_RADIUS * 2);
  return full.slice(Math.max(0, index - CONTEXT_RADIUS), index + text.length + CONTEXT_RADIUS);
}

/** Lê a seleção atual, se ela estiver dentro do container informado. */
export function readSelection(container: HTMLElement | null): TextSelection | null {
  const selection = window.getSelection();
  if (!container || !selection || selection.isCollapsed) return null;
  if (!selection.anchorNode || !container.contains(selection.anchorNode)) return null;

  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (!text || text.length > MAX_SELECTION_LENGTH) return null;

  const rect = selection.getRangeAt(0).getBoundingClientRect();
  return {
    text,
    context: extractContext(selection.anchorNode, text),
    anchor: {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.bottom + window.scrollY,
    },
  };
}
