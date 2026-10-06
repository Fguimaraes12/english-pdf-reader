const memory = new Map<string, string>();

/** localStorage com plano B em memória, caso o navegador o bloqueie. */
export const safeStorage = {
  get(key: string): string | null {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;
    } catch {}
    return memory.get(key) ?? null;
  },
  set(key: string, value: string): void {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
};
