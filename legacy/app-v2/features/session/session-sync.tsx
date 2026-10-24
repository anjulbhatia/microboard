import { useEffect } from "react";
import { useMutation } from "convex/react";
import { browserSessionId, useSession } from "@/store/session";
import { useBoard } from "@/store/board";
// Static codegen import is safe here: this module loads only through
// ConvexShell, which mounts solely when VITE_CONVEX_URL is set.
import { api } from "../../../convex/_generated/api";

const HEARTBEAT_MS = 30_000;

/**
 * SessionSync — acknowledges the local session with the Convex backend.
 * Heartbeats sessionId + userKey + open board; the server upserts the
 * sessions row and returns server time, stored as useSession.ack.
 * Renders nothing. No user, no heartbeat.
 */
export function SessionSync() {
  const user = useSession((s) => s.user);
  const setAck = useSession((s) => s.setAck);
  const boardPublicId = useBoard((s) => s.board.id);
  const heartbeat = useMutation(api.sessions.heartbeat);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const sessionId = browserSessionId();
    const beat = async () => {
      try {
        const res = await heartbeat({
          sessionId,
          userKey: user.id,
          username: user.username,
          boardPublicId,
        });
        if (alive) setAck(res.serverTime);
      } catch {
        // Offline/backend down — next beat retries. Ack keeps last value.
      }
    };
    void beat();
    const timer = setInterval(() => void beat(), HEARTBEAT_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user, boardPublicId, heartbeat, setAck]);

  return null;
}
