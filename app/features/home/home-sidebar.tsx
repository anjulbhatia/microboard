import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics01Icon,
  Database02Icon,
  HistoryIcon,
  Home01Icon,
  Mail01Icon,
  PlusSignIcon,
  SidebarLeft01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HOME_SECTIONS, NEW_PATH, profilePath, type HomeSection } from "@/lib/routes";
import { useSession } from "@/store/session";
import { useBoard } from "@/store/board";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { timeAgo } from "@/shared/lib/time";
import { browserStorage, loadLibrary, parseBoard } from "@/features/library";

export const SECTION_ICONS: Record<HomeSection, typeof Home01Icon> = {
  home: Home01Icon,
  data: Database02Icon,
  mailing: Mail01Icon,
  history: HistoryIcon,
  analytics: Analytics01Icon,
  profile: UserIcon,
};

interface HomeSidebarProps {
  section: HomeSection;
  onSection: (s: HomeSection) => void;
}

function Flyout({ text, kbd }: { text: string; kbd?: string }) {
  return (
    <span className="absolute top-1/2 left-[calc(100%+12px)] z-50 hidden -translate-y-1/2 items-center gap-1.5 rounded-lg border bg-popover px-2.5 py-1 whitespace-nowrap shadow-md group-hover:flex animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
      <span className="text-xs font-medium">{text}</span>
      {kbd && (
        <span className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
          {kbd}
        </span>
      )}
    </span>
  );
}

/**
 * Home sidebar as a floating island: branded h-11 header, dense 30px
 * icon nav, recent boards with relative time, theme toggle, profile.
 * Collapses to an icon rail (Ctrl+.) with flyout tooltips.
 */
export function HomeSidebar({ section, onSection }: HomeSidebarProps) {
  const user = useSession((s) => s.user);
  const loadBoard = useBoard((s) => s.loadBoard);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const recent = useMemo(() => loadLibrary(browserStorage()).slice(0, 5), [section]);
  const tabs = HOME_SECTIONS.filter((s) => s.id !== "profile");

  const openRecent = (snapshot: string) => {
    try {
      loadBoard(parseBoard(snapshot));
      onSection("home");
    } catch {
      // Corrupt snapshot — list entry stays, board untouched.
    }
  };

  if (collapsed) {
    return (
      <aside
        aria-label="Home navigation collapsed"
        className="hidden w-14 shrink-0 flex-col items-center rounded-2xl border bg-card py-3 shadow-md md:flex"
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="group relative flex size-8 items-center justify-center rounded-[9px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} size={17} strokeWidth={1.5} />
          <Flyout text="Expand sidebar" kbd="Ctrl ." />
        </button>
        <Link
          to={NEW_PATH}
          aria-label="Create new board"
          className="group relative mt-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2.5} />
          <Flyout text="Create new board" />
        </Link>
        <nav className="mt-2 flex flex-col gap-[2px]" aria-label="Home sections">
          {tabs.map((s) => {
            const Icon = SECTION_ICONS[s.id];
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSection(s.id)}
                aria-label={s.label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex size-8 items-center justify-center rounded-[9px] transition-colors ${
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <HugeiconsIcon icon={Icon} size={17} strokeWidth={1.5} className={active ? "text-primary" : undefined} />
                <Flyout text={s.label} />
              </button>
            );
          })}
        </nav>
        <span className="flex-1" />
        {user && (
          <button
            type="button"
            onClick={() => onSection("profile")}
            aria-label="Open profile"
            className="group relative flex size-8 items-center justify-center rounded-full text-xs font-bold text-white transition-transform hover:scale-105"
            style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
          >
            {user.username.charAt(0).toUpperCase()}
            <Flyout text={user.username} />
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside
      aria-label="Home navigation"
      className="hidden w-50 shrink-0 flex-col rounded-2xl border bg-card shadow-md md:flex"
    >
      <div className="flex h-11 items-center justify-between px-3">
        <Link to="/" aria-label="Microboard home" className="font-display text-xs tracking-[0.2em]">
          MICROBOARD
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          className="group relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} size={15} strokeWidth={1.5} />
          <Flyout text="Collapse sidebar" kbd="Ctrl ." />
        </button>
      </div>

      <div className="px-3">
        <Link
          to={NEW_PATH}
          className="flex h-[30px] items-center justify-center gap-1.5 rounded-[9px] bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2.5} />
          Create New
        </Link>
      </div>

      <nav className="flex flex-col gap-[1px] overflow-y-auto p-3" aria-label="Home sections">
        {tabs.map((s) => {
          const Icon = SECTION_ICONS[s.id];
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSection(s.id)}
              title={s.blurb}
              aria-current={active ? "page" : undefined}
              className={`flex h-[30px] items-center gap-2.5 rounded-[9px] px-2.5 text-left text-[13px] tracking-tight transition-colors ${
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={Icon} size={16} strokeWidth={1.5} className={`shrink-0 ${active ? "text-primary" : ""}`} />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col px-3">
        <p className="px-2.5 font-semibold text-[11.5px] tracking-tight text-muted-foreground">
          Recent
        </p>
        {recent.length === 0 ? (
          <p className="px-2.5 py-1.5 text-xs text-muted-foreground">No saved boards</p>
        ) : (
          <ul className="no-scrollbar flex min-h-0 flex-col gap-[2px] overflow-y-auto pb-2">
            {recent.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => openRecent(b.snapshot)}
                  title={`Open ${b.title}`}
                  className="group flex w-full items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px] tracking-tight group-hover:text-foreground">
                    {b.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                    {timeAgo(b.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mx-3 mb-2 flex items-center justify-between rounded-[9px] bg-muted/60 px-2.5 py-1">
        <span className="text-xs font-medium text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>

      {user && (
        <div className="border-t p-2.5">
          <button
            type="button"
            onClick={() => onSection("profile")}
            title="Open profile"
            className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
            >
              {user.username.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium tracking-tight">{user.username}</span>
              <span className="block truncate font-mono text-[10.5px] text-muted-foreground">
                {profilePath(user.username)}
              </span>
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
