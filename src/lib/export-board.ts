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
  a.click();
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
  "box-shadow",
  "text-shadow",
] as const;

/**
 * Rasterizers choke on oklch()/color-mix(). Copy computed values as inline
 * styles — the browser resolves them to rgb() — so the clone is raster-safe.
 */
function inlineRgb(live: HTMLElement, clone: HTMLElement): void {
  const liveEls = [live, ...live.querySelectorAll("*")];
  const cloneEls = [clone, ...clone.querySelectorAll("*")];
  for (let i = 0; i < cloneEls.length; i++) {
    const from = liveEls[i];
    const to = cloneEls[i] as HTMLElement;
    if (!from || !(to instanceof HTMLElement)) continue;
    const cs = getComputedStyle(from);
    for (const prop of COLOR_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v) to.style.setProperty(prop, v);
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
  const caption = document.createElement("div");
  caption.textContent = title || "board";
  caption.style.cssText =
    "font-family:monospace;font-size:22px;font-weight:700;letter-spacing:0.15em;padding:14px 18px 4px;";
  const wrap = document.createElement("div");
  const bg = getComputedStyle(el).backgroundColor;
  wrap.style.cssText = `background:${bg};display:inline-block;`;
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
  try {
    if (format === "png") {
      download(await toPng(node, { pixelRatio: 2 }), `${name}.png`);
    } else if (format === "svg") {
      download(await toSvg(node), `${name}.svg`);
    } else if (format === "pdf") {
      const url = await toJpeg(node, { pixelRatio: 2 });
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
    } else {
      download(await toJpeg(node, { quality: 0.92, pixelRatio: 2 }), `${name}.jpg`);
    }
  } finally {
    cleanup();
  }
}
