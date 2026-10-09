"use client";

import type { ExtractedDocument } from "@/types/pdf";

const DB_NAME = "english-pdf-reader-extract";
const STORE_NAME = "extracted-docs";
/** Troque se o formato de ExtractedDocument mudar (invalida caches antigos). */
const FORMAT_VERSION = 1;

interface StoredExtract {
  key: string;
  v: number;
  savedAt: number;
  doc: ExtractedDocument;
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
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha ao abrir IndexedDB"));
  });
}

/** Lê a extração guardada (null se não houver ou se o formato mudou). */
export async function getStoredExtract(key: string | null): Promise<ExtractedDocument | null> {
  if (!key) return null;
  try {
    const db = await openDb();
    try {
      const stored = await new Promise<StoredExtract | undefined>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result as StoredExtract | undefined);
        request.onerror = () => reject(request.error ?? new Error("Falha ao ler extração"));
      });
      if (!stored || stored.v !== FORMAT_VERSION) return null;
      return stored.doc ?? null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

/** Guarda a extração. Em falta de espaço, apaga a mais antiga e tenta de novo (1x). */
export async function setStoredExtract(key: string | null, doc: ExtractedDocument): Promise<void> {
  if (!key) return;
  const entry: StoredExtract = { key, v: FORMAT_VERSION, savedAt: Date.now(), doc };
  try {
    await putEntry(entry);
  } catch (error) {
    console.warn("Sem espaço para guardar a extração, limpando a mais antiga", error);
    try {
      await deleteOldest();
      await putEntry(entry);
    } catch (retryError) {
      console.warn("Não consegui guardar a extração", retryError);
    }
  }
}

function putEntry(entry: StoredExtract): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(entry);
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("Falha ao guardar extração"));
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error ?? new Error("Transação abortada"));
        };
      }),
  );
}

async function deleteOldest(): Promise<void> {
  const db = await openDb();
  try {
    const all = await new Promise<StoredExtract[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as StoredExtract[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error("Falha ao ler extrações"));
    });
    if (!all.length) return;
    const oldest = all.sort((a, b) => a.savedAt - b.savedAt)[0];
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(oldest.key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao limpar extração"));
    });
  } finally {
    db.close();
  }
}
