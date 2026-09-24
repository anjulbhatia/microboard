import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CreateLayout } from "@/features/board/components/create-layout";
import { ToolboxSidebar } from "@/features/board/components/toolbox";
import { Stage } from "@/features/board/components/stage";
import { WidgetCard } from "@/features/board/components/widget-card";
import { TransformPanel } from "@/features/board/components/panels";
import { ChatPanel } from "@/features/agent";
import { PageStrip } from "@/features/board/components/page-strip";
import { useBoard } from "@/store/board";
import { useBoardDerived } from "@/hooks/use-board-derived";
import type { RightTab } from "@/features/board/types";
import type { StageBackdrop } from "@/features/board/components/stage";

const RIGHT_TABS: { id: RightTab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "transform", label: "Transform" },
];

/**
 * Canvas. Create lands straight here — tools live in the left toolbox
 * (Elements, Charts, Uploads), Transform and Chat share the right dock.
 */
export function CreatePage() {
  const board = useBoard((s) => s.board);
  const {
    removeWidget, duplicateWidget, moveWidget,
    setTitle,
  } = useBoard();

  const [panelOpen, setPanelOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("chat");
  const [backdrop, setBackdrop] = useState<StageBackdrop>("dotted");
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { order, widgets, cleanedCols, rawCols, hasData, dims, usedCells, capacity, cleaned } =
    useBoardDerived(board);

  const dropWidget = (targetId: string) => {
    if (dragId) {
      moveWidget(dragId, targetId);
      setDragId(null);
    }
  };

  const agentPanel = (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-0.5 rounded-md bg-muted/50 p-0.5" role="tablist" aria-label="Right dock">
        {RIGHT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={rightTab === t.id}
            onClick={() => setRightTab(t.id)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              rightTab === t.id
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={rightTab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {rightTab === "chat" ? (
            <ChatPanel />
          ) : (
            <TransformPanel rawCols={rawCols} hasData={hasData} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <CreateLayout
      title={board.title}
      onTitle={setTitle}
      panelOpen={panelOpen}
      onPanelToggle={() => setPanelOpen((v) => !v)}
      panel={
        <ToolboxSidebar
          columns={cleanedCols}
          hasData={hasData}
          gridCols={dims.cols}
        />
      }
      agentPanel={agentPanel}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
          <Stage backdrop={backdrop}>
            {order.length === 0 ? (
              <div
                onClick={() => setSelectedId(null)}
                className="flex h-full flex-col items-center justify-center gap-2 text-center"
              >
                <p className="text-base font-medium">Canvas is empty</p>
                <p className="max-w-sm text-[13px] text-muted-foreground">
                  Add elements or charts from the toolbox.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                onClick={() => setSelectedId(null)}
                style={{ gridTemplateColumns: `repeat(${dims.cols}, minmax(0, 1fr))` }}
                className="grid gap-2"
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
            backdrop={backdrop}
            onBackdrop={setBackdrop}
          />
        </div>
    </CreateLayout>
  );
}
