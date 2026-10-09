"use client";

interface ReadMarkProps {
  pageNumber: number;
  marked: boolean;
  onToggle: () => void;
}

/**
 * Botão circular de "página lida" + borda verde com margem leve
 * sobre o container da página. Requer o pai com `relative`.
 */
export function ReadMark({ pageNumber, marked, onToggle }: ReadMarkProps) {
  const label = marked
    ? `Página ${pageNumber} marcada como lida — clique para desmarcar`
    : `Marcar página ${pageNumber} como lida`;

  return (
    <>
      {marked && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1.5 z-10 rounded-xl border-[3px] border-green-500"
        />
      )}
      <button
        type="button"
        onClick={onToggle}
        title={label}
        aria-label={label}
        aria-pressed={marked}
        className={`absolute -top-3 -right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-md transition-colors ${
          marked
            ? "border-green-600 bg-green-500 text-white hover:bg-green-600"
            : "border-stone-300 bg-white text-stone-400 hover:border-green-500 hover:text-green-600 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-green-500"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
          <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}
