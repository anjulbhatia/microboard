import { toCanvas, toJpeg, toPng, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";

export type BoardImageFormat = "jpg" | "png" | "svg" | "pdf";

function slug(name: string): string {
  const s = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s || "board";
}

function download(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  // Firefox ignores clicks on detached anchors.
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function themeBg(): string {
  return isDark() ? "#1c1917" : "#fafaf9";
}

function themeFg(): string {
  return isDark() ? "#f5f4f0" : "#292524";
}

let colorCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Resolve any CSS color (oklch(), color-mix(), lab(), named) to a
 * raster-safe rgb() string via the canvas parser. Null when the value is
 * not a color or fails to parse.
 */
function resolveColorOrNull(value: string): string | null {
  const v = value.trim();
  if (!v || v === "none" || v === "transparent") return null;
  try {
    if (colorCtx === undefined) {
      colorCtx = document.createElement("canvas").getContext("2d");
    }
    if (!colorCtx) return null;
    const sentinel = "rgba(1, 2, 3, 0.5)";
    colorCtx.fillStyle = sentinel;
    colorCtx.fillStyle = v;
    const out = colorCtx.fillStyle;
    // Invalid input leaves fillStyle unchanged (still the sentinel).
    if (!out || out === sentinel) return null;
    return out;
  } catch {
    return null;
  }
}

let cachedVarNames: string[] | null = null;

/** Every custom property referenced by same-origin stylesheets. */
function usedVarNames(): string[] {
  if (cachedVarNames) return cachedVarNames;
  const names = new Set<string>();
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin sheet — skip
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        const text = rule.cssText ?? "";
        const re = /--[\w-]+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) names.add(m[0]);
        if (names.size > 500) break;
      }
    }
  } catch {
    // Style scraping failed — export falls back to live values.
  }
  cachedVarNames = [...names];
  return cachedVarNames;
}

/**
 * Point every theme var at a resolved rgb() on `root` (the rasterizer
 * cannot parse oklch()/lab(); inheritance carries it to all descendants,
 * including SVG). Returns a restore fn. Live nodes stay visually
 * identical — values are the same colors in rgb.
 */
export function applyThemeVars(root: HTMLElement): () => void {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:fixed;left:-99999px;top:0;visibility:hidden;";
  document.body.appendChild(probe);
  const touched: string[] = [];
  try {
    for (const name of usedVarNames()) {
      probe.style.color = `var(${name})`;
      const computed = getComputedStyle(probe).color;
      if (!computed || computed.includes("var(")) continue;
      const rgb = resolveColorOrNull(computed);
      if (rgb) {
        root.style.setProperty(name, rgb);
        touched.push(name);
      }
    }
  } finally {
    probe.remove();
  }
  return () => {
    for (const name of touched) root.style.removeProperty(name);
  };
}

/**
 * Make an owned (detached) raster clone safe: resolved theme vars plus an
 * opaque surface (JPEG has no alpha — transparent renders black).
 */
export function prepExportRoot(root: HTMLElement): void {
  applyThemeVars(root);
  root.style.backgroundColor = themeBg();
  root.style.color = themeFg();
}

/** Clone the stage, prepend the board name. Raster prep runs via onClone. */
function titledWrap(title: string): { node: HTMLElement; cleanup: () => void } {
  const el = document.getElementById("board-stage");
  if (!el) throw new Error("Board stage not found.");
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${el.offsetWidth}px`;
  clone.style.height = `${el.offsetHeight}px`;
  clone.style.overflow = "hidden";
  const caption = document.createElement("div");
  caption.textContent = title || "board";
  caption.style.cssText =
    `font-family:monospace;font-size:22px;font-weight:700;letter-spacing:0.15em;` +
    `padding:14px 18px 4px;color:${themeFg()};background:${themeBg()};`;
  const wrap = document.createElement("div");
  wrap.style.cssText = `background:${themeBg()};color:${themeFg()};display:inline-block;`;
  wrap.appendChild(caption);
  wrap.appendChild(clone);
  wrap.style.position = "fixed";
  wrap.style.left = "-99999px";
  wrap.style.top = "0";
  document.body.appendChild(wrap);
  prepExportRoot(wrap);
  return { node: wrap, cleanup: () => wrap.remove() };
}

export async function exportBoardImage(format: BoardImageFormat, boardName: string): Promise<void> {
  const { node, cleanup } = titledWrap(boardName.trim() || "board");
  const name = slug(boardName);
  // Let webfonts settle — mid-load fonts rasterize as blank text.
  try {
    await document.fonts.ready;
  } catch {
    // Font API unavailable — proceed anyway.
  }
  try {
    // Large boards can exceed canvas limits at 2x; retry at 1x.
    const ratios = format === "svg" ? [1] : [2, 1];
    let lastError: unknown = null;
    for (const pixelRatio of ratios) {
      try {
        if (format === "png") {
          download(await toPng(node, { pixelRatio, backgroundColor: themeBg() }), `${name}.png`);
        } else if (format === "svg") {
          download(await toSvg(node), `${name}.svg`);
        } else if (format === "pdf") {
          await downloadPdf(node, name, pixelRatio);
        } else {
          download(
            await toJpeg(node, { quality: 0.92, pixelRatio, backgroundColor: themeBg() }),
            `${name}.jpg`
          );
        }
        return;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Export failed.");
  } finally {
    cleanup();
  }
}

async function downloadPdf(node: HTMLElement, name: string, pixelRatio: number): Promise<void> {
  const url = await toJpeg(node, { pixelRatio, backgroundColor: themeBg() });
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not rasterize board."));
    img.src = url;
  });
  const landscape = img.width >= img.height;
  const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "px", format: [img.width, img.height] });
  pdf.addImage(url, "JPEG", 0, 0, img.width, img.height);
  pdf.save(`${name}.pdf`);
}

/**
 * Live-raster the stage for the minimap. Theme vars are applied to the
 * live node for the duration of the capture (same rgb values, no visual
 * change) and restored after — shares the export raster path.
 */
export async function rasterStageThumb(maxWidth: number): Promise<string> {
  const el = document.getElementById("board-stage");
  if (!el) throw new Error("Board stage not found.");
  const restore = applyThemeVars(el);
  try {
    const canvas = await toCanvas(el, {
      canvasWidth: maxWidth,
      backgroundColor: themeBg(),
    });
    return canvas.toDataURL("image/png");
  } finally {
    restore();
  }
}
