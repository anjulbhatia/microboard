# ChartMicro — micro chart abstracts (WebMCP guide)

> 33 hand-rolled SVG abstracts in `src/widgets/charts/micro/`.
> Pure functions of data → SVG. No deps, no animation, theme-aware
> (`var(--chart-*)`, `currentColor`). Every abstract doubles as a canvas
> widget (`micro` kind) and an agent-renderable spec.

## How to specify a chart (agent + human)

One JSON object. `chart` is the registry id, the rest is the chart's props:

```json
{ "chart": "sparkline", "values": [4, 7, 5, 9, 8, 12] }
```

In-function:

```ts
import { MICRO_REGISTRY } from "@/widgets/charts/micro/registry";

const def = MICRO_REGISTRY["sparkline"];
const props = def.derive([4, 7, 5, 9]); // bare series → full props
// <def.Component {...props} />
```

Inline:

```sh
micro --chart sparkline --values "[4,7,5,9]"
```

(`values` parses as JSON; every other prop passes through as given.)

On canvas, the **Micro chart** widget stores `{ chart, ...props }` in
`widget.props` and binds a board column to feed `values`. Agents propose the
same JSON through `propose_widget`; humans pick from `/charts`.

## Catalog

### Trends

| id | Title | Props | When |
| -- | ----- | ----- | ---- |
| `sparkline` | Sparkline | `values[]` | ordered series, direction over precision |
| `sparkbar` | SparkBar | `values[]` (negatives ok) | magnitudes, win–loss streaks |
| `dualsparkline` | Dual Sparkline | `a[], b[]` | actual vs benchmark |
| `stackedarea` | Stacked Area | `a[], b[]` | two-part composition over time |
| `bumpstrip` | Bump Strip | `series: number[][]` (ranks, 1 = top) | rank movement |
| `trendarrow` | Trend Arrow | `delta` | direction glyph beside a KPI |
| `delta` | Delta | `value, previous` | signed % change, glyph + color |

### Compare

| id | Title | Props | When |
| -- | ----- | ----- | ---- |
| `minibar` | Mini Bar | `values[], labels?` | ranked categories, leader matters |
| `pairedbars` | Paired Bars | `a[], b[], labels?` | planned vs actual per category |
| `dumbbell` | Dumbbell | `from[], to[], labels?` | before/after per row |
| `dotplot` | Dot Plot | `values[], labels?` | 3–8 named values, minimum ink |
| `slope` | Slope | `a[], b[], labels?` | exactly two moments per entity |
| `waterfall` | Waterfall | `values[], labels?` | gains/losses composing a total |
| `funnel` | Funnel | `values[], labels?` | shrinking pipeline stages |

### Grids

| id | Title | Props | When |
| -- | ----- | ----- | ---- |
| `activitygrid` | Activity Grid | `weeks: number[][], cols?` | daily activity over weeks |
| `heatcell` | Heat Cell | `value, min?, max?` | one value as color + number (table cells) |
| `heatstripe` | Heat Stripe | `values[]` | 1×N intensity row |
| `calendarstrip` | Calendar Strip | `values[], offset?` | last ~4 weeks, real weekday position |
| `pictogramrow` | Pictogram Row | `filled, total?` | small countable counts (≤10) |
| `segmented` | Segmented | `parts: {label, value}[]` | named part-to-whole |
| `microbox` | Micro Box | `min, q1, median, q3, max` | five-number summary |
| `histogramstrip` | Histogram Strip | `values[], bins?` | distribution shape from raw values |

### Gauges

| id | Title | Props | When |
| -- | ----- | ----- | ---- |
| `microdonut` | Micro Donut | `parts: {label, value}[]` | 2–4 rough shares |
| `progressring` | Progress Ring | `value` 0–1 | completion in icon-size spaces |
| `progress` | Progress | `value` 0–1 | completion with room for % |
| `bullet` | Bullet | `value, target, bands?` | actual vs target with context |
| `likertstripe` | Likert Stripe | `name?, counts[]` (disagree → agree) | sentiment splits |

### Finance

| id | Title | Props | When |
| -- | ----- | ----- | ---- |
| `microscatter` | Micro Scatter | `points: [x, y][]` | paired-variable relationship |
| `spreadband` | Spread Band | `a[], b[]` | two series + the gap |
| `forecastcone` | Forecast Cone | `actual[], forecast[], lo[], hi[]` | actuals + bounded forecast |
| `ohlc` | OHLC | `candles: {o,h,l,c}[]` | per-period range candles |
| `netflow` | Net Flow | `values[]` (signed) | in/out with running net |
| `ratevolume` | Rate Volume | `rates[], volumes[]` | rate line over volume bars |

## Rules for agents

1. Prefer the smallest chart that answers the question — sparkline over area, dotplot over bars.
2. Never invent data: derive props from board columns via `derive()`, or ask for data first.
3. Negatives only where the chart supports them (sparkbar, netflow, waterfall, slope, dumbbell). Gauges and funnels clamp.
4. Keep series short (≤30 points); abstracts are word-sized, not dashboards.
5. Colors come from the theme (`--chart-1..5`, destructive for bad). Do not hardcode hex.
