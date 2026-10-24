import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { compile } from "vega-lite";
import { parse, View } from "vega";
import sharp from "sharp";
import {
  BOARD_GRID,
  buildWidgetSpec,
  CHART_THEME,
  type Board,
  type Widget,
  type WidgetSpec,
} from "@microboard/core";

const require = createRequire(import.meta.url);

const UNIT_W = 180;
const UNIT_H = 132;
const GAP = 14;
const PAD = 24;
const HEADER = 58;
const FONT = "Geist, Inter, ui-sans-serif, -apple-system, Segoe UI, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: unknown, max: number): string {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function statsLine(board: Board): string {
  return [
    `v${board.version}`,
    count(board.data.cleaned?.length ?? 0, "row"),
    count(board.steps.length, "step"),
    count(Object.keys(board.widgets).length, "widget"),
  ].join(" · ");
}

async function vegaSvg(spec: Record<string, unknown>, width: number, height: number): Promise<string> {
  const resized = { ...spec, width, height };
  const compiled = compile(resized as never).spec;
  const view = new View(parse(compiled as never), { renderer: "none" });
  await view.runAsync();
  const svg = await view.toSVG();
  view.finalize();
  return svg;
}

function svgOpen(width: number, height: number, extra = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"${extra}>`;
}

function kpiSvg(spec: WidgetSpec, width: number, height: number): string {
  const value = spec.kpi?.value ?? 0;
  const label = escapeXml(spec.kpi?.label ?? "");
  const size = Math.max(20, Math.min(56, Math.floor(height / 2.4)));
  return [
    `<g font-family="${FONT}">`,
    `<text x="16" y="${Math.round(height * 0.46)}" font-size="${size}" font-weight="700" fill="${CHART_THEME.foreground}">${escapeXml(value.toLocaleString("en-US"))}</text>`,
    `<text x="16" y="${Math.round(height * 0.46) + 24}" font-size="12" fill="${CHART_THEME.muted}">${label} · ${count(spec.kpi?.rows ?? 0, "row")}</text>`,
    `</g>`,
  ].join("");
}

function tableSvg(spec: WidgetSpec, width: number, height: number): string {
  const table = spec.table;
  if (!table || table.columns.length === 0) {
    return `<text x="16" y="32" font-family="${FONT}" font-size="12" fill="${CHART_THEME.muted}">No data</text>`;
  }
  const cols = table.columns.slice(0, 6);
  const rows = table.rows.slice(0, Math.max(1, Math.floor((height - 34) / 20)));
  const colW = (width - 24) / cols.length;
  const parts: string[] = [`<g font-family="${MONO}">`];
  cols.forEach((col, i) => {
    parts.push(
      `<text x="${12 + i * colW}" y="20" font-size="10" font-weight="600" fill="${CHART_THEME.muted}">${escapeXml(truncate(col, Math.floor(colW / 6)))}</text>`
    );
    parts.push(
      `<line x1="${12 + i * colW}" y1="28" x2="${12 + i * colW + colW - 8}" y2="28" stroke="${CHART_THEME.grid}" />`
    );
  });
  rows.forEach((row, r) => {
    cols.forEach((col, i) => {
      parts.push(
        `<text x="${12 + i * colW}" y="${46 + r * 20}" font-size="10" fill="${CHART_THEME.foreground}">${escapeXml(truncate(row[col], Math.floor(colW / 6)))}</text>`
      );
    });
  });
  parts.push("</g>");
  return parts.join("");
}

async function widgetBody(spec: WidgetSpec, width: number, height: number): Promise<string> {
  if (spec.kpi) return kpiSvg(spec, width, height);
  if (spec.table) return tableSvg(spec, width, height);
  if (!spec.spec) {
    return `<text x="16" y="32" font-family="${FONT}" font-size="12" fill="${CHART_THEME.muted}">No chartable data</text>`;
  }
  return vegaSvg(spec.spec, Math.max(120, width), Math.max(80, height));
}

function widgetBox(spec: WidgetSpec, item: { x: number; y: number; w: number; h: number }): string {
  const x = item.x;
  const y = item.y;
  return [
    `<g>`,
    `<rect x="${x}" y="${y}" width="${item.w}" height="${item.h}" rx="12" fill="#ffffff" stroke="${CHART_THEME.grid}" />`,
    `<text x="${x + 14}" y="${y + 22}" font-family="${FONT}" font-size="12" font-weight="650" fill="${CHART_THEME.foreground}">${escapeXml(truncate(spec.title, 48))}</text>`,
    `</g>`,
  ].join("");
}

export async function boardToSvg(board: Board): Promise<string> {
  const maxRows = Math.max(
    BOARD_GRID.rows,
    ...board.layout.map((item) => item.y + item.h),
  );
  const width = PAD * 2 + BOARD_GRID.cols * UNIT_W;
  const height = HEADER + PAD + maxRows * UNIT_H;
  const parts: string[] = [
    svgOpen(width, height),
    `<rect width="${width}" height="${height}" fill="${CHART_THEME.background}" />`,
    `<text x="${PAD}" y="30" font-family="${FONT}" font-size="20" font-weight="750" fill="${CHART_THEME.foreground}">${escapeXml(board.title)}</text>`,
    `<text x="${PAD}" y="48" font-family="${MONO}" font-size="10" fill="${CHART_THEME.muted}">${escapeXml(statsLine(board))}</text>`,
  ];

  for (const item of board.layout) {
    const widget = board.widgets[item.i];
    if (!widget) continue;
    const spec = buildWidgetSpec(board, widget);
    const boxX = PAD + item.x * UNIT_W + GAP / 2;
    const boxY = HEADER + item.y * UNIT_H + GAP / 2;
    const boxW = item.w * UNIT_W - GAP;
    const boxH = item.h * UNIT_H - GAP;
    parts.push(widgetBox(spec, { x: boxX, y: boxY, w: boxW, h: boxH }));
    const body = await widgetBody(spec, boxW - 28, boxH - 78);
    parts.push(
      `<svg x="${boxX + 14}" y="${boxY + 32}" width="${boxW - 28}" height="${boxH - 46}" viewBox="0 0 ${boxW - 28} ${boxH - 46}">${body}</svg>`
    );
  }

  parts.push("</svg>");
  return parts.join("");
}

