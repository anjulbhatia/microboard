import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { useSession } from "@/lib/session";

const ShareMenu = lazy(() =>
  import("@/components/canvas/ShareMenu").then((m) => ({ default: m.ShareMenu }))
);

import type { CreateLayoutProps, DockTab } from "@/app/create/interface";

const TABS: { id: DockTab; label: string }[] = [
  { id: "visualize", label: "Visualize" },
  { id: "transform", label: "Transform" },
];

export function CreateLayout({ title, onTitle, tab, onTab, panelOpen, onPanelToggle, panel, agentPanel, toolbar, children }: CreateLayoutProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { user, signOut } = useSession();

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 flex-wrap items-baseline gap-x-2 gap-y-1 bg-card px-2 py-1.5">
        <Link
          to="/"
          aria-label="Microboard home"
          className="rounded-md px-2 py-1 font-display text-lg leading-none tracking-[0.2em] text-foreground transition-opacity hover:opacity-70"
        >
          MICROBOARD
        </Link>

        <div className="group relative ml-2 w-44 shrink-0">
          <input
            ref={nameRef}
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-label="Visualisation name"
            placeholder="Untitled Board"
            className="w-full truncate rounded-md bg-transparent py-1 pr-12 pl-1.5 text-left text-sm font-medium text-primary focus-visible:bg-muted focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => nameRef.current?.focus()}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 text-xs font-light tracking-wide text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
          >
            rename
          </button>
        </div>

        <div className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAgentOpen((v) => !v)}
            aria-label="Toggle agent panel"
            title="Agent inputs"
            className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wider transition-colors hover:bg-muted hover:text-foreground ${
              agentOpen ? "border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            WEBMCP
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShareOpen((v) => !v)}
              aria-label="Share"
              aria-expanded={shareOpen}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <HugeiconsIcon icon={Share01Icon} size={16} strokeWidth={1.5} />
              Share
            </button>
            {shareOpen && (
              <div className="absolute top-full right-0 z-30 mt-2">
                <Suspense
                  fallback={
                    <div className="rounded-xl border bg-popover px-4 py-3 font-mono text-xs text-muted-foreground shadow-xl">
                      Loading…
                    </div>
                  }
                >
                  <ShareMenu onClose={() => setShareOpen(false)} />
                </Suspense>
              </div>
            )}
          </div>
          {user ? (
            <button
              type="button"
              onClick={signOut}
              title={`${user.name} — sign out`}
              aria-label="Profile — sign out"
              className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: `hsl(${user.hue} 55% 42%)` }}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          ) : null}
        </div>
      </header>

      {toolbar}

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <div className="relative shrink-0">
          <motion.aside
            initial={false}
            animate={panelOpen ? { width: 288, opacity: 1 } : { width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="h-full overflow-hidden"
            aria-label="Tool sidebar"
          >
            <div className="slim-scroll flex h-full w-72 flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-3 shadow-md">
              <div className="grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Tool pane">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => onTab(t.id)}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                      tab === t.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {panel}
            </div>
          </motion.aside>
          <button
            type="button"
            onClick={onPanelToggle}
            aria-label={panelOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={panelOpen}
            title={panelOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="absolute top-16 -right-3 z-10 flex size-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-md transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={panelOpen ? ChevronLeftIcon : ChevronRightIcon} size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>

        {agentOpen && (
          <aside className="slim-scroll flex w-64 shrink-0 flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-3 shadow-sm">
            {agentPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
