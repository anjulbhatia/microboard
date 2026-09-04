import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type IHeaderParams,
} from "ag-grid-community";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Copy01Icon,
  Delete02Icon,
  DeleteColumnIcon,
  Eraser01Icon,
  FilterIcon,
  Layers01Icon,
  MagicWand01Icon,
  PaintBucketIcon,
  PenLineIcon,
  PencilEdit01Icon,
  RowsTwoIcon,
} from "@hugeicons/core-free-icons";
import { useBoard } from "@/lib/board-store";
import { applySteps, inferColumns } from "@/lib/data-utils";
import { Btn } from "@/components/canvas/controls";
import { DropColsModal, FillModal, FlashFillModal, GroupByModal, RenameModal, ReplaceModal } from "@/components/canvas/transform-modals";

ModuleRegistry.registerModules([AllCommunityModule]);

type Modal = "rename" | "dropcols" | "fill" | "flashfill" | "replace" | "groupby" | null;

const lightGrid = themeQuartz.withParams({});
const darkGrid = themeQuartz.withParams({}, "dark");

const TransformCtx = createContext<{ columns: string[]; onDeleteColumn: (col: string) => void }>({
  columns: [],
  onDeleteColumn: () => {},
});

function ColHeader(props: IHeaderParams) {
  const { onDeleteColumn } = useContext(TransformCtx);
  const sort = props.column.getSort();
  const cycle = () => {
    const next = sort === "asc" ? "desc" : sort === "desc" ? null : "asc";
    props.setSort(next, false);
  };
  return (
    <div className="group flex h-full w-full items-center gap-1 px-1">
      <button
        type="button"
        onClick={cycle}
        title="Sort"
        className="flex min-w-0 flex-1 items-center gap-1 truncate font-mono text-xs font-semibold"
      >
        <span className="truncate">{props.displayName}</span>
        <span className="text-[10px] text-muted-foreground">
          {sort === "asc" ? "▲" : sort === "desc" ? "▼" : ""}
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteColumn(props.column.getColId());
        }}
        title={`Delete ${props.displayName}`}
        aria-label={`Delete ${props.displayName}`}
        className="hidden rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
      >
        <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function Cmd({
  icon,
  label,
  onClick,
}: {
  icon: typeof Eraser01Icon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} />
      {label}
    </button>
  );
}

