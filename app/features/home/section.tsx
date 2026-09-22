import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Shared home design language: eyebrow + title + blurb header,
 * stat tiles, empty states, icon buttons. Every tab speaks the same rhythm.
 */

export function SectionHead({
  eyebrow,
  title,
  blurb,
  actions,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ value, label, icon }: { value: string | number; label: string; icon?: typeof import("@hugeicons/core-free-icons").Home01Icon }) {
  return (
    <div className="rounded-xl border bg-background p-4 text-center transition-colors hover:border-primary/40">
      {icon && (
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} className="mx-auto text-primary" />
      )}
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

/** Compact icon button with press micro-interaction. */
export function IconBtn({
  label,
  onClick,
  icon,
  danger,
  active,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon: typeof import("@hugeicons/core-free-icons").Home01Icon;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`flex size-7 items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 ${
        danger
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} />
    </button>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed px-5 py-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-background p-4 sm:p-5 ${className}`}>{children}</div>;
}
