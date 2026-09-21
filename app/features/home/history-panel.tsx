import { useState } from "react";
import { useBoard } from "@/store/board";
import { parseBoard } from "@/features/library";
import {
  HISTORY_KEY,
  loadHistory,
  pushHistory,
  takeSnapshot,
} from "@/features/history";

/**
 * History — version snapshots of boards. Snapshot now, restore any entry
 * (restores into the editor via loadBoard). Cap 10, local-first.
 */
export function HistoryPanel() {
  const board = useBoard((s) => s.board);
  const loadBoard = useBoard((s) => s.loadBoard);
  const [entries, setEntries] = useState(() => {
    try {
      return loadHistory((k) => localStorage.getItem(k));
    } catch {
      return loadHistory(() => null);
    }
  });

  const persist = (next: typeof entries) => {
    setEntries(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Session-only history.
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} snapshots · restores open in the editor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => persist(pushHistory(entries, takeSnapshot(board)))}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Snapshot now
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          No snapshots yet. Snapshot the current board to start its timeline.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{e.title}</span>{" "}
                <span className="font-mono text-[11px] text-muted-foreground">
                  v{e.version} · {new Date(e.createdAt).toLocaleString()}
                </span>
              </span>
              <button
                type="button"
                onClick={() => loadBoard(parseBoard(e.snapshot))}
                className="rounded-md border px-3 py-1 text-xs"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
