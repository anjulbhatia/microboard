import { useState } from "react";
import { useAction } from "convex/react";
import { useBoard } from "@/store/board";
import { useSession } from "@/store/session";
import { api } from "../../../convex/_generated/api";

/**
 * Send-to-list panel (lazy: codegen import). Mails the public board link
 * to every subscriber through the owner's AgentMail inbox.
 */
export function SendToSubscribers() {
  const board = useBoard((s) => s.board);
  const user = useSession((s) => s.user);
  const sendBoardLink = useAction(api.mailing.sendBoardLink);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const send = async () => {
    setState("sending");
    setMessage("");
    try {
      const res = await sendBoardLink({
        ownerId: user?.id,
        boardPublicId: board.id,
        boardTitle: board.title,
      });
      setState("done");
      setMessage(`Sent to ${res.sent} subscriber${res.sent === 1 ? "" : "s"}.`);
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Send failed.");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void send()}
        disabled={state === "sending"}
        className="w-full rounded-md border px-2 py-2 text-center text-xs font-semibold tracking-widest uppercase transition-colors hover:bg-muted disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send to subscriber list"}
      </button>
      {message && (
        <p className={`px-2 pt-1 font-mono text-[11px] ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
