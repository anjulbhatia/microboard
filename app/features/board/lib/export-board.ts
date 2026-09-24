import { toJpeg, toPng, toSvg } from "html-to-image";
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

const COLOR_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "caret-color",
  "fill",
  "stroke",
  "stop-color",
  "flood-color",
] as const;

const SHADOW_PROPS = ["box-shadow", "text-shadow"] as const;

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
 * raster-safe rgb() string via the canvas parser. Returns fallback when
 * the value is not a color (e.g. "none") or fails to parse.
 */
function resolveColor(value: string, fallback: string): string {
  const v = value.trim();
  if (!v || v === "none" || v === "transparent") return fallback;
  try {
    if (colorCtx === undefined) {
      colorCtx = document.createElement("canvas").getContext("2d");
    }
    if (!colorCtx) return fallback;
    const sentinel = "rgba(1, 2, 3, 0.5)";
    colorCtx.fillStyle = sentinel;
    colorCtx.fillStyle = v;
    const out = colorCtx.fillStyle;
    // Invalid input leaves fillStyle unchanged (still the sentinel).
    if (!out || out === sentinel) return fallback;
    return out;
  } catch {
    return fallback;
  }
}

/** Replace color functions inside shorthands (shadows) with rgb(). */
function resolveShadows(value: string): string {
  let out = "";
  let rest = value;
  const fnRe = /(oklch|lab|lch|oklab|color-mix|color)\(/;
  for (;;) {
    const m = fnRe.exec(rest);
    if (!m || m.index === undefined) return out + rest;
    // Balance parens from the function's opening bracket.
    let depth = 0;
    let end = -1;
    for (let i = m.index + m[0].length - 1; i < rest.length; i++) {
      if (rest[i] === "(") depth++;
      else if (rest[i] === ")") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) return out + rest;
    const token = rest.slice(m.index, end + 1);
    out += rest.slice(0, m.index) + resolveColor(token, "rgb(128, 128, 128)");
    rest = rest.slice(end + 1);
  }
}

function isFullyTransparent(rgb: string): boolean {
  const m = /rgba?\(\s*([^)]+)\)/.exec(rgb);
  if (!m) return false;
  const parts = m[1].split(",").map((p) => p.trim());
  return parts.length === 4 && Number(parts[3]) === 0;
}

/**
 * Rasterizers (SVG foreignObject → canvas) choke on oklch()/color-mix()
 * and transparent roots (JPEG has no alpha → renders black). Inline every
 * color as resolved rgb() and force opaque surfaces, so the clone is
 * raster-safe.
 */
function inlineRgb(live: HTMLElement, clone: HTMLElement): void {
  const liveEls = [live, ...live.querySelectorAll("*")];
  const cloneEls = [clone, ...clone.querySelectorAll("*")];
  for (let i = 0; i < cloneEls.length; i++) {
    const from = liveEls[i] as Element | undefined;
    const to = cloneEls[i] as Element | undefined;
    if (!from || !to) continue;
    const style = (to as HTMLElement | SVGElement).style;
    if (!style) continue;
    const cs = getComputedStyle(from);
    for (const prop of COLOR_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (!v) continue;
      const fallback = prop === "color" || prop === "fill" ? themeFg() : themeBg();
      let rgb = resolveColor(v, fallback);
      // Transparent surfaces become theme background — never alpha.
      if ((prop === "background-color" || prop === "fill") && isFullyTransparent(rgb)) {
        rgb = prop === "fill" ? themeFg() : themeBg();
      }
      style.setProperty(prop, rgb);
    }
    for (const prop of SHADOW_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v && v !== "none") style.setProperty(prop, resolveShadows(v));
    }
  }
}

/** Clone the stage, prepend the board name, rasterize. */
async function titledNode(title: string): Promise<{ node: HTMLElement; cleanup: () => void }> {
  const el = document.getElementById("board-stage");
  if (!el) throw new Error("Board stage not found.");
  const clone = el.cloneNode(true) as HTMLElement;
  inlineRgb(el, clone);
  clone.style.width = `${el.offsetWidth}px`;
  clone.style.height = `${el.offsetHeight}px`;
  clone.style.overflow = "hidden";
  // Dotted/grid backdrops are color-mix gradients — unsupported in raster
  // context. Solid theme surface instead of a black/blank one.
  clone.style.backgroundImage = "none";
  clone.style.backgroundColor = themeBg();
  const caption = document.createElement("div");
  caption.textContent = title || "board";
  caption.style.cssText =
    `font-family:monospace;font-size:22px;font-weight:700;letter-spacing:0.15em;` +
    `padding:14px 18px 4px;color:${themeFg()};background:${themeBg()};`;
  const wrap = document.createElement("div");
  wrap.style.cssText = `background:${themeBg()};display:inline-block;`;
  wrap.appendChild(caption);
  wrap.appendChild(clone);
  wrap.style.position = "fixed";
  wrap.style.left = "-99999px";
  wrap.style.top = "0";
  document.body.appendChild(wrap);
  return { node: wrap, cleanup: () => wrap.remove() };
}

export async function exportBoardImage(format: BoardImageFormat, boardName: string): Promise<void> {
  const { node, cleanup } = await titledNode(boardName.trim() || "board");
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
          download(await toPng(node, { pixelRatio }), `${name}.png`);
        } else if (format === "svg") {
          download(await toSvg(node), `${name}.svg`);
        } else if (format === "pdf") {
          await downloadPdf(node, name, pixelRatio);
        } else {
          download(await toJpeg(node, { quality: 0.92, pixelRatio }), `${name}.jpg`);
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
  const url = await toJpeg(node, { pixelRatio });
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
