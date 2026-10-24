import { inferColumns } from "./board";
import { toNumber } from "./steps";
import type { Board, ColumnMeta, Row } from "./types";

export interface InspectColumn extends ColumnMeta {
  min: number | null;
  max: number | null;
  mean: number | null;
}

export interface InspectReport {
  rows: number;
  columns: InspectColumn[];
  sample: Row[];
  steps: Array<{ id: string; type: string; description: string; params: Record<string, unknown> }>;
  version: number;
}

function numericStats(rows: Row[], name: string): { min: number | null; max: number | null; mean: number | null } {
  let min: number | null = null;
  let max: number | null = null;
  let sum = 0;
  let count = 0;
  for (const row of rows) {
    const value = toNumber(row[name]);
    if (value == null) continue;
    min = min == null ? value : Math.min(min, value);
    max = max == null ? value : Math.max(max, value);
    sum += value;
    count++;
  }
  return { min, max, mean: count ? Math.round((sum / count) * 1000) / 1000 : null };
}

export function inspectBoard(board: Board, sample = 5): InspectReport {
  const rows = board.data.cleaned ?? [];
  const limit = Math.max(0, Math.min(Math.floor(sample), 100));
  const columns = inferColumns(rows).map((column) => ({
    ...column,
    ...(column.type === "number" ? numericStats(rows, column.name) : { min: null, max: null, mean: null }),
  }));
  return {
    rows: rows.length,
    columns,
    sample: rows.slice(0, limit),
    steps: board.steps.map((step) => ({
      id: step.id,
      type: step.type,
      description: step.description,
      params: step.params,
    })),
    version: board.version,
  };
}
