import { useState } from "react";
import { useBoard } from "@/store/board";
import { loadStats, totals } from "@/features/analytics";

/**
 * Analytics — views and shares per board. Counts record locally when
 * boards open and links publish; a Convex mirror follows the same shape.
 */
export function AnalyticsPanel() {
  const board = useBoard((s) => s.board);
  const [map] = useState(() => {
    try {
      return loadStats((k) => localStorage.getItem(k));
    } catch {
      return loadStats(() => null);
    }
  });
  const t = totals(map);
  const mine = map[board.id];

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Views and shares across your boards.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Boards", value: t.boards },
          { label: "Views", value: t.views },
          { label: "Shares", value: t.shares },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="font-mono text-[11px] text-muted-foreground uppercase">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-4 text-sm">
        <p className="font-mono text-xs text-muted-foreground">CURRENT BOARD</p>
        <p className="mt-1 font-medium">{board.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {mine ? `${mine.views} views · ${mine.shares} shares` : "No events yet — open and share to count."}
        </p>
      </div>
    </div>
  );
}
