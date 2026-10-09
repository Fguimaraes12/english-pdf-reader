"use client";

import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { TranslationPopover } from "@/components/translation/TranslationPopover";
import { VocabularyDialog } from "@/components/vocabulary/VocabularyDialog";
import { VocabTooltipProvider } from "@/components/vocabulary/VocabTooltip";
import { useSettings } from "@/hooks/useSettings";
import { useReadPages } from "@/hooks/useReadPages";
import { useRecentPdfs } from "@/hooks/useRecentPdfs";
import { captureFirstPageThumbnail } from "@/lib/pdf/makePdfThumbnail";
import { recentPdfToFile } from "@/lib/storage/recentPdfs";
import { useTextSelection } from "@/hooks/useTextSelection";
import { useTranslation } from "@/hooks/useTranslation";
import { useVocabulary } from "@/hooks/useVocabulary";
import { EmptyState } from "./EmptyState";
import { ExtractedView } from "./ExtractedView";
import { PdfReader } from "./PdfReader";

type ViewMode = "pdf" | "text";

export function ReaderScreen() {
  const [file, setFile] = useState<File | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vocabularyOpen, setVocabularyOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("pdf");
  const readerRef = useRef<HTMLDivElement>(null);

  const settings = useSettings();
  const read = useReadPages(file);
  const recents = useRecentPdfs();
  const vocabulary = useVocabulary();
  const selection = useTextSelection(readerRef);
  const { state, translate, prefetch, reset } = useTranslation({
    apiKey: settings.apiKey,
    model: settings.model,
  });

  useEffect(() => {
    if (selection) prefetch(selection);
    else reset();
  }, [selection, prefetch, reset]);

  const handleSelectFile = (next: File) => {
    setFile(next);
    // Miniatura em segundo plano para a capa do card; salva mesmo se falhar.
    void captureFirstPageThumbnail(next)
      .catch(() => null)
      .then((thumbnail) => recents.save(next, thumbnail));
  };

  const handleOpenRecent = (entry: Parameters<typeof recentPdfToFile>[0]) => {
    const next = recentPdfToFile(entry);
    setFile(next);
    void recents.save(next, entry.thumbnail ?? null);
  };

  const goHome = () => {
    setFile(null);
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignora
    }
  };

  const pdfWhiteBg = file !== null && viewMode === "pdf";

  return (
    <>
      <AppHeader
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenVocabulary={() => setVocabularyOpen(true)}
        onGoHome={goHome}
        showHome={file !== null}
        onSelectFile={handleSelectFile}
      />
      <main ref={readerRef} className={pdfWhiteBg ? "min-h-screen bg-white" : undefined}>
      <div className="mx-auto max-w-4xl px-2 pt-4 pb-24">
        <VocabTooltipProvider
          apiKey={settings.apiKey}
          onLearned={(word) => vocabulary.setStatus(word, "dominada")}
        >
        {file ? (
          <>
            <div className="mx-auto mb-4 flex w-fit items-center gap-3">
              <div className="flex overflow-hidden rounded-lg border border-stone-300 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`px-4 py-1.5 text-sm font-medium ${
                  viewMode === "pdf"
                    ? "bg-teal-700 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300"
                }`}
              >
                PDF original
              </button>
              <button
                type="button"
                onClick={() => setViewMode("text")}
                className={`px-4 py-1.5 text-sm font-medium ${
                  viewMode === "text"
                    ? "bg-teal-700 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300"
                }`}
              >
                Texto extraído
              </button>
              </div>
              {read.readCount > 0 && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  {read.readCount} lida(s)
                </span>
              )}
            </div>
            {viewMode === "pdf" ? (
              <PdfReader
                file={file}
                readPages={read.readPages}
                onToggleRead={read.toggle}
                vocabEntries={vocabulary.entryMap}
              />
            ) : (
              <ExtractedView
                file={file}
                readPages={read.readPages}
                onToggleRead={read.toggle}
                vocabEntries={vocabulary.entryMap}
              />
            )}
          </>
        ) : (
          <EmptyState
            recents={recents.recents}
            onOpenRecent={handleOpenRecent}
            onRemoveRecent={recents.remove}
          />
        )}
        </VocabTooltipProvider>
      </div>
      </main>

      <TranslationPopover
        selection={selection}
        state={state}
        apiKey={settings.apiKey}
        onTranslate={() => selection && translate(selection)}
        onSave={() => {
          if (selection && state.status === "success") {
            vocabulary.addEntry(selection.text, state.data.translation, state.data.pronunciation);
          }
        }}
        saved={!!selection && vocabulary.hasWord(selection.text)}
        onLearned={() => {
          if (selection && state.status === "success") {
            vocabulary.markLearned(selection.text, state.data.translation, state.data.pronunciation);
          }
        }}
        learned={
          selection
            ? vocabulary.entryMap.get(selection.text.toLowerCase())?.status === "dominada"
            : false
        }
      />
      <SettingsDialog
        open={settingsOpen}
        settings={{ apiKey: settings.apiKey, model: settings.model }}
        onSave={settings.save}
        onClose={() => setSettingsOpen(false)}
      />
      <VocabularyDialog
        open={vocabularyOpen}
        entries={vocabulary.entries}
        apiKey={settings.apiKey}
        onStatusChange={vocabulary.setStatus}
        onNoteChange={vocabulary.setNote}
        onRemove={vocabulary.removeEntry}
        onClose={() => setVocabularyOpen(false)}
      />
    </>
  );
}

