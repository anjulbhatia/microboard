import { Suspense, lazy } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "@/store/session";
import { isBackendConfigured } from "@/lib/backend";
import { normalizeUsername } from "@/lib/routes";

// Codegen-backed boards — lazy so offline clones still build.
const ProfileLive = lazy(() =>
  import("@/features/profile/profile-live").then((m) => ({ default: m.ProfileLive }))
);

/**
 * Public user profile at /u/:username. Identifier is the username.
 * Backend live: public boards resolve via api.users.profileBoards.
 * Demo: resolves the signed-in user by username; anyone else shows the
 * empty state.
 */
export function PublicProfilePage() {
  const { username = "" } = useParams<{ username: string }>();
  const me = useSession((s) => s.user);
  const slug = normalizeUsername(username);
  const isMine = me !== null && me.username === slug;
  const live = isBackendConfigured() ? (
    <Suspense fallback={<p className="font-mono text-xs text-muted-foreground">Loading public boards…</p>}>
      <ProfileLive username={slug} />
    </Suspense>
  ) : null;

  if (!isMine) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 p-8">
        <p className="font-mono text-xs text-muted-foreground">USER · /u/{slug}</p>
        <h1 className="text-2xl font-bold tracking-tight">No public boards yet</h1>
        <p className="text-sm text-muted-foreground">
          Nothing published under this name. Public Convex lookup lands here.
        </p>
        {live}
        <Link to="/showcase" className="mt-2 w-fit rounded-md border px-4 py-2 text-sm">
          Browse showcase
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <p className="font-mono text-xs text-muted-foreground">USER · /u/{me.username}</p>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: `hsl(${me.hue} 55% 42%)` }}
        >
          {me.username.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{me.username}</h1>
          <p className="text-sm text-muted-foreground">{me.demo ? "Demo creator" : "Creator"}</p>
        </div>
      </div>
      {live ?? (
        <div className="rounded-lg border p-5 text-sm text-muted-foreground">
          Public boards for this profile land here (Convex: boards by ownerId where showcase is true).
        </div>
      )}
    </div>
  );
}
