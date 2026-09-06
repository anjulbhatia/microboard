import { lazy, Suspense, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CreateLayout } from "@/features/board/components/create-layout";
import { UploadPhase } from "@/features/board/components/upload-phase";

const TransformPhase = lazy(() =>
  import("@/features/board/components/transform-phase").then((m) => ({ default: m.TransformPhase }))
);
import { Stage } from "@/features/board/components/stage";
import { WidgetCard } from "@/features/board/components/widget-card";
import { AgentPanel, TransformPanel, VisualsPanel } from "@/features/board/components/panels";
import { PageStrip } from "@/features/board/components/page-strip";
import { QuickAddBar } from "@/features/board/components/quick-add-bar";
import { useBoard } from "@/app/store/board";
import { useBoardDerived } from "@/app/hooks/use-board-derived";
import { useUploads } from "@/app/hooks/use-uploads";
import type { DockTab } from "@/features/board/types";
import { BOARD_GRID } from "@/features/board/types";
import type { StageBackdrop, StageRatio } from "@/features/board/components/stage";

export function CreatePage() {
  const board = useBoard((s) => s.board);
  const {
    loadData, removeWidget, duplicateWidget, moveWidget,
    clampAllWidgets, setTitle,
  } = useBoard();

  const [tab, setTab] = useState<DockTab>("visualize");
  const [panelOpen, setPanelOpen] = useState(false);
  const [agentGoal, setAgentGoal] = useState("");
  const [ratio, setRatio] = useState<StageRatio>("16:10");
  const [backdrop, setBackdrop] = useState<StageBackdrop>("dotted");
  const [phase, setPhase] = useState<"load" | "transform" | "canvas">("load");
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { order, widgets, cleanedCols, rawCols, hasData, dims, usedCells, capacity, cleaned } =
    useBoardDerived(board, ratio);
  const { uploads, addUploads } = useUploads();

  const toggleTab = (t: DockTab) => {
    setTab(t);
    setPanelOpen(true);
  };

  const handleLoad = (source: "inline" | "file" | "sample", records: Record<string, string>[]) => {
    loadData(source, records);
    setPhase("transform");
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
        uploads={uploads}
        onAddUploads={addUploads}
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

  if (phase === "load" || (phase === "transform" && !hasData)) {
    return <UploadPhase onLoad={handleLoad} />;
  }

  if (phase === "transform") {
    return (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            Loading transform…
          </div>
        }
      >
        <TransformPhase onDone={() => setPhase("canvas")} onBack={() => setPhase("load")} />
      </Suspense>
    );
  }

  return (
    <CreateLayout
      title={board.title}
      onTitle={setTitle}
      tab={tab}
      onTab={toggleTab}
      panelOpen={panelOpen}
      onPanelToggle={() => setPanelOpen((v) => !v)}
      panel={panel}
      agentPanel={<AgentPanel goal={agentGoal} onGoal={setAgentGoal} />}
      toolbar={<QuickAddBar />}
    >
      <div className="relative flex min-h-0 flex-1 flex-col px-1 pt-1">
          {selectedId === null && order.length > 0 && (
            <div className="absolute top-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover px-2 py-1 shadow-xl ring-1 ring-border">
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
    </CreateLayout>
  );
}
