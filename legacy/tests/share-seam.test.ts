import { describe, expect, test } from "bun:test";
import { boardSnapshot, publicBoardUrl } from "../app/features/share/types";
import type { Board } from "../app/features/board/types";
import { freshPage } from "../app/features/board/types";

describe("share seam", () => {
  test("publicBoardUrl uses canonical /share/:id route", () => {
    const url = publicBoardUrl("abc123");
    expect(url.endsWith("/share/abc123")).toBe(true);
    expect(url).not.toContain("/b/");
  });

  test("boardSnapshot round-trips schema-first fields", () => {
    const page = freshPage("P1");
    const board = {
      id: "b1",
      title: "t",
      version: 3,
      createdAt: "a",
      updatedAt: "b",
      data: { source: null, raw: [], columns: [] },
      steps: [],
      pages: [page],
      activePageId: page.id,
      locks: [],
    } satisfies Board;
    const back = JSON.parse(boardSnapshot(board)) as Board;
    expect(back.version).toBe(3);
    expect(back.activePageId).toBe(page.id);
  });
});
