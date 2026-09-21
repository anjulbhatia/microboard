import { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, PlusSignIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/store/board";
import { useSession } from "@/store/session";
import { HOME_SECTIONS, NEW_PATH, profilePath, type HomeSection } from "@/lib/routes";
import { HomeSidebar, SECTION_ICONS } from "@/features/home/home-sidebar";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/**
 * Home — logged-in SPA. Sections: library (board cards), data sources
 * (sources + integrations + transforms), mailing list, history,
 * analytics, profile. Convex collections (listByOwner) slot into Library.
 *
 * Responsive: desktop gets the island sidebar; phones get a top island
 * bar (brand, new, theme, avatar) plus a bottom island tab bar.
 */
export function HomePage() {
  const [section, setSection] = useState<HomeSection>("library");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-muted/40 p-3 md:flex-row">
      <MobileTopBar onHome={() => setSection("library")} />
      <HomeSidebar section={section} onSection={setSection} />
      <MobileSectionTabs section={section} onSection={setSection} />
      <div className="min-w-0 flex-1 overflow-y-auto rounded-2xl border bg-card p-4 shadow-sm md:p-6">
        {section === "library" && <LibraryPanel />}
        {section === "data" && <DataPanel />}
        {section === "mailing" && <MailingPanel />}
        {section === "history" && <Placeholder title="History" body="Board versions and restores land here." />}
        {section === "analytics" && <Placeholder title="Analytics" body="Views and shares per board land here." />}
        {section === "profile" && <ProfilePanel />}
      </div>
      <MobileTabBar onHome={() => setSection("library")} onProfile={() => setSection("profile")} />
    </div>
  );
}

function MobileTopBar({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-2xl border bg-card px-3 py-2 shadow-sm md:hidden">
      <button
        type="button"
        onClick={onHome}
        aria-label="Microboard home"
        className="flex items-center gap-1.5"
      >
        <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={1.5} className="text-primary" />
        <span className="font-display text-xs tracking-[0.2em]">MICROBOARD</span>
      </button>
      <span className="flex-1" />
      <ThemeToggle />
    </div>
  );
}

/** Section tabs under the header: Library, Data Sources, Mailing, History, Stats. */
function MobileSectionTabs({ section, onSection }: { section: HomeSection; onSection: (s: HomeSection) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Home sections"
      className="slim-scroll flex shrink-0 gap-1.5 overflow-x-auto rounded-2xl border bg-card p-2 shadow-sm md:hidden"
    >
      {HOME_SECTIONS.filter((s) => s.id !== "profile").map((s) => {
        const Icon = SECTION_ICONS[s.id];
        const active = section === s.id;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSection(s.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            <HugeiconsIcon icon={Icon} size={15} strokeWidth={1.5} className={active ? "text-primary" : undefined} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** Main bottom navbar: Home, Create, User Profile. */
function MobileTabBar({ onHome, onProfile }: { onHome: () => void; onProfile: () => void }) {
  const user = useSession((s) => s.user);
  return (
    <nav
      aria-label="Main navigation"
      className="grid shrink-0 grid-cols-3 gap-0.5 rounded-2xl border bg-card p-2 shadow-md md:hidden"
    >
      <button
        type="button"
        onClick={onHome}
        aria-label="Home"
        className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] text-muted-foreground"
      >
        <HugeiconsIcon icon={Home01Icon} size={20} strokeWidth={1.5} />
        Home
      </button>
      <Link
        to={NEW_PATH}
        aria-label="Create new board"
        className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] text-muted-foreground"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2.5} />
        </span>
        Create
      </Link>
      <button
        type="button"
        onClick={onProfile}
        aria-label="User profile"
        className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] text-muted-foreground"
      >
        {user ? (
          <span
            aria-hidden
            className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
          >
            {user.username.charAt(0).toUpperCase()}
          </span>
        ) : null}
        Profile
      </button>
    </nav>
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
        <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sources, integrations, and everything data on the current board.</p>
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
