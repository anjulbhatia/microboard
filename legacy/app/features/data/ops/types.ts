/** A JSON-friendly dataset: the unit every op consumes and produces. */
export interface Dataset {
  columns: string[];
  rows: Record<string, unknown>[];
}

export type ParamType = "string" | "number" | "boolean" | "json" | "dataset";

export interface ParamDef {
  name: string;
  type: ParamType;
  required?: boolean;
  default?: unknown;
  description?: string;
  enum?: string[];
}

export interface OpDef {
  name: string;
  description: string;
  params: ParamDef[];
  run: (args: Record<string, unknown>) => Dataset | Promise<Dataset>;
}

export function emptyDataset(): Dataset {
  return { columns: [], rows: [] };
}

/**
 * Normalize loose values: "" becomes null so engines see real nulls,
 * numeric-looking strings become numbers so sort/agg behave.
 */
export function cleanValue(v: unknown): unknown {
  if (v === "") return null;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return v;
}

export function cleanRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) obj[k] = cleanValue(v);
    return obj;
  });
}
