import type { Row, Step } from "./types";

export function cellText(v: unknown): string {
  return v == null ? "" : String(v);
}

export function toNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function numParam(v: unknown): number | null {
  return toNumber(v);
}

function columnsParam(v: unknown): string[] {
  return cellText(v)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function filterRows(rows: Row[], p: Record<string, unknown>): Row[] {
  const col = cellText(p.column);
  const op = cellText(p.cond ?? p.op ?? "==");
  const value = p.value;
  if (!col) throw new Error("filter needs column.");
  return rows.filter((r) => {
    const cell = r[col];
    const cellNum = toNumber(cell);
    const valueNum = numParam(value);
    switch (op) {
      case "==":
        return cell == value || cellText(cell) === cellText(value);
      case "!=":
        return !(cell == value || cellText(cell) === cellText(value));
      case "contains":
        return cellText(cell).toLowerCase().includes(cellText(value).toLowerCase());
      case ">":
        return cellNum != null && valueNum != null && cellNum > valueNum;
      case "<":
        return cellNum != null && valueNum != null && cellNum < valueNum;
      case ">=":
        return cellNum != null && valueNum != null && cellNum >= valueNum;
      case "<=":
        return cellNum != null && valueNum != null && cellNum <= valueNum;
      default:
        throw new Error(`filter: unknown condition "${op}". Use ==|!=|contains|>|<|>=|<=.`);
    }
  });
}

function groupRows(rows: Row[], p: Record<string, unknown>): Row[] {
  const group = cellText(p.column);
  const target = cellText(p.target);
  const agg = cellText(p.agg ?? "count");
  if (!group) throw new Error("groupBy needs column.");
  if (agg !== "count" && !target) throw new Error(`groupBy ${agg} needs target.`);

  const groups = new Map<string, { key: unknown; values: number[]; count: number }>();
  for (const r of rows) {
    const rawKey = r[group];
    const key = cellText(rawKey);
    const entry = groups.get(key) ?? { key: rawKey ?? null, values: [], count: 0 };
    entry.count += 1;
    if (agg !== "count") {
      const n = toNumber(r[target]);
      if (n != null) entry.values.push(n);
    }
    groups.set(key, entry);
  }

  const outColumn = agg === "count" ? "count" : `${agg}_${target}`;
  return [...groups.entries()].map(([key, entry]) => {
    let value: number;
    if (agg === "count") value = entry.count;
    else if (agg === "sum") value = entry.values.reduce((a, b) => a + b, 0);
    else if (agg === "average") {
      value = entry.values.length ? entry.values.reduce((a, b) => a + b, 0) / entry.values.length : 0;
    } else if (agg === "min") value = entry.values.length ? Math.min(...entry.values) : 0;
    else if (agg === "max") value = entry.values.length ? Math.max(...entry.values) : 0;
    else throw new Error(`groupBy: unknown aggregate "${agg}". Use sum|count|average|min|max.`);
    return { [group]: entry.key ?? key, [outColumn]: Math.round(value * 100) / 100 };
  });
}

function deriveRows(rows: Row[], p: Record<string, unknown>): Row[] {
  const into = cellText(p.into);
  const column = cellText(p.column);
  const fn = cellText(p.fn ?? "+");
  const right = p.right;
  if (!into || !column) throw new Error("derive needs into and column.");
  if (!["+", "-", "*", "/"].includes(fn)) throw new Error(`derive: unknown fn "${fn}".`);
  const rightIsColumn = rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], cellText(right));
  const rightNum = numParam(right);
  return rows.map((r) => {
    const a = toNumber(r[column]) ?? 0;
    const b = rightIsColumn ? (toNumber(r[cellText(right)]) ?? 0) : (rightNum ?? 0);
    const value = fn === "+" ? a + b : fn === "-" ? a - b : fn === "*" ? a * b : b === 0 ? null : a / b;
    return { ...r, [into]: value };
  });
}

function headerRows(rows: Row[]): Row[] {
  if (rows.length === 0) return rows;
  const keys = Object.keys(rows[0]);
  const headers = keys.map((k, i) => {
    const value = cellText(rows[0][k]).trim();
    return value || `col_${i + 1}`;
  });
  if (new Set(headers).size !== headers.length) {
    throw new Error("header: first row has duplicate or empty column names.");
  }
  return rows.slice(1).map((r) => {
    const obj: Row = {};
    keys.forEach((k, i) => {
      obj[headers[i]] = r[k] ?? null;
    });
    return obj;
  });
}

function fillRows(rows: Row[], p: Record<string, unknown>): Row[] {
  const column = cellText(p.column ?? "__all__");
  const mode = cellText(p.mode ?? "value");
  const value = p.value ?? null;
  if (mode === "down") {
    if (!column || column === "__all__") throw new Error("fill down needs column.");
    let last: unknown = null;
    return rows.map((r) => {
      const current = r[column];
      if (current != null && current !== "") last = current;
      return { ...r, [column]: current != null && current !== "" ? current : last };
    });
  }
  const cols = column === "__all__" ? Object.keys(rows[0] ?? {}) : [column];
  return rows.map((r) => {
    const next = { ...r };
    for (const c of cols) {
      if (next[c] == null || next[c] === "") next[c] = value;
    }
    return next;
  });
}

