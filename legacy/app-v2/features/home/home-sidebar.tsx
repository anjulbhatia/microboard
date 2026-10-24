import { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics01Icon,
  Database02Icon,
  HistoryIcon,
  Home01Icon,
  Mail01Icon,
  PlusSignIcon,
  Search01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HOME_SECTIONS, NEW_PATH, profilePath, type HomeSection } from "@/lib/routes";
import { useSession } from "@/store/session";
import { ThemeToggle } from "@/shared/components/theme-toggle";

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

/**
 * Home sidebar v2 — fresh build. Workspace header, filterable nav,
 * quiet footer. No collapse, no flyouts, no recents (Library owns them).
 */
export function HomeSidebar({ section, onSection }: HomeSidebarProps) {
  const user = useSession((s) => s.user);
  const [filter, setFilter] = useState("");
  const tabs = HOME_SECTIONS.filter((s) => s.id !== "profile").filter((s) =>
    s.label.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <aside
      aria-label="Home navigation"
      className="hidden w-60 shrink-0 flex-col rounded-2xl border bg-card md:flex"
    >
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          {user ? user.username.charAt(0).toUpperCase() : "M"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold tracking-tight">
            {user?.username ?? "Workspace"}
          </p>
          <Link to="/" className="font-display text-[10px] tracking-[0.2em] text-muted-foreground hover:text-foreground">
            MICROBOARD
          </Link>
        </div>
      </div>

      <div className="px-3 pt-3">
        <Link
          to={NEW_PATH}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2.5} />
          New board
        </Link>
      </div>

      <div className="px-3 pt-3">
        <label className="flex h-9 items-center gap-2 rounded-xl bg-muted/60 px-3 transition-colors focus-within:bg-muted">
          <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter sections"
            aria-label="Filter sections"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <nav className="flex flex-col gap-0.5 p-3" aria-label="Home sections">
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
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors ${
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={Icon}
                size={16}
                strokeWidth={1.5}
                className={`shrink-0 ${active ? "text-primary" : "group-hover:text-foreground"}`}
              />
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              {active && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
            </button>
          );
        })}
        {tabs.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">No sections match.</p>
        )}
      </nav>

      <span className="flex-1" />

      <div className="border-t p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        {user && (
          <button
            type="button"
            onClick={() => onSection("profile")}
            title="Open profile"
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/50"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
            >
              {user.username.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{user.username}</span>
              <span className="block truncate font-mono text-[10.5px] text-muted-foreground">
                {profilePath(user.username)}
              </span>
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
