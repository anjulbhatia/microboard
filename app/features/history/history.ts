import type { Board } from "@/features/board/types";

export interface HistoryEntry {
  id: string;
  boardId: string;
  title: string;
  version: number;
  createdAt: string;
  snapshot: string;
}

export const HISTORY_KEY = "microboard.history.v1";
export const HISTORY_MAX = 10;

export function takeSnapshot(board: Board): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    boardId: board.id,
    title: board.title,
    version: board.version,
    createdAt: new Date().toISOString(),
    snapshot: JSON.stringify(board),
  };
}

/** Newest first, capped. Oversize snapshots are skipped, never fatal. */
export function pushHistory(list: HistoryEntry[], entry: HistoryEntry, max = HISTORY_MAX): HistoryEntry[] {
  if (entry.snapshot.length > 500_000) return list;
  return [entry, ...list].slice(0, max);
}

export function loadHistory(get: (k: string) => string | null): HistoryEntry[] {
  try {
    const raw = get(HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
