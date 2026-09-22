import { create, type StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Board, DataSource, Page, StepType, Widget } from "@/features/board/types";
import { activePage, BOARD_GRID, clampWidgetToGrid, freshPage, nextPosition, normalizeWidget } from "@/features/board/types";
import { inferColumns } from "@/features/data/lib/data-utils";

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
  /** Replace rows in place — keeps source config, steps, pages. */
  refreshData: (raw: Record<string, string>[]) => void;
  /** Point the board at an API endpoint + poll interval. */
  setSourceConfig: (url: string, refreshMinutes: number) => void;
  addStep: (type: StepType, params: Record<string, string>, description: string) => void;
  removeStep: (id: string) => void;
  clearSteps: () => void;
  addWidget: (widget: Omit<Widget, "id" | "col" | "row"> & Partial<Pick<Widget, "col" | "row">>) => void;
  updateWidget: (id: string, patch: Partial<Omit<Widget, "id">>) => void;
  duplicateWidget: (id: string) => void;
  moveWidget: (dragId: string, targetId: string) => void;
  removeWidget: (id: string) => void;
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;
  clampAllWidgets: (cols: number) => void;
  /** Replace the working board (open from library). Normalizes widgets. */
  loadBoard: (board: Board) => void;
  reset: () => void;
}

/** Normalize + clamp a board (rehydration, old snapshots, cloud docs). */
function sanitizeBoard(board: Board): Board {
  return {
    ...board,
    pages: board.pages.map((p) => ({
      ...p,
      widgets: Object.fromEntries(
        Object.entries(p.widgets).map(([id, w]) => [
          id,
          clampWidgetToGrid(normalizeWidget(w), BOARD_GRID.cols, BOARD_GRID.rows),
        ])
      ),
    })),
  };
}

const hasBrowserStorage =
  typeof localStorage !== "undefined" && typeof window !== "undefined";

const boardCreator: StateCreator<BoardStore> = (set) => {
  return {
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

  refreshData: (raw) =>
    set((s) => ({
      board: touch({
        ...s.board,
        data: {
          ...s.board.data,
          raw,
          columns: inferColumns(raw),
          lastRefresh: new Date().toISOString(),
        },
      }),
    })),

  setSourceConfig: (url, refreshMinutes) =>
    set((s) => ({
      board: touch({
        ...s.board,
        data: { ...s.board.data, sourceUrl: url, refreshMinutes },
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
      const page = activePage(s.board);
      const span = {
        w: Math.max(1, Math.min(Math.round(widget.w), BOARD_GRID.cols)),
        h: Math.max(1, Math.min(Math.round(widget.h), BOARD_GRID.rows)),
      };
      const pos =
        widget.col !== undefined && widget.row !== undefined
          ? { col: widget.col, row: widget.row }
          : nextPosition(page.order, page.widgets, span, BOARD_GRID.cols);
      const placed = clampWidgetToGrid(
        { ...widget, id, w: span.w, h: span.h, col: pos.col, row: pos.row } as Widget,
        BOARD_GRID.cols,
        BOARD_GRID.rows
      );
      return {
        board: touch(
          withPage(s.board, (p) => ({
            ...p,
            widgets: { ...p.widgets, [id]: placed },
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

  clampAllWidgets: (cols: number = BOARD_GRID.cols, rows: number = BOARD_GRID.rows) =>
    set((s) => {
      let changed = false;
      const pages = s.board.pages.map((p) => {
        let order = p.order;
        const next: typeof p.widgets = {};
        for (const [wid, w] of Object.entries(p.widgets)) {
          const clamped = clampWidgetToGrid(w, cols, rows);
          if (clamped.w !== w.w || clamped.h !== w.h || clamped.col !== w.col || clamped.row !== w.row) {
            changed = true;
          }
          next[wid] = clamped;
        }
        return { ...p, order, widgets: next };
      });
      if (!changed) return s;
      return { board: touch({ ...s.board, pages }) };
    }),

  reset: () => set({ board: newBoard() }),

  loadBoard: (board) => set(() => ({ board: sanitizeBoard(board) })),
  };
}

/** Persisted in browsers (survives reload, guest included); plain in tests. */
const persistedCreator = persist(boardCreator, {
  name: "microboard.board.v1",
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({ board: s.board }) as BoardStore,
  merge: (persisted, current) => {
    const p = persisted as Partial<BoardStore>;
    return {
      ...current,
      board: p.board ? sanitizeBoard(p.board) : current.board,
    };
  },
}) as StateCreator<BoardStore>;

export const useBoard = create<BoardStore>()(
  hasBrowserStorage ? persistedCreator : boardCreator
);
