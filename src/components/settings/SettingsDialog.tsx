"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Settings } from "@/hooks/useSettings";

interface SettingsDialogProps {
  open: boolean;
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-stone-300 bg-stone-50 p-2 dark:border-stone-600 dark:bg-stone-900";

export function SettingsDialog({ open, settings, onSave, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setDraft(settings);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, settings]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-[92vw] max-w-sm rounded-xl border border-stone-300 bg-white p-5 text-sm text-stone-900 backdrop:bg-black/40 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
    >
      <h2 className="font-bold">Configuração da OpenRouter</h2>

      <label htmlFor="api-key" className="mt-3 mb-1 block font-semibold">Chave de API</label>
      <input
        id="api-key"
        type="password"
        autoComplete="off"
        placeholder="sk-or-..."
        value={draft.apiKey}
        onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
        className={INPUT_CLASS}
      />

      <label htmlFor="model" className="mt-3 mb-1 block font-semibold">Modelo</label>
      <input
        id="model"
        value={draft.model}
        onChange={(e) => setDraft({ ...draft, model: e.target.value })}
        className={INPUT_CLASS}
      />

      <p className="mt-3 text-xs text-stone-500">
        A chave fica salva só neste navegador e é enviada apenas para a OpenRouter.
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" onClick={() => { onSave(draft); onClose(); }}>Salvar</Button>
        <Button onClick={onClose}>Cancelar</Button>
      </div>
    </dialog>
  );
}
