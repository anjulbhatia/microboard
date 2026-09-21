import { describe, expect, test } from "bun:test";
import { SOURCE_REGISTRY, recordsFromJson, refreshLabel } from "../app/features/data/sources";
import { useBoard } from "../app/store/board";

describe("data sources", () => {
  test("registry covers file, paste, sheet, api, sample", () => {
    expect(SOURCE_REGISTRY.map((s) => s.kind).sort()).toEqual(
      ["api", "file", "inline", "sample", "sheet"].sort()
    );
    expect(SOURCE_REGISTRY.every((s) => s.live)).toBe(true);
  });

  test("refreshLabel", () => {
    expect(refreshLabel(0)).toBe("Off");
    expect(refreshLabel(15)).toBe("Every 15m");
    expect(refreshLabel(60)).toBe("Every 1h");
  });

  test("recordsFromJson accepts arrays and { rows }", () => {
    const rows = recordsFromJson([{ a: 1, b: null }, { a: "x", b: true }]);
    expect(rows).toEqual([
      { a: "1", b: "" },
      { a: "x", b: "TRUE" },
    ]);
    expect(recordsFromJson({ rows: [{ a: 1 }] })).toEqual([{ a: "1" }]);
  });

  test("recordsFromJson rejects junk", () => {
    expect(() => recordsFromJson([])).toThrow();
    expect(() => recordsFromJson({ nope: 1 })).toThrow();
    expect(() => recordsFromJson([42])).toThrow();
  });

  test("refreshData swaps rows, keeps steps and pages", () => {
    useBoard.getState().reset();
    useBoard.getState().loadData("inline", [{ a: "1" }]);
    useBoard.getState().addStep("sort", { column: "a" }, "sort a");
    const before = useBoard.getState().board;
    useBoard.getState().refreshData([{ a: "2", b: "3" }]);
    const after = useBoard.getState().board;
    expect(after.data.raw).toEqual([{ a: "2", b: "3" }]);
    expect(after.steps.length).toBe(before.steps.length);
    expect(after.pages.length).toBe(before.pages.length);
    expect(after.data.lastRefresh).toBeDefined();
  });

  test("setSourceConfig stores endpoint and interval", () => {
    useBoard.getState().reset();
    useBoard.getState().setSourceConfig("https://x.test/rows", 15);
    const { data } = useBoard.getState().board;
    expect(data.sourceUrl).toBe("https://x.test/rows");
    expect(data.refreshMinutes).toBe(15);
  });
});
