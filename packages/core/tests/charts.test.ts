import { describe, expect, test } from "bun:test";
import { addWidget, buildBoardSpecs, buildWidgetSpec, createBoard, setBoardData } from "../src/index";

const ROWS = [
  { month: "Jan", visitors: "10" },
  { month: "Feb", visitors: "20" },
  { month: "Mar", visitors: "15" },
];

describe("charts", () => {
  test("bar spec carries bound data", () => {
    let board = setBoardData(createBoard(), ROWS, "inline");
    board = addWidget(board, { type: "bar", x: "month", y: "visitors" });
    const widget = Object.values(board.widgets)[0]!;
    const spec = buildWidgetSpec(board, widget);
    expect(spec.spec?.mark).toMatchObject({ type: "bar" });
    expect(spec.values).toHaveLength(3);
    expect(buildBoardSpecs(board)).toHaveLength(1);
  });

  test("kpi sums values", () => {
    let board = setBoardData(createBoard(), ROWS, "inline");
    board = addWidget(board, { type: "kpi", y: "visitors" });
    const widget = Object.values(board.widgets)[0]!;
    expect(buildWidgetSpec(board, widget).kpi?.value).toBe(45);
  });
});
