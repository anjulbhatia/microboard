import type { BoardRatio } from "@/features/board/types";

export interface BoardTemplate {
  id: string;
  title: string;
  blurb: string;
  ratio: BoardRatio;
  /** Load the sample dataset on pick (skips the load phase). */
  sample: boolean;
}

/** Starters for /new. Blank canvases plus a sample-data board. */
export const BOARD_TEMPLATES: BoardTemplate[] = [
  { id: "blank-16", title: "Blank 16:10", blurb: "Widescreen canvas, 160 cells", ratio: "16:10", sample: false },
  { id: "blank-34", title: "Blank 3:4", blurb: "Tall poster canvas, 160 cells", ratio: "3:4", sample: false },
  { id: "sample", title: "Sample data", blurb: "Demo set, jumps to transforms", ratio: "16:10", sample: true },
];

export function templateById(id: string): BoardTemplate {
  return BOARD_TEMPLATES.find((t) => t.id === id) ?? BOARD_TEMPLATES[0];
}
