import * as aq from "arquero";
import type { Dataset, OpDef } from "@/lib/transform/types";
import { cleanRows } from "@/lib/transform/types";
import { inferFlashFill } from "@/lib/data-utils";

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
    case "header": {
      const rows = t.objects() as Record<string, unknown>[];
      if (rows.length === 0) return toDataset(t);
      const keys = Object.keys(rows[0]);
      const headers = keys.map((k, i) => {
        const v = String(rows[0][k] ?? "").trim();
        return v || `col_${i + 1}`;
      });
      return {
        columns: headers,
        rows: rows.slice(1).map((r) => {
          const obj: Record<string, unknown> = {};
          keys.forEach((k, i) => {
            obj[headers[i]] = r[k] ?? null;
          });
          return obj;
        }),
      };
    }
    case "dropDuplicates": {
      const cols = String(args.columns ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      return toDataset(cols.length > 0 ? t.dedupe(...cols) : t.dedupe());
    }
    case "fill": {
      const col = String(args.column ?? "__all__");
      const mode = String(args.mode ?? "value");
      const value = args.value ?? null;
      if (mode === "down") {
        if (!col || col === "__all__") throw new Error("transform_data fill down needs column.");
        let last: unknown = null;
        const rows = (t.objects() as Record<string, unknown>[]).map((r) => {
          const v = r[col];
          if (v != null && v !== "") last = v;
          return { ...r, [col]: v != null && v !== "" ? v : last };
        });
        return { columns: t.columnNames(), rows };
      }
      const cols = col === "__all__" ? t.columnNames() : [col];
      const rows = (t.objects() as Record<string, unknown>[]).map((r) => {
        const obj = { ...r };
        cols.forEach((c) => {
          if (obj[c] == null || obj[c] === "") obj[c] = value;
        });
        return obj;
      });
      return { columns: t.columnNames(), rows };
    }
    case "replace": {
      const col = String(args.column ?? "");
      const find = String(args.find ?? "");
      const with_ = args.with == null ? "" : String(args.with);
      if (!col || !find) throw new Error("transform_data replace needs column and find.");
      const rows = (t.objects() as Record<string, unknown>[]).map((r) => ({
        ...r,
        [col]: String(r[col] ?? "").split(find).join(with_),
      }));
      return { columns: t.columnNames(), rows };
    }
    case "limit": {
      const n = Math.max(0, Math.floor(Number(args.n ?? 0)));
      if (!n) return toDataset(t);
      const rows = (t.objects() as Record<string, unknown>[]).slice(0, n);
      return { columns: t.columnNames(), rows };
    }
    case "flashfill": {
      const col = String(args.column ?? "");
      const into = String(args.into ?? (col ? `${col}_fill` : ""));
      const example = String(args.example ?? "");
      if (!col || !into) throw new Error("transform_data flashfill needs column and into.");
      const fn = inferFlashFill(
        (t.objects() as Record<string, unknown>[]).map((r) => String(r[col] ?? "")),
        example
      );
      if (!fn) throw new Error("transform_data flashfill: no pattern fits that example.");
      const rows = (t.objects() as Record<string, unknown>[]).map((r) => ({
        ...r,
        [into]: fn(String(r[col] ?? "")),
      }));
      return { columns: [...t.columnNames(), into], rows };
    }
    default:
      throw new Error(
        `transform_data: unknown op "${op}". Use filter|select|rename|dropNulls|sort|groupBy|derive|header|dropDuplicates|fill|flashfill|replace|limit.`
      );
  }
}

export const transformDataOp: OpDef = {
  name: "transform_data",
  description:
    "Deterministic Arquero transforms: filter, select, rename, dropNulls, sort, groupBy, derive, header, dropDuplicates, fill, flashfill, replace, limit.",
  params: [
    { name: "data", type: "dataset", required: true, description: "{columns, rows} input." },
    {
      name: "op",
      type: "string",
      required: true,
      enum: ["filter", "select", "rename", "dropNulls", "sort", "groupBy", "derive", "header", "dropDuplicates", "fill", "flashfill", "replace", "limit"],
    },
    { name: "column", type: "string", description: "Target column." },
    { name: "cond", type: "string", enum: ["==", "!=", "contains", ">", "<", ">=", "<="], description: "Filter condition." },
    { name: "value", type: "string", description: "Filter value." },
    { name: "columns", type: "string", description: "Comma list for select." },
    { name: "to", type: "string", description: "Rename target." },
    { name: "dir", type: "string", enum: ["asc", "desc"], description: "Sort direction." },
    { name: "agg", type: "string", enum: ["sum", "count", "average", "min", "max"], description: "Group aggregation." },
    { name: "target", type: "string", description: "Aggregated column." },
    { name: "into", type: "string", description: "Derive/flashfill output column." },
    { name: "fn", type: "string", enum: ["+", "-", "*", "/"], description: "Derive arithmetic." },
    { name: "right", type: "string", description: "Derive right side (column or number)." },
    { name: "mode", type: "string", enum: ["value", "down"], description: "Fill mode." },
    { name: "example", type: "string", description: "Flashfill example output." },
    { name: "find", type: "string", description: "Replace find string." },
    { name: "with", type: "string", description: "Replace replacement." },
    { name: "n", type: "number", description: "Limit row count." },
  ],
  run: runTransform,
};
