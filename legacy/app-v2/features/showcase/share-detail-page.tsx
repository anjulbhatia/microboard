import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, Bookmark01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { useSession } from "@/store/session";
import { api } from "../../../convex/_generated/api";

/**
 * Shared board detail: meta, like/save, comments. Records a view on open.
 * Snapshot rendering (full board replay) slots in next.
 */
export function ShareDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const user = useSession((s) => s.user);
  const detail = useQuery(api.showcase.boardDetail, { publicId: id, userKey: user?.id });
  const recordView = useMutation(api.boards.recordView);
  const toggleLike = useMutation(api.boards.toggleLike);
  const toggleSave = useMutation(api.boards.toggleSave);
  const addComment = useMutation(api.boards.addComment);
  const removeComment = useMutation(api.boards.removeComment);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) void recordView({ publicId: id }).catch(() => {});
  }, [id, recordView]);

  if (detail === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-24 pb-12" aria-label="Loading shared board">
        <div className="shimmer h-48 rounded-2xl" />
        <div className="shimmer h-40 rounded-2xl" />
      </div>
    );
  }
  if (detail === null) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Board not found</h1>
        <p className="text-sm text-muted-foreground">The link is wrong or the board was removed.</p>
        <Link to="/showcase" className="mt-2 rounded-md border px-4 py-2 text-sm">Browse showcase</Link>
      </div>
    );
  }

  const { board, author, comments, liked, saved } = detail;

  const send = async () => {
    if (!user || !text.trim()) return;
    setError("");
    try {
      await addComment({ publicId: id, userKey: user.id, username: user.username, text: text.trim() });
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comment failed.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-24 pb-12">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="font-mono text-[11px] text-muted-foreground">SHARED BOARD · @{author}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{board.title}</h1>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          v{board.version} · {board.viewCount ?? 0} views
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1 text-sm">
          <button
            type="button"
            disabled={!user}
            onClick={() => void toggleLike({ publicId: id, userKey: user?.id }).catch(() => {})}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all hover:scale-105 hover:bg-muted active:scale-95 ${liked ? "text-primary" : ""}`}
          >
            <HugeiconsIcon icon={FavouriteIcon} size={16} strokeWidth={1.5} />
            {board.likeCount ?? 0}
          </button>
          <button
            type="button"
            disabled={!user}
            onClick={() => void toggleSave({ publicId: id, userKey: user?.id }).catch(() => {})}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all hover:scale-105 hover:bg-muted active:scale-95 ${saved ? "text-primary" : ""}`}
          >
            <HugeiconsIcon icon={Bookmark01Icon} size={16} strokeWidth={1.5} />
            {board.saveCount ?? 0}
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(window.location.href).catch(() => {})}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all hover:scale-105 hover:bg-muted active:scale-95"
          >
            <HugeiconsIcon icon={Share01Icon} size={16} strokeWidth={1.5} />
            Copy link
          </button>
          {!user && <span className="ml-auto text-xs text-muted-foreground">Sign in to like, save, comment.</span>}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold">Comments · {comments.length}</p>
        {user ? (
          <div className="mt-2 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Add a comment…"
              maxLength={500}
              aria-label="Add a comment"
              className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!text.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Post
            </button>
          </div>
        ) : null}
        {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
        <ul className="mt-3 flex flex-col gap-2">
          {comments.map((c) => (
            <li key={c._id} className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <p className="font-mono text-[11px] text-muted-foreground">
                @{c.username ?? "anon"} · {new Date(c.createdAt).toLocaleString()}
              </p>
              <p className="mt-0.5">{c.text}</p>
              {user && (c.userKey === user.id) && (
                <button
                  type="button"
                  onClick={() => void removeComment({ commentId: c._id, userKey: user.id }).catch(() => {})}
                  className="mt-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
