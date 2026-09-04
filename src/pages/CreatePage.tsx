import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CreateLayout } from "@/components/canvas/CreateLayout";
import { UploadPhase } from "@/components/canvas/UploadPhase";
import { DataLandedModal } from "@/components/canvas/DataLandedModal";
import { Stage } from "@/components/canvas/Stage";
import { WidgetCard } from "@/components/canvas/WidgetCard";
import { AgentPanel, TransformPanel, VisualsPanel } from "@/components/canvas/Panels";
import { PageStrip } from "@/components/canvas/PageStrip";
import { useBoard } from "@/lib/board-store";
import { inferColumns } from "@/lib/data-utils";
import { useBoardDerived } from "@/app/create/logic/useBoardDerived";
import { useUploads } from "@/app/create/logic/useUploads";
import type { DockTab } from "@/app/create/interface";
import { BOARD_GRID, type ColumnMeta } from "@/types/board";
import type { StageBackdrop, StageRatio } from "@/components/canvas/Stage";

export function CreatePage() {
  const board = useBoard((s) => s.board);
  const {
    loadData, addStep, removeWidget, duplicateWidget, moveWidget,
    clampAllWidgets, setTitle,
  } = useBoard();

  const [tab, setTab] = useState<DockTab>("visualize");
  const [panelOpen, setPanelOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<"widget" | "chart">("widget");
  const [agentGoal, setAgentGoal] = useState("");
  const [ratio, setRatio] = useState<StageRatio>("16:10");
  const [backdrop, setBackdrop] = useState<StageBackdrop>("dotted");
  const [landed, setLanded] = useState<{ columns: ColumnMeta[]; rows: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { order, widgets, cleanedCols, rawCols, hasData, dims, usedCells, capacity, cleaned } =
    useBoardDerived(board, ratio);
  const { uploads, addUploads } = useUploads();

  const toggleTab = (t: DockTab) => {
    if (t === tab && panelOpen) {
      setPanelOpen(false);
    } else {
      setTab(t);
      setPanelOpen(true);
    }
  };

  const handleLoad = (source: "inline" | "file" | "sample", records: Record<string, string>[]) => {
    loadData(source, records);
    setLanded({ columns: inferColumns(records), rows: records.length });
    setTab("visualize");
  };

  const dropWidget = (targetId: string) => {
    if (dragId) {
      moveWidget(dragId, targetId);
      setDragId(null);
    }
  };

  const changeRatio = (r: StageRatio) => {
    setRatio(r);
    clampAllWidgets(BOARD_GRID[r].cols);
  };

  const panelContent =
    tab === "visualize" ? (
      <VisualsPanel
        columns={cleanedCols}
        hasData={hasData}
        builderMode={builderMode}
        onBuilderMode={setBuilderMode}
        uploads={uploads}
        onAddUploads={addUploads}
        backdrop={backdrop}
        onBackdrop={setBackdrop}
        ratio={ratio}
        onRatio={changeRatio}
        gridCols={dims.cols}
      />
    ) : (
      <TransformPanel rawCols={rawCols} hasData={hasData} />
    );

  const panel = (
    <motion.div
      key={tab}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {panelContent}
    </motion.div>
  );

  const showCanvas = hasData || order.length > 0;

  return (
    <CreateLayout
      title={board.title}
      onTitle={setTitle}
      tab={tab}
      onTab={toggleTab}
      panelOpen={panelOpen}
      panel={panel}
      agentPanel={<AgentPanel goal={agentGoal} onGoal={setAgentGoal} />}
    >
      {!showCanvas ? (
        <UploadPhase onLoad={handleLoad} />
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col px-1 pt-1">
          {selectedId === null && order.length > 0 && (
            <div className="flex shrink-0 items-center justify-center gap-1 pb-1.5">
              <span className="px-1 font-mono text-[11px] text-muted-foreground">Board · {ratio}</span>
              {(["dotted", "grid", "plain"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBackdrop(b)}
                  className={`rounded-md px-2 py-0.5 text-[11px] capitalize transition-colors ${
                    backdrop === b ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {b}
                </button>
              ))}
              <span className="px-1 font-mono text-[11px] text-muted-foreground">
                {usedCells}/{capacity}
              </span>
            </div>
          )}
          <Stage ratio={ratio} backdrop={backdrop}>
            {order.length === 0 ? (
              <div
                onClick={() => setSelectedId(null)}
                className="flex h-full flex-col items-center justify-center gap-2 text-center"
              >
                <p className="text-lg font-semibold">Canvas is empty</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add widgets or charts from the Visualize pane.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                onClick={() => setSelectedId(null)}
                style={{ gridTemplateColumns: `repeat(${dims.cols}, minmax(0, 1fr))` }}
                className="grid gap-3"
              >
                <AnimatePresence initial={false}>
                  {order.map((id) => {
                    const w = widgets[id];
                    if (!w) return null;
                    return (
                      <WidgetCard
                        key={id}
                        widget={w}
                        selected={selectedId === id}
                        onSelect={() => setSelectedId(id)}
                        onRemove={() => {
                          removeWidget(id);
                          setSelectedId(null);
                        }}
                        onDuplicate={() => duplicateWidget(id)}
                        onDragStart={setDragId}
                        onDrop={dropWidget}
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </Stage>
          <PageStrip
            ratio={ratio}
            onRatio={changeRatio}
            cleanedCount={cleaned.length}
            usedCells={usedCells}
            capacity={capacity}
          />
        </div>
      )}

      {landed && (
        <DataLandedModal
          columns={landed.columns}
          rows={landed.rows}
          onQuickClean={() => addStep("dropNulls", { column: "__all__" }, "Drop rows with any null")}
          onClose={() => setLanded(null)}
        />
      )}
    </CreateLayout>
  );
}
