import { describe, expect, test } from "bun:test";
import { loadHistory, pushHistory, takeSnapshot } from "../app/features/history/history";
import { loadStats, recordStat, totals } from "../app/features/analytics/analytics";
import type { Board } from "../app/features/board/types";
import { freshPage } from "../app/features/board/types";

function board(): Board {
  const page = freshPage("P1");
  return {
    id: "b1",
    title: "t",
    version: 4,
    createdAt: "a",
    updatedAt: "b",
    data: { source: null, raw: [], columns: [] },
    steps: [],
    pages: [page],
    activePageId: page.id,
    locks: [],
  };
}

describe("history", () => {
  test("snapshot caps at max, skips oversize", () => {
    let list = pushHistory([], takeSnapshot(board()));
    for (let i = 0; i < 15; i++) list = pushHistory(list, takeSnapshot(board()));
    expect(list.length).toBe(10);
    expect(list[0].version).toBe(4);
    const big = { ...takeSnapshot(board()), snapshot: "x".repeat(600_000) };
    expect(pushHistory(list, big).length).toBe(10);
  });

  test("load survives corrupt docs", () => {
    expect(loadHistory(() => null)).toEqual([]);
    expect(loadHistory(() => "{nope")).toEqual([]);
  });
});

describe("analytics", () => {
  test("record and totals", () => {
    let map = recordStat({}, "b1", "views");
    map = recordStat(map, "b1", "views");
    map = recordStat(map, "b1", "shares");
    map = recordStat(map, "b2", "shares");
    expect(totals(map)).toEqual({ boards: 2, views: 2, shares: 2 });
    expect(loadStats(() => null)).toEqual({});
    expect(loadStats(() => "{nope")).toEqual({});
  });
});
