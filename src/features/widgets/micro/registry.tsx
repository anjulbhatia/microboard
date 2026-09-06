import type { MicroDef } from "@/widgets/charts/micro/types";
import { Sparkline, SparkBar, DualSparkline, StackedArea, BumpStrip, TrendArrow, Delta } from "@/widgets/charts/micro/trends";
import { MiniBar, PairedBars, Dumbbell, Dotplot, Slope, Waterfall, Funnel } from "@/widgets/charts/micro/compare";
import { ActivityGrid, HeatCell, HeatStripe, CalendarStrip, PictogramRow, Segmented, MicroBox, HistogramStrip } from "@/widgets/charts/micro/grids";
import { MicroDonut, ProgressRing, Progress, Bullet, LikertStrip } from "@/widgets/charts/micro/gauges";
import { MicroScatter, SpreadBand, ForecastCone, OHLC, NetFlow, RateVolume } from "@/widgets/charts/micro/finance";

const S = [4, 7, 5, 9, 8, 12, 10, 14, 13, 17, 15, 21];
const A = [3, 5, 4, 8, 7, 10];
const B = [5, 4, 6, 5, 8, 7];
const NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function pair(values: number[]): { a: number[]; b: number[] } {
  const half = Math.max(1, Math.floor(values.length / 2));
  return { a: values.slice(0, half), b: values.slice(half) };
}

function pts(values: number[]): [number, number][] {
  return values.map((v, i) => [i, v]);
}

