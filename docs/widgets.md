# Widgets — specs

> Source of truth lives in `app/features/widgets/registry.ts` (`WIDGET_REGISTRY` + `clampSpan`).
> Board grid dims live in `app/features/board/types.ts` (`BOARD_GRID`).

## 1. Unit system

- 1 grid unit = 1 cell. One fluid canvas: **8 cols × 5 rows = 40 cells**.
  Presentation scales to screen — no aspect variants.
- **1×1** is the smallest degree (fits an icon). Width caps at 8 columns;
  height caps at 5 rows.
- Pixel size of a unit is derived from the fitted stage
  (`Stage` → `useStageUnit()`): `unit = stageWidth / 8`, min 24px.
- Capacity is advisory, not blocking: the board palette shows
  `used / capacity` cells. Used = Σ `w × h` over widgets.

## 2. Resize rules per kind

Resize happens on the **focused** widget via edge handles:

| Handle | Cursor | Axis |
| ------ | ------ | ---- |
| Right edge (E) | `ew-resize` | width |
| Bottom edge (S) | `ns-resize` | height |
| Corner (SE) | `nwse-resize` | both |

Drag works in whole-unit steps (`dx / unit`, rounded). Preview is local;
the store commits once on pointer-up (single version bump).

| Kind | W range | H range | Notes |
| ---- | ------- | ------- | ----- |
| textbox | 2–6 | 1–3 | free |
| heading | 2–8 | locked | height = padding + line-height + font size (content-driven) |
| shape | 2–6 | 1–3 | free |
| icon | 1–4 | 1–4 | **square only** — SE handle drives both axes |
| image | 2–8 | 2–4 | free |
| board | 4–8 | 2–5 | nested dotted canvas, fixed 8:5 |
| card | 2–6 | 1–3 | free |
| kpi (micro) | 2–4 | 1–2 | gauges stay small |
| spark (micro) | 2–8 | 1–2 | word-sized |
| micro | 2–8 | 1–3 | chart select + X/Y/Y2 bindings + labels |
| table | 4–8 | 2–4 | free |
| dither-area / dither-bar / dither-line / dither-pie | 4–8 | 2–4 | axes charts need room to breathe |
| mono-* (future) | 4–8 | 2–4 | **mono min height: 2** (same rule when engine lands) |

Headings show only the E handle. Icons show E (square) + SE.

## 3. Focus palettes

- **Widget focused** (click a card): floating palette above the widget —
  move grip (drag to reorder), settings (if the kind has fields),
  duplicate, remove. Card gets `ring-2 ring-primary`.
- **Board focused** (click empty canvas): floating board palette —
  aspect ratio, backdrop (dotted/grid/plain), live cell meter.
- Clicking empty canvas clears widget focus. Removing a widget clears focus.

## 4. Chart engines

`app/features/widgets/components/ChartWidget.tsx` renders all data widgets.
`CHART_ENGINES` tags each kind:

| Kind | Engine | Status |
| ---- | ------ | ------ |
| kpi, spark, micro (34 abstracts) | micro | live (hand-rolled, column-bound) |
| table | none | live |
| dither-area, dither-bar, dither-line, dither-pie | dither | live (Dither Kit composites + pie) |
| mono-* | mono | **slot reserved** — plug in where told |

New engines register here and in `WIDGET_REGISTRY` (component + resize
spec). Micro charts bind columns through
`app/features/widgets/micro/columns.ts` (`deriveChartProps`).

## 5. Adding a kind

1. Component in `app/features/widgets/components/<kind>.tsx` receiving `{ widget }`.
2. Entry in `WIDGET_REGISTRY`: label, group, `needsData`, `defaultSpan`,
   `resize` spec, `defaults`, `fields`, `render`.
3. Props editing is automatic via `PropsEditor` field schema
   (`text | textarea | number | select | color | icon`).
4. Data-bound kinds read the store (`useBoard` + `applySteps`) like `ChartWidget`.
