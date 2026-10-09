"use client";

export interface RecentPdf {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  openedAt: number;
  blob: Blob;
  /** Miniatura JPEG da primeira página (dataURL). Ausente em entradas antigas. */
  thumbnail?: string | null;
}

const DB_NAME = "english-pdf-reader";
const STORE_NAME = "recent-pdfs";
const MAX_RECENTS = 8;

function idFor(file: Pick<File, "name" | "size" | "lastModified">): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha ao abrir IndexedDB"));
  });
}

function tx<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result: T;
    try {
      const request = run(store);
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error ?? new Error("Falha no IndexedDB"));
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error ?? new Error("Falha no IndexedDB"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Transação abortada"));
  });
}

/** Guarda o PDF aberto para aparecer em "Abertos recentemente". */
export async function saveRecentPdf(file: File, thumbnail?: string | null): Promise<void> {
  try {
    const db = await openDb();
    try {
      const entry: RecentPdf = {
        id: idFor(file),
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        openedAt: Date.now(),
        blob: file.slice(0, file.size, "application/pdf"),
        thumbnail: thumbnail ?? null,
      };
      await tx(db, "readwrite", (store) => store.put(entry));
      await prune(db);
    } finally {
      db.close();
    }
  } catch (error) {
    console.warn("Não consegui guardar o PDF nos recentes", error);
  }
}

async function prune(db: IDBDatabase): Promise<void> {
  const all = await tx<RecentPdf[]>(db, "readonly", (store) => store.getAll());
  if (all.length <= MAX_RECENTS) return;
  const oldest = all.sort((a, b) => a.openedAt - b.openedAt).slice(0, all.length - MAX_RECENTS);
  await tx(db, "readwrite", (store) => {
    // Mantém a transação viva até apagar todos.
    oldest.forEach((entry) => store.delete(entry.id));
    // Retorna um request válido para o helper (o último delete).
    return store.count();
  });
}

export async function listRecentPdfs(): Promise<RecentPdf[]> {
  try {
    const db = await openDb();
    try {
      const all = await tx<RecentPdf[]>(db, "readonly", (store) => store.getAll());
      return all.sort((a, b) => b.openedAt - a.openedAt);
    } finally {
      db.close();
    }
  } catch {
    return [];
  }
}

export function recentPdfToFile(entry: RecentPdf): File {
  return new File([entry.blob], entry.name, {
    type: "application/pdf",
    lastModified: entry.lastModified,
  });
}

export async function removeRecentPdf(id: string): Promise<void> {
  try {
    const db = await openDb();
    try {
      await tx(db, "readwrite", (store) => store.delete(id));
    } finally {
      db.close();
    }
  } catch (error) {
    console.warn("Não consegui remover o PDF dos recentes", error);
  }
}
