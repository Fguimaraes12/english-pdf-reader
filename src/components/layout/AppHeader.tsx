import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";

interface AppHeaderProps {
  onOpenSettings: () => void;
  onOpenVocabulary: () => void;
  onGoHome: () => void;
  showHome: boolean;
  onSelectFile: (file: File) => void;
}

export function AppHeader({ onOpenSettings, onOpenVocabulary, onGoHome, showHome, onSelectFile }: AppHeaderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onSelectFile(file);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-stone-300 bg-white px-4 py-2 dark:border-stone-700 dark:bg-stone-900">
      <h1 className="mr-auto text-base font-bold">Leitor de inglês</h1>
      {showHome && <Button onClick={onGoHome}>Início</Button>}
      <Button onClick={onOpenVocabulary}>Caderno</Button>
      <Button onClick={onOpenSettings}>Configurar chave</Button>
      <label className="cursor-pointer rounded-lg border border-teal-700 bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800">
        Abrir PDF
        <input type="file" accept="application/pdf" hidden onChange={handleChange} />
      </label>
    </header>
  );
}
