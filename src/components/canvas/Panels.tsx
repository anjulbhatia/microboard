import { useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartColumnIcon,
  Delete02Icon,
  FunctionIcon,
  SparklesIcon,
  Table01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { useBoard } from "@/lib/board-store";
import { applySteps, downloadJSON, inferColumns } from "@/lib/data-utils";
import { Btn, CSelect } from "@/components/canvas/controls";
import { StepForm } from "@/components/canvas/StepForm";
import { WidgetBuilder } from "@/components/canvas/WidgetBuilder";
import { DisplayTableModal } from "@/components/canvas/transform-modals";
import type { AgentPanelProps, TransformPanelProps, VisualsPanelProps } from "@/app/create/interface";

const sectionTitle =
  "border-l-2 border-primary pl-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

export function VisualsPanel({
  columns,
  hasData,
  uploads,
  onAddUploads,
  gridCols,
}: Omit<VisualsPanelProps, "builderMode" | "onBuilderMode" | "backdrop" | "onBackdrop" | "ratio" | "onRatio">) {
  const board = useBoard((s) => s.board);
  const { addWidget, removeWidget } = useBoard();
  const imgRef = useRef<HTMLInputElement>(null);

  const page = board.pages.find((p) => p.id === board.activePageId);
  const chartWidgets = useMemo(
    () =>
      (page?.order ?? []).filter((id) => {
        const w = page?.widgets[id];
        return w && (w.type === "kpi" || w.type === "spark" || w.type === "table" || w.type === "dither-area" || w.type === "dither-bar");
      }),
    [page]
  );

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className={sectionTitle}>New chart</h2>
        {hasData ? (
          <WidgetBuilder columns={columns} hasData chartOnly gridCols={gridCols} />
        ) : (
          <p className="text-xs text-muted-foreground">Load data to chart.</p>
        )}
      </section>

      <section className="space-y-1.5">
        <h2 className={sectionTitle}>Charts · {chartWidgets.length}</h2>
        {chartWidgets.length === 0 ? (
          <p className="text-xs text-muted-foreground">No charts yet.</p>
        ) : (
          chartWidgets.map((id) => {
            const w = page?.widgets[id];
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
    </div>
  );
}

const FUNCTIONS = [
  { fn: "+", hint: "add" },
  { fn: "-", hint: "subtract" },
  { fn: "*", hint: "multiply" },
  { fn: "/", hint: "divide" },
  { fn: "sum", hint: "total" },
  { fn: "average", hint: "mean" },
  { fn: "min", hint: "minimum" },
  { fn: "max", hint: "maximum" },
  { fn: "count", hint: "rows" },
];

export function TransformPanel({ rawCols, hasData }: TransformPanelProps) {
  const board = useBoard((s) => s.board);
  const { addStep, removeStep, clearSteps, reset } = useBoard();
  const [mName, setMName] = useState("");
  const [mCol, setMCol] = useState("");
  const [mFn, setMFn] = useState("+");
  const [mRight, setMRight] = useState("");
  const [showTable, setShowTable] = useState(false);

  const cleaned = useMemo(() => applySteps(board.data.raw, board.steps), [board.data.raw, board.steps]);
  const schema = useMemo(() => inferColumns(cleaned), [cleaned]);
  const rawNames = useMemo(() => new Set(board.data.columns.map((c) => c.name)), [board.data]);
  const dims = schema.filter((c) => c.type === "string");
  const measures = schema.filter((c) => c.type === "number");
  const derived = schema.filter((c) => !rawNames.has(c.name));

  const addMeasure = () => {
    const name = mName.trim() || `${mCol}_${mFn === "+" ? "plus" : mFn === "-" ? "minus" : mFn === "*" ? "times" : "by"}_${mRight || "n"}`;
    if (!mCol) return;
    if (["+", "-", "*", "/"].includes(mFn)) {
      addStep("derive", { into: name, column: mCol, fn: mFn, right: mRight }, `Measure ${name} = ${mCol} ${mFn} ${mRight || "?"}`);
    } else {
      addStep("groupBy", { column: rawCols[0] ?? mCol, agg: mFn, target: mCol }, `Measure ${name} = ${mFn}(${mCol})`);
      addStep("rename", { column: `${mFn}_${mCol}`, to: name }, `Rename ${mFn}_${mCol} to ${name}`);
    }
    setMName("");
    setMRight("");
  };

  return (
    <div className="space-y-4">
      <section className="space-y-1.5">
        <h2 className={sectionTitle}>Schema</h2>
        {schema.length === 0 ? (
          <p className="text-xs text-muted-foreground">Load data to inspect.</p>
        ) : (
          <>
            <p className="font-mono text-[10px] text-muted-foreground">dimensions · {dims.length}</p>
            {dims.map((c) => (
              <div key={c.name} className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs">
                <HugeiconsIcon icon={Table01Icon} size={13} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-mono">{c.name}</span>
                {c.nulls > 0 && <span className="font-mono text-[10px] text-muted-foreground">{c.nulls}∅</span>}
              </div>
            ))}
            <p className="pt-1 font-mono text-[10px] text-muted-foreground">measures · {measures.length}</p>
            {measures.map((c) => (
              <div key={c.name} className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs">
                <HugeiconsIcon icon={ChartColumnIcon} size={13} strokeWidth={1.5} className="shrink-0 text-primary" />
                <span className="flex-1 truncate font-mono">{c.name}</span>
                {derived.some((d) => d.name === c.name) && (
                  <span className="rounded bg-primary/10 px-1 font-mono text-[10px] text-primary">fx</span>
                )}
              </div>
            ))}
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>New measure</h2>
        <input
          value={mName}
          onChange={(e) => setMName(e.target.value)}
          placeholder="measure name (optional)"
          aria-label="Measure name"
          className="w-full rounded-md border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="flex gap-1.5">
          <CSelect
            label="Column"
            value={mCol}
            onChange={setMCol}
            emptyLabel="Column…"
            options={measures.map((c) => ({ value: c.name, label: c.name }))}
          />
          <CSelect
            label="Function"
            value={mFn}
            onChange={setMFn}
            options={[
              { value: "+", label: "+" },
              { value: "-", label: "−" },
              { value: "*", label: "×" },
              { value: "/", label: "÷" },
              { value: "sum", label: "sum" },
              { value: "average", label: "avg" },
              { value: "min", label: "min" },
              { value: "max", label: "max" },
              { value: "count", label: "count" },
            ]}
          />
        </div>
        {["+", "-", "*", "/"].includes(mFn) && (
          <input
            value={mRight}
            onChange={(e) => setMRight(e.target.value)}
            placeholder="column or number"
            aria-label="Operand"
            className="w-full rounded-md border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        )}
        <button
          type="button"
          onClick={addMeasure}
          disabled={!mCol}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <HugeiconsIcon icon={FunctionIcon} size={14} strokeWidth={1.5} />
          Add measure
        </button>
        <div className="flex flex-wrap gap-1">
          {FUNCTIONS.map((f) => (
            <span key={f.fn} title={f.hint} className="rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {f.fn}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Table</h2>
        <button
          type="button"
          onClick={() => setShowTable(true)}
          disabled={!hasData}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <HugeiconsIcon icon={Table01Icon} size={14} strokeWidth={1.5} />
          Display table
        </button>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Steps · {board.steps.length}</h2>
        {hasData ? (
          <>
            <StepForm columns={rawCols} />
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-xs text-muted-foreground">{board.steps.length} steps · {cleaned.length} rows</span>
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

      {showTable && <DisplayTableModal onClose={() => setShowTable(false)} />}
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
