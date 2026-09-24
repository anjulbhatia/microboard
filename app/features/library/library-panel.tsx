import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy01Icon, Delete02Icon, EyeIcon, GridIcon, HistoryIcon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/store/board";
import { NEW_PATH } from "@/lib/routes";
import { useShare } from "@/features/share";
import { Card, Empty, IconBtn, SectionHead, Stat } from "@/features/home/section";
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
      const cols = 8;
      const cells: { id: string; w: number; h: number; type: string }[] = page.order
        .map((id) => {
          const w = page.widgets[id];
          return { id, w: w?.w ?? 4, h: w?.h ?? 3, type: w?.type ?? "textbox" };
        })
        .slice(0, 12);
      for (const c of cells) {
        const w = Math.max(1, Math.min(Math.round(c.w), cols));
        const h = Math.max(1, Math.round(c.h));
        if (col + w > cols) {
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
        leftPct: (b.left / cols) * 100,
        topPct: (b.top / totalRows) * 100,
        wPct: (b.w / cols) * 100,
        hPct: (b.h / totalRows) * 100,
      }));
    } catch {
      return null;
    }
  }, [snapshot]);

  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-md bg-muted/50">
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
          className={`absolute m-[1.5px] rounded-[2px] ${PREVIEW_TINT[b.tint] ?? "bg-primary/40"}`}
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
    try {
      loadBoard(parseBoard(s.snapshot));
      setNotice(`Opened ${s.title} in the editor.`);
    } catch {
      setNotice(`Could not open ${s.title} — snapshot is corrupt.`);
    }
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
      <SectionHead
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
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              New board
            </button>
            <button
              type="button"
              onClick={saveCurrent}
              className="rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
            >
              Save current
            </button>
          </>
        }
      />

      {notice && <p role="status" className="font-mono text-xs text-muted-foreground">{notice}</p>}

      <Card className="p-4">
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
          Open in editor · v{board.version}
        </p>
        <p className="mt-1 truncate text-lg font-semibold tracking-tight">{board.title}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat value={widgets} label="Widgets" icon={GridIcon} />
          <Stat value={board.steps.length} label="Steps" icon={HistoryIcon} />
          <Stat value={board.pages.length} label="Pages" icon={EyeIcon} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
          <Link to={NEW_PATH} className="rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
            Open in editor
          </Link>
          <button
            type="button"
            onClick={() => void saveToCloud()}
            disabled={status === "publishing"}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {status === "publishing" ? "Publishing…" : "Save to cloud"}
          </button>
          <Link to="/showcase" className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
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
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {saved.map((s) => (
            <li
              key={s.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card"
            >
              <button
                type="button"
                onClick={() => open(s)}
                aria-label={`Open ${s.title}`}
                className="block p-2 pb-0"
              >
                <span className="block">
                  <BoardPreview snapshot={s.snapshot} />
                </span>
              </button>
              <div className="flex items-center gap-1 border-t border-border/60 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{s.title}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    v{s.version} · {s.widgets}w · {s.steps}s
                  </p>
                </div>
                <span className="flex gap-0.5">
                  <IconBtn label={`Duplicate ${s.title}`} onClick={() => duplicate(s)} icon={Copy01Icon} />
                  <IconBtn label={`Delete ${s.title}`} onClick={() => store(removeSaved(saved, s.id))} icon={Delete02Icon} danger />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
