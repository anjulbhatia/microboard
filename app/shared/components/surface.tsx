import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Minimal modular surface kit — PowerBI/Canva rhythm.
 * Flat boxes, thin dividers, no shadows/gradients.
 * Home + Canvas share these; home-sidebar untouched.
 */

export function Box({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border/60 bg-card ${className}`}>{children}</div>;
}

export function FlatRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${className}`}>{children}</div>
  );
}

export function ModuleHead({
  eyebrow,
  title,
  blurb,
  actions,
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{eyebrow}</p>
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight">{title}</h1>
        {blurb && <p className="mt-0.5 text-[13px] text-muted-foreground">{blurb}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon?: typeof import("@hugeicons/core-free-icons").Home01Icon;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5 text-left">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon && <HugeiconsIcon icon={icon} size={13} strokeWidth={1.5} />}
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase">{label}</p>
      </div>
      <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

export function EmptyBox({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 px-5 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Minimal ghost action used across Home + Canvas toolbars. */
export function GhostBtn({
  children,
  onClick,
  primary,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? `rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 ${className}`
          : `rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 ${className}`
      }
    >
      {children}
    </button>
  );
}
