import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { useBoard } from "@/lib/board-store";
import { applySteps, inferColumns, inferFlashFill } from "@/lib/data-utils";
import { Btn, CSelect, inputCls } from "@/components/canvas/controls";

function Shell({
  title,
  sub,
  onClose,
  children,
}: {
  title: string;
  sub: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function Foot({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 border-t px-4 py-3">{children}</div>;
}

export function RenameModal({ columns, onClose }: { columns: string[]; onClose: () => void }) {
  const addStep = useBoard((s) => s.addStep);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(columns.map((c) => [c, c]))
  );
  const submit = () => {
    columns.forEach((c) => {
      const to = (names[c] ?? "").trim();
      if (to && to !== c) addStep("rename", { column: c, to }, `Rename ${c} to ${to}`);
    });
    onClose();
  };
  return (
    <Shell title="Rename columns" sub="Edit names, apply once." onClose={onClose}>
      <div className="slim-scroll max-h-64 space-y-1.5 overflow-y-auto pr-1">
        {columns.map((c) => (
          <div key={c} className="flex items-center gap-2">
            <span className="w-1/2 truncate font-mono text-xs text-muted-foreground">{c}</span>
            <input
              value={names[c] ?? ""}
              onChange={(e) => setNames((p) => ({ ...p, [c]: e.target.value }))}
              aria-label={`Rename ${c}`}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <Foot>
        <Btn primary onClick={submit} className="w-full">
          Apply renames
        </Btn>
      </Foot>
    </Shell>
  );
}

export function DropColsModal({ columns, onClose }: { columns: string[]; onClose: () => void }) {
  const addStep = useBoard((s) => s.addStep);
  const [drop, setDrop] = useState<string[]>([]);
  const toggle = (c: string, v: boolean) =>
    setDrop((p) => (v ? [...p, c] : p.filter((x) => x !== c)));
  const submit = () => {
    const keep = columns.filter((c) => !drop.includes(c));
    if (keep.length === 0 || drop.length === 0) {
      onClose();
      return;
    }
    addStep("select", { columns: keep.join(",") }, `Keep columns ${keep.join(", ")}`);
    onClose();
  };
  return (
    <Shell title="Drop columns" sub="Check columns to remove." onClose={onClose}>
      <div className="slim-scroll flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
        {columns.map((c) => (
          <label
            key={c}
            className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors ${
              drop.includes(c) ? "border-destructive bg-destructive/10" : "hover:bg-muted"
            }`}
          >
            <Checkbox checked={drop.includes(c)} onCheckedChange={(v) => toggle(c, v === true)} />
            <span className="truncate">{c}</span>
          </label>
        ))}
      </div>
      <Foot>
        <Btn primary onClick={submit} className="w-full">
          Drop {drop.length} column{drop.length === 1 ? "" : "s"}
        </Btn>
      </Foot>
    </Shell>
  );
}

export function FillModal({ columns, onClose }: { columns: string[]; onClose: () => void }) {
  const addStep = useBoard((s) => s.addStep);
  const [column, setColumn] = useState(columns[0] ?? "");
  const [mode, setMode] = useState("value");
  const [value, setValue] = useState("");
  const submit = () => {
    if (!column) {
      onClose();
      return;
    }
    if (mode === "down") {
      addStep("fill", { column, mode: "down" }, `Fill ${column} down`);
    } else {
      addStep("fill", { column, mode: "value", value }, `Fill ${column} with "${value}"`);
    }
    onClose();
  };
  return (
    <Shell title="Fill nulls" sub="Literal value or carry last value down." onClose={onClose}>
      <CSelect
        label="Column"
        value={column}
        onChange={setColumn}
        options={columns.map((c) => ({ value: c, label: c }))}
      />
      <div className="flex gap-2">
        <CSelect
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "value", label: "Value" },
            { value: "down", label: "Fill down" },
          ]}
        />
        {mode === "value" && (
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="fill value" className={inputCls} />
        )}
      </div>
      <Foot>
        <Btn primary onClick={submit} className="w-full">
          Apply fill
        </Btn>
      </Foot>
    </Shell>
  );
}

export function DisplayTableModal({ onClose }: { onClose: () => void }) {
  const board = useBoard((s) => s.board);
  const cleaned = applySteps(board.data.raw, board.steps);
  const cols = inferColumns(cleaned).map((c) => c.name);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Data table"
    >
      <div
        className="flex max-h-[85svh] w-full max-w-4xl flex-col rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">Data table</h2>
            <p className="font-mono text-xs text-muted-foreground">
              {cleaned.length} rows · {cols.length} cols · v{board.version}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="slim-scroll min-h-0 flex-1 overflow-auto">
          <table className="w-full font-mono text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left text-muted-foreground">
                <th className="px-2 py-1 font-medium">#</th>
                {cols.map((c) => (
                  <th key={c} className="px-2 py-1 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cleaned.slice(0, 200).map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                  {cols.map((c) => (
                    <td key={c} className="px-2 py-1">{r[c]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ReplaceModal({ columns, onClose }: { columns: string[]; onClose: () => void }) {
  const addStep = useBoard((s) => s.addStep);
  const [column, setColumn] = useState(columns[0] ?? "");
  const [find, setFind] = useState("");
  const [with_, setWith] = useState("");
  const submit = () => {
    if (!column || !find) return;
    addStep("replace", { column, find, with: with_ }, `Replace "${find}" with "${with_}" in ${column}`);
    onClose();
  };
  return (
    <Shell title="Replace values" sub="Find and replace inside a column." onClose={onClose}>
      <CSelect
        label="Column"
        value={column}
        onChange={setColumn}
        options={columns.map((c) => ({ value: c, label: c }))}
      />
      <div className="flex gap-2">
        <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="find" className={inputCls} />
        <input value={with_} onChange={(e) => setWith(e.target.value)} placeholder="replace with" className={inputCls} />
      </div>
      <Foot>
        <Btn primary onClick={submit} disabled={!find} className="w-full">
          Apply replace
        </Btn>
      </Foot>
    </Shell>
  );
}

export function GroupByModal({ columns, onClose }: { columns: string[]; onClose: () => void }) {
  const addStep = useBoard((s) => s.addStep);
  const [column, setColumn] = useState(columns[0] ?? "");
  const [agg, setAgg] = useState("sum");
  const [target, setTarget] = useState(columns[0] ?? "");
  const submit = () => {
    if (!column) return;
    addStep(
      "groupBy",
      { column, agg, target },
      agg === "count" ? `Group by ${column}, count rows` : `Group by ${column}, ${agg} of ${target}`
    );
    onClose();
  };
  return (
    <Shell title="Group by" sub="Aggregate rows per group." onClose={onClose}>
      <CSelect
        label="Group column"
        value={column}
        onChange={setColumn}
        options={columns.map((c) => ({ value: c, label: c }))}
      />
      <div className="flex gap-2">
        <CSelect
          label="Aggregation"
          value={agg}
          onChange={setAgg}
          options={["sum", "count", "average", "min", "max"].map((a) => ({ value: a, label: a }))}
        />
        {agg !== "count" && (
          <CSelect
            label="Target column"
            value={target}
            onChange={setTarget}
            options={columns.map((c) => ({ value: c, label: c }))}
          />
        )}
      </div>
      <Foot>
        <Btn primary onClick={submit} className="w-full">
          Apply group by
        </Btn>
      </Foot>
    </Shell>
  );
}

export function FlashFillModal({
  columns,
  rows,
  onClose,
}: {
  columns: string[];
  rows: Record<string, string>[];
  onClose: () => void;
}) {
  const addStep = useBoard((s) => s.addStep);
  const [column, setColumn] = useState(columns[0] ?? "");
  const [example, setExample] = useState("");
  const preview = useMemo(() => {
    if (!column || !example) return null;
    try {
      const fn = inferFlashFill(
        rows.map((r) => r[column] ?? ""),
        example
      );
      if (!fn) return null;
      return rows.slice(0, 3).map((r) => ({ in: r[column] ?? "", out: fn(r[column] ?? "") }));
    } catch {
      return null;
    }
  }, [column, example, rows]);

  const submit = () => {
    if (!column || !example || !preview) return;
    addStep(
      "flashfill",
      { column, into: `${column}_fill`, example },
      `Flash fill ${column} like "${example}"`
    );
    onClose();
  };

  return (
    <Shell title="Flash fill" sub="Give one example, infer the pattern." onClose={onClose}>
      <CSelect
        label="Column"
        value={column}
        onChange={setColumn}
        options={columns.map((c) => ({ value: c, label: c }))}
      />
      <input
        value={example}
        onChange={(e) => setExample(e.target.value)}
        placeholder='e.g. "JD" for "John Doe"'
        className={inputCls}
      />
      {example && (
        <div className="rounded-md border bg-card p-2 font-mono text-xs">
          {preview ? (
            preview.map((p, i) => (
              <p key={i} className="truncate text-muted-foreground">
                {p.in} → <span className="text-foreground">{p.out}</span>
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">No pattern fits — try a clearer example.</p>
          )}
        </div>
      )}
      <Foot>
        <Btn primary onClick={submit} disabled={!preview} className="w-full">
          Apply flash fill
        </Btn>
      </Foot>
    </Shell>
  );
}
