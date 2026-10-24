import { describe, expect, test } from "bun:test";
import {
  addStep,
  addWidget,
  applySteps,
  assertVersion,
  createBoard,
  inferColumns,
  lockWidget,
  setBoardData,
  updateWidget,
} from "../src/index";

const ROWS = [
  { month: "Jan", channel: "organic", visitors: "100", signups: "10" },
  { month: "Feb", channel: "organic", visitors: "200", signups: "20" },
  { month: "Jan", channel: "paid", visitors: "50", signups: "" },
];

describe("board recipe", () => {
  test("steps replay deterministically on raw data", () => {
    let board = setBoardData(createBoard("Test"), ROWS, "inline");
    expect(board.data.cleaned).toHaveLength(3);
    expect(board.version).toBe(1);

    board = addStep(board, "filter", { column: "channel", cond: "==", value: "organic" }, "organic only");
    expect(board.data.cleaned).toHaveLength(2);

    board = addStep(board, "groupBy", { column: "month", agg: "sum", target: "visitors" });
    expect(board.data.cleaned).toEqual([{ month: "Jan", sum_visitors: 100 }, { month: "Feb", sum_visitors: 200 }]);
    expect(applySteps(ROWS as never, board.steps)).toEqual(board.data.cleaned ?? []);
    expect(board.version).toBe(3);
  });

  test("all step types validate and replay", () => {
    let board = setBoardData(createBoard(), ROWS, "inline");
    board = addStep(board, "dropNulls", {});
    expect(board.data.cleaned).toHaveLength(2);

    board = addStep(board, "derive", { into: "rate", column: "signups", fn: "*", right: "2" });
    expect(board.data.cleaned?.[0]?.rate).toBe(20);

    board = addStep(board, "select", { columns: "channel,rate" });
    expect(board.data.columns.map((c) => c.name)).toEqual(["channel", "rate"]);

    board = addStep(board, "rename", { column: "rate", to: "score" });
    expect(board.data.columns.map((c) => c.name)).toEqual(["channel", "score"]);

    board = addStep(board, "sort", { column: "score", dir: "desc" });
    expect(board.data.cleaned?.[0]?.channel).toBe("organic");

    board = addStep(board, "limit", { n: 1 });
    expect(board.data.cleaned).toHaveLength(1);
    expect(applySteps(ROWS as never, board.steps)).toEqual(board.data.cleaned ?? []);
  });

  test("unknown step types fail closed", () => {
    const board = setBoardData(createBoard(), ROWS, "inline");
    expect(() => addStep(board, "explode", {})).toThrow("Unknown step type");
  });

  test("widgets validate columns, layout, locks, versions", () => {
    let board = setBoardData(createBoard(), ROWS, "inline");
    board = addWidget(board, { type: "bar", x: "channel", y: "visitors" });
    const id = Object.keys(board.widgets)[0];
    expect(board.layout).toEqual([{ i: id, x: 0, y: 0, w: 4, h: 3 }]);

    expect(() => addWidget(board, { type: "line", x: "nope", y: "visitors" })).toThrow("Unknown column");

    board = lockWidget(board, id, true);
    expect(() => updateWidget(board, id, { title: "new" })).toThrow("locked");

    board = lockWidget(board, id, false);
    const v = board.version;
    board = updateWidget(board, id, { title: "Revenue" });
    expect(board.widgets[id]?.title).toBe("Revenue");
    expect(board.version).toBe(v + 1);

    expect(() => assertVersion(board, v)).toThrow("Version conflict");
    expect(inferColumns(board.data.cleaned ?? [])[0]?.type).toBe("string");
  });
});
