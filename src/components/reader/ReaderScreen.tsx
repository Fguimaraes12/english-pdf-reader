"use client";

import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { TranslationPopover } from "@/components/translation/TranslationPopover";
import { useSettings } from "@/hooks/useSettings";
import { useTextSelection } from "@/hooks/useTextSelection";
import { useTranslation } from "@/hooks/useTranslation";
import { EmptyState } from "./EmptyState";
import { PdfReader } from "./PdfReader";

export function ReaderScreen() {
  const [file, setFile] = useState<File | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);

  const settings = useSettings();
  const selection = useTextSelection(readerRef);
  const { state, translate, prefetch, reset } = useTranslation({
    apiKey: settings.apiKey,
    model: settings.model,
  });

  useEffect(() => {
    if (selection) prefetch(selection);
    else reset();
  }, [selection, prefetch, reset]);

  return (
    <>
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} onSelectFile={setFile} />
      <main ref={readerRef} className="mx-auto max-w-4xl px-2 pt-4 pb-24">
        {file ? <PdfReader file={file} /> : <EmptyState />}
      </main>

      <TranslationPopover
        selection={selection}
        state={state}
        apiKey={settings.apiKey}
        onTranslate={() => selection && translate(selection)}
      />
      <SettingsDialog
        open={settingsOpen}
        settings={{ apiKey: settings.apiKey, model: settings.model }}
        onSave={settings.save}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
