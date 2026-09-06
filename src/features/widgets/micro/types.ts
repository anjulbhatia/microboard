import type { ComponentType } from "react";

/** Every abstract is a pure function of data → SVG. No deps, no animation. */
export interface MicroDef {
  id: string;
  title: string;
  family: "Trends" | "Compare" | "Grids" | "Gauges" | "Finance";
  blurb: string;
  use: string;
  dataShape: string;
  Component: ComponentType<Record<string, unknown>>;
  sample: Record<string, unknown>;
  /** Derive render props from a bare number series (canvas widgets, agents). */
  derive: (values: number[]) => Record<string, unknown>;
}

export const C3 = "var(--chart-3)";
export const C2 = "var(--chart-2)";
export const C1 = "var(--chart-1)";
export const C4 = "var(--chart-4)";
export const C5 = "var(--chart-5)";
export const MUT = "var(--muted-foreground)";
export const BDR = "var(--border)";
export const DES = "var(--destructive)";
