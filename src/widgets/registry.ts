import type { ComponentType } from "react";
import type { GridSpan, Widget, WidgetType } from "@/types/board";
import { TextboxWidget } from "@/widgets/textbox";
import { HeadingWidget } from "@/widgets/heading";
import { ShapesWidget } from "@/widgets/shapes";
import { IconsWidget, ICON_CHOICES } from "@/widgets/icons";
import { ImageWidget } from "@/widgets/image";
import { BoardWidget } from "@/widgets/board";
import { CardWidget } from "@/widgets/card";
import { ChartWidget } from "@/widgets/charts/ChartWidget";

export type FieldType = "text" | "textarea" | "number" | "select" | "color" | "icon";

export interface WidgetField {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
}

export interface ResizeSpec {
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
  /** Width and height stay equal (icons). */
  square?: boolean;
  /** Height is content-driven, only width resizes (headings). */
  fixedH?: boolean;
}

export interface WidgetMeta {
  label: string;
  group: "content" | "media" | "board" | "charts";
  needsData: boolean;
  defaultSpan: GridSpan;
  resize: ResizeSpec;
  defaults: { title: string; props: Record<string, string | number> };
  fields: WidgetField[];
  render: ComponentType<{ widget: Widget }>;
}

/** Clamp a span to a kind's resize spec (and the board's column cap). */
export function clampSpan(type: WidgetType, span: GridSpan, cols = 16): GridSpan {
  const spec = WIDGET_REGISTRY[type].resize;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
  if (spec.square) {
    const s = clamp(span.w, spec.minW, Math.min(spec.maxW, cols));
    return { w: s, h: s };
  }
  return {
    w: clamp(span.w, spec.minW, Math.min(spec.maxW, cols)),
    h: clamp(span.h, spec.minH, Math.min(spec.maxH, 16)),
  };
}

const SHAPE_COLORS = [
  { value: "var(--chart-3)", label: "Purple" },
  { value: "var(--chart-1)", label: "Deep" },
  { value: "var(--chart-4)", label: "Soft" },
  { value: "var(--chart-5)", label: "Mist" },
  { value: "var(--destructive)", label: "Red" },
  { value: "var(--muted-foreground)", label: "Grey" },
];

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
  textbox: {
    label: "Textbox",
    group: "content",
    needsData: false,
    defaultSpan: { w: 5, h: 3 },
    resize: { minW: 2, maxW: 16, minH: 2, maxH: 8 },
    defaults: { title: "Textbox", props: { text: "Add some text…" } },
    fields: [{ key: "text", label: "Text", type: "textarea" }],
    render: TextboxWidget,
  },
  heading: {
    label: "Heading",
    group: "content",
    needsData: false,
    defaultSpan: { w: 8, h: 2 },
    resize: { minW: 2, maxW: 16, minH: 2, maxH: 2, fixedH: true },
    defaults: { title: "Heading", props: { text: "Heading", level: "2" } },
    fields: [
      { key: "text", label: "Text", type: "text" },
      {
        key: "level",
        label: "Level",
        type: "select",
        options: [
          { value: "1", label: "H1" },
          { value: "2", label: "H2" },
          { value: "3", label: "H3" },
        ],
      },
    ],
    render: HeadingWidget,
  },
  shape: {
    label: "Shape",
    group: "content",
    needsData: false,
    defaultSpan: { w: 5, h: 4 },
    resize: { minW: 2, maxW: 16, minH: 2, maxH: 8 },
    defaults: { title: "Shape", props: { shape: "rectangle", color: "var(--chart-3)" } },
    fields: [
      {
        key: "shape",
        label: "Shape",
        type: "select",
        options: [
          { value: "rectangle", label: "Rectangle" },
          { value: "ellipse", label: "Ellipse" },
          { value: "line", label: "Line" },
        ],
      },
      { key: "color", label: "Color", type: "color", options: SHAPE_COLORS },
    ],
    render: ShapesWidget,
  },
  icon: {
    label: "Icon",
    group: "media",
    needsData: false,
    defaultSpan: { w: 2, h: 2 },
    resize: { minW: 1, maxW: 6, minH: 1, maxH: 6, square: true },
    defaults: { title: "Icon", props: { icon: "Sparkles", size: 32 } },
    fields: [
      {
        key: "icon",
        label: "Icon",
        type: "icon",
        options: Object.keys(ICON_CHOICES).map((k) => ({ value: k, label: k })),
      },
      { key: "size", label: "Size", type: "number" },
    ],
    render: IconsWidget,
  },
  image: {
    label: "Image",
    group: "media",
    needsData: false,
    defaultSpan: { w: 8, h: 5 },
    resize: { minW: 2, maxW: 16, minH: 2, maxH: 10 },
    defaults: { title: "Image", props: { src: "", fit: "cover" } },
    fields: [
      { key: "src", label: "Image URL", type: "text" },
      {
        key: "fit",
        label: "Fit",
        type: "select",
        options: [
          { value: "cover", label: "Cover" },
          { value: "contain", label: "Contain" },
        ],
      },
    ],
    render: ImageWidget,
  },
  board: {
    label: "Board",
    group: "board",
    needsData: false,
    defaultSpan: { w: 10, h: 7 },
    resize: { minW: 4, maxW: 16, minH: 4, maxH: 12 },
    defaults: { title: "Board", props: { ratio: "16:10", label: "Slide board" } },
    fields: [
      {
        key: "ratio",
        label: "Aspect",
        type: "select",
        options: [
          { value: "16:10", label: "16:10" },
          { value: "3:4", label: "3:4" },
        ],
      },
      { key: "label", label: "Label", type: "text" },
    ],
    render: BoardWidget,
  },
  card: {
    label: "Card",
    group: "content",
    needsData: false,
    defaultSpan: { w: 5, h: 4 },
    resize: { minW: 2, maxW: 16, minH: 2, maxH: 8 },
    defaults: { title: "Card", props: { title: "Card title", body: "Add a short description here.", stat: "" } },
    fields: [
      { key: "stat", label: "Stat", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
    ],
    render: CardWidget,
  },
  kpi: {
    label: "KPI",
    group: "charts",
    needsData: true,
    defaultSpan: { w: 4, h: 3 },
    resize: { minW: 2, maxW: 8, minH: 2, maxH: 4 },
    defaults: { title: "KPI", props: {} },
    fields: [],
    render: ChartWidget,
  },
  spark: {
    label: "Sparkline",
    group: "charts",
    needsData: true,
    defaultSpan: { w: 8, h: 3 },
    resize: { minW: 2, maxW: 16, minH: 1, maxH: 4 },
    defaults: { title: "Sparkline", props: {} },
    fields: [],
    render: ChartWidget,
  },
  table: {
    label: "Table",
    group: "charts",
    needsData: true,
    defaultSpan: { w: 12, h: 6 },
    resize: { minW: 4, maxW: 16, minH: 2, maxH: 10 },
    defaults: { title: "Table", props: {} },
    fields: [],
    render: ChartWidget,
  },
  "dither-area": {
    label: "Dither area",
    group: "charts",
    needsData: true,
    defaultSpan: { w: 12, h: 7 },
    resize: { minW: 4, maxW: 16, minH: 5, maxH: 12 },
    defaults: { title: "Dither area", props: {} },
    fields: [],
    render: ChartWidget,
  },
  "dither-bar": {
    label: "Dither bar",
    group: "charts",
    needsData: true,
    defaultSpan: { w: 12, h: 7 },
    resize: { minW: 4, maxW: 16, minH: 5, maxH: 12 },
    defaults: { title: "Dither bar", props: {} },
    fields: [],
    render: ChartWidget,
  },
};
