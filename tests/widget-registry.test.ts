import { describe, expect, test } from "bun:test";
import { clampPosition, clampSpan } from "../app/features/widgets/registry";

describe("clampSpan (per-type resize spec + 16-col cap)", () => {
  test("icon stays square and inside cap", () => {
    expect(clampSpan("icon", { w: 9, h: 2 }, 16)).toEqual({ w: 6, h: 6 });
  });

  test("heading keeps fixed height, width capped by cols", () => {
    expect(clampSpan("heading", { w: 99, h: 9 }, 10)).toEqual({ w: 10, h: 2 });
  });

  test("textbox clamps to min", () => {
    expect(clampSpan("textbox", { w: 0, h: 0 }, 16)).toEqual({ w: 2, h: 2 });
  });
});

describe("clampPosition", () => {
  test("span hanging off the right edge slides left", () => {
    expect(clampPosition(15, 3, 4, 16)).toEqual({ col: 12, row: 3 });
  });

  test("negative floors to origin", () => {
    expect(clampPosition(-4, -1, 4, 16)).toEqual({ col: 0, row: 0 });
  });
});
