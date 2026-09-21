import type { Board } from "@/features/board/types";
import { activePage, normalizeWidget } from "@/features/board/types";

export const LIBRARY_KEY = "microboard.library.v1";

/** Smallest honest storage face — localStorage satisfies it in browsers. */
export interface BoardStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SavedBoard {
  id: string;
  title: string;
  version: number;
  updatedAt: string;
  widgets: number;
  steps: number;
  pages: number;
  snapshot: string;
}

export function summarizeBoard(board: Board): SavedBoard {
  const page = activePage(board);
  return {
    id: board.id,
    title: board.title,
    version: board.version,
    updatedAt: board.updatedAt,
    widgets: Object.keys(page.widgets).length,
    steps: board.steps.length,
    pages: board.pages.length,
    snapshot: JSON.stringify(board),
  };
}

/** Parse a snapshot back; normalizes widgets so old docs load. */
export function parseBoard(snapshot: string): Board {
  const board = JSON.parse(snapshot) as Board;
  return {
    ...board,
    pages: board.pages.map((p) => ({
      ...p,
      widgets: Object.fromEntries(
        Object.entries(p.widgets).map(([id, w]) => [id, normalizeWidget(w)])
      ),
    })),
  };
}

export function loadLibrary(storage: BoardStorage | null): SavedBoard[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedBoard[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function persistLibrary(storage: BoardStorage | null, boards: SavedBoard[]): void {
  if (!storage) return;
  try {
    storage.setItem(LIBRARY_KEY, JSON.stringify(boards));
  } catch {
    // Quota or private mode — library stays in memory for the session.
  }
}

/** Upsert by id, newest first. */
export function upsertSaved(boards: SavedBoard[], saved: SavedBoard): SavedBoard[] {
  return [saved, ...boards.filter((b) => b.id !== saved.id)];
}

export function removeSaved(boards: SavedBoard[], id: string): SavedBoard[] {
  return boards.filter((b) => b.id !== id);
}

export function browserStorage(): BoardStorage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}
