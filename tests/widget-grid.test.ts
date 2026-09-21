import { describe, expect, test } from "bun:test";
import {
  BOARD_GRID,
  activePage,
  clampWidgetToGrid,
  freshPage,
  nextPosition,
  normalizeWidget,
  widgetDataX,
  widgetDataY,
  type Board,
  type Widget,
} from "../app/features/board/types";

function widget(over: Partial<Widget> = {}): Widget {
  return {
    id: "w1",
    type: "textbox",
    title: "t",
    col: 0,
    row: 0,
    w: 4,
    h: 3,
    ...over,
  };
}

describe("widget data bindings (legacy x/y compat)", () => {
  test("dataX/dataY win, x/y fall back", () => {
    expect(widgetDataX(widget({ x: "a", dataX: "b" }))).toBe("b");
    expect(widgetDataY(widget({ y: "c" }))).toBe("c");
    expect(widgetDataX(widget({}))).toBe("");
  });

  test("normalizeWidget fills position + bindings", () => {
    const n = normalizeWidget(widget({ col: NaN as unknown as number, dataX: undefined, x: "col_a" }));
    expect(n.col).toBe(0);
    expect(n.dataX).toBe("col_a");
    expect(n.dataY).toBeUndefined();
  });
});

describe("grid placement", () => {
  test("nextPosition flows left-to-right and wraps at 16 cols", () => {
    const a = widget({ id: "a", w: 12, h: 3 });
    // 12 + 4 fits the row; 12 + 8 overflows and wraps.
    expect(nextPosition(["a"], { a }, { w: 4, h: 2 }, 16)).toEqual({ col: 12, row: 0 });
    expect(nextPosition(["a"], { a }, { w: 8, h: 3 }, 16)).toEqual({ col: 0, row: 3 });
    const b = widget({ id: "b", w: 16, h: 3 });
    expect(nextPosition(["b"], { b }, { w: 4, h: 2 }, 16)).toEqual({ col: 0, row: 3 });
  });

  test("clampWidgetToGrid keeps span inside cols x rows", () => {
    const c = clampWidgetToGrid(widget({ w: 99, h: 99, col: 15, row: -2 }), 16, 10);
    expect(c.w).toBe(16);
    expect(c.h).toBe(10);
    expect(c.col).toBe(0);
    expect(c.row).toBe(0);
  });

  test("BOARD_GRID keeps 160-cell capacity on both ratios", () => {
    expect(BOARD_GRID["16:10"].cols * BOARD_GRID["16:10"].rows).toBe(160);
    expect(BOARD_GRID["3:4"].cols * BOARD_GRID["3:4"].rows).toBe(160);
  });

  test("board JSON round-trips position + bindings", () => {
    const page = { ...freshPage("P1"), order: ["w1"], widgets: { w1: widget({ col: 4, row: 2, dataX: "x", dataY: "y" }) } };
    const board = {
      id: "b",
      title: "t",
      version: 1,
      createdAt: "now",
      updatedAt: "now",
      data: { source: null, raw: [], columns: [] },
      steps: [],
      pages: [page],
      activePageId: page.id,
      locks: [],
    } satisfies Board;
    const back = JSON.parse(JSON.stringify(board)) as Board;
    const w = activePage(back).widgets.w1;
    expect(w.col).toBe(4);
    expect(w.row).toBe(2);
    expect(widgetDataX(w)).toBe("x");
    expect(widgetDataY(w)).toBe("y");
  });
});
