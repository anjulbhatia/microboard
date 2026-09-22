import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Refresh01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/store/board";
import { NEW_PATH } from "@/lib/routes";
import { Card, Empty, IconBtn, SectionHead } from "@/features/home/section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  REFRESH_OPTIONS,
  SOURCE_REGISTRY,
  refreshLabel,
} from "@/features/data/sources";
import { useSourceRefresh } from "@/features/data/use-source-refresh";
import { useDataLoader } from "@/features/data/use-data-loader";
import { applySteps, inferColumns } from "@/features/data/lib/data-utils";

type UploadKind = "file" | "paste" | "sheet" | "api" | "sample";

/**
 * Data Sources — clean header with Upload on the right, data listing
 * below, pipeline timeline, API refresh card. Uploads open in a modal.
 */
export function DataPanel() {
  const board = useBoard((s) => s.board);
  const removeStep = useBoard((s) => s.removeStep);
  const clearSteps = useBoard((s) => s.clearSteps);
  const [uploadOpen, setUploadOpen] = useState(false);

  const cleaned = useMemo(
    () => applySteps(board.data.raw, board.steps),
    [board.data.raw, board.steps]
  );
  const cols = useMemo(() => inferColumns(cleaned).map((c) => c.name), [cleaned]);
  const showCols = cols.slice(0, 6);
  const showRows = cleaned.slice(0, 8);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <SectionHead
        eyebrow="Data Sources"
        title="Everything data lives here"
        blurb={
          board.data.source
            ? `${board.data.source} · ${board.data.raw.length} rows · ${cols.length} cols`
            : "No source yet — upload to begin."
        }
        actions={
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.97]"
          >
            <HugeiconsIcon icon={Upload01Icon} size={15} strokeWidth={1.5} />
            Upload data
          </button>
        }
      />

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {cleaned.length === 0 ? (
        <Empty
          title="No rows yet"
          body="Upload a file, paste rows, link a sheet, or pull an API — the listing lands here."
          action={
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Upload data
            </button>
          }
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b">
                  {showCols.map((c) => (
                    <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>
                  ))}
                  {cols.length > 6 && (
                    <th className="px-3 py-2 text-muted-foreground">+{cols.length - 6}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {showRows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                    {showCols.map((c) => (
                      <td key={c} className="max-w-32 truncate px-3 py-1.5">{String(r[c] ?? "")}</td>
                    ))}
                    {cols.length > 6 && <td className="px-3 py-1.5 text-muted-foreground">…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cleaned.length > 8 && (
            <p className="border-t px-3 py-2 font-mono text-[11px] text-muted-foreground">
              Showing 8 of {cleaned.length} rows
            </p>
          )}
        </Card>
      )}

      <SourceCards />
      <ApiCard />

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">
            Pipeline · {board.steps.length} step{board.steps.length === 1 ? "" : "s"}
          </p>
          {board.steps.length > 0 && (
            <button type="button" onClick={clearSteps} className="text-xs font-medium text-destructive hover:underline">
              Clear all
            </button>
          )}
        </div>
        {board.steps.length > 0 ? (
          <ol className="mt-3 flex flex-col">
            {board.steps.map((s, i) => (
              <li key={s.id} className="relative flex gap-3 pb-3 pl-1 last:pb-0">
                {i < board.steps.length - 1 && (
                  <span aria-hidden className="absolute top-7 bottom-0 left-[15px] w-px bg-border" />
                )}
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 text-sm transition-colors hover:bg-muted">
                  <span className="min-w-0 flex-1 truncate">{s.description}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{s.type}</span>
                  <IconBtn label={`Remove step ${i + 1}`} onClick={() => removeStep(s.id)} icon={Cancel01Icon} />
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No transforms yet — the recipe starts empty.</p>
        )}
        <Link to={NEW_PATH} className="mt-3 inline-block rounded-lg border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
          Edit transforms in canvas
        </Link>
      </Card>
    </div>
  );
}

function SourceCards() {
  const source = useBoard((s) => s.board.data.source);
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {SOURCE_REGISTRY.map((s) => {
        const active = source === s.kind;
        return (
          <li
            key={s.kind}
            title={s.blurb}
            className={`rounded-xl border bg-background px-2.5 py-2 text-center ${
              active ? "border-primary/60 ring-1 ring-primary/40" : ""
            }`}
          >
            <p className="text-xs font-bold">{s.label}</p>
            <p className={`mt-0.5 font-mono text-[10px] uppercase ${active ? "text-primary" : "text-muted-foreground"}`}>
              {active ? "Live" : "—"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function ApiCard() {
  const board = useBoard((s) => s.board);
  const setSourceConfig = useBoard((s) => s.setSourceConfig);
  const { refreshing, error, refreshNow } = useSourceRefresh();
  const [url, setUrl] = useState(board.data.sourceUrl ?? "");
  const [minutes, setMinutes] = useState(board.data.refreshMinutes ?? 0);

  return (
    <Card>
      <p className="text-sm font-bold">API auto-refresh</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Rows swap in place; steps replay automatically.
      </p>
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/rows"
          spellCheck={false}
          aria-label="API endpoint URL"
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          aria-label="Auto-refresh interval"
          className="rounded-lg border bg-background px-2 py-2 text-xs"
        >
          {REFRESH_OPTIONS.map((m) => (
            <option key={m} value={m}>{refreshLabel(m)}</option>
          ))}
        </select>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSourceConfig(url.trim(), minutes)}
          disabled={url.trim().length === 0}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Connect
        </button>
          <button
            type="button"
            onClick={() => void refreshNow()}
            disabled={refreshing || !board.data.sourceUrl}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-xs font-medium transition-all hover:bg-muted active:scale-[0.97] disabled:opacity-50"
          >
            <HugeiconsIcon
              icon={Refresh01Icon}
              size={13}
              strokeWidth={2}
              className={refreshing ? "animate-spin" : undefined}
            />
            {refreshing ? "Refreshing…" : "Refresh now"}
          </button>
        {board.data.lastRefresh && (
          <span className="font-mono text-[11px] text-muted-foreground">
            Last: {new Date(board.data.lastRefresh).toLocaleString()}
          </span>
        )}
      </div>
      {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
    </Card>
  );
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<UploadKind>("file");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, error, loadFile, loadPaste, loadSheet, loadApi, loadSample } = useDataLoader();

  const done = () => {
    setText("");
    setUrl("");
    onClose();
  };

  const submit = async () => {
    const ok =
      kind === "sample"
        ? loadSample()
        : kind === "paste"
          ? loadPaste(text)
          : kind === "sheet"
            ? await loadSheet(url)
            : await loadApi(url);
    if (ok) done();
  };

  const onFile = async (files: FileList | null) => {
    if (await loadFile(files)) done();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload data</DialogTitle>
          <DialogDescription>Pick a source. Rows land on the current board.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5" role="tablist" aria-label="Source type">
          {(["file", "paste", "sheet", "api", "sample"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`flex-1 rounded-lg px-1 py-1.5 text-xs font-medium capitalize transition-colors ${
                kind === k ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {kind === "file" && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
          >
            {busy ? "Reading…" : "Choose a .csv or .xlsx file"}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => void onFile(e.target.files)}
            />
          </button>
        )}
        {kind === "paste" && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"month,visitors\nJan,1860"}
            rows={6}
            spellCheck={false}
            aria-label="Pasted rows"
            className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        )}
        {(kind === "sheet" || kind === "api") && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={kind === "sheet" ? "https://docs.google.com/spreadsheets/d/…" : "https://api.example.com/rows"}
            spellCheck={false}
            aria-label="Source URL"
            className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        )}
        {kind === "sample" && (
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            12-row demo set. One click, straight to transforms.
          </p>
        )}

        {error && <p className="font-mono text-xs text-destructive">{error}</p>}

        {kind !== "file" && (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load into board"}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
