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

/** Parse a snapshot back; validates shape so corrupt/foreign JSON throws. */
export function parseBoard(snapshot: string): Board {
  if (typeof snapshot !== "string" || snapshot.length === 0 || snapshot.length > 2_000_000) {
    throw new Error("Snapshot is empty or too large.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(snapshot);
  } catch {
    throw new Error("Snapshot is not valid JSON.");
  }
  const board = raw as Partial<Board>;
  if (typeof board !== "object" || board === null || !Array.isArray(board.pages) || board.pages.length === 0) {
    throw new Error("Snapshot is not a board (missing pages).");
  }
  if (board.pages.length > 50) throw new Error("Snapshot has too many pages.");
  for (const p of board.pages) {
    if (typeof p !== "object" || p === null || typeof (p as { id?: unknown }).id !== "string") {
      throw new Error("Snapshot has a corrupt page.");
    }
    const widgets = (p as { widgets?: unknown }).widgets;
    if (typeof widgets !== "object" || widgets === null || Object.keys(widgets).length > 500) {
      throw new Error("Snapshot has a corrupt widget map.");
    }
  }
  const full = board as Board;
  return {
    ...full,
    pages: full.pages.map((p) => ({
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
    if (!Array.isArray(list)) return [];
    // Drop corrupt/quota-junk entries instead of rendering them.
    return list.filter(
      (s) =>
        typeof s === "object" &&
        s !== null &&
        typeof s.id === "string" &&
        typeof s.snapshot === "string" &&
        typeof s.title === "string"
    );
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
