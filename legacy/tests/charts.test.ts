import { describe, expect, test } from "bun:test";
import { MICRO_IDS, MICRO_REGISTRY } from "../app/features/widgets/micro/registry";
import { chartBindings, deriveChartProps } from "../app/features/widgets/micro/columns";
import { CHART_ENGINES } from "../app/features/widgets/components/chart-widget";
import { WIDGET_REGISTRY } from "../app/features/widgets/registry";

const ROWS = [
  { month: "Jan", visitors: "10", signups: "2" },
  { month: "Feb", visitors: "20", signups: "5" },
  { month: "Mar", visitors: "15", signups: "4" },
];

// Every chart the user asked for, by registry id.
const REQUESTED = [
  "sparkline", "sparkbar", "delta", "bullet", "activitygrid", "trendarrow",
  "statusdot", "heatcell", "progress", "minibar", "pictogramrow", "heatstripe",
  "dotplot", "dumbbell", "pairedbars", "slope", "microscatter", "segmented",
  "microdonut", "histogramstrip", "microbox", "progressring", "funnel",
  "stackedarea", "ohlc",
];

describe("micro catalog completeness", () => {
  test("every requested chart exists in the registry", () => {
    for (const id of REQUESTED) {
      expect(MICRO_IDS).toContain(id);
      expect(MICRO_REGISTRY[id].Component).toBeDefined();
      expect(MICRO_REGISTRY[id].sample).toBeDefined();
    }
  });

  test("dither line + pie are first-class widget kinds", () => {
    for (const kind of ["dither-area", "dither-bar", "dither-line", "dither-pie", "micro"]) {
      expect(CHART_ENGINES[kind]).toBeDefined();
      expect(WIDGET_REGISTRY[kind as keyof typeof WIDGET_REGISTRY]).toBeDefined();
    }
  });
});

describe("deriveChartProps (X/Y/Y2 bindings)", () => {
  test("series chart reads Y values", () => {
    expect(deriveChartProps("sparkline", ROWS, "month", "visitors")).toEqual({
      values: [10, 20, 15],
    });
  });

  test("labeled chart attaches X labels", () => {
    expect(deriveChartProps("minibar", ROWS, "month", "visitors")).toEqual({
      values: [10, 20, 15],
      labels: ["Jan", "Feb", "Mar"],
    });
  });

  test("paired charts prefer Y2, else split halves", () => {
    expect(deriveChartProps("pairedbars", ROWS, "month", "visitors", "signups")).toEqual({
      a: [10, 20, 15],
      b: [2, 5, 4],
      labels: ["Jan", "Feb", "Mar"],
    });
    const split = deriveChartProps("slope", ROWS, "month", "visitors") as { a: number[]; b: number[] };
    expect(split.a.length + split.b.length).toBe(3);
  });

  test("scatter zips X/Y pairs, drops non-numeric", () => {
    expect(deriveChartProps("microscatter", ROWS, "visitors", "signups")).toEqual({
      points: [[10, 2], [20, 5], [15, 4]],
    });
  });

  test("box summarizes five numbers", () => {
    const box = deriveChartProps("microbox", ROWS, "month", "visitors") as Record<string, number>;
    expect(box.min).toBe(10);
    expect(box.max).toBe(20);
    expect(box.median).toBe(15);
  });

  test("gauges read the last value; statusdot carries the column", () => {
    expect(deriveChartProps("progress", ROWS, "month", "signups")).toEqual({ value: 0.8 });
    expect(deriveChartProps("statusdot", ROWS, "month", "signups")).toEqual({
      level: "idle",
      label: "month",
      value: 4,
    });
  });

  test("part-to-whole charts zip labels and values", () => {
    expect(deriveChartProps("microdonut", ROWS, "month", "visitors")).toEqual({
      parts: [
        { label: "Jan", value: 10 },
        { label: "Feb", value: 20 },
        { label: "Mar", value: 15 },
      ],
    });
  });

  test("unknown chart falls back to values", () => {
    expect(deriveChartProps("nope", ROWS, "month", "visitors")).toEqual({ values: [10, 20, 15] });
  });

  test("empty columns stay empty (no invented data)", () => {
    expect(deriveChartProps("sparkline", ROWS, "", "")).toEqual({ values: [] });
  });
});

describe("chartBindings", () => {
  test("contracts per chart", () => {
    expect(chartBindings("microscatter")).toEqual({ x: true, y: true, y2: false });
    expect(chartBindings("slope")).toEqual({ x: true, y: true, y2: true });
    expect(chartBindings("minibar")).toEqual({ x: true, y: true, y2: false });
    expect(chartBindings("sparkline")).toEqual({ x: false, y: true, y2: false });
  });
});
