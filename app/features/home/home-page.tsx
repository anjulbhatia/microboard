import { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, PlusSignIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useSession } from "@/store/session";
import { HOME_SECTIONS, NEW_PATH, profilePath, type HomeSection } from "@/lib/routes";
import { HomeSidebar, SECTION_ICONS } from "@/features/home/home-sidebar";
import { LibraryPanel } from "@/features/library";
import { DataPanel } from "@/features/home/data-panel";
import { MailingPanel } from "@/features/home/mailing-panel";
import { HistoryPanel } from "@/features/home/history-panel";
import { AnalyticsPanel } from "@/features/home/analytics-panel";
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
        {section === "history" && <HistoryPanel />}
        {section === "analytics" && <AnalyticsPanel />}
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

function ProfilePanel() {
  const user = useSession((s) => s.user);
  const rename = useSession((s) => s.rename);
  const signOut = useSession((s) => s.signOut);
  const [name, setName] = useState(user?.username ?? "");
  if (!user) return null;
  const preview = profilePath(name || user.username);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your internal config and public page.</p>
      </div>
      <div className="rounded-lg border p-5 text-sm">
        <p><span className="font-mono text-xs text-muted-foreground">ID · </span><span className="font-mono text-xs">{user.id}</span></p>
        <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="profile-username">
          Username — public page {preview}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="profile-username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => rename(name)}
            disabled={name.trim().length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Save
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to={profilePath(user.username)} className="rounded-md border px-4 py-2 text-sm">
            View public profile
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
