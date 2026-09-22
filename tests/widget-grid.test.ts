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
    w: 3,
    h: 2,
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
  test("nextPosition flows left-to-right and wraps at 8 cols", () => {
    const a = widget({ id: "a", w: 6, h: 2 });
    // 6 + 2 fits the row; 6 + 4 overflows and wraps.
    expect(nextPosition(["a"], { a }, { w: 2, h: 2 })).toEqual({ col: 6, row: 0 });
    expect(nextPosition(["a"], { a }, { w: 4, h: 2 })).toEqual({ col: 0, row: 2 });
    const b = widget({ id: "b", w: 8, h: 2 });
    expect(nextPosition(["b"], { b }, { w: 2, h: 1 })).toEqual({ col: 0, row: 2 });
  });

  test("clampWidgetToGrid keeps span inside the 8x5 canvas", () => {
    const c = clampWidgetToGrid(widget({ w: 99, h: 99, col: 7, row: -2 }));
    expect(c.w).toBe(8);
    expect(c.h).toBe(5);
    expect(c.col).toBe(0);
    expect(c.row).toBe(0);
  });

  test("BOARD_GRID is one fluid 8x5 canvas, 40 cells", () => {
    expect(BOARD_GRID.cols).toBe(8);
    expect(BOARD_GRID.rows).toBe(5);
    expect(BOARD_GRID.cols * BOARD_GRID.rows).toBe(40);
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
