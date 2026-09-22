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
 * Home sidebar as a floating island: branded header, icon nav,
 * theme toggle above the profile footer.
 */
export function HomeSidebar({ section, onSection }: HomeSidebarProps) {
  const user = useSession((s) => s.user);

  return (
    <aside
      aria-label="Home navigation"
      className="hidden w-60 shrink-0 flex-col rounded-2xl border bg-card shadow-md md:flex"
    >
      <Link
        to="/"
        aria-label="Microboard home"
        className="flex items-center gap-2 px-4 pt-4 pb-3"
      >
        <span className="font-display text-center w-full text-sm tracking-[0.2em]">MICROBOARD</span>
      </Link>

      <div className="px-3">
        <Link
          to={NEW_PATH}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
          Create New
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Home sections">
        {HOME_SECTIONS.filter((s) => s.id !== "profile").map((s) => {
          const Icon = SECTION_ICONS[s.id];
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSection(s.id)}
              title={s.blurb}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={Icon} size={17} strokeWidth={1.5} className={active ? "text-primary" : undefined} />
              {s.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-1.5 mx-3 mb-2">
        <span className="text-xs font-medium text-muted-foreground">Change Theme</span>
        <ThemeToggle />
      </div>

      {user && (
        <div className="border-t p-3">
          <button
            type="button"
            onClick={() => onSection("profile")}
            title="Open profile"
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
          >
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
            >
              {user.username.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.username}</span>
              <span className="block truncate font-mono text-[11px] text-muted-foreground">
                {profilePath(user.username)}
              </span>
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
