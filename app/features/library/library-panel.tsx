import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBoard } from "@/store/board";
import { NEW_PATH } from "@/lib/routes";
import { useShare } from "@/features/share";
import { Card, Empty, SectionHead, Stat } from "@/features/home/section";
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
import type { Board } from "@/features/board/types";

const PREVIEW_TINT: Record<string, string> = {
  textbox: "bg-muted-foreground/30",
  heading: "bg-muted-foreground/40",
  shape: "bg-muted-foreground/20",
  icon: "bg-muted-foreground/20",
  image: "bg-muted-foreground/25",
  board: "bg-muted-foreground/20",
  card: "bg-muted-foreground/25",
};

/**
 * Square board preview: widget blocks flowed on a 16-col grid.
 * Graceful fallback to an empty tile when the snapshot won't parse.
 */
export function BoardPreview({ snapshot }: { snapshot: string }) {
  const blocks = useMemo(() => {
    try {
      const board = JSON.parse(snapshot) as Board;
      const page = board.pages[0];
      if (!page) return null;
      let col = 0;
      let row = 0;
      let rowH = 0;
      const out: { id: string; left: number; top: number; w: number; h: number; tint: string }[] = [];
      const cells: { id: string; w: number; h: number; type: string }[] = page.order
        .map((id) => {
          const w = page.widgets[id];
          return { id, w: w?.w ?? 4, h: w?.h ?? 3, type: w?.type ?? "textbox" };
        })
        .slice(0, 12);
      for (const c of cells) {
        const w = Math.max(1, Math.min(Math.round(c.w), 16));
        const h = Math.max(1, Math.round(c.h));
        if (col + w > 16) {
          col = 0;
          row += rowH;
          rowH = 0;
        }
        out.push({ id: c.id, left: col, top: row, w, h, tint: c.type });
        col += w;
        rowH = Math.max(rowH, h);
      }
      const totalRows = Math.max(1, row + rowH);
      return out.map((b) => ({
        ...b,
        leftPct: (b.left / 16) * 100,
        topPct: (b.top / totalRows) * 100,
        wPct: (b.w / 16) * 100,
        hPct: (b.h / totalRows) * 100,
      }));
    } catch {
      return null;
    }
  }, [snapshot]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/60">
      {blocks?.map((b) => (
        <span
          key={b.id}
          aria-hidden
          style={{
            left: `${b.leftPct}%`,
            top: `${b.topPct}%`,
            width: `calc(${b.wPct}% - 3px)`,
            height: `calc(${b.hPct}% - 3px)`,
          }}
          className={`absolute m-[1.5px] rounded-[3px] ${PREVIEW_TINT[b.tint] ?? "bg-primary/40"}`}
        />
      ))}
      {(!blocks || blocks.length === 0) && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-muted-foreground">
          empty canvas
        </span>
      )}
    </div>
  );
}

/**
 * Home — square board cards with previews. Local-first snapshots;
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

  const widgets = Object.keys(board.pages[0]?.widgets ?? {}).length;

  const store = (list: SavedBoard[]) => {
    setSaved(list);
    persistLibrary(storage, list);
  };

  const saveCurrent = () => {
    store(upsertSaved(saved, summarizeBoard(board)));
    setNotice("Saved to your boards.");
  };

  const open = (s: SavedBoard) => {
    loadBoard(parseBoard(s.snapshot));
    setNotice(`Opened ${s.title} in the editor.`);
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
    <div className="flex max-w-3xl flex-col gap-5">
      <SectionHead
        eyebrow="Home"
        title="Your boards"
        blurb={`${saved.length} saved · pick up where you left off.`}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                reset();
                setNotice("New board started — open it in the editor.");
              }}
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              New board
            </button>
            <button
              type="button"
              onClick={saveCurrent}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Save current
            </button>
          </>
        }
      />

      {notice && <p role="status" className="font-mono text-xs text-muted-foreground">{notice}</p>}

      <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.07] to-transparent">
        <p className="font-mono text-[11px] tracking-[0.14em] text-primary uppercase">
          Open in editor · v{board.version}
        </p>
        <p className="mt-1 truncate text-xl font-bold tracking-tight">{board.title}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat value={widgets} label="Widgets" />
          <Stat value={board.steps.length} label="Steps" />
          <Stat value={board.pages.length} label="Pages" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={NEW_PATH} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Open in editor
          </Link>
          <button
            type="button"
            onClick={() => void saveToCloud()}
            disabled={status === "publishing"}
            className="rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {status === "publishing" ? "Publishing…" : "Save to cloud"}
          </button>
          <Link to="/showcase" className="rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
            Showcase
          </Link>
        </div>
      </Card>

      {saved.length === 0 ? (
        <Empty
          title="No saved boards yet"
          body="Pin the board above with Save current — it lands here as a square card you can reopen, duplicate, or delete."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {saved.map((s) => (
            <li
              key={s.id}
              className="group relative flex aspect-square flex-col overflow-hidden rounded-xl border bg-background transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => open(s)}
                aria-label={`Open ${s.title}`}
                className="block flex-1 p-2 pb-0"
              >
                <BoardPreview snapshot={s.snapshot} />
              </button>
              <div className="p-2.5 pt-1.5">
                <p className="truncate text-xs font-bold">{s.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  v{s.version} · {s.widgets}w · {s.steps}s
                </p>
              </div>
              <div className="absolute top-3.5 right-3.5 hidden gap-1 group-hover:flex group-focus-within:flex">
                <button
                  type="button"
                  onClick={() => duplicate(s)}
                  title="Duplicate"
                  aria-label={`Duplicate ${s.title}`}
                  className="rounded-md border bg-background/95 px-2 py-1 font-mono text-[10px] shadow-sm hover:bg-muted"
                >
                  Dupe
                </button>
                <button
                  type="button"
                  onClick={() => store(removeSaved(saved, s.id))}
                  title="Delete"
                  aria-label={`Delete ${s.title}`}
                  className="rounded-md border border-destructive/40 bg-background/95 px-2 py-1 font-mono text-[10px] text-destructive shadow-sm hover:bg-destructive/10"
                >
                  Del
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