function Group({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 px-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{name}</p>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

export function TransformPhase({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const board = useBoard((s) => s.board);
  const { addStep, removeStep } = useBoard();
  const { resolvedTheme } = useTheme();
  const [modal, setModal] = useState<Modal>(null);
  const gridRef = useRef<AgGridReact>(null);

  const cleaned = useMemo(() => applySteps(board.data.raw, board.steps), [board.data.raw, board.steps]);
  const cols = useMemo(() => inferColumns(cleaned).map((c) => c.name), [cleaned]);

  const deleteColumn = useCallback(
    (col: string) => {
      const keep = cols.filter((c) => c !== col);
      if (keep.length === 0) return;
      addStep("select", { columns: keep.join(",") }, `Drop column ${col}`);
    },
    [addStep, cols]
  );

  const ctxValue = useMemo(() => ({ columns: cols, onDeleteColumn: deleteColumn }), [cols, deleteColumn]);

  const colDefs: ColDef[] = useMemo(
    () =>
      cols.map((c) => ({
        field: c,
        headerName: c,
        headerComponent: ColHeader,
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
        flex: 1,
        minWidth: 140,
        cellClass: "font-mono text-xs",
      })),
    [cols]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({ filter: true, floatingFilter: true, sortable: true, resizable: true }),
    []
  );

  const applyGridFilters = useCallback(() => {
    const api: GridApi | undefined = gridRef.current?.api;
    if (!api) return;
    const model = api.getFilterModel() as Record<string, unknown>;
    let applied = 0;
    for (const [col, f] of Object.entries(model)) {
      const flt = f as { filterType?: string; type?: string; filter?: unknown; conditions?: { type?: string; filter?: unknown }[] };
      const conds = flt.conditions ?? [{ type: flt.type, filter: flt.filter }];
      for (const c of conds) {
        const t = c.type;
        const v = c.filter;
        if (flt.filterType === "number") {
          if (t === "blank") {
            addStep("dropNulls", { column: col }, `Drop rows where ${col} is null`);
            applied++;
          } else if (t === "notBlank") {
            continue;
          } else if (v != null && v !== "") {
            const map: Record<string, string> = {
              equals: "==",
              notEqual: "!=",
              greaterThan: ">",
              greaterThanOrEqual: ">=",
              lessThan: "<",
              lessThanOrEqual: "<=",
            };
            const cond = map[t ?? ""];
            if (!cond) continue;
            addStep("filter", { column: col, op: cond, value: String(v) }, `Keep rows where ${col} ${cond} ${v}`);
            applied++;
          }
        } else {
          if (t === "blank") {
            addStep("dropNulls", { column: col }, `Drop rows where ${col} is null`);
            applied++;
          } else if (t === "notBlank" || v == null || v === "") {
            continue;
          } else {
            const map: Record<string, string> = { equals: "==", notEqual: "!=", contains: "contains" };
            const cond = map[t ?? ""] ?? "contains";
            addStep("filter", { column: col, op: cond, value: String(v) }, `Keep rows where ${col} ${cond} ${v}`);
            applied++;
          }
        }
      }
    }
    if (applied > 0) api.setFilterModel(null);
  }, [addStep]);

  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-muted/40 p-3">
      <div className="flex h-full w-11/12 max-w-6xl min-h-0 flex-col gap-2 rounded-2xl border bg-card p-3 shadow-xl">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to load"
            className="flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.5} />
          </button>
          <span className="font-display text-base tracking-[0.2em]">MICROBOARD</span>
          <div className="min-w-0 flex-1" />
          <Btn onClick={onDone}>Load</Btn>
          <Btn primary onClick={onDone}>
            Transform and Load
          </Btn>
        </div>

        <div className="flex min-h-0 flex-1 gap-2">
          <div className="slim-scroll flex w-52 shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border bg-card/60 p-2">
            <Group name="Column">
              <Cmd icon={PencilEdit01Icon} label="Rename" onClick={() => setModal("rename")} />
              <Cmd icon={DeleteColumnIcon} label="Drop" onClick={() => setModal("dropcols")} />
              <Cmd icon={RowsTwoIcon} label="First row as header" onClick={() => addStep("header", {}, "First row as header")} />
            </Group>
            <Group name="Row">
              <Cmd icon={Eraser01Icon} label="Drop nulls" onClick={() => addStep("dropNulls", { column: "__all__" }, "Drop rows with any null")} />
              <Cmd icon={Copy01Icon} label="Drop duplicates" onClick={() => addStep("dropDuplicates", { columns: "" }, "Drop duplicate rows")} />
              <Cmd icon={PaintBucketIcon} label="Fill nulls" onClick={() => setModal("fill")} />
              <Cmd icon={MagicWand01Icon} label="Flash fill" onClick={() => setModal("flashfill")} />
            </Group>
            <Group name="Transform">
              <Cmd icon={PenLineIcon} label="Replace values" onClick={() => setModal("replace")} />
              <Cmd icon={Layers01Icon} label="Group by" onClick={() => setModal("groupby")} />
              <Cmd icon={FilterIcon} label="Apply filters" onClick={applyGridFilters} />
            </Group>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border">
            <TransformCtx.Provider value={ctxValue}>
              <AgGridReact
                ref={gridRef}
                theme={resolvedTheme === "dark" ? darkGrid : lightGrid}
                rowData={cleaned as Record<string, unknown>[]}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                animateRows
              />
            </TransformCtx.Provider>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto">
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {cleaned.length} rows · {cols.length} cols · {board.steps.length} steps
          </span>
          {board.steps.map((s, i) => (
            <span
              key={s.id}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-card px-2 py-0.5 font-mono text-[11px]"
            >
              {i + 1}. {s.type}
              <button
                type="button"
                onClick={() => removeStep(s.id)}
                aria-label={`Remove step ${s.type}`}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Delete02Icon} size={11} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>

        {modal === "rename" && <RenameModal columns={cols} onClose={() => setModal(null)} />}
        {modal === "dropcols" && <DropColsModal columns={cols} onClose={() => setModal(null)} />}
        {modal === "fill" && <FillModal columns={cols} onClose={() => setModal(null)} />}
        {modal === "flashfill" && <FlashFillModal columns={cols} rows={cleaned} onClose={() => setModal(null)} />}
        {modal === "replace" && <ReplaceModal columns={cols} onClose={() => setModal(null)} />}
        {modal === "groupby" && <GroupByModal columns={cols} onClose={() => setModal(null)} />}
      </div>
    </div>
  );
}
