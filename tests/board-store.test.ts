import { describe, expect, test } from "bun:test";
import { useBoard } from "../app/store/board";

describe("board store (grid auto-position + 16-col clamp)", () => {
  test("addWidget flow-places col/row and bumps version", () => {
    useBoard.getState().reset();
    const v0 = useBoard.getState().board.version;
    useBoard.getState().addWidget({ type: "textbox", title: "a", w: 12, h: 2 });
    useBoard.getState().addWidget({ type: "textbox", title: "b", w: 8, h: 2 });
    const { board } = useBoard.getState();
    const [idA, idB] = board.pages[0].order;
    expect(board.pages[0].widgets[idA]).toMatchObject({ col: 0, row: 0 });
    // 12 + 8 overflows 16 cols, so b wraps to the next row.
    expect(board.pages[0].widgets[idB]).toMatchObject({ col: 0, row: 2 });
    expect(board.version).toBeGreaterThan(v0);
  });

  test("explicit col/row survive, oversize spans clamp to 16 cols", () => {
    useBoard.getState().reset();
    useBoard.getState().addWidget({ type: "textbox", title: "wide", w: 99, h: 2, col: 15, row: 1 });
    const { board } = useBoard.getState();
    const w = board.pages[0].widgets[board.pages[0].order[0]];
    expect(w.w).toBe(16);
    expect(w.col).toBe(0);
  });

  test("clampAllWidgets pulls 16-col board into 10-col ratio", () => {
    useBoard.getState().reset();
    useBoard.getState().addWidget({ type: "textbox", title: "a", w: 14, h: 2 });
    useBoard.getState().clampAllWidgets(10);
    const { board } = useBoard.getState();
    const w = board.pages[0].widgets[board.pages[0].order[0]];
    expect(w.w).toBeLessThanOrEqual(10);
    expect(w.col + w.w).toBeLessThanOrEqual(10);
  });
});
