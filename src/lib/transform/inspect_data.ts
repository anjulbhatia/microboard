import * as aq from "arquero";
import type { Dataset, OpDef } from "@/lib/transform/types";
import { cleanRows } from "@/lib/transform/types";

function runInspect(args: Record<string, unknown>): Dataset {
  const data = args.data as Dataset | undefined;
  if (!data || !Array.isArray(data.rows)) throw new Error("inspect_data needs data {columns, rows}.");
  const rows = cleanRows(data.rows);
  const t = aq.from(rows);
  const cols = t.columnNames();
  const sample = Number(args.sample ?? 5);
  const summary = cols.map((c) => {
    let nulls = 0;
    let numeric = true;
    for (const r of rows) {
      const v = (r as Record<string, unknown>)[c];
      if (v == null || v === "") {
        nulls++;
        continue;
      }
      if (typeof v !== "number" && !(typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))) {
        numeric = false;
      }
    }
    return { column: c, type: numeric ? "number" : "string", nulls, rows: rows.length };
  });
  return {
    columns: ["column", "type", "nulls", "rows"],
    rows: [...summary, { column: "__sample__", type: `first ${sample}`, nulls: 0, rows: rows.length }, ...rows.slice(0, sample).map((r, i) => ({ column: `#${i + 1}`, type: "row", nulls: 0, rows: 0, ...r }))],
  };
}

export const inspectDataOp: OpDef = {
  name: "inspect_data",
  description: "Column types, null counts, row count, plus sample rows.",
  params: [
    { name: "data", type: "dataset", required: true, description: "{columns, rows} input." },
    { name: "sample", type: "number", default: 5, description: "Sample row count." },
  ],
  run: runInspect,
};
