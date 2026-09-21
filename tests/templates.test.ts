import { describe, expect, test } from "bun:test";
import { BOARD_GRID } from "../app/features/board/types";
import { BOARD_TEMPLATES, templateById } from "../app/features/board/templates";

describe("board templates", () => {
  test("three starters, ratios exist in grid", () => {
    expect(BOARD_TEMPLATES.map((t) => t.id)).toEqual(["blank-16", "blank-34", "sample"]);
    for (const t of BOARD_TEMPLATES) {
      expect(BOARD_GRID[t.ratio]).toBeDefined();
    }
  });

  test("sample jumps to transforms, blanks start at load", () => {
    expect(templateById("sample").sample).toBe(true);
    expect(templateById("blank-16").sample).toBe(false);
    expect(templateById("nope").id).toBe("blank-16");
  });
});
