import type { ColumnMeta, Step } from "@/types/board";

export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.length > 1 || row[0].trim() !== "") rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      // skip, \n handles it
    } else {
      field += c;
    }
  }
  pushRow();
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => {
      obj[h] = (r[j] ?? "").trim();
    });
    return obj;
  });
}

export function toNumber(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function inferColumns(rows: Record<string, string>[]): ColumnMeta[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).map((name) => {
    let nulls = 0;
    let numeric = true;
    for (const r of rows) {
      const v = r[name];
      if (v === "" || v == null) {
        nulls++;
        continue;
      }
      if (toNumber(v) == null) numeric = false;
    }
    return { name, type: numeric ? "number" : "string", nulls };
  });
}

function applyStep(rows: Record<string, string>[], step: Step): Record<string, string>[] {
  const p = step.params;
  switch (step.type) {
    case "filter": {
      const col = p.column;
      const op = p.op;
      const val = p.value;
      return rows.filter((r) => {
        const cell = r[col] ?? "";
        const nCell = toNumber(cell);
        const nVal = toNumber(val);
        switch (op) {
          case "==":
            return cell === val;
          case "!=":
            return cell !== val;
          case "contains":
            return cell.toLowerCase().includes(val.toLowerCase());
          case ">":
            return nCell != null && nVal != null && nCell > nVal;
          case "<":
            return nCell != null && nVal != null && nCell < nVal;
          case ">=":
            return nCell != null && nVal != null && nCell >= nVal;
          case "<=":
            return nCell != null && nVal != null && nCell <= nVal;
          default:
            return true;
        }
      });
    }
    case "select": {
      const cols = (p.columns ?? "").split(",").map((c) => c.trim()).filter(Boolean);
      if (cols.length === 0) return rows;
      return rows.map((r) => {
        const obj: Record<string, string> = {};
        cols.forEach((c) => {
          obj[c] = r[c] ?? "";
        });
        return obj;
      });
    }
    case "rename": {
      const from = p.column;
      const to = p.to;
      if (!from || !to) return rows;
      return rows.map((r) => {
        const obj: Record<string, string> = {};
        Object.keys(r).forEach((k) => {
          obj[k === from ? to : k] = r[k];
        });
        return obj;
      });
    }
    case "dropNulls": {
      const col = p.column;
      if (!col || col === "__all__") {
        return rows.filter((r) => Object.values(r).every((v) => v !== "" && v != null));
      }
      return rows.filter((r) => r[col] !== "" && r[col] != null);
    }
    case "sort": {
      const col = p.column;
      const dir = p.dir === "desc" ? -1 : 1;
      return [...rows].sort((a, b) => {
        const an = toNumber(a[col] ?? "");
        const bn = toNumber(b[col] ?? "");
        if (an != null && bn != null) return (an - bn) * dir;
        return String(a[col] ?? "").localeCompare(String(b[col] ?? "")) * dir;
      });
    }
    case "groupBy": {
      const group = p.column;
      const target = p.target;
      const agg = p.agg;
      const groups = new Map<string, number[]>();
      for (const r of rows) {
        const key = r[group] ?? "";
        const list = groups.get(key) ?? [];
        if (agg === "count") {
          list.push(1);
        } else {
          const n = toNumber(r[target] ?? "");
          if (n != null) list.push(n);
        }
        groups.set(key, list);
      }
      return [...groups.entries()].map(([key, list]) => {
        let value = 0;
        if (agg === "count") value = list.length;
        else if (agg === "sum") value = list.reduce((a, b) => a + b, 0);
        else if (agg === "average") value = list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
        else if (agg === "min") value = list.length ? Math.min(...list) : 0;
        else if (agg === "max") value = list.length ? Math.max(...list) : 0;
        const rounded = Math.round(value * 100) / 100;
        return { [group]: key, [agg === "count" ? "count" : `${agg}_${target}`]: String(rounded) };
      });
    }
    case "header": {
      if (rows.length === 0) return rows;
      const first = rows[0];
      const keys = Object.keys(first);
      const headers = keys.map((k, i) => {
        const v = (first[k] ?? "").trim();
        return v || `col_${i + 1}`;
      });
      return rows.slice(1).map((r) => {
        const obj: Record<string, string> = {};
        keys.forEach((k, i) => {
          obj[headers[i]] = r[k] ?? "";
        });
        return obj;
      });
    }
    case "dropDuplicates": {
      const cols = (p.columns ?? "").split(",").map((c) => c.trim()).filter(Boolean);
      const seen = new Set<string>();
      return rows.filter((r) => {
        const keys = cols.length > 0 ? cols : Object.keys(r);
        const sig = keys.map((k) => r[k] ?? "").join("␟");
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
    }
    case "fill": {
      const col = p.column;
      const mode = p.mode ?? "value";
      const value = p.value ?? "";
      if (mode === "down") {
        let last = "";
        return rows.map((r) => {
          const v = r[col] ?? "";
          if (v !== "") last = v;
          return { ...r, [col]: v !== "" ? v : last };
        });
      }
      if (!col || col === "__all__") {
        return rows.map((r) => {
          const obj: Record<string, string> = {};
          Object.keys(r).forEach((k) => {
            obj[k] = r[k] !== "" && r[k] != null ? r[k] : value;
          });
          return obj;
        });
      }
      return rows.map((r) => (r[col] !== "" && r[col] != null ? r : { ...r, [col]: value }));
    }
    case "flashfill": {
      const col = p.column;
      const into = p.into || `${col}_fill`;
      const example = p.example ?? "";
      const fn = inferFlashFill(
        rows.map((r) => r[col] ?? ""),
        example
      );
      if (!fn) return rows;
      return rows.map((r) => ({ ...r, [into]: fn(r[col] ?? "") }));
    }
    case "replace": {
      const col = p.column;
      const find = p.find ?? "";
      const with_ = p.with ?? "";
      if (!col || !find) return rows;
      return rows.map((r) => ({ ...r, [col]: String(r[col] ?? "").split(find).join(with_) }));
    }
    default:
      return rows;
  }
}

/** Flash-fill-lite: infer a string rule from one example. Returns null if no rule fits. */
export function inferFlashFill(
  values: string[],
  example: string
): ((v: string) => string) | null {
  const sources = values.filter((v) => v !== "");
  if (sources.length === 0 || example === "") return null;
  const src = sources.find((v) => v === example) ?? sources[0];

  const lower = (s: string) => s.toLowerCase();
  if (example === src.toUpperCase() && src !== example) {
    return (v) => v.toUpperCase();
  }
  if (example === lower(src) && src !== example) {
    return (v) => lower(v);
  }
  const titled = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  if (example === titled(lower(src))) {
    return (v) => titled(lower(v));
  }

  const DELIMS = [" ", "-", "_", "/", "@", ".", ","];
  for (const d of DELIMS) {
    if (!src.includes(d)) continue;
    const parts = src.split(d);
    const idx = parts.indexOf(example);
    if (parts.length > 1 && idx >= 0) {
      if (idx === 0) return (v) => v.split(d)[0] ?? v;
      if (idx === parts.length - 1) return (v) => {
        const ps = v.split(d);
        return ps[ps.length - 1] ?? v;
      };
      return (v) => v.split(d)[idx] ?? v;
    }
  }

  const initials = (s: string) =>
    s
      .split(/[\s\-_/.]+/)
      .filter(Boolean)
      .map((t) => t[0])
      .join("");
  if (example === initials(src)) {
    return (v) => initials(v);
  }

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

export function applySteps(
  rows: Record<string, string>[],
  steps: Step[]
): Record<string, string>[] {
  return steps.reduce((acc, s) => applyStep(acc, s), rows);
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const SAMPLE_CSV = `month,channel,visitors,signups
Jan,organic,1860,182
Feb,organic,2400,210
Mar,organic,1980,195
Apr,organic,2780,260
Jan,paid,820,96
Feb,paid,1010,120
Mar,paid,940,110
Apr,paid,1240,148
Jan,social,540,48
Feb,social,610,55
Mar,social,720,70
Apr,social,690,62`;
