import { describe, expect, test } from "bun:test";
import {
  loadLibrary,
  parseBoard,
  persistLibrary,
  removeSaved,
  summarizeBoard,
  upsertSaved,
  type BoardStorage,
  type SavedBoard,
} from "../app/features/library/library";
import type { Board } from "../app/features/board/types";
import { freshPage } from "../app/features/board/types";

function mem(): BoardStorage & { dump: () => string | null } {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    dump: () => m.get("microboard.library.v1") ?? null,
  };
}

function board(title = "t"): Board {
  const page = freshPage("P1");
  return {
    id: "b1",
    title,
    version: 2,
    createdAt: "a",
    updatedAt: "2026-01-01T00:00:00.000Z",
    data: { source: null, raw: [], columns: [] },
    steps: [],
    pages: [page],
    activePageId: page.id,
    locks: [],
  };
}

describe("library", () => {
  test("summarize + parse round-trips with widget normalization", () => {
    const s = summarizeBoard(board("hello"));
    expect(s.title).toBe("hello");
    expect(s.version).toBe(2);
    const back = parseBoard(s.snapshot);
    expect(back.title).toBe("hello");
  });

  test("upsert dedupes by id, newest first; remove drops", () => {
    const a: SavedBoard = { ...summarizeBoard(board("a")), id: "1" };
    const b: SavedBoard = { ...summarizeBoard(board("b")), id: "2" };
    let list = upsertSaved(upsertSaved([], a), b);
    expect(list.map((x) => x.id)).toEqual(["2", "1"]);
    list = upsertSaved(list, { ...a, title: "a2" });
    expect(list[0].title).toBe("a2");
    expect(removeSaved(list, "2").map((x) => x.id)).toEqual(["1"]);
  });

  test("persist/load survives corrupt docs and null storage", () => {
    const s = mem();
    persistLibrary(s, [summarizeBoard(board())]);
    expect(loadLibrary(s).length).toBe(1);
    expect(loadLibrary(null)).toEqual([]);
    const bad = mem();
    bad.setItem("microboard.library.v1", "{nope");
    expect(loadLibrary(bad)).toEqual([]);
  });
});
