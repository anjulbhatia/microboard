import { useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ChartColumnIcon,
  Delete02Icon,
  PlusSignIcon,
  Settings01Icon,
  SparklesIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { CreateLayout, type DockTab } from "@/app/create/CreateLayout";
import { UploadPhase } from "@/app/create/UploadPhase";
import { DataLandedModal } from "@/app/create/DataLandedModal";
import { Stage } from "@/app/create/Stage";
import { useBoard, WIDGET_SIZES, WIDGET_TYPES } from "@/lib/board-store";
import { applySteps, downloadJSON, inferColumns } from "@/lib/data-utils";
import { PropsEditor } from "@/widgets/PropsEditor";
import { WIDGET_REGISTRY } from "@/widgets/registry";
import type { ColumnMeta, StepType, Widget, WidgetSize, WidgetType } from "@/types/board";

function Btn({
  children,
  onClick,
  primary,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? `rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`
          : `rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 ${className}`
      }
    >
      {children}
    </button>
  );
}

const STEP_TYPES: { value: StepType; label: string; hint: string }[] = [
  { value: "filter", label: "Filter", hint: "keep matching rows" },
  { value: "groupBy", label: "Group", hint: "aggregate by column" },
  { value: "select", label: "Select", hint: "keep columns" },
  { value: "rename", label: "Rename", hint: "rename a column" },
  { value: "dropNulls", label: "Drop nulls", hint: "remove empty rows" },
  { value: "sort", label: "Sort", hint: "order rows" },
];

const FILTER_OPS = ["==", "!=", "contains", ">", "<", ">=", "<="];

const SIZE_SPAN: Record<WidgetSize, string> = {
  "1x1": "col-span-12 sm:col-span-6 xl:col-span-4",
  "1x2": "col-span-12 xl:col-span-8",
  "2x2": "col-span-12 xl:col-span-6",
  full: "col-span-12",
};

