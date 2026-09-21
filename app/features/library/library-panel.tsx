import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBoard } from "@/store/board";
import { NEW_PATH } from "@/lib/routes";
import { useShare } from "@/features/share";
import {
  browserStorage,
  loadLibrary,
  parseBoard,
  persistLibrary,
  removeSaved,
  summarizeBoard,
  upsertSaved,
  type SavedBoard,
} from "@/features/library/library";

/**
 * Library — board cards. Local-first (localStorage snapshots);
 * cloud collections via Convex listByOwner slot into loadLibrary next.
 */
export function LibraryPanel() {
  const board = useBoard((s) => s.board);
  const loadBoard = useBoard((s) => s.loadBoard);
  const reset = useBoard((s) => s.reset);
  const { publish, status } = useShare();
  const storage = useMemo(() => browserStorage(), []);
  const [saved, setSaved] = useState<SavedBoard[]>(() => loadLibrary(storage));
  const [notice, setNotice] = useState("");

  const store = (list: SavedBoard[]) => {
    setSaved(list);
    persistLibrary(storage, list);
  };

  const saveCurrent = () => {
    store(upsertSaved(saved, summarizeBoard(board)));
    setNotice("Saved to library.");
  };

  const open = (s: SavedBoard) => {
    loadBoard(parseBoard(s.snapshot));
    setNotice(`Opened ${s.title}.`);
  };

  const duplicate = (s: SavedBoard) => {
    const copy = parseBoard(s.snapshot);
    copy.id = crypto.randomUUID();
    copy.title = `${s.title} copy`;
    copy.version = 0;
    copy.updatedAt = new Date().toISOString();
    store(upsertSaved(saved, summarizeBoard(copy)));
  };

  const saveToCloud = async () => {
    setNotice("");
    try {
      const res = await publish();
      setNotice(res.backend === "convex" ? `Published: ${res.url}` : "Link ready — cloud publish slots in when Convex is wired.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Publish failed.");
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {saved.length} saved · cloud sync via Convex lands next.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              setNotice("New board started.");
            }}
            className="rounded-md border px-4 py-2 text-sm"
          >
            New board
          </button>
          <button
            type="button"
            onClick={saveCurrent}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save current
          </button>
        </div>
      </div>

      {notice && <p className="font-mono text-xs text-muted-foreground">{notice}</p>}

      <div className="rounded-lg border p-5">
        <p className="font-mono text-xs text-muted-foreground">OPEN IN EDITOR · v{board.version}</p>
        <p className="mt-1 text-lg font-semibold">{board.title}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={NEW_PATH} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Open in editor
          </Link>
          <button
            type="button"
            onClick={() => void saveToCloud()}
            disabled={status === "publishing"}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          >
            {status === "publishing" ? "Publishing…" : "Save to cloud"}
          </button>
          <Link to="/showcase" className="rounded-md border px-4 py-2 text-sm">
            Showcase
          </Link>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          Nothing saved yet. Hit “Save current” to pin this board here.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {saved.map((s) => (
            <li key={s.id} className="flex flex-col gap-1 rounded-lg border p-4">
              <p className="truncate text-sm font-semibold">{s.title}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                v{s.version} · {s.widgets} widgets · {s.steps} steps · {s.pages} pages
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {new Date(s.updatedAt).toLocaleString()}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => open(s)} className="rounded-md border px-3 py-1 text-xs">
                  Open
                </button>
                <button type="button" onClick={() => duplicate(s)} className="rounded-md border px-3 py-1 text-xs">
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => store(removeSaved(saved, s.id))}
                  className="rounded-md border border-destructive/40 px-3 py-1 text-xs text-destructive"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
