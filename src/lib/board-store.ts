import { create } from "zustand";
import type { Board, DataSource, Page, StepType, Widget, WidgetType } from "@/types/board";
import { activePage, freshPage } from "@/types/board";
import { inferColumns } from "@/lib/data-utils";

function newBoard(): Board {
  const now = new Date().toISOString();
  const page = freshPage("Page 1");
  return {
    id: crypto.randomUUID(),
    title: "Untitled board",
    version: 0,
    createdAt: now,
    updatedAt: now,
    data: { source: null, raw: [], columns: [] },
    steps: [],
    pages: [page],
    activePageId: page.id,
    locks: [],
  };
}

function touch(board: Board): Board {
  return { ...board, version: board.version + 1, updatedAt: new Date().toISOString() };
}

/** Apply a transform to the active page's widget map. */
function withPage(
  board: Board,
  fn: (page: Page) => Page
): Board {
  return {
    ...board,
    pages: board.pages.map((p) => (p.id === board.activePageId ? fn(p) : p)),
  };
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
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;
  clampAllWidgets: (cols: number) => void;
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
    set((s) => {
      const page = freshPage("Page 1");
      return {
        board: touch({
          ...s.board,
          data: { source, raw, columns: inferColumns(raw) },
          steps: [],
          pages: [page],
          activePageId: page.id,
        }),
      };
    }),

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
        board: touch(
          withPage(s.board, (p) => ({
            ...p,
            widgets: { ...p.widgets, [id]: { ...widget, id } },
            order: [...p.order, id],
          }))
        ),
      };
    }),

  updateWidget: (id, patch) =>
    set((s) => {
      const current = activePage(s.board).widgets[id];
      if (!current) return s;
      return {
        board: touch(
          withPage(s.board, (p) => ({
            ...p,
            widgets: {
              ...p.widgets,
              [id]: { ...current, ...patch, props: { ...current.props, ...patch.props } },
            },
          }))
        ),
      };
    }),

  duplicateWidget: (id) =>
    set((s) => {
      const current = activePage(s.board).widgets[id];
      if (!current) return s;
      const copyId = crypto.randomUUID();
      return {
        board: touch(
          withPage(s.board, (p) => ({
            ...p,
            widgets: { ...p.widgets, [copyId]: { ...current, id: copyId, title: `${current.title} copy` } },
            order: [...p.order, copyId],
          }))
        ),
      };
    }),

  moveWidget: (dragId, targetId) =>
    set((s) => {
      const page = activePage(s.board);
      if (dragId === targetId || !page.widgets[dragId] || !page.widgets[targetId]) return s;
      const order = page.order.filter((w) => w !== dragId);
      order.splice(order.indexOf(targetId), 0, dragId);
      return { board: touch(withPage(s.board, (p) => ({ ...p, order }))) };
    }),

  removeWidget: (id) =>
    set((s) => {
      const page = activePage(s.board);
      if (!page.widgets[id]) return s;
      const widgets = { ...page.widgets };
      delete widgets[id];
      return {
        board: touch(
          withPage(s.board, (p) => ({ ...p, widgets, order: p.order.filter((w) => w !== id) }))
        ),
      };
    }),

  addPage: () =>
    set((s) => {
      const page = freshPage(`Page ${s.board.pages.length + 1}`);
      return {
        board: touch({ ...s.board, pages: [...s.board.pages, page], activePageId: page.id }),
      };
    }),

  removePage: (id) =>
    set((s) => {
      if (s.board.pages.length <= 1) return s;
      const pages = s.board.pages.filter((p) => p.id !== id);
      const activePageId =
        s.board.activePageId === id ? pages[Math.max(0, pages.findIndex((p) => p.id === id) - 1)]?.id ?? pages[0].id : s.board.activePageId;
      return { board: touch({ ...s.board, pages, activePageId }) };
    }),

  setActivePage: (id) =>
    set((s) => {
      if (!s.board.pages.some((p) => p.id === id) || s.board.activePageId === id) return s;
      return { board: touch({ ...s.board, activePageId: id }) };
    }),

  clampAllWidgets: (cols) =>
    set((s) => {
      let changed = false;
      const pages = s.board.pages.map((p) => {
        let order = p.order;
        let widgets = p.widgets;
        const next: typeof widgets = {};
        for (const [wid, w] of Object.entries(widgets)) {
          const cw = Math.max(1, Math.min(w.w, cols));
          if (cw !== w.w) {
            changed = true;
            next[wid] = { ...w, w: cw };
          } else {
            next[wid] = w;
          }
        }
        widgets = next;
        return { ...p, order, widgets };
      });
      if (!changed) return s;
      return { board: touch({ ...s.board, pages }) };
    }),

  reset: () => set({ board: newBoard() }),
}));
