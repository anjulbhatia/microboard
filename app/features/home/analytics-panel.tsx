import { useState } from "react";
import { useBoard } from "@/store/board";
import { Card, SectionHead, Stat } from "@/features/home/section";
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
  const rows = Object.entries(map).sort((a, b) => b[1].views + b[1].shares - (a[1].views + a[1].shares));

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <SectionHead
        eyebrow="Analytics"
        title="How boards travel"
        blurb="Views and shares across every board you touch."
      />

      <div className="grid grid-cols-3 gap-2">
        <Stat value={t.boards} label="Boards" />
        <Stat value={t.views} label="Views" />
        <Stat value={t.shares} label="Shares" />
      </div>

      <Card>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Current board
        </p>
        <p className="mt-1 truncate text-base font-bold">{board.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {mine ? `${mine.views} views · ${mine.shares} shares` : "No events yet — open and share to count."}
        </p>
      </Card>

      {rows.length > 0 && (
        <Card className="p-2">
          <ul className="flex flex-col divide-y divide-border">
            {rows.slice(0, 8).map(([id, s]) => (
              <li key={id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {id === board.id ? board.title : id.slice(0, 18)}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {s.views} views · {s.shares} shares
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
