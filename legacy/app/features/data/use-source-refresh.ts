import { useCallback, useEffect, useRef, useState } from "react";
import { useBoard } from "@/store/board";
import { fetchApiRecords } from "@/features/data/sources";

interface RefreshState {
  refreshing: boolean;
  error: string;
  refreshNow: () => Promise<void>;
}

/**
 * Auto-refresh for API sources. Polls sourceUrl every refreshMinutes
 * (0 = off) and swaps rows in place via refreshData — steps replay,
 * widgets stay. Manual refreshNow for the button.
 */
export function useSourceRefresh(): RefreshState {
  const source = useBoard((s) => s.board.data.source);
  const sourceUrl = useBoard((s) => s.board.data.sourceUrl);
  const refreshMinutes = useBoard((s) => s.board.data.refreshMinutes);
  const refreshData = useBoard((s) => s.refreshData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const refreshNow = useCallback(async () => {
    const url = useBoard.getState().board.data.sourceUrl;
    if (!url || busy.current) return;
    busy.current = true;
    setRefreshing(true);
    setError("");
    try {
      const rows = await fetchApiRecords(url);
      useBoard.getState().refreshData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed.");
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [refreshData]);

  useEffect(() => {
    if (source !== "api" || !sourceUrl || !refreshMinutes || refreshMinutes <= 0) return;
    const t = setInterval(() => void refreshNow(), refreshMinutes * 60_000);
    return () => clearInterval(t);
  }, [source, sourceUrl, refreshMinutes, refreshNow]);

  return { refreshing, error, refreshNow };
}