function inferFlashFill(values: string[], example: string): ((v: string) => string) | null {
  const sources = values.filter((v) => v !== "");
  if (sources.length === 0 || example === "") return null;
  const src = sources.find((v) => v === example) ?? sources[0];
  const lower = (s: string) => s.toLowerCase();
  if (example === src.toUpperCase() && src !== example) return (v) => v.toUpperCase();
  if (example === lower(src) && src !== example) return (v) => lower(v);
  const titled = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  if (example === titled(lower(src))) return (v) => titled(lower(v));

  for (const d of [" ", "-", "_", "/", "@", ".", ","]) {
    if (!src.includes(d)) continue;
    const parts = src.split(d);
    const idx = parts.indexOf(example);
    if (parts.length > 1 && idx >= 0) {
      if (idx === 0) return (v) => v.split(d)[0] ?? v;
      if (idx === parts.length - 1) {
        return (v) => {
          const ps = v.split(d);
          return ps[ps.length - 1] ?? v;
        };
      }
      return (v) => v.split(d)[idx] ?? v;
    }
  }

  const initials = (s: string) =>
    s
      .split(/[\s\-_/.]+/)
      .filter(Boolean)
      .map((t) => t[0])
      .join("");
  if (example === initials(src)) return (v) => initials(v);
  if (src.startsWith(example) && example.length < src.length) {
    const n = example.length;
    return (v) => v.slice(0, n);
  }
  if (src.endsWith(example) && example.length < src.length) {
    const n = example.length;
    return (v) => v.slice(-n);
  }
  return null;
}

export function applyStep(rows: Row[], step: Step): Row[] {
  const p = step.params ?? {};
  switch (step.type) {
    case "filter":
      return filterRows(rows, p);
    case "groupBy":
      return groupRows(rows, p);
    case "select": {
      const cols = columnsParam(p.columns);
      if (cols.length === 0) throw new Error("select needs columns.");
      return rows.map((r) => {
        const obj: Row = {};
        for (const c of cols) obj[c] = r[c] ?? null;
        return obj;
      });
    }
    case "rename": {
      const from = cellText(p.column);
      const to = cellText(p.to);
      if (!from || !to) throw new Error("rename needs column and to.");
      return rows.map((r) => {
        const obj: Row = {};
        for (const [k, v] of Object.entries(r)) obj[k === from ? to : k] = v;
        return obj;
      });
    }
    case "dropNulls": {
      const column = cellText(p.column ?? "__all__");
      if (column === "__all__") {
        return rows.filter((r) => Object.values(r).every((v) => v != null && v !== ""));
      }
      return rows.filter((r) => r[column] != null && r[column] !== "");
    }
    case "sort": {
      const column = cellText(p.column);
      if (!column) throw new Error("sort needs column.");
      const dir = cellText(p.dir ?? "asc") === "desc" ? -1 : 1;
      return [...rows].sort((a, b) => {
        const an = toNumber(a[column]);
        const bn = toNumber(b[column]);
        if (an != null && bn != null) return (an - bn) * dir;
        return cellText(a[column]).localeCompare(cellText(b[column])) * dir;
      });
    }
    case "header":
      return headerRows(rows);
    case "dropDuplicates": {
      const cols = columnsParam(p.columns);
      const seen = new Set<string>();
      return rows.filter((r) => {
        const keys = cols.length > 0 ? cols : Object.keys(r);
        const sig = JSON.stringify(keys.map((k) => r[k] ?? null));
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
    }
    case "fill":
      return fillRows(rows, p);
    case "flashfill": {
      const column = cellText(p.column);
      const into = cellText(p.into || `${column}_fill`);
      if (!column) throw new Error("flashfill needs column.");
      const fn = inferFlashFill(rows.map((r) => cellText(r[column])), cellText(p.example));
      if (!fn) throw new Error("flashfill: no pattern fits that example.");
      return rows.map((r) => ({ ...r, [into]: fn(cellText(r[column])) }));
    }
    case "replace": {
      const column = cellText(p.column);
      const find = cellText(p.find);
      const replacement = cellText(p.with);
      if (!column || !find) throw new Error("replace needs column and find.");
      return rows.map((r) => ({ ...r, [column]: cellText(r[column]).split(find).join(replacement) }));
    }
    case "limit": {
      const n = Math.max(0, Math.floor(Number(p.n ?? 0)));
      return n ? rows.slice(0, n) : rows;
    }
    case "derive":
      return deriveRows(rows, p);
    default: {
      const unknown: never = step.type;
      throw new Error(`Unknown step type "${String(unknown)}".`);
    }
  }
}

export function applySteps(rows: Row[] | null, steps: Step[]): Row[] {
  return steps.reduce((acc, step) => applyStep(acc, step), rows ?? []);
}
