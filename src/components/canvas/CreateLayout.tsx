import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BotIcon,
  ChartColumnIcon,
  CleanIcon,
  FullScreenIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import type { CreateLayoutProps, DockTab } from "@/app/create/interface";

const DOCK_ITEMS: { id: DockTab; label: string; icon: typeof ChartColumnIcon }[] = [
  { id: "visualize", label: "Visualize", icon: ChartColumnIcon },
  { id: "transform", label: "Transform", icon: CleanIcon },
];

export function CreateLayout({ title, onTitle, tab, onTab, panelOpen, panel, agentPanel, children }: CreateLayoutProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void shellRef.current?.requestFullscreen();
    }
  };

  const iconBtn =
    "flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div ref={shellRef} className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-card px-2 py-1.5">
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
            placeholder="Untitled visualisation"
            className="w-full truncate rounded-md bg-transparent py-1 pr-12 pl-1.5 text-left text-sm font-semibold focus-visible:bg-muted focus-visible:outline-none"
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
          <button type="button" className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
            Export
          </button>
          <button type="button" className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Share
          </button>
          <button
            type="button"
            onClick={() => setAgentOpen((v) => !v)}
            aria-label="Toggle agent panel"
            title="Agent inputs"
            className={`${iconBtn} ${agentOpen ? "border-primary text-foreground" : ""}`}
          >
            <HugeiconsIcon icon={BotIcon} size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className={iconBtn}
          >
            <HugeiconsIcon icon={FullScreenIcon} size={16} strokeWidth={1.5} />
          </button>
          <button type="button" title="Sign in (soon)" className={`${iconBtn} gap-1 px-2`}>
            <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={1.5} />
            <span className="hidden text-xs font-medium lg:inline">Sign in</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <nav
            aria-label="Tools"
            className="absolute top-2 left-2 z-20 flex flex-col items-center gap-1 rounded-2xl border bg-card p-1.5 shadow-md"
          >
            {DOCK_ITEMS.map((item) => {
              const active = tab === item.id && panelOpen;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTab(item.id)}
                  aria-label={item.label}
                  aria-expanded={active}
                  className={`group relative flex size-10 items-center justify-center rounded-xl transition-colors ${
                    active ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      className="absolute inset-0 rounded-xl bg-primary shadow"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <HugeiconsIcon icon={item.icon} size={19} strokeWidth={1.5} className="relative" />
                  <span className="pointer-events-none absolute left-full ml-3 hidden rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow group-hover:block">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <motion.aside
            initial={false}
            animate={panelOpen ? { width: 288, opacity: 1 } : { width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute top-2 bottom-2 left-16 z-20 overflow-hidden"
          >
            <div className="slim-scroll flex h-full w-72 flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-3 shadow-md">
              {panel}
            </div>
          </motion.aside>

          {children}
        </div>

        {agentOpen && (
          <aside className="slim-scroll flex w-64 shrink-0 flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-3 shadow-sm">
            {agentPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
