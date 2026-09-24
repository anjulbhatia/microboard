import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/store/board";
import { WIDGET_REGISTRY, clampSpan } from "@/features/widgets/registry";
import { BOARD_GRID } from "@/features/board/types";
import { applySteps, inferColumns } from "@/features/data/lib/data-utils";
import { csvRecords } from "@/features/data/providers/csv";
import { SAMPLE_CSV } from "@/features/data/lib/data-utils";
import { handleChatMessage, runInline, type AgentBoardApi, type ChartKind } from "@/features/agent";
import type { StepType } from "@/features/board/types";

interface Message {
  role: "user" | "agent";
  text: string;
}

/**
 * In-app chat on the canvas. Rule-based local agent over the same
 * semantics WebMCP exposes; inline `*_data` commands run for real.
 */
export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "I work the board with you. Say `help`, or ask for data, a clean, or a chart." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const api: AgentBoardApi = {
    columns: () => {
      const b = useBoard.getState().board;
      return inferColumns(applySteps(b.data.raw, b.steps)).map((c) => c.name);
    },
    hasData: () => useBoard.getState().board.data.raw.length > 0,
    loadSample: () => useBoard.getState().loadData("sample", csvRecords(SAMPLE_CSV)),
    addStep: (type: StepType, params, description) =>
      useBoard.getState().addStep(type, params, description),
    addChart: (kind: ChartKind, x, y) => {
      const meta = WIDGET_REGISTRY[kind];
      const span = clampSpan(kind, meta.defaultSpan, BOARD_GRID.cols);
      useBoard.getState().addWidget({
        type: kind,
        title: `${meta.label} · ${y}`,
        dataX: x,
        dataY: y,
        x,
        y,
        w: span.w,
        h: span.h,
        props: { ...meta.defaults.props },
      });
    },
    summary: () => {
      const b = useBoard.getState().board;
      const cleaned = applySteps(b.data.raw, b.steps);
      const cols = inferColumns(cleaned).map((c) => c.name);
      return `${cleaned.length} rows · ${cols.length} cols (${cols.join(", ")}) · ${b.steps.length} steps.`;
    },
    state: () => {
      const b = useBoard.getState().board;
      const cleaned = applySteps(b.data.raw, b.steps);
      const cols = inferColumns(cleaned).map((c) => c.name);
      const page = b.pages.find((p) => p.id === b.activePageId) ?? b.pages[0];
      const widgets = page ? Object.keys(page.widgets).length : 0;
      return { title: b.title, version: b.version, steps: b.steps.length, widgets, columns: cols };
    },
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      const reply = handleChatMessage(text, api);
      if (reply.text.startsWith("INLINE ")) {
        const ds = await runInline(reply.text.slice("INLINE ".length));
        setMessages((m) => [
          ...m,
          { role: "agent", text: `Ran it: ${ds.columns.length} columns, ${ds.rows.length} rows.` },
        ]);
      } else {
        setMessages((m) => [...m, { role: "agent", text: reply.text }]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "agent", text: e instanceof Error ? e.message : "That failed." },
      ]);
    } finally {
      setBusy(false);
      boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Agent chat
      </h2>
      <div ref={boxRef} className="chat-scroll flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-2.5 py-1.5 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-150 ${
              m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted"
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && <p className="font-mono text-[11px] text-muted-foreground">Working…</p>}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          placeholder="chart signups by channel…"
          aria-label="Ask the agent"
          className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-xs focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="rounded-md bg-primary px-2.5 text-primary-foreground disabled:opacity-50"
        >
          <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
