export interface BoardStats {
  views: number;
  shares: number;
  updatedAt: string;
}

export type StatsMap = Record<string, BoardStats>;

export const STATS_KEY = "microboard.stats.v1";

function empty(): BoardStats {
  return { views: 0, shares: 0, updatedAt: new Date().toISOString() };
}

/** Bump views or shares for a board. Pure — caller persists. */
export function recordStat(map: StatsMap, boardId: string, kind: "views" | "shares"): StatsMap {
  const prev = map[boardId] ?? empty();
  return {
    ...map,
    [boardId]: { ...prev, [kind]: prev[kind] + 1, updatedAt: new Date().toISOString() },
  };
}

export function totals(map: StatsMap): { boards: number; views: number; shares: number } {
  const rows = Object.values(map);
  return {
    boards: rows.length,
    views: rows.reduce((a, s) => a + s.views, 0),
    shares: rows.reduce((a, s) => a + s.shares, 0),
  };
}

export function loadStats(get: (k: string) => string | null): StatsMap {
  try {
    const raw = get(STATS_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw) as StatsMap;
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

/** Guarded write — private mode keeps stats in memory. */
export function persistStats(set: (k: string, v: string) => void, map: StatsMap): void {
  try {
    set(STATS_KEY, JSON.stringify(map));
  } catch {
    // Ignore.
  }
}
