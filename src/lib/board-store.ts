import { create } from "zustand";
import type { Board, DataSource, StepType, Widget, WidgetType } from "@/types/board";
import { inferColumns } from "@/lib/data-utils";

function newBoard(): Board {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Untitled board",
    version: 0,
    createdAt: now,
    updatedAt: now,
    data: { source: null, raw: [], columns: [] },
    steps: [],
    order: [],
    widgets: {},
    locks: [],
  };
}

function touch(board: Board): Board {
  return { ...board, version: board.version + 1, updatedAt: new Date().toISOString() };
}

interface BoardStore {
  board: Board;
  setTitle: (title: string) => void;
  loadData: (source: DataSource, raw: Record<string, string>[]) => void;
  addStep: (type: StepType, params: Record<string, string>, description: string) => void;
  removeStep: (id: string) => void;
  clearSteps: () => void;
  addWidget: (widget: Omit<Widget, "id">) => void;
  updateWidget: (id: string, patch: Partial<Omit<Widget, "id">>) => void;
  duplicateWidget: (id: string) => void;
  moveWidget: (dragId: string, targetId: string) => void;
  removeWidget: (id: string) => void;
  reset: () => void;
}

export const WIDGET_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "S · 4×3", w: 4, h: 3 },
  { label: "M · 8×5", w: 8, h: 5 },
  { label: "L · 12×7", w: 12, h: 7 },
  { label: "Full · 16×8", w: 16, h: 8 },
];

export const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: "textbox", label: "Textbox" },
  { value: "heading", label: "Heading" },
  { value: "shape", label: "Shape" },
  { value: "icon", label: "Icon" },
  { value: "image", label: "Image" },
  { value: "board", label: "Board" },
  { value: "card", label: "Card" },
  { value: "kpi", label: "KPI" },
  { value: "spark", label: "Sparkline" },
  { value: "table", label: "Table" },
  { value: "dither-area", label: "Dither area" },
  { value: "dither-bar", label: "Dither bar" },
];

export const useBoard = create<BoardStore>()((set) => ({
  board: newBoard(),

  setTitle: (title) =>
    set((s) => ({ board: touch({ ...s.board, title }) })),

  loadData: (source, raw) =>
    set((s) => ({
      board: touch({
        ...s.board,
        data: { source, raw, columns: inferColumns(raw) },
        steps: [],
        order: [],
        widgets: {},
      }),
    })),

  addStep: (type, params, description) =>
    set((s) => ({
      board: touch({
        ...s.board,
        steps: [...s.board.steps, { id: crypto.randomUUID(), type, params, description }],
      }),
    })),

  removeStep: (id) =>
    set((s) => ({ board: touch({ ...s.board, steps: s.board.steps.filter((st) => st.id !== id) }) })),

  clearSteps: () => set((s) => ({ board: touch({ ...s.board, steps: [] }) })),

  addWidget: (widget) =>
    set((s) => {
      const id = crypto.randomUUID();
      return {
        board: touch({
          ...s.board,
          widgets: { ...s.board.widgets, [id]: { ...widget, id } },
          order: [...s.board.order, id],
        }),
      };
    }),

  updateWidget: (id, patch) =>
    set((s) => {
      const current = s.board.widgets[id];
      if (!current) return s;
      return {
        board: touch({
          ...s.board,
          widgets: {
            ...s.board.widgets,
            [id]: { ...current, ...patch, props: { ...current.props, ...patch.props } },
          },
        }),
      };
    }),

  duplicateWidget: (id) =>
    set((s) => {
      const current = s.board.widgets[id];
      if (!current) return s;
      const copyId = crypto.randomUUID();
      return {
        board: touch({
          ...s.board,
          widgets: { ...s.board.widgets, [copyId]: { ...current, id: copyId, title: `${current.title} copy` } },
          order: [...s.board.order, copyId],
        }),
      };
    }),

  moveWidget: (dragId, targetId) =>
    set((s) => {
      if (dragId === targetId || !s.board.widgets[dragId] || !s.board.widgets[targetId]) return s;
      const order = s.board.order.filter((w) => w !== dragId);
      order.splice(order.indexOf(targetId), 0, dragId);
      return { board: touch({ ...s.board, order }) };
    }),

  removeWidget: (id) =>
    set((s) => {
      const widgets = { ...s.board.widgets };
      delete widgets[id];
      return {
        board: touch({ ...s.board, widgets, order: s.board.order.filter((w) => w !== id) }),
      };
    }),

  reset: () => set({ board: newBoard() }),
}));
