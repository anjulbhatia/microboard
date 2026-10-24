import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, Bookmark01Icon, Comment01Icon } from "@hugeicons/core-free-icons";
import { useSession } from "@/store/session";
import { api } from "../../../convex/_generated/api";
import type { FeedItem } from "../../../convex/showcase";

/**
 * Showcase feed — live from Convex. Like/save need a session (demo ok).
 */
export function ShowcasePage() {
  const user = useSession((s) => s.user);
  const feed = useQuery(api.showcase.feed, { limit: 24, userKey: user?.id });
  const toggleLike = useMutation(api.boards.toggleLike);
  const toggleSave = useMutation(api.boards.toggleSave);

  if (feed === undefined) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-12" aria-label="Loading showcase">
        <div className="shimmer h-8 w-48 rounded-lg" />
        <div className="shimmer mt-2 h-4 w-72 rounded-md" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 pt-28 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Showcase</h1>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Nothing showcased yet. Publish a board from the editor and flip it to showcase.
        </p>
        <Link to="/new" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Create a board
        </Link>
      </div>
    );
  }

  const act = (fn: () => Promise<unknown>) => {
    if (!user) return;
    void fn().catch(() => {});
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-24 pb-12">
      <h1 className="text-3xl font-bold tracking-tight">Showcase</h1>
      <p className="mt-1 text-sm text-muted-foreground">Boards people shared. Like, save, comment.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {feed.map((b: FeedItem) => (
          <li key={b.publicId} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm">
            <Link to={`/share/${b.publicId}`} className="min-w-0">
              <p className="truncate text-base font-semibold hover:underline">{b.title}</p>
            </Link>
            <p className="font-mono text-[11px] text-muted-foreground">
              @{b.author} · v{b.version}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <button
                type="button"
                disabled={!user}
                title={user ? "Like" : "Sign in to like"}
                onClick={() => act(() => toggleLike({ publicId: b.publicId, userKey: user?.id })) }
                className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all hover:scale-105 hover:bg-muted active:scale-95 ${b.liked ? "text-primary" : ""}`}
              >
                <HugeiconsIcon icon={FavouriteIcon} size={15} strokeWidth={1.5} />
                {b.likeCount}
              </button>
              <button
                type="button"
                disabled={!user}
                title={user ? "Save" : "Sign in to save"}
                onClick={() => act(() => toggleSave({ publicId: b.publicId, userKey: user?.id }))}
                className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all hover:scale-105 hover:bg-muted active:scale-95 ${b.saved ? "text-primary" : ""}`}
              >
                <HugeiconsIcon icon={Bookmark01Icon} size={15} strokeWidth={1.5} />
                {b.saveCount}
              </button>
              <Link
                to={`/share/${b.publicId}`}
                className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted"
              >
                <HugeiconsIcon icon={Comment01Icon} size={15} strokeWidth={1.5} />
                {b.commentCount}
              </Link>
              <span className="ml-auto font-mono text-[10px]">{b.viewCount} views</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
