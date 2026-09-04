import type { CellValue, TabularData } from "@/lib/data-providers/types";

export type ClipSep = "tab" | "comma" | "semicolon" | "colon" | "space";

const SEP_CHAR: Record<ClipSep, string> = {
  tab: "\t",
  comma: ",",
  semicolon: ";",
  colon: ":",
  space: " ",
};

/** Guess the separator from the first non-empty line. */
export function detectSep(text: string): ClipSep {
  const line = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const counts: Record<ClipSep, number> = {
    tab: line.split("\t").length - 1,
    comma: line.split(",").length - 1,
    semicolon: line.split(";").length - 1,
    colon: line.split(":").length - 1,
    space: (line.match(/ {2,}|\t/g) ?? []).length,
  };
  if (counts.tab > 0) return "tab";
  if (counts.semicolon >= counts.comma && counts.semicolon > 0) return "semicolon";
  if (counts.comma > 0) return "comma";
  if (counts.colon > 1) return "colon";
  return "space";
}

function splitLine(line: string, sep: ClipSep): string[] {
  if (sep === "space") return line.trim().split(/\s+/);
  return line.split(SEP_CHAR[sep]).map((c) => c.trim().replace(/^"|"$/g, ""));
}

/** Parse pasted text: csv, tab, semicolon, colon, or whitespace separated. */
export function clipboardFromText(text: string, sep?: ClipSep): TabularData {
  const resolved = sep ?? detectSep(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("Need a header row plus at least one data row.");
  const columns = splitLine(lines[0], resolved).map((c, i) => c || `col_${i + 1}`);
  const rows: CellValue[][] = lines.slice(1).map((line) => {
    const cells = splitLine(line, resolved);
    return columns.map((_, i) => {
      const v = cells[i] ?? "";
      if (v === "") return null;
      const n = Number(v);
      return v !== "" && Number.isFinite(n) ? n : v;
    });
  });
  return { columns, rows };
}
