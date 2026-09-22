import { describe, expect, test } from "bun:test";
import { clampPosition, clampSpan } from "../app/features/widgets/registry";

describe("clampSpan (per-type resize spec + 8-col cap)", () => {
  test("icon stays square and inside cap", () => {
    expect(clampSpan("icon", { w: 9, h: 2 })).toEqual({ w: 4, h: 4 });
  });

  test("heading keeps fixed height, width capped by cols", () => {
    expect(clampSpan("heading", { w: 99, h: 9 })).toEqual({ w: 8, h: 1 });
  });

  test("textbox clamps to min", () => {
    expect(clampSpan("textbox", { w: 0, h: 0 })).toEqual({ w: 2, h: 1 });
  });

  test("tall widgets cap at 5 rows", () => {
    expect(clampSpan("dither-bar", { w: 6, h: 99 })).toEqual({ w: 6, h: 4 });
  });
});

describe("clampPosition", () => {
  test("span hanging off the right edge slides left", () => {
    expect(clampPosition(7, 3, 4)).toEqual({ col: 4, row: 3 });
  });

  test("negative floors to origin", () => {
    expect(clampPosition(-4, -1, 4)).toEqual({ col: 0, row: 0 });
  });
});
