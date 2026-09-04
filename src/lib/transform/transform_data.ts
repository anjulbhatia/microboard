import * as aq from "arquero";
import type { Dataset, OpDef } from "@/lib/transform/types";
import { cleanRows } from "@/lib/transform/types";

type Table = ReturnType<typeof aq.from>;

function toTable(data: Dataset): Table {
  return aq.from(cleanRows(data.rows));
}

function toDataset(t: Table): Dataset {
  return { columns: t.columnNames(), rows: t.objects() as Record<string, unknown>[] };
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function applyFilter(t: Table, p: Record<string, unknown>): Table {
  const col = String(p.column ?? "");
  const op = String(p.cond ?? "==");
  const raw = p.value;
  switch (op) {
    case "==":
      return t.filter(aq.escape((d: Record<string, unknown>) => d[col] == raw));
    case "!=":
      return t.filter(aq.escape((d: Record<string, unknown>) => d[col] != raw));
    case "contains":
      return t.filter(
        aq.escape((d: Record<string, unknown>) => String(d[col] ?? "").toLowerCase().includes(String(raw).toLowerCase()))
      );
    case ">":
    case "<":
    case ">=":
    case "<=": {
      const n = num(raw);
      return t.filter(
        aq.escape((d: Record<string, unknown>) => {
          const c = num(d[col]);
          if (c == null || n == null) return false;
          if (op === ">") return c > n;
          if (op === "<") return c < n;
          if (op === ">=") return c >= n;
          return c <= n;
        })
      );
    }
    default:
      throw new Error(`transform_data filter: unknown op "${op}".`);
  }
}

function applyGroupBy(t: Table, p: Record<string, unknown>): Table {
  const group = String(p.column ?? "");
  const agg = String(p.agg ?? "count");
  const target = String(p.target ?? "");
  if (!group) throw new Error("transform_data groupBy needs column.");
  if (agg === "count") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t.groupby(group).rollup({ count: (_d: any) => aq.op.count() });
  }
  if (!target) throw new Error(`transform_data groupBy ${agg} needs target.`);
  if (!t.columnNames().includes(target)) throw new Error(`transform_data groupBy: no column "${target}".`);
  // Rollup bodies are AST-parsed, so member access must be static.
  // Funnel the target through a temp column, then use a literal.
  const TMP = "__v__";
  const tt = t
    .derive({ [TMP]: aq.escape((d: Record<string, unknown>) => num(d[target]) ?? 0) })
    .select([group, TMP]);
  const out = `${agg}_${target}`;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  if (agg === "sum") return tt.groupby(group).rollup({ [out]: (d: any) => aq.op.sum(d.__v__) });
  if (agg === "average") return tt.groupby(group).rollup({ [out]: (d: any) => aq.op.average(d.__v__) });
  if (agg === "min") return tt.groupby(group).rollup({ [out]: (d: any) => aq.op.min(d.__v__) });
  if (agg === "max") return tt.groupby(group).rollup({ [out]: (d: any) => aq.op.max(d.__v__) });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  throw new Error(`transform_data groupBy: unknown agg "${agg}".`);
}

function applyDerive(t: Table, p: Record<string, unknown>): Table {
  const into = String(p.into ?? "");
  const left = String(p.column ?? "");
  const fn = String(p.fn ?? "+");
  const rightRaw = p.right;
  if (!into || !left) throw new Error("transform_data derive needs into, column.");
  if (!["+", "-", "*", "/"].includes(fn)) throw new Error(`transform_data derive: unknown fn "${fn}".`);
  const rightIsCol = typeof rightRaw === "string" && t.columnNames().includes(rightRaw);
  const rightNum = num(rightRaw);
  return t.derive({
    [into]: aq.escape(
      (d: Record<string, unknown>) => {
        const a = num(d[left]) ?? 0;
        const b = rightIsCol ? (num(d[String(rightRaw)]) ?? 0) : (rightNum ?? 0);
        if (fn === "+") return a + b;
        if (fn === "-") return a - b;
        if (fn === "*") return a * b;
        return b === 0 ? null : a / b;
      }
    ),
  });
}

function runTransform(args: Record<string, unknown>): Dataset {
  const data = args.data as Dataset | undefined;
  if (!data || !Array.isArray(data.rows)) throw new Error("transform_data needs data {columns, rows}.");
  const op = String(args.op ?? "");
  const t = toTable(data);
  switch (op) {
    case "filter":
      return toDataset(applyFilter(t, args));
    case "select": {
      const cols = String(args.columns ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cols.length === 0) throw new Error("transform_data select needs columns.");
      return toDataset(t.select(cols));
    }
    case "rename": {
      const from = String(args.column ?? "");
      const to = String(args.to ?? "");
      if (!from || !to) throw new Error("transform_data rename needs column and to.");
      return toDataset(t.rename({ [from]: to }));
    }
    case "dropNulls": {
      const col = String(args.column ?? "__all__");
      if (col === "__all__") {
        const cols = t.columnNames();
        return toDataset(t.filter(aq.escape((d: Record<string, unknown>) => cols.every((c) => d[c] != null && d[c] !== ""))));
      }
      return toDataset(t.filter(aq.escape((d: Record<string, unknown>) => d[col] != null && d[col] !== "")));
    }
    case "sort": {
      const col = String(args.column ?? "");
      if (!col) throw new Error("transform_data sort needs column.");
      const desc = String(args.dir ?? "asc") === "desc";
      return toDataset(desc ? t.orderby(aq.desc(col)) : t.orderby(col));
    }
    case "groupBy":
      return toDataset(applyGroupBy(t, args));
    case "derive":
      return toDataset(applyDerive(t, args));
    default:
      throw new Error(`transform_data: unknown op "${op}". Use filter|select|rename|dropNulls|sort|groupBy|derive.`);
  }
}

export const transformDataOp: OpDef = {
  name: "transform_data",
  description: "Deterministic Arquero transforms: filter, select, rename, dropNulls, sort, groupBy, derive.",
  params: [
    { name: "data", type: "dataset", required: true, description: "{columns, rows} input." },
    { name: "op", type: "string", required: true, enum: ["filter", "select", "rename", "dropNulls", "sort", "groupBy", "derive"] },
    { name: "column", type: "string", description: "Target column." },
    { name: "cond", type: "string", enum: ["==", "!=", "contains", ">", "<", ">=", "<="], description: "Filter condition." },
    { name: "value", type: "string", description: "Filter value." },
    { name: "columns", type: "string", description: "Comma list for select." },
    { name: "to", type: "string", description: "Rename target." },
    { name: "dir", type: "string", enum: ["asc", "desc"], description: "Sort direction." },
    { name: "agg", type: "string", enum: ["sum", "count", "average", "min", "max"], description: "Group aggregation." },
    { name: "target", type: "string", description: "Aggregated column." },
    { name: "into", type: "string", description: "Derive output column." },
    { name: "fn", type: "string", enum: ["+", "-", "*", "/"], description: "Derive arithmetic." },
    { name: "right", type: "string", description: "Derive right side (column or number)." },
  ],
  run: runTransform,
};
