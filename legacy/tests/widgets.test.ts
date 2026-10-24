import { describe, expect, test } from "bun:test";
import { WIDGET_REGISTRY } from "../app/features/widgets/registry";
import type { WidgetType } from "../app/features/board/types";

const ALL: WidgetType[] = [
  "textbox", "heading", "shape", "icon", "image", "board", "card",
  "kpi", "spark", "micro", "table",
  "dither-area", "dither-bar", "dither-line", "dither-pie",
];

describe("widget registry integrity", () => {
  test("every kind renders with a valid span and fields", () => {
    for (const kind of ALL) {
      const meta = WIDGET_REGISTRY[kind];
      expect(meta, kind).toBeDefined();
      expect(meta.render).toBeDefined();
      expect(meta.defaultSpan.w).toBeGreaterThanOrEqual(1);
      expect(meta.defaultSpan.h).toBeGreaterThanOrEqual(1);
      expect(meta.defaultSpan.w).toBeLessThanOrEqual(8);
      expect(meta.defaultSpan.h).toBeLessThanOrEqual(5);
      expect(meta.resize.minW).toBeLessThanOrEqual(meta.resize.maxW);
      expect(meta.resize.minH).toBeLessThanOrEqual(meta.resize.maxH);
    }
  });

  test("data kinds are flagged, content kinds are not", () => {
    for (const kind of ["kpi", "spark", "micro", "table", "dither-area", "dither-bar", "dither-line", "dither-pie"] as const) {
      expect(WIDGET_REGISTRY[kind].needsData).toBe(true);
    }
    for (const kind of ["textbox", "heading", "shape", "icon", "image", "board", "card"] as const) {
      expect(WIDGET_REGISTRY[kind].needsData).toBe(false);
    }
  });
});
