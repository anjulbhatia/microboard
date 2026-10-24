import { describe, expect, test } from "bun:test";
import { useBoard } from "../app/store/board";

describe("board store (grid auto-position + 8-col clamp)", () => {
  test("addWidget flow-places col/row and bumps version", () => {
    useBoard.getState().reset();
    const v0 = useBoard.getState().board.version;
    useBoard.getState().addWidget({ type: "textbox", title: "a", w: 6, h: 2 });
    useBoard.getState().addWidget({ type: "textbox", title: "b", w: 4, h: 2 });
    const { board } = useBoard.getState();
    const [idA, idB] = board.pages[0].order;
    expect(board.pages[0].widgets[idA]).toMatchObject({ col: 0, row: 0 });
    // 6 + 4 overflows 8 cols, so b wraps to the next row.
    expect(board.pages[0].widgets[idB]).toMatchObject({ col: 0, row: 2 });
    expect(board.version).toBeGreaterThan(v0);
  });

  test("explicit col/row survive, oversize spans clamp to 8 cols", () => {
    useBoard.getState().reset();
    useBoard.getState().addWidget({ type: "textbox", title: "wide", w: 99, h: 2, col: 7, row: 1 });
    const { board } = useBoard.getState();
    const w = board.pages[0].widgets[board.pages[0].order[0]];
    expect(w.w).toBe(8);
    expect(w.col).toBe(0);
  });

  test("clampAllWidgets keeps every widget inside the canvas", () => {
    useBoard.getState().reset();
    useBoard.getState().addWidget({ type: "textbox", title: "a", w: 6, h: 2 });
    useBoard.getState().clampAllWidgets();
    const { board } = useBoard.getState();
    const w = board.pages[0].widgets[board.pages[0].order[0]];
    expect(w.w).toBeLessThanOrEqual(8);
    expect(w.col + w.w).toBeLessThanOrEqual(8);
    expect(w.h).toBeLessThanOrEqual(5);
  });
});
