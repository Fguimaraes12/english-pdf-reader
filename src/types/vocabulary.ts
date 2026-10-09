export type VocabularyStatus = "nova" | "aprendendo" | "dominada";

export const VOCABULARY_STATUSES: VocabularyStatus[] = ["nova", "aprendendo", "dominada"];

export interface VocabularyEntry {
  /** Palavra em inglês (chave única, minúscula). */
  word: string;
  /** Como a palavra aparece no texto (preserva maiúsculas). */
  display: string;
  translation: string;
  pronunciation: string;
  status: VocabularyStatus;
  /** Macete/anotação do usuário sobre esta palavra. */
  note: string;
  createdAt: number;
}
