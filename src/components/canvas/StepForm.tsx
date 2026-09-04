import { useState } from "react";
import { useBoard } from "@/lib/board-store";
import { Btn } from "@/components/canvas/controls";
import type { StepFormProps } from "@/app/create/interface";
import type { StepType } from "@/types/board";

const STEP_TYPES: { value: StepType; label: string; hint: string }[] = [
  { value: "filter", label: "Filter", hint: "keep matching rows" },
  { value: "groupBy", label: "Group", hint: "aggregate by column" },
  { value: "select", label: "Select", hint: "keep columns" },
  { value: "rename", label: "Rename", hint: "rename a column" },
  { value: "dropNulls", label: "Drop nulls", hint: "remove empty rows" },
  { value: "sort", label: "Sort", hint: "order rows" },
];

const FILTER_OPS = ["==", "!=", "contains", ">", "<", ">=", "<="];

export const selectCls =
  "w-full rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
export const inputCls =
  "w-full rounded-md border bg-background px-2 py-1.5 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function StepForm({ columns }: StepFormProps) {
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
