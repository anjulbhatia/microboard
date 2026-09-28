import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics01Icon,
  Database02Icon,
  HistoryIcon,
  Home01Icon,
  Mail01Icon,
  PlusSignIcon,
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
 * Home sidebar — static PowerBI-style nav. No collapse, no flyouts,
 * no recent list (Library owns boards). Brand, create, sections,
 * theme, user. Desktop only; mobile uses the header tab row.
 */
export function HomeSidebar({ section, onSection }: HomeSidebarProps) {
  const user = useSession((s) => s.user);
  const tabs = HOME_SECTIONS.filter((s) => s.id !== "profile");

  return (
    <aside
      aria-label="Home navigation"
      className="hidden w-52 shrink-0 flex-col rounded-2xl border bg-card shadow-sm md:flex"
    >
      <div className="flex h-12 items-center px-4">
        <Link to="/" aria-label="Microboard home" className="font-display text-xs tracking-[0.2em]">
          MICROBOARD
        </Link>
      </div>

      <div className="px-3">
        <Link
          to={NEW_PATH}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2.5} />
          Create New
        </Link>
      </div>

      <nav className="flex flex-col gap-px p-3" aria-label="Home sections">
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
              className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors ${
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

      <span className="flex-1" />

      <div className="mx-3 mb-2 flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>

      {user && (
        <div className="border-t p-2.5">
          <button
            type="button"
            onClick={() => onSection("profile")}
            title="Open profile"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
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
        </div>
      )}
    </aside>
  );
}