export const MICRO_REGISTRY: Record<string, MicroDef> = {
  sparkline: {
    id: "sparkline", title: "Sparkline", family: "Trends",
    blurb: "A trend over ordered values, small enough to sit in a sentence.",
    use: "Use for any ordered series where direction matters more than exact values.",
    dataShape: "{ values: number[] }",
    Component: Sparkline as MicroDef["Component"], sample: { values: S },
    derive: (v) => ({ values: v.slice(0, 30) }),
  },
  sparkbar: {
    id: "sparkbar", title: "SparkBar", family: "Trends",
    blurb: "Compact bars for magnitude, or a win–loss streak of outcomes.",
    use: "Use when individual magnitudes matter, including negatives.",
    dataShape: "{ values: number[] }",
    Component: SparkBar as MicroDef["Component"], sample: { values: [4, -2, 5, -1, 6, 3, -3, 7] },
    derive: (v) => ({ values: v.slice(0, 24) }),
  },
  dualsparkline: {
    id: "dualsparkline", title: "Dual Sparkline", family: "Trends",
    blurb: "How is this series doing against its benchmark.",
    use: "Use for actual vs benchmark over the same periods.",
    dataShape: "{ a: number[], b: number[] }",
    Component: DualSparkline as MicroDef["Component"], sample: { a: A, b: B },
    derive: (v) => pair(v.slice(0, 24)),
  },
  stackedarea: {
    id: "stackedarea", title: "Stacked Area", family: "Trends",
    blurb: "How the composition is shifting over time.",
    use: "Use for two series whose sum tells the story.",
    dataShape: "{ a: number[], b: number[] }",
    Component: StackedArea as MicroDef["Component"], sample: { a: A, b: B },
    derive: (v) => pair(v.slice(0, 24)),
  },
  bumpstrip: {
    id: "bumpstrip", title: "Bump Strip", family: "Trends",
    blurb: "Where do we rank, and which way is it moving.",
    use: "Use for rank movements across rounds or periods.",
    dataShape: "{ series: number[][] } (ranks, 1 = top)",
    Component: BumpStrip as MicroDef["Component"],
    sample: { series: [[1, 2, 2, 1], [2, 1, 3, 2], [3, 3, 1, 3]] },
    derive: (v) => ({ series: [v.slice(0, 6), [...v.slice(0, 6)].reverse()] }),
  },
  trendarrow: {
    id: "trendarrow", title: "Trend Arrow", family: "Trends",
    blurb: "Which way is this moving? At glyph size, before any number.",
    use: "Use beside a KPI to show direction at a glance.",
    dataShape: "{ delta: number }",
    Component: TrendArrow as MicroDef["Component"], sample: { delta: 4 },
    derive: (v) => ({ delta: v.length > 1 ? v[v.length - 1] - v[0] : 0 }),
  },
  delta: {
    id: "delta", title: "Delta", family: "Trends",
    blurb: "A signed change, double-encoded by glyph and color.",
    use: "Use for period-over-period change with direction baked in.",
    dataShape: "{ value: number, previous: number }",
    Component: Delta as MicroDef["Component"], sample: { value: 1240, previous: 1010 },
    derive: (v) => ({ value: v[v.length - 1] ?? 0, previous: v[v.length - 2] ?? 0 }),
  },
  minibar: {
    id: "minibar", title: "Mini Bar", family: "Compare",
    blurb: "Which category is biggest, and by roughly how much.",
    use: "Use for ranked categories where the leader matters.",
    dataShape: "{ values: number[], labels?: string[] }",
    Component: MiniBar as MicroDef["Component"], sample: { values: [8, 14, 6, 11], labels: ["a", "b", "c", "d"] },
    derive: (v) => ({ values: v.slice(0, 6) }),
  },
  pairedbars: {
    id: "pairedbars", title: "Paired Bars", family: "Compare",
    blurb: "Actual vs expected, category by category: one shared scale.",
    use: "Use for planned vs actual per category.",
    dataShape: "{ a: number[], b: number[], labels?: string[] }",
    Component: PairedBars as MicroDef["Component"], sample: { a: [8, 12, 9], b: [10, 9, 11], labels: NAMES.slice(0, 3) },
    derive: (v) => ({ ...pair(v.slice(0, 12)) }),
  },
  dumbbell: {
    id: "dumbbell", title: "Dumbbell", family: "Compare",
    blurb: "Where each row started and ended: hollow to filled, no legend.",
    use: "Use for before/after per row.",
    dataShape: "{ from: number[], to: number[], labels?: string[] }",
    Component: Dumbbell as MicroDef["Component"], sample: { from: [4, 7, 5], to: [9, 6, 11], labels: ["a", "b", "c"] },
    derive: (v) => {
      const { a, b } = pair(v.slice(0, 12));
      return { from: a, to: [...b, ...a].slice(0, a.length) };
    },
  },
  dotplot: {
    id: "dotplot", title: "Dot Plot", family: "Compare",
    blurb: "A few named values on one scale: minimum ink per comparison.",
    use: "Use for 3–8 named values worth comparing precisely.",
    dataShape: "{ values: number[], labels?: string[] }",
    Component: Dotplot as MicroDef["Component"], sample: { values: [4, 9, 6], labels: ["a", "b", "c"] },
    derive: (v) => ({ values: v.slice(0, 6) }),
  },
  slope: {
    id: "slope", title: "Slope", family: "Compare",
    blurb: "Who rose and who fell between two moments: crossings read instantly.",
    use: "Use for exactly two moments per entity.",
    dataShape: "{ a: number[], b: number[], labels?: string[] }",
    Component: Slope as MicroDef["Component"], sample: { a: [4, 8, 6], b: [9, 5, 10], labels: ["a", "b", "c"] },
    derive: (v) => pair(v.slice(0, 12)),
  },
  waterfall: {
    id: "waterfall", title: "Waterfall", family: "Compare",
    blurb: "How the deltas compose into the total: P&L in a cell.",
    use: "Use for sequential gains and losses ending in a total.",
    dataShape: "{ values: number[], labels?: string[] }",
    Component: Waterfall as MicroDef["Component"], sample: { values: [10, -3, 5, -2], labels: ["q1", "q2", "q3", "q4"] },
    derive: (v) => ({ values: v.slice(0, 8) }),
  },
  funnel: {
    id: "funnel", title: "Funnel", family: "Compare",
    blurb: "Where does the pipeline leak? Stage-to-stage conversion in a cell.",
    use: "Use for staged pipelines with shrinking counts.",
    dataShape: "{ values: number[], labels?: string[] }",
    Component: Funnel as MicroDef["Component"], sample: { values: [100, 72, 45, 28], labels: ["visit", "signup", "trial", "paid"] },
    derive: (v) => ({ values: [...v].sort((x, y) => y - x).slice(0, 5) }),
  },
  activitygrid: {
    id: "activitygrid", title: "Activity Grid", family: "Grids",
    blurb: "Calendar or matrix intensity: the contribution-graph shape.",
    use: "Use for daily activity over weeks.",
    dataShape: "{ weeks: number[][], cols?: number }",
    Component: ActivityGrid as MicroDef["Component"],
    sample: { weeks: [[1, 3, 0, 4, 2, 5, 3], [2, 0, 4, 1, 3, 2, 5], [0, 2, 5, 3, 4, 1, 2]] },
    derive: (v) => ({ weeks: [v.slice(0, 7), v.slice(7, 14), v.slice(14, 21)] }),
  },
  heatcell: {
    id: "heatcell", title: "Heat Cell", family: "Grids",
    blurb: "One calibrated color step: the building block for host-owned grids.",
    use: "Use inside tables to encode a single value as color + number.",
    dataShape: "{ value: number, min?: number, max?: number }",
    Component: HeatCell as MicroDef["Component"], sample: { value: 72, min: 0, max: 100 },
    derive: (v) => ({ value: v[v.length - 1] ?? 0, min: Math.min(...v, 0), max: Math.max(...v, 1) }),
  },
  heatstripe: {
    id: "heatstripe", title: "Heat Stripe", family: "Grids",
    blurb: "How intensity evolved, glanceably: the 1×N sibling of ActivityGrid.",
    use: "Use for intensity over ordered slots in one row.",
    dataShape: "{ values: number[] }",
    Component: HeatStripe as MicroDef["Component"], sample: { values: S },
    derive: (v) => ({ values: v.slice(0, 30) }),
  },
  calendarstrip: {
    id: "calendarstrip", title: "Calendar Strip", family: "Grids",
    blurb: "The last few weeks, day by day: real calendar position.",
    use: "Use for the last ~4 weeks of daily values.",
    dataShape: "{ values: number[], offset?: number }",
    Component: CalendarStrip as MicroDef["Component"], sample: { values: S.slice(0, 14), offset: 2 },
    derive: (v) => ({ values: v.slice(0, 21), offset: 0 }),
  },
  pictogramrow: {
    id: "pictogramrow", title: "Pictogram Row", family: "Grids",
    blurb: "Counts a human can verify by counting.",
    use: "Use for small counts (≤10) worth trusting at a glance.",
    dataShape: "{ filled: number, total?: number }",
    Component: PictogramRow as MicroDef["Component"], sample: { filled: 3, total: 5 },
    derive: (v) => ({ filled: Math.max(0, Math.min(10, Math.round(v[v.length - 1] ?? 0))), total: 10 }),
  },
  segmented: {
    id: "segmented", title: "Segmented", family: "Grids",
    blurb: "What is this made of, and in what proportions.",
    use: "Use for part-to-whole with named parts.",
    dataShape: "{ parts: { label: string, value: number }[] }",
    Component: Segmented as MicroDef["Component"],
    sample: { parts: [{ label: "a", value: 40 }, { label: "b", value: 35 }, { label: "c", value: 25 }] },
    derive: (v) => ({ parts: v.slice(0, 4).map((x, i) => ({ label: `p${i + 1}`, value: Math.abs(x) })) }),
  },
  microbox: {
    id: "microbox", title: "Micro Box", family: "Grids",
    blurb: "The p50 and spread of a metric: a five-number summary in a row.",
    use: "Use for distribution shape when quartiles are known.",
    dataShape: "{ min, q1, median, q3, max: number }",
    Component: MicroBox as MicroDef["Component"], sample: { min: 2, q1: 5, median: 8, q3: 12, max: 18 },
    derive: (v) => {
      const s = [...v].sort((x, y) => x - y);
      const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0;
      return { min: s[0] ?? 0, q1: q(0.25), median: q(0.5), q3: q(0.75), max: s[s.length - 1] ?? 0 };
    },
  },
  histogramstrip: {
    id: "histogramstrip", title: "Histogram Strip", family: "Grids",
    blurb: "What does the distribution look like? Mode, spread, skew in a cell.",
    use: "Use for raw values when the shape is the story.",
    dataShape: "{ values: number[], bins?: number }",
    Component: HistogramStrip as MicroDef["Component"], sample: { values: S },
    derive: (v) => ({ values: v.slice(0, 60), bins: 12 }),
  },
  microdonut: {
    id: "microdonut", title: "Micro Donut", family: "Gauges",
    blurb: "Roughly what is this made of? An honest, capped concession at icon size.",
    use: "Use for 2–4 part shares where exactness is not required.",
    dataShape: "{ parts: { label: string, value: number }[] }",
    Component: MicroDonut as MicroDef["Component"],
    sample: { parts: [{ label: "a", value: 55 }, { label: "b", value: 30 }, { label: "c", value: 15 }] },
    derive: (v) => ({ parts: v.slice(0, 3).map((x, i) => ({ label: `p${i + 1}`, value: Math.abs(x) })) }),
  },
  progressring: {
    id: "progressring", title: "Progress Ring", family: "Gauges",
    blurb: "How complete is this? At icon size, where a bar doesn't fit.",
    use: "Use for 0–1 completion in tight spaces.",
    dataShape: "{ value: number } (0–1)",
    Component: ProgressRing as MicroDef["Component"], sample: { value: 0.72 },
    derive: (v) => ({ value: Math.max(0, Math.min(1, (v[v.length - 1] ?? 0) / Math.max(1, Math.max(...v, 1)))) }),
  },
  progress: {
    id: "progress", title: "Progress", family: "Gauges",
    blurb: "How far along, exactly: bar plus the percent that is the datum.",
    use: "Use for 0–1 completion with room for a number.",
    dataShape: "{ value: number } (0–1)",
    Component: Progress as MicroDef["Component"], sample: { value: 0.64 },
    derive: (v) => ({ value: Math.max(0, Math.min(1, (v[v.length - 1] ?? 0) / Math.max(1, Math.max(...v, 1)))) }),
  },
  bullet: {
    id: "bullet", title: "Bullet", family: "Gauges",
    blurb: "A measure against a target and qualitative bands.",
    use: "Use for actual vs target with context bands.",
    dataShape: "{ value: number, target: number, bands?: number[] }",
    Component: Bullet as MicroDef["Component"], sample: { value: 72, target: 90, bands: [50, 75, 100] },
    derive: (v) => ({ value: v[v.length - 1] ?? 0, target: Math.max(...v, 1), bands: [] }),
  },
  likertstripe: {
    id: "likertstripe", title: "Likert Stripe", family: "Gauges",
    blurb: "Does the response lean agree or disagree, and how hard.",
    use: "Use for 3–5 point sentiment splits.",
    dataShape: "{ name?: string, counts: number[] } (disagree → agree)",
    Component: LikertStrip as MicroDef["Component"], sample: { name: "Satisfaction", counts: [8, 12, 20, 35, 25] },
    derive: (v) => ({ counts: v.slice(0, 5).map((x) => Math.abs(Math.round(x))) }),
  },
  microscatter: {
    id: "microscatter", title: "Micro Scatter", family: "Finance",
    blurb: "Are these two variables related? The relationship no other type tells.",
    use: "Use for paired x/y observations.",
    dataShape: "{ points: [number, number][] }",
    Component: MicroScatter as MicroDef["Component"], sample: { points: pts([3, 5, 4, 8, 7, 10, 9, 13]) },
    derive: (v) => ({ points: pts(v.slice(0, 20)) }),
  },
  spreadband: {
    id: "spreadband", title: "Spread Band", family: "Finance",
    blurb: "Which of two series leads, by how much, and since when.",
    use: "Use for two series and the gap between them.",
    dataShape: "{ a: number[], b: number[] }",
    Component: SpreadBand as MicroDef["Component"], sample: { a: A, b: B },
    derive: (v) => pair(v.slice(0, 24)),
  },
  forecastcone: {
    id: "forecastcone", title: "Forecast Cone", family: "Finance",
    blurb: "Will we land where we need to?",
    use: "Use for actuals plus forecast with uncertainty bounds.",
    dataShape: "{ actual: number[], forecast: number[], lo: number[], hi: number[] }",
    Component: ForecastCone as MicroDef["Component"],
    sample: {
      actual: [4, 6, 7, 9],
      forecast: [10, 12, 13],
      lo: [9, 10, 10],
      hi: [11, 14, 16],
    },
    derive: (v) => {
      const a = v.slice(0, 6);
      const last = a[a.length - 1] ?? 0;
      return { actual: a, forecast: [last, last + 1, last + 2], lo: [last - 1, last - 1, last], hi: [last + 1, last + 3, last + 4] };
    },
  },
  ohlc: {
    id: "ohlc", title: "OHLC", family: "Finance",
    blurb: "Price action per period: open, high, low, close in a cell.",
    use: "Use for candle-like per-period ranges.",
    dataShape: "{ candles: { o, h, l, c: number }[] }",
    Component: OHLC as MicroDef["Component"],
    sample: { candles: [{ o: 4, h: 7, l: 3, c: 6 }, { o: 6, h: 9, l: 5, c: 8 }, { o: 8, h: 10, l: 6, c: 7 }] },
    derive: (v) => ({
      candles: v.slice(0, 9).reduce<{ o: number; h: number; l: number; c: number }[]>((acc, x, i, arr) => {
        if (i % 3 === 0) acc.push({ o: x, h: Math.max(x, arr[i + 1] ?? x, arr[i + 2] ?? x), l: Math.min(x, arr[i + 1] ?? x, arr[i + 2] ?? x), c: arr[i + 2] ?? x });
        return acc;
      }, []),
    }),
  },
  netflow: {
    id: "netflow", title: "Net Flow", family: "Finance",
    blurb: "In versus out, and where does that leave us net?",
    use: "Use for signed flows with a running net.",
    dataShape: "{ values: number[] }",
    Component: NetFlow as MicroDef["Component"], sample: { values: [8, -3, 5, -2, 6] },
    derive: (v) => ({ values: v.slice(0, 12) }),
  },
  ratevolume: {
    id: "ratevolume", title: "Rate Volume", family: "Finance",
    blurb: "The rate moved, but on what volume?",
    use: "Use for a rate line over volume bars.",
    dataShape: "{ rates: number[], volumes: number[] }",
    Component: RateVolume as MicroDef["Component"], sample: { rates: [2, 3, 2.5, 4, 5], volumes: [80, 60, 95, 70, 110] },
    derive: (v) => ({ rates: v.slice(0, 12), volumes: v.slice(0, 12).map((x) => Math.abs(x) * 8) }),
  },
};

export const MICRO_IDS = Object.keys(MICRO_REGISTRY);

export const MICRO_FAMILIES = ["Trends", "Compare", "Grids", "Gauges", "Finance"] as const;