const selectCls =
  "w-full rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const inputCls =
  "w-full rounded-md border bg-background px-2 py-1.5 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function WidgetCard({
  widget,
  onRemove,
  onDragStart,
  onDrop,
}: {
  widget: Widget;
  onRemove: () => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
}) {
  const updateWidget = useBoard((s) => s.updateWidget);
  const [editing, setEditing] = useState(false);
  const meta = WIDGET_REGISTRY[widget.type];
  const Body = meta.render;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", widget.id);
        onDragStart(widget.id);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(widget.id);
      }}
      className={`${SIZE_SPAN[widget.size]} cursor-grab rounded-xl border bg-card p-3 active:cursor-grabbing`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="truncate font-medium">{widget.title}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {meta.fields.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              aria-label="Widget settings"
              className={`rounded-md p-1 transition-colors hover:bg-muted hover:text-foreground ${
                editing ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <HugeiconsIcon icon={Settings01Icon} size={16} strokeWidth={1.5} />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove widget"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <Body widget={widget} />
      {editing && (
        <div className="mt-2">
          <PropsEditor widget={widget} onChange={(props) => updateWidget(widget.id, { props })} />
        </div>
      )}
    </div>
  );
}

function StepForm({ columns }: { columns: string[] }) {
  const addStep = useBoard((s) => s.addStep);
  const [type, setType] = useState<StepType>("filter");
  const [column, setColumn] = useState("");
  const [op, setOp] = useState("==");
  const [value, setValue] = useState("");
  const [to, setTo] = useState("");
  const [dir, setDir] = useState("asc");
  const [target, setTarget] = useState("");
  const [agg, setAgg] = useState("sum");
  const [selected, setSelected] = useState<string[]>([]);

  const col = column || columns[0] || "";
  const describe = (): string => {
    switch (type) {
      case "filter":
        return `Keep rows where ${col} ${op} ${value}`;
      case "groupBy":
        return `Group by ${col}, ${agg} of ${agg === "count" ? "rows" : target}`;
      case "select":
        return `Keep columns ${selected.join(", ")}`;
      case "rename":
        return `Rename ${col} to ${to}`;
      case "dropNulls":
        return col === "__all__" ? "Drop rows with any null" : `Drop rows where ${col} is null`;
      case "sort":
        return `Sort by ${col} ${dir}`;
    }
  };

  const submit = () => {
    const params: Record<string, string> = { column: col };
    if (type === "filter") {
      if (!value) return;
      params.op = op;
      params.value = value;
    } else if (type === "groupBy") {
      params.target = target || columns[0] || "";
      params.agg = agg;
    } else if (type === "select") {
      if (selected.length === 0) return;
      params.columns = selected.join(",");
    } else if (type === "rename") {
      if (!to) return;
      params.to = to;
    } else if (type === "sort") {
      params.dir = dir;
    }
    addStep(type, params, describe());
    setValue("");
    setTo("");
  };

  const toggleSelected = (c: string) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {STEP_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            title={t.hint}
            onClick={() => setType(t.value)}
            className={`rounded-lg border px-1 py-1.5 text-xs font-medium transition-colors ${
              type === t.value ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type !== "select" && (
        <select value={column} onChange={(e) => setColumn(e.target.value)} className={selectCls}>
          {type === "dropNulls" && <option value="__all__">All columns</option>}
          {columns.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {type === "filter" && (
        <div className="flex gap-2">
          <select value={op} onChange={(e) => setOp(e.target.value)} className={selectCls}>
            {FILTER_OPS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" className={inputCls} />
        </div>
      )}

      {type === "groupBy" && (
        <div className="flex gap-2">
          <select value={agg} onChange={(e) => setAgg(e.target.value)} className={selectCls}>
            {["sum", "count", "average", "min", "max"].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {agg !== "count" && (
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={selectCls}>
              {columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {type === "select" && (
        <div className="flex flex-wrap gap-1.5">
          {columns.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleSelected(c)}
              className={`rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
                selected.includes(c) ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {type === "rename" && (
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="new name" className={inputCls} />
      )}

      {type === "sort" && (
        <select value={dir} onChange={(e) => setDir(e.target.value)} className={selectCls}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      )}

      <Btn primary onClick={submit} className="w-full">
        Add step
      </Btn>
    </div>
  );
}

function WidgetBuilder({ columns, hasData, chartOnly }: { columns: string[]; hasData: boolean; chartOnly: boolean }) {
  const addWidget = useBoard((s) => s.addWidget);
  const kinds = WIDGET_TYPES.filter((t) => WIDGET_REGISTRY[t.value].needsData === chartOnly);
  const [wType, setWType] = useState<WidgetType>(kinds[0]?.value ?? "textbox");
  const [wX, setWX] = useState("");
  const [wY, setWY] = useState("");
  const [wSize, setWSize] = useState<WidgetSize>("1x1");
  const meta = WIDGET_REGISTRY[wType] ?? WIDGET_REGISTRY.textbox;

  const pickType = (t: WidgetType) => {
    setWType(t);
    setWSize(WIDGET_REGISTRY[t].defaultSize);
  };

  const submit = () => {
    if (meta.needsData && !hasData) return;
    const x = wX || columns[0] || "";
    const y = wY || columns[0] || "";
    addWidget({
      type: wType,
      title: meta.needsData ? `${meta.label} · ${y || x}` : meta.defaults.title,
      x: meta.needsData ? x : undefined,
      y: meta.needsData ? y : undefined,
      size: wSize,
      props: { ...meta.defaults.props },
    });
  };

  return (
    <div className="space-y-2">
      <select value={wType} onChange={(e) => pickType(e.target.value as WidgetType)} className={selectCls} aria-label="Widget type">
        {kinds.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      {meta.needsData && wType !== "table" && (
        <div className="flex gap-2">
          <select value={wX} onChange={(e) => setWX(e.target.value)} className={selectCls} aria-label="X column">
            <option value="">x: auto</option>
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={wY} onChange={(e) => setWY(e.target.value)} className={selectCls} aria-label="Y column">
            <option value="">y: auto</option>
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
      <select value={wSize} onChange={(e) => setWSize(e.target.value as WidgetSize)} className={selectCls} aria-label="Widget size">
        {WIDGET_SIZES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <Btn primary onClick={submit} className="w-full">
        <span className="inline-flex items-center justify-center gap-1">
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} />
          Add {chartOnly ? "chart" : "widget"}
        </span>
      </Btn>
    </div>
  );
}

interface Upload {
  id: string;
  url: string;
  name: string;
}

export function CreatePage() {
  const board = useBoard((s) => s.board);
  const { loadData, addStep, removeStep, clearSteps, addWidget, removeWidget, moveWidget, setTitle, reset } = useBoard();
  const [tab, setTab] = useState<DockTab>("visualize");
  const [builderMode, setBuilderMode] = useState<"widget" | "chart">("widget");
  const [agentGoal, setAgentGoal] = useState("");
  const [ratio, setRatio] = useState<"16:10" | "3:4">("16:10");
  const [backdrop, setBackdrop] = useState<"dotted" | "grid" | "plain">("dotted");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [landed, setLanded] = useState<{ columns: ColumnMeta[]; rows: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const cleaned = useMemo(() => applySteps(board.data.raw, board.steps), [board.data.raw, board.steps]);
  const cleanedCols = useMemo(() => inferColumns(cleaned).map((c) => c.name), [cleaned]);
  const rawCols = useMemo(() => board.data.columns.map((c) => c.name), [board.data]);
  const hasData = board.data.raw.length > 0;
  const chartWidgets = board.order.filter((id) => {
    const w = board.widgets[id];
    return w && WIDGET_REGISTRY[w.type].needsData;
  });

  const handleLoad = (source: "inline" | "file" | "sample", records: Record<string, string>[]) => {
    loadData(source, records);
    setLanded({ columns: inferColumns(records), rows: records.length });
    setTab("visualize");
  };

  const addUploads = (files: FileList | null) => {
    if (!files) return;
    const imgs = [...files].filter((f) => f.type.startsWith("image/"));
    setUploads((prev) => [...prev, ...imgs.map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), name: f.name }))]);
  };

  const dropWidget = (targetId: string) => {
    if (dragId) {
      moveWidget(dragId, targetId);
      setDragId(null);
    }
  };

  const sectionTitle = "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

  const panel = tab === "visualize" ? (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className={sectionTitle}>New</h2>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setBuilderMode("widget")}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              builderMode === "widget" ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            New Widget
          </button>
          <button
            type="button"
            onClick={() => setBuilderMode("chart")}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              builderMode === "chart" ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            New Chart
          </button>
        </div>
        <WidgetBuilder columns={cleanedCols} hasData={hasData} chartOnly={builderMode === "chart"} />
      </section>

      <section className="space-y-1.5">
        <h2 className={sectionTitle}>Charts · {chartWidgets.length}</h2>
        {chartWidgets.length === 0 ? (
          <p className="text-xs text-muted-foreground">No charts yet.</p>
        ) : (
          chartWidgets.map((id) => {
            const w = board.widgets[id];
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
            addUploads(e.target.files);
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
                  addWidget({ type: "image", title: u.name, size: "1x2", props: { src: u.url, fit: "cover" } })
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
              onClick={() => setBackdrop(b)}
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
              onClick={() => setRatio(r)}
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
  ) : (
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
    </div>
  );

  const agentPanel = (
    <div className="space-y-3">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Agent inputs</h2>
      <div className="space-y-1">
        <label htmlFor="agent-goal" className="text-xs font-medium">Goal</label>
        <textarea
          id="agent-goal"
          value={agentGoal}
          onChange={(e) => setAgentGoal(e.target.value)}
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

  const showCanvas = hasData || board.order.length > 0;

  return (
    <CreateLayout
      title={board.title}
      onTitle={setTitle}
      version={board.version}
      tab={tab}
      onTab={setTab}
      panel={panel}
      agentPanel={agentPanel}
    >
      {!showCanvas ? (
        <UploadPhase onLoad={handleLoad} />
      ) : (
        <Stage
          ratio={ratio}
          backdrop={backdrop}
          toolbar={
            <div className="flex items-center gap-2 px-1">
              <div className="flex gap-1">
                {(["16:10", "3:4"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRatio(r)}
                    className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                      ratio === r ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {cleaned.length} rows · {board.order.length} widgets · drag cards to reorder
              </span>
            </div>
          }
        >
          {board.order.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-lg font-semibold">Canvas is empty</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add widgets or charts from the Visualize pane.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-3">
              {board.order.map((id) => {
                const w = board.widgets[id];
                if (!w) return null;
                return (
                  <WidgetCard
                    key={id}
                    widget={w}
                    onRemove={() => removeWidget(id)}
                    onDragStart={setDragId}
                    onDrop={dropWidget}
                  />
                );
              })}
            </div>
          )}
        </Stage>
      )}

      {landed && (
        <DataLandedModal
          columns={landed.columns}
          rows={landed.rows}
          onQuickClean={() => addStep("dropNulls", { column: "__all__" }, "Drop rows with any null")}
          onClose={() => setLanded(null)}
        />
      )}
    </CreateLayout>
  );
}
