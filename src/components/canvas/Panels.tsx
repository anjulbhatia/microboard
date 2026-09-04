import { useMemo, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartColumnIcon, Delete02Icon, SparklesIcon, Upload01Icon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/lib/board-store";
import { applySteps, downloadJSON } from "@/lib/data-utils";
import { activePage } from "@/types/board";
import { WIDGET_REGISTRY } from "@/widgets/registry";
import { Btn } from "@/components/canvas/controls";
import { StepForm } from "@/components/canvas/StepForm";
import { WidgetBuilder } from "@/components/canvas/WidgetBuilder";
import type { AgentPanelProps, TransformPanelProps, VisualsPanelProps } from "@/app/create/interface";

const sectionTitle =
  "border-l-2 border-primary pl-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

export function VisualsPanel({
  columns,
  hasData,
  builderMode,
  onBuilderMode,
  uploads,
  onAddUploads,
  backdrop,
  onBackdrop,
  ratio,
  onRatio,
  gridCols,
}: VisualsPanelProps) {
  const board = useBoard((s) => s.board);
  const { addWidget, removeWidget } = useBoard();
  const imgRef = useRef<HTMLInputElement>(null);

  const page = activePage(board);
  const chartWidgets = useMemo(
    () =>
      page.order.filter((id) => {
        const w = page.widgets[id];
        return w && WIDGET_REGISTRY[w.type].needsData;
      }),
    [page]
  );

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className={sectionTitle}>New</h2>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onBuilderMode("widget")}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              builderMode === "widget" ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            New Widget
          </button>
          <button
            type="button"
            onClick={() => onBuilderMode("chart")}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              builderMode === "chart" ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            New Chart
          </button>
        </div>
        <WidgetBuilder columns={columns} hasData={hasData} chartOnly={builderMode === "chart"} gridCols={gridCols} />
      </section>

      <section className="space-y-1.5">
        <h2 className={sectionTitle}>Charts · {chartWidgets.length}</h2>
        {chartWidgets.length === 0 ? (
          <p className="text-xs text-muted-foreground">No charts yet.</p>
        ) : (
          chartWidgets.map((id) => {
            const w = page.widgets[id];
            if (!w) return null;
            return (
              <div key={id} className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-xs">
                <HugeiconsIcon icon={ChartColumnIcon} size={15} strokeWidth={1.5} className="shrink-0 text-primary" />
                <span className="flex-1 truncate">{w.title}</span>
                <button
                  type="button"
                  onClick={() => removeWidget(id)}
                  aria-label="Remove chart"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={1.5} />
                </button>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Uploads</h2>
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={Upload01Icon} size={14} strokeWidth={1.5} />
          Add images
        </button>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onAddUploads(e.target.files);
            e.target.value = "";
          }}
        />
        {uploads.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {uploads.map((u) => (
              <button
                key={u.id}
                type="button"
                title={`Place ${u.name}`}
                onClick={() =>
                  addWidget({ type: "image", title: u.name, w: 8, h: 5, props: { src: u.url, fit: "cover" } })
                }
                className="group relative overflow-hidden rounded-md border"
              >
                <img src={u.url} alt={u.name} className="aspect-square w-full object-cover" />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-xs font-medium text-white group-hover:flex">
                  Place
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Theme</h2>
        <div className="flex gap-1.5">
          {(["dotted", "grid", "plain"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onBackdrop(b)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors ${
                backdrop === b ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["16:10", "3:4"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRatio(r)}
              className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs transition-colors ${
                ratio === r ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function TransformPanel({ rawCols, hasData }: TransformPanelProps) {
  const board = useBoard((s) => s.board);
  const { addStep, removeStep, clearSteps, reset } = useBoard();
  const cleanedCount = applySteps(board.data.raw, board.steps).length;

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className={sectionTitle}>Quick</h2>
        <Btn
          onClick={() => addStep("dropNulls", { column: "__all__" }, "Drop rows with any null")}
          className="w-full"
        >
          Drop all nulls
        </Btn>
      </section>
      <section className="space-y-2">
        <h2 className={sectionTitle}>Steps · {board.steps.length}</h2>
        {hasData ? (
          <>
            <StepForm columns={rawCols} />
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-xs text-muted-foreground">{board.steps.length} steps · {cleanedCount} rows</span>
              {board.steps.length > 0 && (
                <button type="button" onClick={clearSteps} className="font-mono text-xs text-muted-foreground hover:text-foreground">
                  clear
                </button>
              )}
            </div>
            <ol className="space-y-1.5">
              {board.steps.map((s, i) => (
                <li key={s.id} className="flex items-start gap-2 rounded-md border bg-card px-2 py-1.5 text-xs">
                  <span className="font-mono text-muted-foreground">{i + 1}.</span>
                  <span className="flex-1">
                    <span className="font-mono text-primary">{s.type}</span> — {s.description}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(s.id)}
                    aria-label="Remove step"
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Load data to transform.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className={sectionTitle}>Board</h2>
        <p className="font-mono text-xs text-muted-foreground">version {board.version}</p>
        <div className="flex gap-1.5">
          <Btn onClick={() => downloadJSON(`board-${board.id}.json`, board)} className="flex-1">
            Export
          </Btn>
          <Btn onClick={reset} className="flex-1">
            Reset
          </Btn>
        </div>
      </section>
    </div>
  );
}

export function AgentPanel({ goal, onGoal }: AgentPanelProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Agent inputs</h2>
      <div className="space-y-1">
        <label htmlFor="agent-goal" className="text-xs font-medium">Goal</label>
        <textarea
          id="agent-goal"
          value={goal}
          onChange={(e) => onGoal(e.target.value)}
          placeholder="e.g. clean nulls and chart signups by channel…"
          rows={4}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <Btn primary onClick={() => {}} disabled className="w-full">
        <span className="inline-flex items-center justify-center gap-1.5">
          <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={1.5} />
          Ask agent
        </span>
      </Btn>
      <p className="font-mono text-xs text-muted-foreground">Wires to board context next.</p>
    </div>
  );
}
