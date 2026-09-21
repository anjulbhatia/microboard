import { useState } from "react";
import { Link } from "react-router-dom";
import { useBoard } from "@/store/board";
import { NEW_PATH } from "@/lib/routes";
import {
  REFRESH_OPTIONS,
  SOURCE_REGISTRY,
  refreshLabel,
} from "@/features/data/sources";
import { useSourceRefresh } from "@/features/data/use-source-refresh";

/**
 * Data Sources — registry cards, API endpoint config with auto-refresh,
 * and the transform pipeline (steps with remove/clear). Editor does the
 * heavy editing; this is the overview + controls surface.
 */
export function DataPanel() {
  const board = useBoard((s) => s.board);
  const setSourceConfig = useBoard((s) => s.setSourceConfig);
  const removeStep = useBoard((s) => s.removeStep);
  const clearSteps = useBoard((s) => s.clearSteps);
  const { refreshing, error, refreshNow } = useSourceRefresh();
  const [url, setUrl] = useState(board.data.sourceUrl ?? "");
  const [minutes, setMinutes] = useState(board.data.refreshMinutes ?? 0);

  const cols = board.data.columns.map((c) => c.name);
  const current = board.data.source;

  const saveApi = () => {
    setSourceConfig(url.trim(), minutes);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sources, integrations, and everything data on the current board.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {SOURCE_REGISTRY.map((s) => {
          const active = current === s.kind;
          return (
            <li
              key={s.kind}
              className={`rounded-lg border p-3 ${active ? "border-primary ring-1 ring-primary" : ""}`}
            >
              <p className="text-sm font-semibold">
                {s.label}
                {active && <span className="ml-2 font-mono text-[10px] text-primary">CONNECTED</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.blurb}</p>
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-semibold">API endpoint</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JSON array endpoint. Rows swap in place; steps replay automatically.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/rows"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none"
          />
          <select
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="Auto-refresh interval"
            className="rounded-md border bg-background px-2 py-2 text-xs"
          >
            {REFRESH_OPTIONS.map((m) => (
              <option key={m} value={m}>{refreshLabel(m)}</option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveApi}
            disabled={url.trim().length === 0}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Connect
          </button>
          <button
            type="button"
            onClick={() => void refreshNow()}
            disabled={refreshing || !board.data.sourceUrl}
            className="rounded-md border px-4 py-1.5 text-xs disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh now"}
          </button>
          {board.data.lastRefresh && (
            <span className="font-mono text-[11px] text-muted-foreground">
              Last: {new Date(board.data.lastRefresh).toLocaleString()}
            </span>
          )}
        </div>
        {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Transforms · {board.steps.length}</p>
          {board.steps.length > 0 && (
            <button type="button" onClick={clearSteps} className="text-xs text-destructive">
              Clear all
            </button>
          )}
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          COLUMNS · {cols.length > 0 ? cols.join(", ") : "—"}
        </p>
        {board.steps.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1.5">
            {board.steps.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-sm">
                <span className="font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{s.description}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{s.type}</span>
                <button
                  type="button"
                  onClick={() => removeStep(s.id)}
                  aria-label={`Remove step ${i + 1}`}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No transforms yet.</p>
        )}
        <Link to={NEW_PATH} className="mt-3 inline-block rounded-md border px-4 py-1.5 text-xs">
          Edit transforms in canvas
        </Link>
      </div>
    </div>
  );
}