export async function boardToPng(board: Board): Promise<Buffer> {
  const svg = await boardToSvg(board);
  return sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
}

export async function widgetToSvg(board: Board, widget: Widget, width = 760, height = 460): Promise<string> {
  const spec = buildWidgetSpec(board, widget);
  const body = await widgetBody(spec, width - 40, height - 100);
  return [
    svgOpen(width, height),
    `<rect width="${width}" height="${height}" fill="${CHART_THEME.background}" />`,
    `<text x="20" y="30" font-family="${FONT}" font-size="16" font-weight="700" fill="${CHART_THEME.foreground}">${escapeXml(widget.title)}</text>`,
    `<svg x="20" y="46" width="${width - 40}" height="${height - 66}" viewBox="0 0 ${width - 40} ${height - 66}">${body}</svg>`,
    "</svg>",
  ].join("");
}

export async function widgetToPng(board: Board, widget: Widget): Promise<Buffer> {
  const svg = await widgetToSvg(board, widget);
  return sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
}

function readUmd(pkg: string, file: string): string {
  const entry = require.resolve(pkg);
  return readFileSync(join(dirname(entry), file), "utf8");
}

function htmlWidget(spec: WidgetSpec): string {
  if (spec.kpi) {
    return `<div class="kpi"><strong>${escapeXml(spec.kpi.value.toLocaleString("en-US"))}</strong><span>${escapeXml(spec.kpi.label)} · ${count(spec.kpi.rows, "row")}</span></div>`;
  }
  if (spec.table) {
    const cols = spec.table.columns.slice(0, 8);
    const head = cols.map((c) => `<th>${escapeXml(c)}</th>`).join("");
    const rows = spec.table.rows
      .map((row) => `<tr>${cols.map((c) => `<td>${escapeXml(row[c])}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (!spec.spec) return `<div class="empty">No chartable data</div>`;
  return `<div class="chart" id="chart-${escapeXml(spec.widgetId)}"></div>`;
}

export function boardToHtml(board: Board): string {
  const specs = board.layout.map((item) => {
    const widget = board.widgets[item.i];
    return widget ? buildWidgetSpec(board, widget) : null;
  });
  const maxRows = Math.max(BOARD_GRID.rows, ...board.layout.map((item) => item.y + item.h));
  const vegaJs = readUmd("vega", "vega.min.js");
  const vegaLiteJs = readUmd("vega-lite", "vega-lite.min.js");
  const vegaEmbedJs = readUmd("vega-embed", "vega-embed.min.js");
  const cards = board.layout
    .map((item, index) => {
      const spec = specs[index];
      if (!spec) return "";
      return `<section class="card" style="grid-column:${item.x + 1} / span ${item.w};grid-row:${item.y + 1} / span ${item.h}">
  <h2>${escapeXml(spec.title)}</h2>
  ${htmlWidget(spec)}
</section>`;
    })
    .join("\n");

  const embeds = JSON.stringify(
    specs
      .filter((spec): spec is WidgetSpec => Boolean(spec?.spec))
      .map((spec) => ({ id: `chart-${spec.widgetId}`, spec: spec.spec }))
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeXml(board.title)} — Microboard</title>
<style>
:root{color-scheme:light;--bg:#fafaf9;--fg:#292524;--muted:#78716c;--line:#e7e5e4}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:${FONT}}
main{max-width:1440px;margin:0 auto;padding:32px}
header{border-bottom:1px solid var(--line);margin-bottom:20px;padding-bottom:12px}
h1{font-size:26px;margin:0 0 4px}header p{margin:0;font:11px ${MONO};color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(8,1fr);grid-auto-rows:132px;gap:14px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.card h2{font-size:12px;margin:0 0 6px;font-weight:650}
.chart{flex:1;min-height:0}.chart canvas,.chart svg{max-width:100%;height:auto}
.kpi{display:flex;flex-direction:column;gap:4px}.kpi strong{font-size:clamp(20px,3vw,44px);line-height:1}.kpi span{font:11px ${MONO};color:var(--muted)}
.table-wrap{overflow:auto;flex:1}table{border-collapse:collapse;width:100%;font:10px ${MONO}}th,td{text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--muted)}
.empty{color:var(--muted);font:12px ${MONO};padding:12px 0}
footer{margin-top:24px;font:10px ${MONO};color:var(--muted)}
</style>
</head>
<body>
<main>
<header>
<h1>${escapeXml(board.title)}</h1>
<p>${escapeXml(statsLine(board))} · recipe ${escapeXml(board.id)}</p>
</header>
<div class="grid" style="grid-template-rows:repeat(${maxRows},132px)">${cards}</div>
<footer>Generated by Microboard. Board JSON is the source of truth.</footer>
</main>
<script>${vegaJs}</script>
<script>${vegaLiteJs}</script>
<script>${vegaEmbedJs}</script>
<script>
const charts = ${embeds};
for (const {id, spec} of charts) {
  const el = document.getElementById(id);
  if (el) vegaEmbed(el, spec, {actions:false, renderer:"canvas"}).catch(() => {});
}
</script>
</body>
</html>`;
}
