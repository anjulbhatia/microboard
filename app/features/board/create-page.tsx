import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CreateLayout } from "@/features/board/components/create-layout";
import { Stage } from "@/features/board/components/stage";
import { WidgetCard } from "@/features/board/components/widget-card";
import { TransformPanel, VisualsPanel } from "@/features/board/components/panels";
import { ChatPanel } from "@/features/agent";
import { PageStrip } from "@/features/board/components/page-strip";
import { QuickAddBar } from "@/features/board/components/quick-add-bar";
import { useBoard } from "@/store/board";
import { useBoardDerived } from "@/hooks/use-board-derived";
import { useUploads } from "@/hooks/use-uploads";
import type { DockTab } from "@/features/board/types";
import type { StageBackdrop } from "@/features/board/components/stage";

/**
 * Canvas. Create lands straight here — no picker, no import gate.
 * Data arrives later via Data Sources; transforms live in the dock.
 */
export function CreatePage() {
  const board = useBoard((s) => s.board);
  const {
    removeWidget, duplicateWidget, moveWidget,
    setTitle,
  } = useBoard();

  const [tab, setTab] = useState<DockTab>("visualize");
  const [panelOpen, setPanelOpen] = useState(false);
  const [backdrop, setBackdrop] = useState<StageBackdrop>("dotted");
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { order, widgets, cleanedCols, rawCols, hasData, dims, usedCells, capacity, cleaned } =
    useBoardDerived(board);
  const { uploads, addUploads } = useUploads();

  const toggleTab = (t: DockTab) => {
    setTab(t);
    setPanelOpen(true);
  };

  const dropWidget = (targetId: string) => {
    if (dragId) {
      moveWidget(dragId, targetId);
      setDragId(null);
    }
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

  return (
    <CreateLayout
      title={board.title}
      onTitle={setTitle}
      tab={tab}
      onTab={toggleTab}
      panelOpen={panelOpen}
      onPanelToggle={() => setPanelOpen((v) => !v)}
      panel={panel}
      agentPanel={<ChatPanel />}
      toolbar={<QuickAddBar />}
    >
      <div className="relative flex min-h-0 flex-1 flex-col px-1 pt-1">
          {selectedId === null && order.length > 0 && (
            <div className="absolute top-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover px-2 py-1 shadow-xl ring-1 ring-border">
              <span className="px-1 font-mono text-[11px] text-muted-foreground">Board · 8×5</span>
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
          <Stage backdrop={backdrop}>
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
            cleanedCount={cleaned.length}
            usedCells={usedCells}
            capacity={capacity}
          />
        </div>
    </CreateLayout>
  );
}
