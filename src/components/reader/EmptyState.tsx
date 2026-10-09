import type { RecentPdf } from "@/lib/storage/recentPdfs";

interface EmptyStateProps {
  recents: RecentPdf[];
  onOpenRecent: (entry: RecentPdf) => void;
  onRemoveRecent: (id: string) => void;
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export function EmptyState({ recents, onOpenRecent, onRemoveRecent }: EmptyStateProps) {
  return (
    <div className="mx-auto mt-[10vh] max-w-lg text-center text-stone-500">
      <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Abra um livro em PDF</h2>
      <p>Depois, selecione uma palavra ou frase e toque em “Traduzir”.</p>

      {recents.length > 0 && (
        <div className="mt-8 text-left">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-stone-400 uppercase">
            Abertos recentemente
          </h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recents.map((entry) => (
              <li
                key={entry.id}
                className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-900"
              >
                <button
                  type="button"
                  onClick={() => onOpenRecent(entry)}
                  title={`Abrir ${entry.name}`}
                  className="block w-full cursor-pointer text-left"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    {entry.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={entry.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="rounded bg-stone-300 px-2 py-1 text-xs font-bold text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                          PDF
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p
                      title={entry.name}
                      className="truncate text-sm font-medium text-stone-900 dark:text-stone-100"
                    >
                      {entry.name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {formatSize(entry.size)} · {formatDate(entry.openedAt)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRecent(entry.id)}
                  aria-label={`Remover ${entry.name} dos recentes`}
                  title="Remover"
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/50 px-2 py-0.5 text-lg leading-none text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 focus-visible:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
