import { useState } from "react";
import { CreatePage } from "@/features/board/create-page";
import { BOARD_TEMPLATES, templateById } from "@/features/board/templates";
import { useBoard } from "@/store/board";
import { csvRecords } from "@/features/data/providers/csv";
import { SAMPLE_CSV } from "@/features/data/lib/data-utils";

/**
 * /new — template picker, then canvas. Blank resets the board;
 * sample loads the demo set and jumps to transforms.
 */
export function NewPage() {
  const [picked, setPicked] = useState<string | null>(null);
  const reset = useBoard((s) => s.reset);
  const loadData = useBoard((s) => s.loadData);

  if (picked) {
    const t = templateById(picked);
    return <CreatePage initialRatio={t.ratio} startAt={t.sample ? "transform" : "load"} />;
  }

  const pick = (id: string) => {
    const t = templateById(id);
    if (t.sample) {
      loadData("sample", csvRecords(SAMPLE_CSV));
    } else {
      reset();
    }
    setPicked(id);
  };

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-muted/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
        <p className="font-mono text-xs text-muted-foreground">NEW MICROBOARD</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Start from a template</h1>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {BOARD_TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => pick(t.id)}
                className="flex h-full w-full flex-col gap-1 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:ring-1 hover:ring-primary"
              >
                <span className="font-mono text-[10px] text-muted-foreground">{t.ratio}</span>
                <span className="text-sm font-semibold">{t.title}</span>
                <span className="text-xs text-muted-foreground">{t.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
