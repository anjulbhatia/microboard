import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
// Static codegen import is safe here: this module loads only through a
// lazy() boundary rendered when VITE_CONVEX_URL is set (see public-profile-page).
import { api } from "../../../convex/_generated/api";

/**
 * Live public boards for /u/:username, backed by api.users.profileBoards.
 * Null (unknown user / still loading handled by parent) renders nothing —
 * the parent's empty state stands.
 */
export function ProfileLive({ username }: { username: string }) {
  const data = useQuery(api.users.profileBoards, { username });
  if (data === undefined) {
    return <p className="font-mono text-xs text-muted-foreground">Loading public boards…</p>;
  }
  if (!data || data.boards.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
        Public boards · {data.boards.length}
      </h2>
      <ul className="grid gap-2">
        {data.boards.map((b) => (
          <li key={b.publicId}>
            <Link
              to={`/share/${b.publicId}`}
              className="flex items-baseline justify-between gap-4 rounded-lg border px-4 py-2.5 transition-colors hover:bg-muted/40"
            >
              <span className="truncate text-sm font-medium">{b.title}</span>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                ♥ {b.likeCount} · ✎ {b.commentCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
