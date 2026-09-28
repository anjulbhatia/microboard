import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { handleChatMessage, runInline, useAgentBoardApi, useWebMCP } from "@/features/agent";

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

  const api = useAgentBoardApi();
  const { supported: webmcp } = useWebMCP(api);

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
        <span className={webmcp ? "text-foreground" : ""} title={webmcp ? "External agents can call board tools via WebMCP" : "WebMCP bridge unavailable — chat still works"}>
          {webmcp ? " · webmcp" : ""}
        </span>
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
