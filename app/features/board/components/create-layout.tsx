import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { useSession } from "@/store/session";
import { LoginModal } from "@/features/auth";

const ShareMenu = lazy(() =>
  import("@/features/board/components/share-menu").then((m) => ({ default: m.ShareMenu }))
);

import type { CreateLayoutProps } from "@/features/board/types";

export function CreateLayout({ title, onTitle, panelOpen, onPanelToggle, panel, agentPanel, toolbar, children }: CreateLayoutProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user } = useSession();

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-12 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b px-3">
        <Link
          to="/"
          aria-label="Microboard home"
          className="rounded-md px-2 py-1 font-display text-base leading-none tracking-[0.2em] text-foreground transition-opacity hover:opacity-70"
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
            className="w-full truncate rounded-md bg-transparent py-1 pr-12 pl-1.5 text-left text-[13px] font-medium tracking-tight text-primary focus-visible:bg-muted focus-visible:outline-none"
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
            className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider transition-colors hover:bg-muted hover:text-foreground ${
              agentOpen ? "border-foreground/30 text-foreground" : "border-transparent text-muted-foreground"
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
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
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
            <Link
              to="/home"
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Home
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Log in / Sign up
            </button>
          )}
        </div>
      </header>
      {loginOpen && !user && (
        <LoginModal next="/new" onDone={() => setLoginOpen(false)} onClose={() => setLoginOpen(false)} />
      )}

      {toolbar}

      <div className="flex min-h-0 flex-1">
        <motion.aside
          initial={false}
          animate={panelOpen ? { width: 264, opacity: 1 } : { width: 44, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="h-full shrink-0 overflow-hidden border-r bg-background"
          aria-label="Tool sidebar"
        >
          {panelOpen ? (
            <div className="slim-scroll flex h-full w-66 flex-col overflow-y-auto">
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/60 pl-3 pr-1.5">
                <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  Toolbox
                </span>
                <button
                  type="button"
                  onClick={onPanelToggle}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <HugeiconsIcon icon={ChevronLeftIcon} size={14} strokeWidth={2} />
                </button>
              </div>
              <div className="min-h-0 flex-1">{panel}</div>
            </div>
          ) : (
            <div className="flex h-full w-11 flex-col items-center pt-2">
              <button
                type="button"
                onClick={onPanelToggle}
                aria-label="Expand sidebar"
                aria-expanded={false}
                title="Expand toolbox"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <HugeiconsIcon icon={ChevronRightIcon} size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>

        {agentOpen && (
          <aside className="slim-scroll flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-l bg-background p-3">
            {agentPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
