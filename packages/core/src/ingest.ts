import type { DataSource, Row } from "./types";

export const MAX_ROWS = 20_000;
export const MAX_COLUMNS = 200;
export const MAX_CELL_CHARS = 10_000;
export const MAX_BYTES = 10 * 1024 * 1024;

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

export function parseCsv(text: string): Row[] {
  const clean = text.replace(/^\uFEFF/, "");
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
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
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
    } else if (c !== "\r") {
      field += c;
    }
  }
  pushRow();
  if (rows.length < 2) throw new Error("CSV needs a header row plus at least one data row.");
  const headers = rows[0].map((h, i) => h.trim() || `col_${i + 1}`);
  return rows.slice(1).map((r) => {
    const obj: Row = {};
    headers.forEach((h, j) => {
      obj[h] = (r[j] ?? "").trim();
    });
    return obj;
  });
}

export type ClipSep = "tab" | "comma" | "semicolon" | "colon" | "space";

const SEP_CHAR: Record<ClipSep, string> = {
  tab: "\t",
  comma: ",",
  semicolon: ";",
  colon: ":",
  space: " ",
};

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

export function parseClipboard(text: string, sep?: ClipSep): Row[] {
  const resolved = sep ?? detectSep(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("Pasted data needs a header row plus at least one data row.");
  const columns = splitLine(lines[0], resolved).map((c, i) => c || `col_${i + 1}`);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line, resolved);
    const obj: Row = {};
    columns.forEach((c, i) => {
      const value = cells[i] ?? "";
      if (value === "") {
        obj[c] = null;
        return;
      }
      const n = Number(value);
      obj[c] = Number.isFinite(n) ? n : value;
    });
    return obj;
  });
}

export function parseJson(text: string): Row[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON. Provide an array of objects or { rows: [...] }.");
  }
  return rowsFromJson(parsed);
}

export function rowsFromJson(parsed: unknown): Row[] {
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown }).rows)
      ? ((parsed as { rows: unknown[] }).rows)
      : parsed && typeof parsed === "object"
        ? [parsed]
        : null;
  if (!list) throw new Error("JSON must be an array of objects, one object, or { rows: [...] }.");
  if (list.length === 0) throw new Error("JSON contains no rows.");
  return list.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`JSON row ${i + 1} is not an object.`);
    }
    return item as Row;
  });
}

export function normalizeRows(rows: Row[]): Row[] {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Dataset has no rows.");
  if (rows.length > MAX_ROWS) throw new Error(`Dataset exceeds ${MAX_ROWS} rows.`);

  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
      if (columns.length > MAX_COLUMNS) throw new Error(`Dataset exceeds ${MAX_COLUMNS} columns.`);
    }
  }
  if (columns.length === 0) throw new Error("Dataset has no columns.");

  return rows.map((row, rowIndex) => {
    const out: Row = {};
    for (const col of columns) {
      const value = row[col] ?? null;
      const size = typeof value === "string" ? value.length : JSON.stringify(value)?.length ?? 0;
      if (size > MAX_CELL_CHARS) {
        throw new Error(`Row ${rowIndex + 1}, column "${col}" exceeds ${MAX_CELL_CHARS} characters.`);
      }
      out[col] = value;
    }
    return out;
  });
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const a = Number(ipv4[1]);
  const b = Number(ipv4[2]);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed.");
  }
  if (isPrivateHost(url.hostname)) {
    throw new Error("Private, loopback, and link-local URLs are not allowed.");
  }
  return url;
}

function sheetExportUrl(url: URL): URL {
  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return url;
  return new URL(`https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`);
}

export async function fetchPublicText(raw: string): Promise<{ text: string; contentType: string }> {
  let url = assertPublicUrl(raw);
  url = sheetExportUrl(url);
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "text/csv, application/json, text/plain;q=0.9, */*;q=0.1" },
  });
  if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status} ${res.statusText}.`);
  assertPublicUrl(res.url || url.href);

  const length = Number(res.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) throw new Error(`Remote payload exceeds ${MAX_BYTES} bytes.`);
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) throw new Error(`Remote payload exceeds ${MAX_BYTES} bytes.`);
  return {
    text: new TextDecoder().decode(buffer),
    contentType: res.headers.get("content-type") ?? "",
  };
}

export interface IngestInput {
  type: "csv" | "json" | "clipboard" | "url" | "sample" | "rows";
  text?: string;
  url?: string;
  sep?: ClipSep;
  rows?: unknown;
}

export interface IngestResult {
  rows: Row[];
  source: DataSource;
}

export async function ingestData(input: IngestInput): Promise<IngestResult> {
  switch (input.type) {
    case "sample":
      return { rows: normalizeRows(parseCsv(SAMPLE_CSV)), source: "inline" };
    case "csv": {
      const text = input.text ?? "";
      if (!text.trim()) throw new Error("csv needs text.");
      return { rows: normalizeRows(parseCsv(text)), source: "inline" };
    }
    case "clipboard": {
      const text = input.text ?? "";
      if (!text.trim()) throw new Error("clipboard needs text.");
      return { rows: normalizeRows(parseClipboard(text, input.sep)), source: "inline" };
    }
    case "json": {
      if (input.rows !== undefined) return { rows: normalizeRows(rowsFromJson(input.rows)), source: "inline" };
      const text = input.text ?? "";
      if (!text.trim()) throw new Error("json needs text or rows.");
      return { rows: normalizeRows(parseJson(text)), source: "inline" };
    }
    case "url": {
      const url = input.url ?? "";
      if (!url) throw new Error("url source needs url.");
      const { text, contentType } = await fetchPublicText(url);
      const looksJson = contentType.includes("json") || /^\s*[[{]/.test(text);
      const rows = looksJson ? parseJson(text) : parseCsv(text);
      return { rows: normalizeRows(rows), source: "url" };
    }
    default:
      throw new Error(`Unknown ingest type "${String((input as { type?: string }).type)}".`);
  }
}
