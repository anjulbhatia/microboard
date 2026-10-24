import { describe, expect, test } from "bun:test";
import { useBoard } from "../app/store/board";

describe("persistence safety", () => {
  test("loadBoard normalizes legacy widgets to the 8x5 canvas", () => {
    useBoard.getState().reset();
    const legacy = {
      ...useBoard.getState().board,
      pages: [
        {
          id: "p1",
          name: "P1",
          order: ["w1"],
          widgets: {
            w1: { id: "w1", type: "textbox", title: "old", w: 14, h: 9 },
          },
        },
      ],
      activePageId: "p1",
    } as never;
    useBoard.getState().loadBoard(legacy);
    const w = useBoard.getState().board.pages[0].widgets.w1;
    expect(w.col).toBe(0);
    expect(w.row).toBe(0);
    expect(w.w).toBeLessThanOrEqual(8);
    expect(w.h).toBeLessThanOrEqual(5);
  });
});
