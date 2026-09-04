import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BotIcon,
  ChartColumnIcon,
  CleanIcon,
  FullScreenIcon,
  PenTool02Icon,
  Tick02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export type DockTab = "visualize" | "transform";

const DOCK_ITEMS: { id: DockTab; label: string; icon: typeof ChartColumnIcon }[] = [
  { id: "visualize", label: "Visualize", icon: ChartColumnIcon },
  { id: "transform", label: "Transform", icon: CleanIcon },
];

function SaveStatus({ version }: { version: number }) {
  const [saving, setSaving] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaving(true);
    const t = setTimeout(() => setSaving(false), 1000);
    return () => clearTimeout(t);
  }, [version]);

  return (
    <div className="hidden w-28 shrink-0 sm:block" aria-live="polite">
      {saving ? (
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-muted-foreground">Saving…</p>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              key={version}
              className="h-full rounded-full bg-primary"
              initial={{ width: "4%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
      ) : (
        <p className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2} className="text-green-500" />
          Saved
        </p>
      )}
    </div>
  );
}

interface CreateLayoutProps {
  title: string;
  onTitle: (title: string) => void;
  version: number;
  tab: DockTab;
  onTab: (tab: DockTab) => void;
  panel: ReactNode;
  agentPanel: ReactNode;
  children: ReactNode;
}

export function CreateLayout({ title, onTitle, version, tab, onTab, panel, agentPanel, children }: CreateLayoutProps) {
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
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b px-2 py-1.5">
        <Link
          to="/"
          aria-label="Microboard home"
          className="rounded-md px-2 py-1 font-display text-lg leading-none tracking-[0.2em] text-foreground transition-opacity hover:opacity-70"
        >
          MICROBOARD
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <input
            ref={nameRef}
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            aria-label="Visualisation name"
            placeholder="Untitled visualisation"
            className="w-full max-w-md truncate rounded-md bg-transparent px-2 py-1 text-center text-sm font-semibold focus-visible:bg-muted focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => nameRef.current?.focus()}
            aria-label="Rename visualisation"
            title="Rename"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={PenTool02Icon} size={14} strokeWidth={1.5} />
          </button>
        </div>

        <SaveStatus version={version} />

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
        <nav
          aria-label="Tools"
          className="flex shrink-0 flex-col items-center gap-1 self-start rounded-2xl border bg-background/70 p-1.5 shadow-sm backdrop-blur-xl"
        >
          {DOCK_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              aria-label={item.label}
              className={`group relative flex size-10 items-center justify-center rounded-xl transition-all ${
                tab === item.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={item.icon} size={19} strokeWidth={1.5} />
              <span className="pointer-events-none absolute left-full ml-3 hidden rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow group-hover:block">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border bg-card/50 p-3 md:flex">
          {panel}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>

        {agentOpen && (
          <aside className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto rounded-xl border bg-card/50 p-3">
            {agentPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
