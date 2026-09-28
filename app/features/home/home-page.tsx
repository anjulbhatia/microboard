import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useSession } from "@/store/session";
import { HOME_SECTIONS, NEW_PATH, profilePath, type HomeSection } from "@/lib/routes";
import { HomeSidebar, SECTION_ICONS } from "@/features/home/home-sidebar";
import { LibraryPanel } from "@/features/library";
import { DataPanel } from "@/features/home/data-panel";
import { MailingPanel } from "@/features/home/mailing-panel";
import { HistoryPanel } from "@/features/home/history-panel";
import { AnalyticsPanel } from "@/features/home/analytics-panel";
import { Card, SectionHead } from "@/features/home/section";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/**
 * Home — logged-in SPA. Desktop gets the static sidebar; mobile gets
 * one sticky header (brand row + section tabs). No bottom tab bar,
 * no separate scroller block — one chrome block total on phones.
 */
export function HomePage() {
  const [section, setSection] = useState<HomeSection>("home");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-muted/40 p-3 md:flex-row">
      <MobileHeader section={section} onSection={setSection} />
      <HomeSidebar section={section} onSection={setSection} />
      <div className="min-w-0 flex-1 overflow-y-auto rounded-2xl border bg-card p-4 shadow-sm md:p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {section === "home" && <LibraryPanel />}
            {section === "data" && <DataPanel />}
            {section === "mailing" && <MailingPanel />}
            {section === "history" && <HistoryPanel />}
            {section === "analytics" && <AnalyticsPanel />}
            {section === "profile" && <ProfilePanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MobileHeader({ section, onSection }: { section: HomeSection; onSection: (s: HomeSection) => void }) {
  const user = useSession((s) => s.user);
  return (
    <div className="shrink-0 rounded-2xl border bg-card shadow-sm md:hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={1.5} className="text-primary" />
          <span className="font-display text-xs tracking-[0.2em]">MICROBOARD</span>
        </span>
        <span className="flex-1" />
        <Link
          to={NEW_PATH}
          aria-label="Create new board"
          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2.5} />
        </Link>
        <ThemeToggle />
        {user && (
          <button
            type="button"
            onClick={() => onSection("profile")}
            aria-label="Open profile"
            className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
          >
            {user.username.charAt(0).toUpperCase()}
          </button>
        )}
      </div>
      <div
        role="tablist"
        aria-label="Home sections"
        className="slim-scroll flex gap-1 overflow-x-auto border-t px-2 py-1.5"
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
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                active ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              <HugeiconsIcon icon={Icon} size={14} strokeWidth={1.5} className={active ? "text-primary" : undefined} />
              {s.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePanel() {
  const user = useSession((s) => s.user);
  const rename = useSession((s) => s.rename);
  const signOut = useSession((s) => s.signOut);
  const [name, setName] = useState(user?.username ?? "");
  const [editing, setEditing] = useState(false);
  if (!user) return null;
  const preview = profilePath(name.trim() || user.username);

  const save = () => {
    if (name.trim().length === 0) return;
    rename(name.trim());
    setEditing(false);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <SectionHead
        title={user.username}
        blurb={user.demo ? "Demo creator · link a real account anytime." : "Verified account."}
      />
      <Card>
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
          >
            {user.username.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold tracking-tight">{user.username}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">{preview}</p>
          </div>
        </div>

        {editing ? (
          <div className="mt-4 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              aria-label="Username"
              className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={save}
              disabled={name.trim().length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setName(user.username); setEditing(false); }}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Edit handle
            </button>
            <Link to={profilePath(user.username)} className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
              View public profile
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              Sign out
            </button>
          </div>
        )}
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">ID · {user.id}</p>
      </Card>
    </div>
  );
}
