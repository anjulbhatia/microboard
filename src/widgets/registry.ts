import type { ComponentType } from "react";
import type { Widget, WidgetSize, WidgetType } from "@/types/board";
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

export interface WidgetMeta {
  label: string;
  group: "content" | "media" | "board" | "charts";
  needsData: boolean;
  defaultSize: WidgetSize;
  defaults: { title: string; props: Record<string, string | number> };
  fields: WidgetField[];
  render: ComponentType<{ widget: Widget }>;
}

const SHAPE_COLORS = [
  { value: "#8b5cf6", label: "Purple" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Red" },
  { value: "#6b7280", label: "Grey" },
];

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
  textbox: {
    label: "Textbox",
    group: "content",
    needsData: false,
    defaultSize: "1x1",
    defaults: { title: "Textbox", props: { text: "Add some text…" } },
    fields: [{ key: "text", label: "Text", type: "textarea" }],
    render: TextboxWidget,
  },
  heading: {
    label: "Heading",
    group: "content",
    needsData: false,
    defaultSize: "1x1",
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
    defaultSize: "1x1",
    defaults: { title: "Shape", props: { shape: "rectangle", color: "#8b5cf6" } },
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
    defaultSize: "1x1",
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
    defaultSize: "1x2",
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
    defaultSize: "2x2",
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
    defaultSize: "1x1",
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
    defaultSize: "1x1",
    defaults: { title: "KPI", props: {} },
    fields: [],
    render: ChartWidget,
  },
  spark: {
    label: "Sparkline",
    group: "charts",
    needsData: true,
    defaultSize: "1x1",
    defaults: { title: "Sparkline", props: {} },
    fields: [],
    render: ChartWidget,
  },
  table: {
    label: "Table",
    group: "charts",
    needsData: true,
    defaultSize: "2x2",
    defaults: { title: "Table", props: {} },
    fields: [],
    render: ChartWidget,
  },
  "dither-area": {
    label: "Dither area",
    group: "charts",
    needsData: true,
    defaultSize: "2x2",
    defaults: { title: "Dither area", props: {} },
    fields: [],
    render: ChartWidget,
  },
  "dither-bar": {
    label: "Dither bar",
    group: "charts",
    needsData: true,
    defaultSize: "2x2",
    defaults: { title: "Dither bar", props: {} },
    fields: [],
    render: ChartWidget,
  },
};
