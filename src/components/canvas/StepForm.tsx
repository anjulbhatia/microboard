import { useState } from "react";
import { useBoard } from "@/lib/board-store";
import { Btn, CSelect, inputCls } from "@/components/canvas/controls";
import type { StepFormProps } from "@/app/create/interface";
import type { StepType } from "@/types/board";

const STEP_TYPES: { value: StepType; label: string; hint: string }[] = [
  { value: "filter", label: "Filter", hint: "keep matching rows" },
  { value: "groupBy", label: "Group", hint: "aggregate by column" },
  { value: "select", label: "Select", hint: "keep columns" },
  { value: "rename", label: "Rename", hint: "rename a column" },
  { value: "dropNulls", label: "Drop nulls", hint: "remove empty rows" },
  { value: "sort", label: "Sort", hint: "order rows" },
  { value: "header", label: "Header", hint: "first row as header" },
  { value: "dropDuplicates", label: "Dedup", hint: "drop duplicate rows" },
  { value: "fill", label: "Fill", hint: "fill nulls" },
  { value: "flashfill", label: "Flash", hint: "fill by example" },
  { value: "replace", label: "Replace", hint: "find + replace" },
];

export const FILTER_COND = ["==", "!=", "contains", ">", "<", ">=", "<="];
const FILTER_OPS = FILTER_COND;

export const selectCls =
  "w-full rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";


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
  const [fillMode, setFillMode] = useState("value");
  const [fillValue, setFillValue] = useState("");
  const [ffExample, setFfExample] = useState("");
  const [dupCols, setDupCols] = useState("");
  const [repFind, setRepFind] = useState("");
  const [repWith, setRepWith] = useState("");

  const col = column || (type === "dropNulls" ? "__all__" : columns[0] || "");
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
      case "header":
        return "First row as header";
      case "dropDuplicates":
        return dupCols ? `Drop duplicates on ${dupCols}` : "Drop duplicate rows";
      case "fill":
        return fillMode === "down" ? `Fill ${col} down` : `Fill ${col} with "${fillValue}"`;
      case "flashfill":
        return `Flash fill ${col} like "${ffExample}"`;
      case "replace":
        return `Replace "${repFind}" with "${repWith}" in ${col}`;
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
    } else if (type === "header") {
      // no params
    } else if (type === "dropDuplicates") {
      params.columns = dupCols;
    } else if (type === "fill") {
      params.mode = fillMode;
      params.value = fillValue;
    } else if (type === "flashfill") {
      if (!ffExample) return;
      params.example = ffExample;
      params.into = `${col}_fill`;
    } else if (type === "replace") {
      if (!repFind) return;
      params.find = repFind;
      params.with = repWith;
    }
    addStep(type, params, describe());
    setValue("");
    setTo("");
  };

  const toggleSelected = (c: string) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
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

      {type !== "select" && type !== "header" && (
        <CSelect
          label="Column"
          value={column || (type === "dropNulls" ? "__all__" : (columns[0] ?? ""))}
          onChange={setColumn}
          options={[
            ...(type === "dropNulls" ? [{ value: "__all__", label: "All columns" }] : []),
            ...columns.map((c) => ({ value: c, label: c })),
          ]}
        />
      )}

      {type === "header" && (
        <p className="font-mono text-xs text-muted-foreground">Promotes the first data row to headers.</p>
      )}

      {type === "dropDuplicates" && (
        <input
          value={dupCols}
          onChange={(e) => setDupCols(e.target.value)}
          placeholder="columns, comma separated (empty = all)"
          className={inputCls}
        />
      )}

      {type === "fill" && (
        <div className="flex gap-2">
          <CSelect
            label="Fill mode"
            value={fillMode}
            onChange={setFillMode}
            options={[
              { value: "value", label: "Value" },
              { value: "down", label: "Fill down" },
            ]}
          />
          {fillMode === "value" && (
            <input value={fillValue} onChange={(e) => setFillValue(e.target.value)} placeholder="fill value" className={inputCls} />
          )}
        </div>
      )}

      {type === "flashfill" && (
        <input
          value={ffExample}
          onChange={(e) => setFfExample(e.target.value)}
          placeholder='example, e.g. "JD"'
          className={inputCls}
        />
      )}

      {type === "replace" && (
        <div className="flex gap-2">
          <input value={repFind} onChange={(e) => setRepFind(e.target.value)} placeholder="find" className={inputCls} />
          <input value={repWith} onChange={(e) => setRepWith(e.target.value)} placeholder="replace with" className={inputCls} />
        </div>
      )}

      {type === "filter" && (
        <div className="flex gap-2">
          <CSelect
            label="Condition"
            value={op}
            onChange={setOp}
            options={FILTER_OPS.map((o) => ({ value: o, label: o }))}
          />
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" className={inputCls} />
        </div>
      )}

      {type === "groupBy" && (
        <div className="flex gap-2">
          <CSelect
            label="Aggregation"
            value={agg}
            onChange={setAgg}
            options={["sum", "count", "average", "min", "max"].map((a) => ({ value: a, label: a }))}
          />
          {agg !== "count" && (
            <CSelect
              label="Target column"
              value={target || columns[0] || ""}
              onChange={setTarget}
              options={columns.map((c) => ({ value: c, label: c }))}
            />
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
        <CSelect
          label="Direction"
          value={dir}
          onChange={setDir}
          options={[
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" },
          ]}
        />
      )}

      <Btn primary onClick={submit} className="w-full">
        Add step
      </Btn>
    </div>
  );
}
