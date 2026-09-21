import { useMemo } from "react";
import { activePage, BOARD_GRID, type Board } from "@/features/board/types";
import { WIDGET_REGISTRY } from "@/features/widgets/registry";
import { applySteps, inferColumns } from "@/features/data/lib/data-utils";
import type { StageRatio } from "@/features/board/components/stage";

export function useBoardDerived(board: Board, ratio: StageRatio) {
  const page = activePage(board);
  const order = page.order;
  const widgets = page.widgets;

  const cleaned = useMemo(
    () => applySteps(board.data.raw, board.steps),
    [board.data.raw, board.steps]
  );
  const cleanedCols = useMemo(() => inferColumns(cleaned).map((c) => c.name), [cleaned]);
  const rawCols = useMemo(() => board.data.columns.map((c) => c.name), [board.data]);
  const hasData = board.data.raw.length > 0;

  const chartWidgets = useMemo(
    () => order.filter((id) => {
      const w = widgets[id];
      return w && WIDGET_REGISTRY[w.type].needsData;
    }),
    [order, widgets]
  );

  const dims = BOARD_GRID[ratio];
  const usedCells = useMemo(
    () =>
      order.reduce((acc, id) => {
        const w = widgets[id];
        return acc + (w ? w.w * w.h : 0);
      }, 0),
    [order, widgets]
  );
  const capacity = dims.cols * dims.rows;

  return { page, order, widgets, cleaned, cleanedCols, rawCols, hasData, chartWidgets, dims, usedCells, capacity };
}
