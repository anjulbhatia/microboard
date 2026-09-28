import { useMemo } from "react";
import { useBoard } from "@/store/board";
import { WIDGET_REGISTRY, clampSpan } from "@/features/widgets/registry";
import { BOARD_GRID } from "@/features/board/types";
import { applySteps, inferColumns, SAMPLE_CSV } from "@/features/data/lib/data-utils";
import { csvRecords } from "@/features/data/providers/csv";
import type { AgentBoardApi, ChartKind } from "@/features/agent/chat-agent";

/**
 * Live board surface for agents. Stable across renders; reads store state
 * lazily so both the chat panel and the WebMCP bridge share one object.
 */
export function useAgentBoardApi(): AgentBoardApi {
  return useMemo<AgentBoardApi>(
    () => ({
      columns: () => {
        const b = useBoard.getState().board;
        return inferColumns(applySteps(b.data.raw, b.steps)).map((c) => c.name);
      },
      hasData: () => useBoard.getState().board.data.raw.length > 0,
      loadSample: () => useBoard.getState().loadData("sample", csvRecords(SAMPLE_CSV)),
      addStep: (type, params, description) =>
        useBoard.getState().addStep(type, params, description),
      addChart: (kind: ChartKind, x, y) => {
        const meta = WIDGET_REGISTRY[kind];
        const span = clampSpan(kind, meta.defaultSpan, BOARD_GRID.cols);
        useBoard.getState().addWidget({
          type: kind,
          title: `${meta.label} · ${y}`,
          dataX: x,
          dataY: y,
          x,
          y,
          w: span.w,
          h: span.h,
          props: { ...meta.defaults.props },
        });
      },
      summary: () => {
        const b = useBoard.getState().board;
        const cleaned = applySteps(b.data.raw, b.steps);
        const cols = inferColumns(cleaned).map((c) => c.name);
        return `${cleaned.length} rows · ${cols.length} cols (${cols.join(", ")}) · ${b.steps.length} steps.`;
      },
      state: () => {
        const b = useBoard.getState().board;
        const cleaned = applySteps(b.data.raw, b.steps);
        const cols = inferColumns(cleaned).map((c) => c.name);
        const page = b.pages.find((p) => p.id === b.activePageId) ?? b.pages[0];
        const widgets = page ? Object.keys(page.widgets).length : 0;
        return { title: b.title, version: b.version, steps: b.steps.length, widgets, columns: cols };
      },
    }),
    []
  );
}
