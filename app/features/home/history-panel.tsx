import { useState } from "react";
import { useBoard } from "@/store/board";
import { parseBoard } from "@/features/library";
import { Card, Empty, SectionHead } from "@/features/home/section";
import {
  HISTORY_KEY,
  loadHistory,
  pushHistory,
  takeSnapshot,
} from "@/features/history";

/**
 * History — version snapshots as a timeline. Snapshot now,
 * restore any entry into the editor via loadBoard.
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
    <div className="flex max-w-2xl flex-col gap-5">
      <SectionHead
        eyebrow="History"
        title="Board timeline"
        blurb={`${entries.length} snapshot${entries.length === 1 ? "" : "s"} · restores open in the editor.`}
        actions={
          <button
            type="button"
            onClick={() => persist(pushHistory(entries, takeSnapshot(board)))}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Snapshot now
          </button>
        }
      />

      {entries.length === 0 ? (
        <Empty
          title="No history yet"
          body="Snapshot the current board to start its timeline — every restore point lands here."
        />
      ) : (
        <Card>
          <ol className="flex flex-col">
            {entries.map((e, i) => (
              <li key={e.id} className="relative flex gap-3 pb-4 pl-1 last:pb-0">
                {i < entries.length - 1 && (
                  <span aria-hidden className="absolute top-7 bottom-0 left-[15px] w-px bg-border" />
                )}
                <span
                  aria-hidden
                  className={`mt-1 size-2.5 shrink-0 rounded-full ${i === 0 ? "bg-primary" : "bg-border"}`}
                />
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{e.title}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      v{e.version} · {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => loadBoard(parseBoard(e.snapshot))}
                    className="shrink-0 rounded-lg border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    Restore
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
