import { useState } from "react";
import { Link } from "react-router-dom";
import { useBoard } from "@/store/board";
import { useSession } from "@/store/session";
import { NEW_PATH, profilePath, type HomeSection } from "@/lib/routes";
import { HomeSidebar } from "@/features/home/home-sidebar";

/**
 * Home — logged-in SPA. Sections: library (board cards), data
 * (sources + transforms), mailing list, history, analytics, profile.
 * Convex collections (listByOwner) slot into Library next.
 */
export function HomePage() {
  const [section, setSection] = useState<HomeSection>("library");

  return (
    <div className="flex h-full min-h-0">
      <HomeSidebar section={section} onSection={setSection} />
      <div className="min-w-0 flex-1 overflow-y-auto border-l p-6">
        {section === "library" && <LibraryPanel />}
        {section === "data" && <DataPanel />}
        {section === "mailing" && <MailingPanel />}
        {section === "history" && <Placeholder title="History" body="Board versions and restores land here." />}
        {section === "analytics" && <Placeholder title="Analytics" body="Views and shares per board land here." />}
        {section === "profile" && <ProfilePanel />}
      </div>
    </div>
  );
}

function LibraryPanel() {
  const board = useBoard((s) => s.board);
  const widgets = Object.keys(board.pages[0]?.widgets ?? {}).length;
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Boards you created. Cloud sync via Convex lands next.</p>
      </div>
      <div className="rounded-lg border p-5">
        <p className="font-mono text-xs text-muted-foreground">CURRENT BOARD · v{board.version}</p>
        <p className="mt-1 text-lg font-semibold">{board.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {widgets} widgets · {board.steps.length} steps · {board.pages.length} pages
        </p>
        <div className="mt-4 flex gap-2">
          <Link to={NEW_PATH} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Open in editor
          </Link>
          <Link to="/showcase" className="rounded-md border px-4 py-2 text-sm">
            Showcase
          </Link>
        </div>
      </div>
    </div>
  );
}

function DataPanel() {
  const board = useBoard((s) => s.board);
  const cols = board.data.columns.map((c) => c.name);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sources and transforms on the current board.</p>
      </div>
      <div className="rounded-lg border p-5">
        <p className="font-mono text-xs text-muted-foreground">SOURCE</p>
        <p className="mt-1 text-sm font-medium">{board.data.source ?? "none yet — load data in the editor"}</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">COLUMNS · {cols.length}</p>
        <p className="mt-1 font-mono text-xs">{cols.length > 0 ? cols.join(", ") : "—"}</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">TRANSFORMS · {board.steps.length}</p>
        {board.steps.length > 0 ? (
          <ul className="mt-1 list-disc pl-5 text-sm">
            {board.steps.map((s) => (
              <li key={s.id}>{s.description}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No transforms yet.</p>
        )}
      </div>
    </div>
  );
}

function MailingPanel() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mailing List</h1>
        <p className="mt-1 text-sm text-muted-foreground">Subscribers for board drops. AgentMail send lands here.</p>
      </div>
      <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
        No subscribers yet. Add emails after AgentMail integration — 0 today.
      </div>
    </div>
  );
}

function ProfilePanel() {
  const user = useSession((s) => s.user);
  if (!user) return null;
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your internal config and public page.</p>
      </div>
      <div className="rounded-lg border p-5 text-sm">
        <p><span className="font-mono text-xs text-muted-foreground">USERNAME · </span>{user.username}</p>
        <p className="mt-1"><span className="font-mono text-xs text-muted-foreground">ID · </span><span className="font-mono text-xs">{user.id}</span></p>
        <Link to={profilePath(user.username)} className="mt-3 inline-block rounded-md border px-4 py-2 text-sm">
          View public profile
        </Link>
      </div>
    </div>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}
