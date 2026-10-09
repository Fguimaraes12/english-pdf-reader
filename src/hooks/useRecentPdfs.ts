"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listRecentPdfs,
  removeRecentPdf,
  saveRecentPdf,
  type RecentPdf,
} from "@/lib/storage/recentPdfs";

export function useRecentPdfs() {
  const [recents, setRecents] = useState<RecentPdf[]>([]);

  const refresh = useCallback(async () => {
    setRecents(await listRecentPdfs());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (file: File, thumbnail?: string | null) => {
      await saveRecentPdf(file, thumbnail);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await removeRecentPdf(id);
      await refresh();
    },
    [refresh],
  );

  return { recents, save, remove };
}
