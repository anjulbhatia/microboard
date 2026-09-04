import type { Dataset, OpDef } from "@/lib/transform/types";
import { csvFromText } from "@/lib/data-providers/csv";
import { clipboardFromText, type ClipSep } from "@/lib/data-providers/clipboard";
import { excelFromFile } from "@/lib/data-providers/excel";
import { sheetFromUrl } from "@/lib/data-providers/sheet";
import type { CellValue } from "@/lib/data-providers/types";
import { SAMPLE_CSV } from "@/lib/data-utils";

function tabularToDataset(columns: string[], rows: CellValue[][]): Dataset {
  return {
    columns,
    rows: rows.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((c, i) => {
        obj[c] = row[i] ?? null;
      });
      return obj;
    }),
  };
}

async function runGetData(args: Record<string, unknown>): Promise<Dataset> {
  const type = String(args.type ?? "csv");
  switch (type) {
    case "sample": {
      const t = csvFromText(SAMPLE_CSV);
      return tabularToDataset(t.columns, t.rows);
    }
    case "csv": {
      const text = String(args.text ?? "");
      if (!text) throw new Error("get_data csv needs text.");
      const t = csvFromText(text);
      return tabularToDataset(t.columns, t.rows);
    }
    case "clipboard": {
      const text = String(args.text ?? "");
      if (!text) throw new Error("get_data clipboard needs text.");
      const sep = args.sep ? (String(args.sep) as ClipSep) : undefined;
      const t = clipboardFromText(text, sep);
      return tabularToDataset(t.columns, t.rows);
    }
    case "excel": {
      const file = args.file;
      if (!(file instanceof File)) {
        throw new Error("get_data excel needs a File object (in-function only, not inline).");
      }
      const t = await excelFromFile(file);
      return tabularToDataset(t.columns, t.rows);
    }
    case "gsheet": {
      const url = String(args.url ?? "");
      if (!url) throw new Error("get_data gsheet needs url.");
      const t = await sheetFromUrl(url);
      return tabularToDataset(t.columns, t.rows);
    }
    default:
      throw new Error(`get_data: unknown type "${type}". Use csv|clipboard|excel|gsheet|sample.`);
  }
}

export const getDataOp: OpDef = {
  name: "get_data",
  description: "Load a dataset from csv, clipboard, excel, gsheet, or the sample.",
  params: [
    { name: "type", type: "string", required: true, enum: ["csv", "clipboard", "excel", "gsheet", "sample"], description: "Source type." },
    { name: "text", type: "string", description: "Raw text for csv/clipboard." },
    { name: "sep", type: "string", enum: ["tab", "comma", "semicolon", "colon", "space"], description: "Clipboard separator override (auto-detected otherwise)." },
    { name: "url", type: "string", description: "Public Google Sheets link for gsheet." },
    { name: "file", type: "json", description: "Excel File object (in-function calls only)." },
  ],
  run: runGetData,
};
